import type { PiniaPlugin, PiniaPluginContext, StateTree } from 'pinia'
import type { GlobalPersistOptions, Storage } from './types.js'
import { applyStateFilter, createLogger, getObjectDiff, isPromise, queueTask } from './utils.js'

export function createStatePersistence<S extends StateTree = StateTree>(
	globalOptions?: GlobalPersistOptions<S>,
): PiniaPlugin {
	const pluginOptions = globalOptions || {}
	const queues: Record<string, Promise<void>> = {}
	const log = createLogger(pluginOptions.debug)

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
		if (!storeOptions)
			return

		const {
			key = context.store.$id,
			overwrite = false,
			storage = detectStorage(),
			filter = () => true,
			serialize = JSON.stringify,
			deserialize = JSON.parse,
			clientOnly = false,
			include = null,
			exclude = null,
		} = { ...{ ...pluginOptions, key: undefined }, ...(typeof storeOptions === 'object' && storeOptions) }

		if (!storage || ((clientOnly || storage.constructor.name.includes('LocalForage')) && typeof window === 'undefined'))
			return

		// Combine global prefix with store-specific key
		const getPrefixedKey = (storeKey: string) =>
			pluginOptions.key ? `${pluginOptions.key}:${storeKey}` : storeKey

		const loadState = () => {
			const tasks: Promise<void>[] = []
			const getItem = (key: string) => {
				try {
					const result = storage.getItem(key)
					if (isPromise(result)) {
						const task = queueTask(queues, key, async () => await result)
						tasks.push(task)
						return task
					}
					return result
				}
				catch (error) {
					log.error(`Error loading key ${key}: ${error}`)
				}
			}

			const restoreState = (savedValue: any, stateKey?: string): void => {
				if (!savedValue)
					return

				const savedState = typeof savedValue === 'object' ? savedValue : deserialize(savedValue)

				if (stateKey) {
					context.store.$patch({ [stateKey]: savedState })
				}
				else {
					overwrite
						? (context.store.$state = savedState)
						: context.store.$patch(savedState)
				}
			}

			const savedValue = getItem(typeof key === 'string' ? key : context.store.$id)
			if (!isPromise(savedValue)) {
				restoreState(savedValue)
			}
			else {
				savedValue.then(restoreState)
			}

			if (typeof key === 'object') {
				Object.entries(key).forEach(([stateKey, storageKey]) => {
					const savedValue = getItem(storageKey)
					if (!isPromise(savedValue)) {
						restoreState(savedValue, stateKey)
					}
					else {
						savedValue.then(value => restoreState(value, stateKey))
					}
				})
			}

			return tasks.length ? Promise.all(tasks) : undefined
		}

		// Persist state on mutation
		const persistState = (mutation: any, state: S) => {
			if (!filter(mutation, state))
				return

			const tasks: Promise<void>[] = []
			const filteredState = applyStateFilter(state, include, exclude)
			const setItem = (key: string, value: string) => {
				try {
					const result = storage.setItem(getPrefixedKey(key), value)
					if (isPromise(result)) {
						const task = queueTask(queues, key, async () => await result)
						tasks.push(task)
					}
				}
				catch (error) {
					log.error(`Failed to persist state for key "${key}": ${error}`)
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
			return tasks.length ? Promise.all(tasks) : undefined
		}

		context.store.$restore = loadState
		context.store.$persist = () =>
			persistState({ type: 'persist', storeId: context.store.$id }, context.store.$state)

		loadState()
		context.store.$subscribe(persistState)
	}
}
