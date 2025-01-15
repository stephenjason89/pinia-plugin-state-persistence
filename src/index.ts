import type { PiniaPlugin, PiniaPluginContext, StateTree } from 'pinia'
import type { GlobalPersistOptions, Storage } from './types.js'
import { applyStateFilter, createLogger, getObjectDiff, isPromise, queueTask } from './utils.js'

export function createStatePersistence<S extends StateTree = StateTree>(
	globalOptions: GlobalPersistOptions<S> = {},
): PiniaPlugin {
	const queues: Record<string, Promise<void>> = {}
	const log = createLogger(globalOptions.debug)

	const detectStorage = (): null | Storage => {
		if (typeof window === 'undefined') {
			log.info('Running in SSR environment. No storage available.')
			return null
		}
		if (window.localStorage) {
			log.info('Using localStorage as the default storage.')
			return window.localStorage
		}
		else {
			log.error('No valid storage found. PersistPlugin will be disabled.')
			return null
		}
	}

	return (context: PiniaPluginContext) => {
		const storeOptions = context.options.persist
		if (!storeOptions) {
			log.info(`Store ${context.store.$id} does not have persistence options defined. Plugin skipped.`)
			return
		}

		const {
			key = context.store.$id,
			overwrite = false,
			storage = detectStorage(),
			filter = () => true,
			serialize = JSON.stringify,
			deserialize = JSON.parse,
			deepCopy = false,
			clientOnly = false,
			include = null,
			exclude = null,
		} = { ...{ ...globalOptions, key: undefined }, ...(typeof storeOptions === 'object' && storeOptions) }

		if (!storage || ((clientOnly || storage.constructor.name.includes('LocalForage')) && typeof window === 'undefined')) {
			log.warn(`Skipping persistence for ${context.store.$id}: Storage unavailable or client-only restriction applied.`)
			return
		}

		// Combine global prefix with store-specific key
		const getPrefixedKey = (storeKey: string) =>
			globalOptions.key ? `${globalOptions.key}:${storeKey}` : storeKey

		let isRestoringState: boolean
		const loadState = () => {
			log.info(`Initiating state restoration for store: ${context.store.$id}`)
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
					log.error(`Failed to retrieve item ${key}:`, error)
				}
			}

			const restoreState = (state: Record<string, any>) => {
				if (!state || Object.keys(state).length === 0) {
					log.warn(`No state to restore for store: ${context.store.$id}`)
					return
				}
				isRestoringState = true
				if (overwrite) {
					log.info(`Overwriting state for store: ${context.store.$id}`)
					context.store.$state = state
				}
				else {
					log.info(`Merging restored state into store: ${context.store.$id}`)
					context.store.$patch(state)
				}
				isRestoringState = false
			}

			const resolveAndDeserialize = (storageKey: string, stateKey?: string) => {
				const processValue = (value: any) => {
					if (value) {
						const deserializedValue = typeof value === 'object' ? value : deserialize(value)
						stateKey ? (stateToRestore[stateKey] = deserializedValue) : (stateToRestore = deserializedValue)
					}
					else {
						log.error(`No value found for key: ${storageKey}`)
					}
				}
				const savedValue = getItem(storageKey)
				isPromise(savedValue) ? savedValue.then(processValue) : processValue(savedValue)
			}

			resolveAndDeserialize(typeof key === 'string' ? key : context.store.$id)
			if (typeof key === 'object') {
				Object.entries(key).forEach(([stateKey, storageKey]) => {
					resolveAndDeserialize(storageKey, stateKey)
				})
			}

			if (tasks.length) {
				return Promise.all(tasks).then(() => {
					restoreState(stateToRestore)
					log.info(`Async storage state restoration complete for store: ${context.store.$id}`)
				})
			}

			restoreState(stateToRestore)
			log.info(`Synchronous storage state restoration complete for store: ${context.store.$id}`)
		}

		// Persist state on mutation
		const persistState = (mutation: any, state: S) => {
			if (!filter(mutation, state) || isRestoringState) {
				log.info(`Skipping persistence for store: ${context.store.$id}. Mutation:`, mutation)
				return
			}

			const tasks: Promise<void>[] = []
			const filteredState = applyStateFilter(state, include, exclude)
			const setItem = (key: string, value: string) => {
				try {
					const result = storage.setItem(getPrefixedKey(key), deepCopy ? deserialize(value) : value)
					if (isPromise(result)) {
						const task = queueTask(queues, key, async () => await result)
						tasks.push(task)
					}
				}
				catch (error) {
					log.error(`Failed to persist state for key ${key}:`, error)
				}
			}

			if (typeof key === 'string') {
				setItem(key, serialize(filteredState))
			}
			else {
				setItem(context.store.$id, serialize(getObjectDiff(filteredState, key)))
				for (const [stateKey, storageKey] of Object.entries(key)) {
					if (filteredState[stateKey] !== undefined) {
						setItem(storageKey, serialize(filteredState[stateKey]))
					}
				}
			}
			if (tasks.length) {
				return Promise.all(tasks).then(() => {
					log.info(`Async state persistence complete for store: ${context.store.$id}`)
				})
			}
			log.info(`Synchronous state persistence complete for store: ${context.store.$id}`)
		}

		context.store.$restore = loadState
		context.store.$persist = () =>
			persistState({ type: 'persist', storeId: context.store.$id }, context.store.$state)

		loadState()
		context.store.$subscribe(persistState, { flush: 'sync' })
	}
}
