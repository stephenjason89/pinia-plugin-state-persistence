import type { PiniaPlugin, PiniaPluginContext, StateTree } from 'pinia'
import type { PersistOptions } from './types'
import { applyStateFilter, createLogger, isStorageValid, queueTask } from './utils'

export function createStatePersistence<S extends StateTree = StateTree>(
	globalOptions?: PersistOptions<S>,
): PiniaPlugin {
	const pluginOptions = globalOptions || {}
	const queues: Record<string, Promise<void>> = {}
	const log = createLogger(pluginOptions.debug)

	// Get default storage (localStorage or fallback)
	const detectStorage = async () => {
		if (typeof window === 'undefined') {
			log.info('Running in SSR environment. No storage available.')
			return null
		}
		try {
			if (await isStorageValid(window.localStorage)) {
				log.info('Using localStorage as the default storage.')
				return window.localStorage
			}
		}
		catch (error) {
			log.error('Failed to initialize localStorage:', error)
		}
		log.warn('No valid storage found. PersistPlugin will be disabled.')
		return null
	}

	return async (context: PiniaPluginContext) => {
		const storeOptions = context.options.persist
		if (!storeOptions)
			return

		const {
			key = context.store.$id,
			overwrite = false,
			storage = await detectStorage(),
			filter = () => true,
			serialize = JSON.stringify,
			deserialize = JSON.parse,
			merge = (_: any, savedState: any) => savedState,
			include = null,
			exclude = null,
		} = { ...pluginOptions, ...(typeof storeOptions === 'object' && storeOptions) }

		if (!storage || !(await isStorageValid(storage)))
			return

		// Load persisted state
		const loadState = async () => {
			queueTask(queues, key, async () => {
				const savedValue = await storage.getItem(key)
				if (!savedValue)
					return

				const mergedState = (() => {
					if (typeof savedValue === 'object')
						return merge(context.store.$state, savedValue)
					try {
						return merge(context.store.$state, deserialize(savedValue))
					}
					catch {
						return null
					}
				})()

				if (mergedState)
					overwrite ? (context.store.$state = mergedState) : context.store.$patch(mergedState)
			})
		}

		// Persist state on mutation
		const persistState = (mutation: any, state: S) => {
			if (!filter(mutation, state))
				return

			const processedState = applyStateFilter(state, include, exclude)
			const serializedState = serialize(processedState)

			queueTask(queues, key, async () => {
				await storage.setItem(key, serializedState)
			})
		}

		loadState()
		context.store.$subscribe(persistState)
	}
}
