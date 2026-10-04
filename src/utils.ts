import { isReactive, isRef } from 'vue'

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
export function getNestedValue(obj: any, path: string) {
	return path.split('.').reduce((acc, key) =>
		acc != null && Object.hasOwn(acc, key) ? acc[key] : undefined, obj)
}

// Set nested value in object using dot notation
export function setNestedValue(obj: any, path: string, value: any) {
	path.split('.').reduce((acc, key, idx, arr) => {
		const next = idx === arr.length - 1
			? value
			: Object.hasOwn(acc, key) && acc[key] && typeof acc[key] === 'object' ? acc[key] : {}
		Object.defineProperty(acc, key, { value: next, writable: true, enumerable: true, configurable: true })
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
			if (!Object.hasOwn(parent, key))
				return
			const child: unknown = parent[key]
			if (!child || typeof child !== 'object')
				return
			const copy = Array.isArray(child) ? [...child] : { ...child }
			Object.defineProperty(parent, key, { value: copy, writable: true, enumerable: true, configurable: true })
			parent = copy
		}
		delete parent[lastKey]
	})

	return result
}

// Pinia merges own object fields with assignment; prepare special slots before that merge.
export function prepareStateMerge(target: Record<string, any>, patch: Record<string, any>) {
	const visited = new WeakMap<object, WeakSet<object>>()
	const isPlainObject = (value: any) => value && typeof value === 'object'
		&& Object.prototype.toString.call(value) === '[object Object]' && typeof value.toJSON !== 'function'
	const prepare = (current: Record<string, any>, saved: Record<string, any>) => {
		if (visited.get(current)?.has(saved))
			return
		if (!visited.has(current))
			visited.set(current, new WeakSet())
		visited.get(current)!.add(saved)
		for (const [key, value] of Object.entries(saved)) {
			if (key === '__proto__' && !Object.hasOwn(current, key))
				Object.defineProperty(current, key, { value: undefined, enumerable: true, configurable: true, writable: true })
			if (Object.hasOwn(current, key) && isPlainObject(current[key]) && isPlainObject(value) && !isRef(value) && !isReactive(value))
				prepare(current[key], value)
		}
	}
	prepare(target, patch)
}

// Run storage operations for the same key one at a time, starting each only after the previous one settles
export function enqueue<T>(queues: Record<string, Promise<unknown>>, key: string, operation: () => T | Promise<T>): T | Promise<T> {
	const pending = Object.hasOwn(queues, key) ? queues[key] : undefined
	const result = pending ? pending.then(operation) : operation()
	if (!isPromise(result))
		return result
	const settled = result.then(() => {}, () => {})
	Object.defineProperty(queues, key, { value: settled, writable: true, enumerable: true, configurable: true })
	settled.then(() => {
		if (queues[key] === settled)
			delete queues[key]
	})
	return result
}

export function getObjectDiff(object1: Record<string, any>, object2: Record<string, any>) {
	return Object.fromEntries(
		Object.entries(object1).filter(([key]) => !Object.hasOwn(object2, key)),
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
