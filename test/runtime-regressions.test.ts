import type { PersistOptions, Storage } from '../src/types'
import { describe, expect, it } from 'bun:test'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import { createStatePersistence } from '../src/index'

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason: unknown) => void
	const promise = new Promise<T>((accept, fail) => {
		resolve = accept
		reject = fail
	})
	return { promise, resolve, reject }
}

function memoryStorage(initial: Record<string, unknown> = {}) {
	const data = new Map<string, unknown>(Object.entries(initial))
	return {
		data,
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: unknown) => { data.set(key, value) },
		removeItem: (key: string) => { data.delete(key) },
	}
}

function install(storage?: Storage) {
	const pinia = createPinia()
	pinia.use(createStatePersistence(storage ? { storage } : {}))
	createApp({ render: () => null }).use(pinia)
	setActivePinia(pinia)
	return pinia
}

let id = 0
function makeStore<S extends Record<string, any>>(state: () => S, persist: boolean | PersistOptions<S> | PersistOptions<S>[]) {
	return defineStore(`runtime-${++id}`, { state, persist: persist as any })()
}

describe('runtime regressions', () => {
	it('does not let a disposed store restore into its replacement', async () => {
		const firstRead = deferred<string>()
		const secondRead = deferred<string>()
		let reads = 0
		const storage = {
			...memoryStorage(),
			getItem: () => ++reads === 1 ? firstRead.promise : secondRead.promise,
		}
		const pinia = install(storage)
		const useStore = defineStore(`runtime-${++id}`, { state: () => ({ count: 0 }), persist: true })
		const first = useStore()
		first.$dispose()
		pinia.state.value[first.$id] = { count: 0 }
		const replacement = useStore()

		firstRead.resolve('{"count":5}')
		await first.$onRestore()
		expect(replacement.count).toBe(0)
		secondRead.resolve('{"count":10}')
		await replacement.$onRestore()
		expect(replacement.count).toBe(10)
	})
	it('applies overlapping async configurations in declaration order', async () => {
		const earlier = deferred<string>()
		const later = deferred<string>()
		install()
		const store = makeStore(() => ({ count: 0 }), [
			{ storage: { ...memoryStorage(), getItem: () => earlier.promise } },
			{ storage: { ...memoryStorage(), getItem: () => later.promise } },
		])

		earlier.resolve('{"count":1}')
		await Promise.resolve()
		later.resolve('{"count":2}')
		await store.$onRestore()
		expect(store.count).toBe(2)
	})

	it('preserves user edits while applying ordered async configurations', async () => {
		const earlier = deferred<string>()
		const later = deferred<string>()
		install()
		const store = makeStore(() => ({ count: 0, label: 'default' }), [
			{ storage: { ...memoryStorage(), getItem: () => earlier.promise } },
			{ storage: { ...memoryStorage(), getItem: () => later.promise } },
		])

		store.count = 99
		earlier.resolve('{"count":1,"label":"earlier"}')
		later.resolve('{"count":2,"label":"later"}')
		await store.$onRestore()
		expect(store.$state).toEqual({ count: 99, label: 'later' })
	})
	it('does not remove the replacement when a disposed store is disposed again', () => {
		install(memoryStorage() as Storage)
		const useStore = defineStore(`runtime-${++id}`, { state: () => ({ count: 0 }), persist: true })
		const first = useStore()
		first.$dispose()
		const replacement = useStore()
		first.$dispose()
		expect(useStore() === replacement).toBe(true)
	})

	it('preserves a user edit back to defaults between async configurations', async () => {
		const first = deferred<string>()
		const second = deferred<string>()
		install()
		const adapter = (read: Promise<string>) => ({ getItem: () => read, setItem() {}, removeItem() {} })
		const store = defineStore('back-to-defaults', {
			state: () => ({ count: 0 }),
			persist: [{ storage: adapter(first.promise) }, { storage: adapter(second.promise) }],
		})()
		first.resolve('{"count":1}')
		for (let i = 0; i < 10; i++)
			await Promise.resolve()
		expect(store.count).toBe(1)
		store.count = 0
		second.resolve('{"count":2}')
		await store.$onRestore()
		expect(store.count).toBe(0)
	})
})
