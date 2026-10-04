import type { PiniaPlugin, PiniaPluginContext, StateTree } from 'pinia'
import type { GlobalPersistOptions, PersistOptions, Storage } from './types.js'
import { applyStateFilter, createLogger, enqueue, fingerprint, getObjectDiff, isPromise, prepareStateMerge, settleAll } from './utils.js'

export type { GlobalPersistOptions, PersistOptions, Storage } from './types.js'

export function createStatePersistence<S extends StateTree = StateTree>(
	globalOptions: GlobalPersistOptions<S> = {},
): PiniaPlugin {
	const queues = new WeakMap<Storage, Record<string, Promise<unknown>>>()

	const detectStorage = (log: ReturnType<typeof createLogger>): Storage | null => {
		if (typeof window === 'undefined') {
			log.info('SSR detected, no storage available.')
			return null
		}
		try {
			const storage = window.localStorage
			if (storage) {
				log.info('Using localStorage.')
				return storage
			}
		}
		catch (error) {
			log.error('Unable to access localStorage:', error)
		}
		log.error('No valid storage found, persistence disabled.')
		return null
	}

	return (context: PiniaPluginContext) => {
		const storeOptions = context.options.persist
		if (!storeOptions) {
			return
		}

		const persistOptionsArray: Array<PersistOptions<S>> = Array.isArray(storeOptions)
			? storeOptions
			: storeOptions === true
				? [{}]
				: [storeOptions]

		let disposed = false
		let restorationGeneration = 0
		let restoring = false
		let mutationVersion = 0
		let restorationBatch: Promise<void> | null = null
		let synchronousRestores: Array<() => void> | null = null
		let orderedRestoration: Promise<void> | null = null
		const restoredFingerprints = new Map<string, ReturnType<typeof fingerprint>>()

		const persisters: Array<{
			loadState: () => Promise<void> | void
			persistState: (mutation: any, state: S) => Promise<void> | void
			persistence: () => Promise<void> | null
		}> = []

		persistOptionsArray.forEach((options) => {
			let {
				key = context.store.$id,
				debug = false,
				overwrite = false,
				storage = null,
				filter = () => true,
				serialize = JSON.stringify,
				deserialize = JSON.parse,
				deepCopy = false,
				clientOnly = false,
				include = null,
				exclude = null,
			} = { ...{ ...globalOptions, key: undefined }, ...options }

			const log = createLogger(debug)

			if (!storage)
				storage = detectStorage(log)

			if (!storage || ((clientOnly || storage.constructor?.name?.includes('LocalForage')) && typeof window === 'undefined')) {
				log.warn(`Skipping ${context.store.$id}, storage unavailable.`)
				return
			}

			const activeStorage = storage
			let storageQueues = queues.get(activeStorage)
			if (!storageQueues)
				queues.set(activeStorage, storageQueues = {})

			const getPrefixedKey = (storeKey: string) =>
				globalOptions.key ? `${globalOptions.key}:${storeKey}` : storeKey

			let persistencePromise: Promise<void> | null = null

			const loadState = () => {
				const generation = restorationGeneration
				const tasks: Promise<void>[] = []
				let storedState: Record<string, any> = {}
				const storedValues: Record<string, any> = Object.create(null)

				const restoreState = (state: Record<string, any>) => {
					if (disposed || generation !== restorationGeneration || !state || Object.keys(state).length === 0) {
						log.warn(`No state to restore for ${context.store.$id}.`)
						return
					}
					log.info(`Restoring state for ${context.store.$id}`)
					prepareStateMerge(context.store.$state, state)
					restoring = true
					try {
						overwrite ? (context.store.$state = state) : context.store.$patch(state)
					}
					finally {
						restoring = false
					}
					for (const stateKey of Object.keys(state))
						restoredFingerprints.set(stateKey, fingerprint(context.store.$state[stateKey]))
				}

				const resolveAndDeserialize = (storageKey: string, stateKey?: string) => {
					const processValue = (value: unknown) => {
						if (value === null || value === undefined)
							return
						try {
							const deserializedValue = typeof value === 'object' || (deepCopy && stateKey !== undefined) ? value : deserialize(value as string)
							stateKey !== undefined ? (storedValues[stateKey] = deserializedValue) : (storedState = deserializedValue as Record<string, any>)
						}
						catch (error) {
							log.error(`Error restoring ${storageKey}:`, error)
						}
					}

					const prefixedKey = getPrefixedKey(storageKey)
					try {
						const savedValue = enqueue(storageQueues, prefixedKey, () => activeStorage.getItem(prefixedKey))
						if (isPromise(savedValue)) {
							tasks.push(savedValue.then(processValue, error => console.error(`Error processing queue for key '${storageKey}':`, error)))
							return
						}
						processValue(savedValue)
					}
					catch (error) {
						log.error(`Error retrieving ${storageKey}:`, error)
					}
				}

				resolveAndDeserialize(typeof key === 'string' ? key : context.store.$id)
				if (typeof key === 'object') {
					Object.entries(key).forEach(([stateKey, storageKey]) => resolveAndDeserialize(storageKey, stateKey))
				}

				const previousRestoration = orderedRestoration
				if (!tasks.length && !previousRestoration) {
					const restore = () => restoreState({ ...storedState, ...storedValues })
					synchronousRestores ? synchronousRestores.push(restore) : restore()
					return
				}

				const stateBeforeRestore = Object.fromEntries(
					Object.entries(context.store.$state).map(([stateKey, value]) => [stateKey, fingerprint(value)]),
				)
				const restorationPromise = Promise.all([...tasks, previousRestoration]).then(() => {
					const state: Record<string, any> = { ...storedState, ...storedValues }
					for (const stateKey of Object.keys(state)) {
						const currentFingerprint = Object.hasOwn(context.store.$state, stateKey) ? fingerprint(context.store.$state[stateKey]) : undefined
						const changed = restoredFingerprints.has(stateKey)
							? currentFingerprint !== restoredFingerprints.get(stateKey)
							: Object.hasOwn(stateBeforeRestore, stateKey) && currentFingerprint !== stateBeforeRestore[stateKey]
						if (changed) {
							delete state[stateKey]
						}
					}
					restoreState(state)
				})
				orderedRestoration = restorationPromise
				return restorationPromise
			}

			const persistState = (mutation: any, state: S) => {
				if (!filter(mutation, state)) {
					log.info(`Skipping persistence for ${context.store.$id}.`)
					return
				}

				const tasks: Promise<void>[] = []
				const filteredState = applyStateFilter(state, include, exclude)
				const setItem = (storageKey: string, value: string) => {
					const prefixedKey = getPrefixedKey(storageKey)
					try {
						const storedValue = deepCopy ? deserialize(value) : value
						const result = enqueue(storageQueues, prefixedKey, () => activeStorage.setItem(prefixedKey, storedValue))
						if (isPromise(result)) {
							tasks.push(result.then(() => {}))
						}
					}
					catch (error) {
						tasks.push(Promise.reject(error))
					}
				}

				if (typeof key === 'string') {
					setItem(key, serialize(filteredState))
				}
				else {
					const remainingState = getObjectDiff(filteredState, key)
					if (deepCopy) {
						for (const stateKey of Object.keys(key)) {
							if (Object.hasOwn(filteredState, stateKey) && filteredState[stateKey] === null)
								Object.defineProperty(remainingState, stateKey, { value: null, enumerable: true, configurable: true, writable: true })
						}
					}
					setItem(context.store.$id, serialize(remainingState))
					for (const [stateKey, storageKey] of Object.entries(key)) {
						if (Object.hasOwn(filteredState, stateKey) && filteredState[stateKey] !== undefined) {
							setItem(storageKey, serialize(filteredState[stateKey]))
						}
						else if ((!Object.hasOwn(state, stateKey) || state[stateKey] === undefined)
							&& (!include || ([] as string[]).concat(include).some(path => path === stateKey || path.startsWith(`${stateKey}.`)))
							&& (!exclude || !([] as string[]).concat(exclude).includes(stateKey))) {
							const prefixedKey = getPrefixedKey(storageKey)
							try {
								const result = enqueue(storageQueues, prefixedKey, () => activeStorage.removeItem(prefixedKey))
								if (isPromise(result))
									tasks.push(result.then(() => {}))
							}
							catch (error) {
								tasks.push(Promise.reject(error))
							}
						}
					}
				}

				if (tasks.length) {
					persistencePromise = Promise.all(tasks).then(() => {
						log.info(`State persistence complete for ${context.store.$id}`)
					})
					persistencePromise.catch(error => log.error(`Failed to persist ${context.store.$id}:`, error))
					return persistencePromise
				}
				log.info(`State persistence complete for ${context.store.$id}`)
			}

			persisters.push({
				loadState,
				persistState,
				persistence: () => persistencePromise,
			})
		})

		if (!persisters.length)
			return

		const dispose = context.store.$dispose
		context.store.$dispose = () => {
			if (disposed)
				return
			disposed = true
			dispose.call(context.store)
		}

		const whenSettled = (promises: Array<Promise<void> | null>, callback?: () => void) => {
			const promise = Promise.all(promises).then(() => {})
			promise.catch(() => {})
			if (callback)
				promise.then(callback).catch(() => {})
			return promise
		}

		const restoreAll = () => {
			const generation = ++restorationGeneration
			orderedRestoration = null
			restoredFingerprints.clear()
			const versionBeforeRestore = mutationVersion
			const restores: Array<() => void> = []
			synchronousRestores = restores
			let results: Array<Promise<void> | void>
			try {
				results = persisters.map(persister => persister.loadState())
			}
			finally {
				synchronousRestores = null
			}
			restores.forEach(restore => restore())
			const result = settleAll(results)
			restorationBatch = isPromise(result)
				? result.then(() => {
						if (!disposed && generation === restorationGeneration && mutationVersion !== versionBeforeRestore) {
							return settleAll(persisters.map(persister =>
								persister.persistState({ type: 'restore', storeId: context.store.$id }, context.store.$state),
							))
						}
					})
				: null
			restorationBatch?.catch(() => {})
			return restorationBatch ?? undefined
		}
		context.store.$restore = restoreAll
		context.store.$persist = () => {
			const result = settleAll(persisters.map(persister =>
				persister.persistState({ type: 'persist', storeId: context.store.$id }, context.store.$state),
			))
			result?.catch(() => {})
			return result
		}
		context.store.$onRestore = (callback?: () => void) => whenSettled([restorationBatch], callback)
		context.store.$onPersist = (callback?: () => void) => whenSettled(persisters.map(persister => persister.persistence()), callback)

		restoreAll()
		persisters.forEach((persister) => {
			context.store.$subscribe((mutation, state) => {
				if (!restoring) {
					mutationVersion++
					persister.persistState(mutation, state)
				}
			}, { flush: 'sync' })
		})
	}
}
