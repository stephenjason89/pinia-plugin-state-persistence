import type { PersistOptions, Storage } from '../src/types'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import { createStatePersistence } from '../src/index'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function syncStorage(initial: Record<string, unknown> = {}) {
	const data = new Map<string, unknown>(Object.entries(initial))
	return {
		data,
		getItem: (key: string) => (data.get(key) ?? null) as string | null,
		setItem: (key: string, value: unknown) => { data.set(key, value) },
		removeItem: (key: string) => { data.delete(key) },
	}
}

function asyncStorage(initial: Record<string, unknown> = {}, { readDelays = {} as Record<string, number>, writeDelays = [] as number[] } = {}) {
	const data = new Map<string, unknown>(Object.entries(initial))
	let writes = 0
	return {
		data,
		getItem: async (key: string) => {
			const value = data.get(key) ?? null
			await sleep(readDelays[key] ?? 0)
			return value as string | null
		},
		setItem: async (key: string, value: unknown) => {
			await sleep(writeDelays[writes++] ?? 0)
			data.set(key, value)
		},
		removeItem: async (key: string) => { data.delete(key) },
	}
}

function usePlugin(storage?: Storage) {
	const pinia = createPinia()
	pinia.use(createStatePersistence(storage ? { storage } : {}))
	createApp({ render: () => null }).use(pinia)
	setActivePinia(pinia)
}

let storeId = 0
function createStore<S extends Record<string, any>>(state: () => S, persist: boolean | PersistOptions<S> | PersistOptions<S>[]) {
	return defineStore(`store-${++storeId}`, { state, persist: persist as any })()
}

const unhandled: unknown[] = []
const onUnhandled = (reason: unknown) => unhandled.push(reason)
beforeEach(() => {
	unhandled.length = 0
	process.on('unhandledRejection', onUnhandled)
})
afterEach(() => {
	process.off('unhandledRejection', onUnhandled)
})

describe('state filtering', () => {
	it('excluding a nested path does not remove it from the live state', () => {
		const storage = syncStorage()
		usePlugin(storage)
		const store = createStore(() => ({ user: { name: 'a', password: 'secret' } }), { exclude: 'user.password' })

		store.user.name = 'b'

		expect(store.user.password).toBe('secret')
		expect(JSON.parse(storage.data.get(store.$id) as string)).toEqual({ user: { name: 'b' } })
	})

	it('excluding a child of an included path does not remove it from the live state', () => {
		const storage = syncStorage()
		usePlugin(storage)
		const store = createStore(() => ({ user: { name: 'a', password: 'secret' }, other: 1 }), { include: 'user', exclude: 'user.password' })

		store.user.name = 'b'

		expect(store.user.password).toBe('secret')
		expect(JSON.parse(storage.data.get(store.$id) as string)).toEqual({ user: { name: 'b' } })
	})
})

describe('restoring', () => {
	it('keeps every object-key value when async reads resolve out of order', async () => {
		const id = `store-${storeId + 1}`
		const storage = asyncStorage(
			{ [id]: '{"other":30}', 'alpha-key': '10', 'beta-key': '20' },
			{ readDelays: { 'beta-key': 0, [id]: 10, 'alpha-key': 20 } },
		)
		usePlugin(storage)
		const store = createStore(() => ({ alpha: 1, beta: 2, other: 3 }), { key: { alpha: 'alpha-key', beta: 'beta-key' } })

		await store.$onRestore()
		await store.$onPersist()

		expect(store.$state).toEqual({ alpha: 10, beta: 20, other: 30 })
		expect(storage.data.get('beta-key')).toBe('20')
	})

	it('keeps defaults instead of throwing when synchronous storage holds invalid JSON', () => {
		const storage = syncStorage({ [`store-${storeId + 1}`]: '{bad' })
		usePlugin(storage)

		const store = createStore(() => ({ count: 1 }), true)

		expect(store.count).toBe(1)
	})

	it('keeps defaults without an unhandled rejection when async storage holds invalid JSON', async () => {
		const storage = asyncStorage({ [`store-${storeId + 1}`]: '{bad' })
		usePlugin(storage)
		const store = createStore(() => ({ count: 1 }), true)

		await store.$onRestore()
		await sleep(10)

		expect(store.count).toBe(1)
		expect(unhandled).toEqual([])
	})

	it('does not overwrite changes made before an async restore finishes', async () => {
		const id = `store-${storeId + 1}`
		const storage = asyncStorage({ [id]: '{"count":5,"label":"saved"}' }, { readDelays: { [id]: 20 } })
		usePlugin(storage)
		const store = createStore(() => ({ count: 0, label: 'default' }), true)

		store.count = 100
		await store.$onRestore()
		await store.$onPersist()

		expect(store.$state).toEqual({ count: 100, label: 'saved' })
		expect(JSON.parse(storage.data.get(id) as string)).toEqual({ count: 100, label: 'saved' })
	})

	it('round-trips primitive and falsy object-key values with deepCopy', () => {
		const storage = syncStorage()
		usePlugin(storage)
		const key = { name: 'k-name', empty: 'k-empty', num: 'k-num', flag: 'k-flag' }
		const state = () => ({ name: 'x', empty: 'x', num: 9, flag: true })
		const first = createStore(state, { key, deepCopy: true })
		first.$patch({ name: 'abc', empty: '', num: 0, flag: false })

		usePlugin(storage)
		const second = defineStore(first.$id, { state, persist: { key, deepCopy: true } as any })()

		expect(second.$state).toEqual({ name: 'abc', empty: '', num: 0, flag: false })
	})
})

describe('persisting', () => {
	it('stores the latest state when an earlier async write finishes last', async () => {
		const storage = asyncStorage({}, { writeDelays: [30, 0] })
		usePlugin(storage)
		const store = createStore(() => ({ count: 0 }), true)
		await store.$onRestore()

		store.count = 1
		store.count = 2
		await store.$onPersist()
		await sleep(40)

		expect(JSON.parse(storage.data.get(store.$id) as string)).toEqual({ count: 2 })
	})
})

describe('multiple persist configs', () => {
	it('waits for every config on restore and writes every config on $persist', async () => {
		const slow = asyncStorage({ 'slow-key': '{"a":10}' }, { readDelays: { 'slow-key': 20 } })
		const fast = asyncStorage({ 'fast-key': '{"b":20}' })
		usePlugin()
		const store = createStore(() => ({ a: 1, b: 2 }), [
			{ key: 'slow-key', storage: slow, include: 'a' },
			{ key: 'fast-key', storage: fast, include: 'b' },
		])

		await store.$onRestore()
		expect(store.$state).toEqual({ a: 10, b: 20 })

		slow.data.clear()
		fast.data.clear()
		await store.$persist()

		expect(JSON.parse(slow.data.get('slow-key') as string)).toEqual({ a: 10 })
		expect(JSON.parse(fast.data.get('fast-key') as string)).toEqual({ b: 20 })
	})
})
