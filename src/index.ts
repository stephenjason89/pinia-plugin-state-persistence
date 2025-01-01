import type { PiniaPlugin, PiniaPluginContext, StateTree } from 'pinia'
import type { PersistOptions } from './types.js'
import { applyStateFilter, createLogger, queueTask } from './utils.js'

export function createStatePersistence<S extends StateTree = StateTree>(
	globalOptions?: PersistOptions<S>,
): PiniaPlugin {
	const pluginOptions = globalOptions || {}
	const queues: Record<string, Promise<void>> = {}
	const log = createLogger(pluginOptions.debug)

	// Get default storage (localStorage or fallback)
	const detectStorage = () => {
		if (window?.localStorage) {
			log.info('Using localStorage as the default storage.')
			return window.localStorage
		}
		else {
			if (typeof window === 'undefined')
				log.info('Running in SSR environment. No storage available.')
			else log.error('No valid storage found. PersistPlugin will be disabled.')
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
			merge = (_: any, savedState: any) => savedState,
			clientOnly = false,
			include = null,
			exclude = null,
		} = { ...pluginOptions, ...(typeof storeOptions === 'object' && storeOptions) }

		if (!storage || (clientOnly && typeof window === 'undefined'))
			return

		// Load persisted state
		const loadState = () => {
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
