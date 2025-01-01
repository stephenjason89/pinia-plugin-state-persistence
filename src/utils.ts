export function createLogger(debug: boolean) {
	return {
		info: (message: string, ...args: any[]) => {
			if (debug) {
				console.info(`[PersistPlugin] INFO: ${message}`, ...args)
			}
		},
		warn: (message: string, ...args: any[]) => {
			if (debug) {
				console.warn(`[PersistPlugin] WARN: ${message}`, ...args)
			}
		},
		error: (message: string, ...args: any[]) => {
			if (debug) {
				console.error(`[PersistPlugin] ERROR: ${message}`, ...args)
			}
		},
	}
}

// Get nested value from object using dot notation
export const getNestedValue = (obj: any, path: string) => path.split('.').reduce((acc, key) => acc?.[key], obj)

// Set nested value in object using dot notation
export function setNestedValue(obj: any, path: string, value: any) {
	path.split('.').reduce((acc, key, idx, arr) => {
		if (idx === arr.length - 1)
			acc[key] = value
		else acc[key] = acc[key] || {}
		return acc[key]
	}, obj)
}

export function applyStateFilter(state: Record<string, any>,	include?: string | string[],	exclude?: string | string[]): Record<string, any> {
	const includeArray = include ? ([] as string[]).concat(include) : null
	const excludeArray = exclude ? ([] as string[]).concat(exclude) : null

	const result = includeArray
		? includeArray.reduce((acc, path) => {
				const value = getNestedValue(state, path)
				if (value !== undefined)
					setNestedValue(acc, path, value)
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
export function queueTask(queues: Record<string, Promise<void>>, key: string, task: () => Promise<void>) {
	if (!queues[key])
		queues[key] = Promise.resolve()
	queues[key] = queues[key].then(task).catch(error => console.error(`Error processing queue for key '${key}':`, error))
}
