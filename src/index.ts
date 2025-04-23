import type { PiniaPlugin, PiniaPluginContext, StateTree } from 'pinia'
import type { GlobalPersistOptions, PersistOptions, Storage } from './types.js'
import { applyStateFilter, createLogger, getObjectDiff, isPromise, queueTask } from './utils.js'

export function createStatePersistence<S extends StateTree = StateTree>(
	globalOptions: GlobalPersistOptions<S> = {},
): PiniaPlugin {
	const queues: Record<string, Promise<void>> = {}

	const detectStorage = (log: ReturnType<typeof createLogger>): Storage | null => {
		if (typeof window === 'undefined') {
			log.info('SSR detected, no storage available.')
			return null
		}
		if (window.localStorage) {
			log.info('Using localStorage.')
			return window.localStorage
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

			if (!storage || ((clientOnly || storage.constructor.name.includes('LocalForage')) && typeof window === 'undefined')) {
				log.warn(`Skipping ${context.store.$id}, storage unavailable.`)
				return
			}

			const getPrefixedKey = (storeKey: string) =>
				globalOptions.key ? `${globalOptions.key}:${storeKey}` : storeKey

			let isRestoringState = false
			const loadState = () => {
				const tasks: Promise<void>[] = []
				let stateToRestore: Record<string, any> = {}

				const getItem = (key: string) => {
					try {
						const result = storage.getItem(getPrefixedKey(key))
						if (isPromise(result)) {
							const task = queueTask(queues, key, async () => await result)
							tasks.push(task)
							return task
						}
						return result
					}
					catch (error) {
						log.error(`Error retrieving ${key}:`, error)
					}
				}

				const restoreState = (state: Record<string, any>) => {
					if (!state || Object.keys(state).length === 0) {
						log.warn(`No state to restore for ${context.store.$id}.`)
						return
					}
					isRestoringState = true
					log.info(`Restoring state for ${context.store.$id}`)
					overwrite ? (context.store.$state = state) : context.store.$patch(state)
					setTimeout(() => (isRestoringState = false))
				}

				const resolveAndDeserialize = (storageKey: string, stateKey?: string) => {
					const processValue = (value: any) => {
						if (value) {
							const deserializedValue = typeof value === 'object' ? value : deserialize(value)
							stateKey ? (stateToRestore[stateKey] = deserializedValue) : (stateToRestore = deserializedValue)
						}
					}
					const savedValue = getItem(storageKey)
					isPromise(savedValue) ? savedValue.then(processValue) : processValue(savedValue)
				}

				resolveAndDeserialize(typeof key === 'string' ? key : context.store.$id)
				if (typeof key === 'object') {
					Object.entries(key).forEach(([stateKey, storageKey]) => resolveAndDeserialize(storageKey, stateKey))
				}

				if (tasks.length) {
					return Promise.all(tasks).then(() => restoreState(stateToRestore))
				}
				restoreState(stateToRestore)
			}

			const persistState = (mutation: any, state: S) => {
				if (!filter(mutation, state) || isRestoringState) {
					if (!isRestoringState)
						log.info(`Skipping persistence for ${context.store.$id}.`)
					return
				}

				const tasks: Promise<void>[] = []
				const filteredState = applyStateFilter(state, include, exclude)
				const setItem = (key: string, value: string) => {
					try {
						const result = storage.setItem(getPrefixedKey(key), deepCopy ? deserialize(value) : value)
						if (isPromise(result)) {
							tasks.push(queueTask(queues, key, async () => await result))
						}
					}
					catch (error) {
						log.error(`Failed to persist ${key}:`, error)
					}
				}

				if (typeof key === 'string') {
					setItem(key, serialize(filteredState))
				}
				else {
					setItem(context.store.$id, serialize(getObjectDiff(filteredState, key)))
					for (const [stateKey, storageKey] of Object.entries(key)) {
						if (filteredState[stateKey] !== undefined)
							setItem(storageKey, serialize(filteredState[stateKey]))
					}
				}

				if (tasks.length) {
					return Promise.all(tasks).then(() => {
						log.info(`State persistence complete for ${context.store.$id}`)
					})
				}
				log.info(`State persistence complete for ${context.store.$id}`)
			}

			context.store.$restore = loadState
			context.store.$persist = () => persistState({ type: 'persist', storeId: context.store.$id }, context.store.$state)

			loadState()
			context.store.$subscribe(persistState, { flush: 'sync' })
		})
	}
}
