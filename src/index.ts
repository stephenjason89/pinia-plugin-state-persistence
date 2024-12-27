import type { PiniaPlugin, PiniaPluginContext, StateTree } from 'pinia'
import type { AsyncStorage, PersistOptions } from './types'
import { createLogger } from './utils'

export function createStatePersistence<S extends StateTree = StateTree>(
	globalOptions?: PersistOptions<S>,
): PiniaPlugin {
	const pluginOptions = globalOptions || {}
	const queues: Record<string, Promise<void>> = {}
	const log = createLogger(pluginOptions.debug)

	// Utility: Get nested value from object using dot notation
	const getValue = (obj: any, path: string) => path.split('.').reduce((acc, key) => acc?.[key], obj)

	// Utility: Set nested value in object using dot notation
	const setValue = (obj: any, path: string, value: any) => {
		path.split('.').reduce((acc, key, idx, arr) => {
			if (idx === arr.length - 1)
				acc[key] = value
			else acc[key] = acc[key] || {}
			return acc[key]
		}, obj)
	}

	// Apply include/exclude filters to state
	const applyIncludeExclude = (
		state: Record<string, any>,
		include?: string | string[],
		exclude?: string | string[],
	) => {
		const includeArray = include ? ([] as string[]).concat(include) : null
		const excludeArray = exclude ? ([] as string[]).concat(exclude) : null

		const result = includeArray
			? includeArray.reduce((acc, path) => {
					const value = getValue(state, path)
					if (value !== undefined)
						setValue(acc, path, value)
					return acc
				}, {})
			: { ...state }

		excludeArray?.forEach((path) => {
			const keys = path.split('.')
			const parent = keys
				.slice(0, -1)
				.reduce((acc: Record<string, any> | undefined, key) => acc?.[key], result)
			if (parent)
				delete parent[keys.at(-1)!]
		})

		return result
	}

	// Queue processing for async storage
	const processQueue = (key: string, task: () => Promise<void>) => {
		if (!queues[key])
			queues[key] = Promise.resolve()
		queues[key] = queues[key]
			.then(task)
			.catch(error => log.error(`Error processing queue for key '${key}':`, error))
	}

	// Validate storage for write-read capability
	const validateStorage = async (storage: AsyncStorage | Storage): Promise<boolean> => {
		const testKey = '__persist_test__'

		try {
			const result = storage.setItem(testKey, 'test')
			const cleanup = () => storage.removeItem(testKey)

			if (result instanceof Promise) {
				await result.then(cleanup)
			}
			else {
				cleanup()
			}

			return true
		}
		catch {
			return false
		}
	}

	// Get default storage (localStorage or fallback)
	const getDefaultStorage = async () => {
		if (typeof window === 'undefined') {
			log.info('Running in SSR environment. No storage available.')
			return null
		}
		try {
			if (await validateStorage(window.localStorage)) {
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
			storage = await getDefaultStorage(),
			filter = () => true,
			serialize = JSON.stringify,
			deserialize = JSON.parse,
			merge = (_: any, savedState: any) => savedState,
			include = null,
			exclude = null,
		} = { ...pluginOptions, ...(typeof storeOptions === 'object' && storeOptions) }

		if (!storage || !(await validateStorage(storage)))
			return

		// Load persisted state
		const loadState = async () => {
			processQueue(key, async () => {
				const savedValue = await storage.getItem(key)
				if (!savedValue)
					return

				const mergedState = merge(context.store.$state, deserialize(savedValue))
				overwrite ? (context.store.$state = mergedState) : context.store.$patch(mergedState)
			})
		}

		// Persist state on mutation
		const persistState = (mutation: any, state: S) => {
			if (!filter(mutation, state))
				return

			const processedState = applyIncludeExclude(state, include, exclude)
			const serializedState = serialize(processedState)

			processQueue(key, async () => {
				await storage.setItem(key, serializedState)
			})
		}

		loadState()
		context.store.$subscribe(persistState)
	}
}
