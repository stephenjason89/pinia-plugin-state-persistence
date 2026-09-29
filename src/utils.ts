export function createLogger(debug?: boolean) {
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

export function applyStateFilter(state: Record<string, any>,	include: string | string[] | null,	exclude: string | string[] | null): Record<string, any> {
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
		const lastKey = keys.pop()!
		let parent: Record<string, any> = result
		for (const key of keys) {
			const child: unknown = parent[key]
			if (!child || typeof child !== 'object')
				return
			parent = parent[key] = Array.isArray(child) ? [...child] : { ...child }
		}
		delete parent[lastKey]
	})

	return result
}

// Run storage operations for the same key one at a time, starting each only after the previous one settles
export function enqueue<T>(queues: Record<string, Promise<unknown>>, key: string, operation: () => T | Promise<T>): T | Promise<T> {
	const pending = queues[key]
	const result = pending ? pending.then(operation) : operation()
	if (!isPromise(result))
		return result
	const settled = result.then(() => {}, () => {})
	queues[key] = settled
	settled.then(() => {
		if (queues[key] === settled)
			delete queues[key]
	})
	return result
}

export function getObjectDiff(object1: Record<string, any>, object2: Record<string, any>) {
	return Object.fromEntries(
		Object.entries(object1).filter(([key]) => !(key in object2)),
	)
}

export function isPromise(value: any): value is Promise<any> {
	return value instanceof Promise
}

// Wait for any pending results; stay synchronous when every result is synchronous
export function settleAll(results: unknown[]): Promise<void> | void {
	const promises = results.filter(isPromise)
	if (promises.length)
		return Promise.all(promises).then(() => {})
}

// Compare state values across an async restore; returns undefined when a value cannot be serialized
export function fingerprint(value: unknown): string | undefined {
	try {
		return JSON.stringify(value)
	}
	catch {
		return undefined
	}
}
