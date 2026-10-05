import type { PiniaPlugin, PiniaPluginContext, StateTree } from 'pinia'
import type { GlobalPersistOptions, PersistOptions, Storage } from './types.js'
import { isReactive, isRef } from 'vue'
import { applyStateFilter, createLogger, enqueue, fingerprint, getObjectDiff, isPromise, prepareStateMerge, settleAll } from './utils.js'

export type { GlobalPersistOptions, PersistOptions, Storage } from './types.js'

export function createStatePersistence<S extends StateTree = StateTree>(
	globalOptions: GlobalPersistOptions<S> = {},
): PiniaPlugin {
	const queues = new WeakMap<Storage, Record<string, Promise<unknown>>>()
	const unreadableStorageKeys = new WeakMap<Storage, Set<string>>()

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

	const isWebStorage = (storage: Storage) => {
		if (typeof window === 'undefined')
			return false
		for (const name of ['localStorage', 'sessionStorage'] as const) {
			try {
				if (window[name] === storage)
					return true
			}
			catch {}
		}
		return false
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
		const restoredFingerprints = new Map<string, { present: boolean, value: ReturnType<typeof fingerprint> }>()

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
			const storesRawValues = deepCopy && !isWebStorage(activeStorage)
			let storageQueues = queues.get(activeStorage)
			if (!storageQueues)
				queues.set(activeStorage, storageQueues = {})
			let unreadableKeys = unreadableStorageKeys.get(activeStorage)
			if (!unreadableKeys)
				unreadableStorageKeys.set(activeStorage, unreadableKeys = new Set())

			const getPrefixedKey = (storeKey: string) =>
				globalOptions.key ? `${globalOptions.key}:${storeKey}` : storeKey

			const canWrite = (prefixedKey: string) => {
				if (!unreadableKeys.has(prefixedKey))
					return true
				log.warn(`Skipping persistence for unreadable storage key '${prefixedKey}'.`)
				return false
			}

			let persistencePromise: Promise<void> | null = null

			const loadState = () => {
				const generation = restorationGeneration
				const tasks: Promise<void>[] = []
				let storedState: Record<string, any> = {}
				let hasStoredState = false
				const storedValues: Record<string, any> = Object.create(null)

				const restoreState = (state: Record<string, any>, protectedKeys = new Set<string>()) => {
					if (disposed || generation !== restorationGeneration || (!hasStoredState && Object.keys(state).length === 0)) {
						log.warn(`No state to restore for ${context.store.$id}.`)
						return
					}
					if (unreadableKeys.has(getPrefixedKey(typeof key === 'string' ? key : context.store.$id)))
						Object.keys(context.store.$state).forEach(stateKey => protectedKeys.add(stateKey))
					if (typeof key === 'object') {
						for (const [stateKey, storageKey] of Object.entries(key)) {
							if (unreadableKeys.has(getPrefixedKey(storageKey)))
								protectedKeys.add(stateKey)
						}
					}
					log.info(`Restoring state for ${context.store.$id}`)
					prepareStateMerge(context.store.$state, state)
					restoring = true
					const restoredKeys = new Set(Object.keys(state))
					try {
						if (overwrite) {
							context.store.$patch((currentState) => {
								const restoreContainer = (stateKey: string, value: any) => {
									const current = currentState[stateKey]
									if (context.options.state || isRef(Object.getOwnPropertyDescriptor(currentState, stateKey)?.value) || !isReactive(current))
										return false
									const isRecord = (candidate: any) => candidate !== null && typeof candidate === 'object'
										&& (Object.getPrototypeOf(candidate) === Object.prototype || Object.getPrototypeOf(candidate) === null)
									const compatible = Array.isArray(current)
										? value === undefined || Array.isArray(value)
										: current instanceof Map
											? value === undefined || value instanceof Map
											: current instanceof Set
												? value === undefined || value instanceof Set
												: isRecord(current) && (value === undefined || isRecord(value))
									if (!compatible) {
										log.warn(`Skipping incompatible overwrite for setup state '${stateKey}'.`)
										return true
									}
									if (Array.isArray(current)) {
										const entries = [...(value ?? [])]
										current.splice(0, current.length)
										// Bound call arguments and batch reactive notifications.
										const batchSize = 4096
										for (let index = 0; index < entries.length; index += batchSize)
											current.push(...entries.slice(index, index + batchSize))
									}
									else if (current instanceof Map || current instanceof Set) {
										const entries = value ? [...value] : []
										current.clear()
										if (current instanceof Map)
											entries.forEach(([entryKey, entryValue]) => current.set(entryKey, entryValue))
										else
											entries.forEach(entry => current.add(entry))
									}
									else {
										const entries = Object.entries(value ?? {})
										Object.keys(current).forEach(entryKey => delete current[entryKey])
										entries.forEach(([entryKey, entryValue]) => {
											if (entryKey === '__proto__')
												Object.defineProperty(current, entryKey, { value: entryValue, enumerable: true, configurable: true, writable: true })
											else
												current[entryKey] = entryValue
										})
									}
									return true
								}
								for (const stateKey of Object.keys(currentState)) {
									if (!Object.hasOwn(state, stateKey) && !protectedKeys.has(stateKey)) {
										restoredKeys.add(stateKey)
										if (restoreContainer(stateKey, undefined))
											continue
										if (isRef(Object.getOwnPropertyDescriptor(currentState, stateKey)?.value))
											currentState[stateKey] = undefined
										else
											delete currentState[stateKey]
									}
								}
								for (const [stateKey, value] of Object.entries(state)) {
									if (restoreContainer(stateKey, value))
										continue
									if (stateKey !== '__proto__' || Object.hasOwn(currentState, stateKey))
										currentState[stateKey] = value
									else
										Object.defineProperty(currentState, stateKey, { value, enumerable: true, configurable: true, writable: true })
								}
							})
						}
						else {
							context.store.$patch(state)
						}
					}
					finally {
						restoring = false
					}
					for (const stateKey of restoredKeys) {
						restoredFingerprints.set(stateKey, {
							present: Object.hasOwn(context.store.$state, stateKey),
							value: fingerprint(context.store.$state[stateKey]),
						})
					}
				}

				const resolveAndDeserialize = (storageKey: string, stateKey?: string) => {
					const prefixedKey = getPrefixedKey(storageKey)
					const processValue = (value: unknown) => {
						unreadableKeys.delete(prefixedKey)
						if (value === null || value === undefined)
							return
						try {
							const deserializedValue = typeof value === 'object' || (storesRawValues && stateKey !== undefined) ? value : deserialize(value as string)
							if (stateKey !== undefined) {
								storedValues[stateKey] = deserializedValue
							}
							else if (deserializedValue && typeof deserializedValue === 'object') {
								storedState = deserializedValue as Record<string, any>
								hasStoredState = true
							}
						}
						catch (error) {
							log.error(`Error restoring ${storageKey}:`, error)
						}
					}

					const readFailed = (error: unknown) => {
						unreadableKeys.add(prefixedKey)
						createLogger(true).error(`Error retrieving ${storageKey}; skipping persistence for '${prefixedKey}' until $restore() reads it:`, error)
					}
					try {
						const savedValue = enqueue(storageQueues, prefixedKey, () => activeStorage.getItem(prefixedKey))
						if (isPromise(savedValue)) {
							tasks.push(savedValue.then(processValue, readFailed))
							return
						}
						processValue(savedValue)
					}
					catch (error) {
						readFailed(error)
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
					const protectedKeys = new Set<string>()
					const stateKeys = new Set([...Object.keys(stateBeforeRestore), ...Object.keys(context.store.$state), ...Object.keys(state)])
					for (const stateKey of stateKeys) {
						const currentPresent = Object.hasOwn(context.store.$state, stateKey)
						const currentFingerprint = currentPresent ? fingerprint(context.store.$state[stateKey]) : undefined
						const restored = restoredFingerprints.get(stateKey)
						const changed = restored
							? currentPresent !== restored.present || currentFingerprint !== restored.value
							: currentPresent !== Object.hasOwn(stateBeforeRestore, stateKey) || currentFingerprint !== (Object.hasOwn(stateBeforeRestore, stateKey) ? stateBeforeRestore[stateKey] : undefined)
						if (changed) {
							delete state[stateKey]
							protectedKeys.add(stateKey)
						}
					}
					restoreState(state, protectedKeys)
				})
				orderedRestoration = restorationPromise
				return restorationPromise
			}

			const persistState = (mutation: any, state: S) => {
				const tasks: Promise<void>[] = []
				try {
					if (!filter(mutation, state)) {
						log.info(`Skipping persistence for ${context.store.$id}.`)
						return
					}

					persistencePromise = null
					const filteredState = applyStateFilter(state, include, exclude)
					const setItem = (storageKey: string, serializeValue: () => string) => {
						const prefixedKey = getPrefixedKey(storageKey)
						if (!canWrite(prefixedKey))
							return
						const value = serializeValue()
						try {
							const storedValue = storesRawValues ? deserialize(value) : value
							const result = enqueue(storageQueues, prefixedKey, () => {
								if (canWrite(prefixedKey))
									return activeStorage.setItem(prefixedKey, storedValue)
							})
							if (isPromise(result)) {
								tasks.push(result.then(() => {}))
							}
						}
						catch (error) {
							tasks.push(Promise.reject(error))
						}
					}

					if (typeof key === 'string') {
						setItem(key, () => serialize(filteredState))
					}
					else {
						const remainingState = getObjectDiff(filteredState, key)
						if (storesRawValues) {
							for (const stateKey of Object.keys(key)) {
								if (Object.hasOwn(filteredState, stateKey) && filteredState[stateKey] === null)
									Object.defineProperty(remainingState, stateKey, { value: null, enumerable: true, configurable: true, writable: true })
							}
						}
						setItem(context.store.$id, () => serialize(remainingState))
						for (const [stateKey, storageKey] of Object.entries(key)) {
							if (Object.hasOwn(filteredState, stateKey) && filteredState[stateKey] !== undefined) {
								setItem(storageKey, () => serialize(filteredState[stateKey]))
							}
							else if ((!include || ([] as string[]).concat(include).some(path => path === stateKey || path.startsWith(`${stateKey}.`)))
								&& (!exclude || !([] as string[]).concat(exclude).includes(stateKey))) {
								const prefixedKey = getPrefixedKey(storageKey)
								if (!canWrite(prefixedKey))
									continue
								try {
									const result = enqueue(storageQueues, prefixedKey, () => {
										if (canWrite(prefixedKey))
											return activeStorage.removeItem(prefixedKey)
									})
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
				catch (error) {
					persistencePromise = Promise.all([...tasks, Promise.reject(error)]).then(() => {})
					persistencePromise.catch(failure => log.error(`Failed to persist ${context.store.$id}:`, failure))
					return persistencePromise
				}
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
			const promise = Promise.all(promises).then(() => callback?.())
			promise.catch(() => {})
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
