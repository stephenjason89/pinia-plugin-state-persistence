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
	it('reads all synchronous configurations before restoring without storage feedback', () => {
		const first = memoryStorage({ first: '{"count":1}' })
		const second = memoryStorage({ second: '{"count":2}' })
		install()
		const store = makeStore(() => ({ count: 0 }), [
			{ key: 'first', storage: first as Storage },
			{ key: 'second', storage: second as Storage },
		])
		expect(store.count).toBe(2)
		expect(first.data.get('first')).toBe('{"count":1}')
		expect(second.data.get('second')).toBe('{"count":2}')

		first.data.set('first', '{"count":10}')
		second.data.set('second', '{"count":20}')
		expect(store.$restore()).toBeUndefined()
		expect(store.count).toBe(20)
		expect(first.data.get('first')).toBe('{"count":10}')
		expect(second.data.get('second')).toBe('{"count":20}')
	})
	it('removes mapped storage values when the original field becomes undefined', async () => {
		const storage = memoryStorage({ optional: '10' })
		install(storage as Storage)
		const store = makeStore(() => ({ optional: 0 as number | undefined }), { key: { optional: 'optional' } })
		store.optional = undefined
		await store.$onPersist()
		expect(storage.data.has('optional')).toBe(false)

		install(storage as Storage)
		const replacement = defineStore(store.$id, {
			state: () => ({ optional: 0 as number | undefined }),
			persist: { key: { optional: 'optional' } },
		})()
		expect(replacement.optional).toBe(0)
	})

	it('does not remove mapped values intentionally omitted by include or exclude', () => {
		for (const selection of [{ include: 'other' }, { exclude: 'optional' }]) {
			const storage = memoryStorage({ optional: '10' })
			install(storage as Storage)
			const store = makeStore(() => ({ optional: undefined as number | undefined, other: 0 }), {
				key: { optional: 'optional' },
				...selection,
			})
			store.optional = undefined
			store.other++
			expect(storage.data.get('optional')).toBe('10')
		}
	})
	it('keeps store creation working when the localStorage getter is denied', () => {
		const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
		Object.defineProperty(globalThis, 'window', {
			configurable: true,
			value: Object.defineProperty({}, 'localStorage', {
				get: () => { throw new Error('SecurityError') },
			}),
		})
		try {
			install()
			expect(() => makeStore(() => ({ count: 0 }), true)).not.toThrow()
		}
		finally {
			if (previous)
				Object.defineProperty(globalThis, 'window', previous)
			else
				Reflect.deleteProperty(globalThis, 'window')
		}
	})

	it('accepts null-prototype storage adapters', () => {
		const storage = Object.assign(Object.create(null), memoryStorage({ count: '{"count":10}' })) as Storage
		install(storage)
		const store = makeStore(() => ({ count: 0 }), { key: 'count' })
		expect(store.count).toBe(10)
	})
	it('round-trips mapped deepCopy null without changing raw primitive strings', () => {
		const storage = memoryStorage()
		const state = () => ({ first: 1 as number | null, second: 2 as number | null, text: 'default' })
		const persist = { key: { first: 'first', second: 'second', text: 'text' }, deepCopy: true }
		install(storage as Storage)
		const store = makeStore(state, persist)
		store.$patch({ first: null, second: null, text: 'null' })

		install(storage as Storage)
		const restored = defineStore(store.$id, { state, persist })()
		expect(restored.$state).toEqual({ first: null, second: null, text: 'null' })
		restored.first = 7

		install(storage as Storage)
		const updated = defineStore(store.$id, { state, persist })()
		expect(updated.$state).toEqual({ first: 7, second: null, text: 'null' })
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
	it('does not apply a restoration batch superseded by a newer manual restore', async () => {
		const initial = deferred<string>()
		const manual = deferred<string>()
		let reads = 0
		install({ ...memoryStorage(), getItem: () => ++reads === 1 ? initial.promise : manual.promise })
		const store = makeStore(() => ({ count: 0 }), true)
		const initialRestore = store.$onRestore()
		const manualRestore = store.$restore()

		initial.resolve('{"count":1}')
		await initialRestore
		expect(store.count).toBe(0)
		manual.resolve('{"count":2}')
		await manualRestore
		expect(store.count).toBe(2)
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
