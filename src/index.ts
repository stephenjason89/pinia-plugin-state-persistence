import type { PiniaPlugin, PiniaPluginContext, StateTree } from 'pinia'
import type { GlobalPersistOptions } from './types.js'
import { applyStateFilter, createLogger, getObjectDiff, queueTask } from './utils.js'

export function createStatePersistence<S extends StateTree = StateTree>(
	globalOptions?: GlobalPersistOptions<S>,
): PiniaPlugin {
	const pluginOptions = globalOptions || {}
	const queues: Record<string, Promise<void>> = {}
	const log = createLogger(pluginOptions.debug)

	const detectStorage = () => {
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
				const task = queueTask(queues, key, async () => {
					try {
						return await storage.getItem(key)
					}
					catch (error) {
						log.error(`Error loading key ${key}: ${error}`)
					}
				})
				tasks.push(task)
				return task
			}
			getItem(typeof key === 'string' ? key : context.store.$id).then((savedValue) => {
				if (savedValue) {
					const savedState = typeof savedValue === 'object' ? savedValue : deserialize(savedValue)
					overwrite ? (context.store.$state = savedState) : context.store.$patch(savedState)
				}
			})
			if (typeof key === 'object') {
				Object.entries(key).forEach(([stateKey, storageKey]) =>
					getItem(storageKey).then((savedValue) => {
						if (savedValue) {
							context.store.$patch({
								[stateKey]: typeof savedValue === 'object' ? savedValue : deserialize(savedValue),
							})
						}
					}),
				)
			}
			return Promise.all(tasks)
		}

		// Persist state on mutation
		const persistState = (mutation: any, state: S) => {
			if (!filter(mutation, state))
				return

			const tasks: Promise<void>[] = []
			const filteredState = applyStateFilter(state, include, exclude)
			const setItem = (key: string, value: string) => {
				const task = queueTask(queues, key, async () => {
					try {
						await storage.setItem(getPrefixedKey(key), value)
					}
					catch (error) {
						log.error(`Failed to persist state for key "${key}":${error}`)
					}
				})
				tasks.push(task)
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
			return Promise.all(tasks)
		}

		context.store.$restore = loadState
		context.store.$persist = () =>
			persistState({ type: 'persist', storeId: context.store.$id }, context.store.$state)

		loadState()
		context.store.$subscribe(persistState)
	}
}
