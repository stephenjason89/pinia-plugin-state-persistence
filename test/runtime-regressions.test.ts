import type { PersistOptions, Storage } from '../src/types'
import { describe, expect, it } from 'bun:test'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { createApp, reactive, ref } from 'vue'
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

	it('reports synchronous and asynchronous write failures to explicit callers', async () => {
		for (const asynchronous of [false, true]) {
			const failure = new Error(asynchronous ? 'async write failed' : 'sync write failed')
			const storage = {
				...memoryStorage(),
				setItem: () => {
					if (asynchronous)
						return Promise.reject(failure)
					throw failure
				},
			}
			install(storage)
			const store = makeStore(() => ({ count: 0 }), true)
			expect(() => {
				store.count++
			}).not.toThrow()
			await expect(store.$onPersist()).rejects.toThrow(failure.message)
			await expect(Promise.resolve(store.$persist())).rejects.toThrow(failure.message)
		}
	})

	it('handles ignored persistence failures and rejected callback observers', async () => {
		const unhandled: unknown[] = []
		const onUnhandled = (reason: unknown) => unhandled.push(reason)
		process.on('unhandledRejection', onUnhandled)
		try {
			install({ ...memoryStorage(), setItem: () => Promise.reject(new Error('write failed')) })
			const store = makeStore(() => ({ count: 0 }), true)
			store.count++
			store.$persist()
			let called = false
			store.$onPersist(() => {
				called = true
			})
			await new Promise(resolve => setTimeout(resolve, 10))
			expect(called).toBe(false)
			expect(unhandled).toEqual([])
		}
		finally {
			process.off('unhandledRejection', onUnhandled)
		}
	})
	it('does not abort actions when automatic filtering or serialization fails', async () => {
		for (const failingOption of ['filter', 'serialize'] as const) {
			install(memoryStorage() as Storage)
			const options = {
				[failingOption]: () => {
					throw new Error(`${failingOption} failed`)
				},
			}
			const useStore = defineStore(`runtime-${++id}`, {
				state: () => ({ count: 0, finished: false }),
				actions: {
					increment() {
						this.count++
						this.finished = true
					},
				},
				persist: options,
			})
			const store = useStore()
			expect(() => store.increment()).not.toThrow()
			expect(store.finished).toBe(true)
			await expect(store.$onPersist()).rejects.toThrow(`${failingOption} failed`)
			await expect(Promise.resolve(store.$persist())).rejects.toThrow(`${failingOption} failed`)
		}
	})

	it('reports a successful retry after an earlier synchronous write failure', async () => {
		let failing = true
		const storage = memoryStorage()
		install({
			...storage,
			setItem: (key, value) => {
				if (failing)
					throw new Error('temporary failure')
				storage.setItem(key, value)
			},
		})
		const store = makeStore(() => ({ count: 0 }), true)
		await expect(Promise.resolve(store.$persist())).rejects.toThrow('temporary failure')
		failing = false
		store.$persist()
		await expect(store.$onPersist()).resolves.toBeUndefined()
	})
	it('overwrites option-store snapshots including empty snapshots', () => {
		for (const saved of ['{"count":10,"nested":{"saved":true}}', '{}']) {
			install(memoryStorage({ snapshot: saved }) as Storage)
			const store = makeStore(() => ({ count: 0, obsolete: 'default', nested: { old: true } }), {
				key: 'snapshot',
				overwrite: true,
			})
			expect(store.$state).toEqual(JSON.parse(saved))
		}
	})

	it('keeps setup refs connected when overwriting snapshots', () => {
		const storage = memoryStorage({ snapshot: '{"count":10,"nested":{"saved":true}}' })
		install(storage as Storage)
		const useStore = defineStore(`runtime-${++id}`, () => ({
			count: ref(0),
			omitted: ref<string | undefined>('default'),
			nested: ref<Record<string, boolean>>({ old: true }),
		}), { persist: { key: 'snapshot', overwrite: true } })
		const store = useStore()
		expect(store.$state).toEqual({ count: 10, omitted: undefined, nested: { saved: true } })
		store.omitted = 'edited'
		store.count = 11
		expect(JSON.parse(storage.data.get('snapshot') as string)).toEqual({ count: 11, omitted: 'edited', nested: { saved: true } })
	})

	it('preserves edited and newly added fields omitted by an async overwrite snapshot', async () => {
		const read = deferred<string>()
		install({ ...memoryStorage(), getItem: () => read.promise })
		const store = makeStore(() => ({ count: 0, edited: 'default', obsolete: true }), { overwrite: true })
		store.edited = 'user'
		store.$patch({ added: 99 } as any)
		read.resolve('{"count":10}')
		await store.$onRestore()
		expect(store.$state).toEqual({ count: 10, edited: 'user', added: 99 })
	})

	it('keeps defaults when an overwrite storage snapshot is missing', () => {
		install(memoryStorage() as Storage)
		const store = makeStore(() => ({ count: 0 }), { overwrite: true })
		expect(store.$state).toEqual({ count: 0 })
	})
	it('applies later overwrite configurations after fields removed by an earlier restore', async () => {
		const earlier = deferred<string>()
		const later = deferred<string>()
		install()
		const store = makeStore(() => ({ first: 0, second: 0 }), [
			{ storage: { ...memoryStorage(), getItem: () => earlier.promise }, overwrite: true },
			{ storage: { ...memoryStorage(), getItem: () => later.promise }, overwrite: true },
		])
		later.resolve('{"second":2}')
		earlier.resolve('{"first":1}')
		await store.$onRestore()
		expect(store.$state).toEqual({ second: 2 })
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
	it('reports exceptions from restore and persist callbacks through the returned promise', async () => {
		install(memoryStorage() as Storage)
		const store = makeStore(() => ({ count: 0 }), true)
		for (const observe of [store.$onRestore, store.$onPersist]) {
			await expect(observe(() => {
				throw new Error('callback failed')
			})).rejects.toThrow('callback failed')
		}
	})
	it('keeps setup reactive objects and arrays connected when provided or omitted by overwrite', () => {
		for (const provided of [false, true]) {
			const snapshot = provided ? '{"object":{"count":10},"array":[10]}' : '{}'
			const storage = memoryStorage({ snapshot })
			install(storage as Storage)
			const object = reactive<{ count?: number }>({ count: 0 })
			const array = reactive([0])
			const store = defineStore(`runtime-${++id}`, () => ({ object, array }), {
				persist: { key: 'snapshot', overwrite: true },
			})()
			expect(store.$state).toEqual({ object: provided ? { count: 10 } : {}, array: provided ? [10] : [] })
			expect(object).toEqual(provided ? { count: 10 } : {})
			expect(array).toEqual(provided ? [10] : [])
			object.count = 20
			array.push(20)
			expect(JSON.parse(storage.data.get('snapshot') as string)).toEqual({ object: { count: 20 }, array: provided ? [10, 20] : [20] })
		}
	})
	it('keeps setup reactive maps and sets connected with a custom codec', () => {
		for (const provided of [false, true]) {
			const storage = memoryStorage({ snapshot: provided ? '{"map":[["saved",10]],"set":["saved"]}' : {} })
			install(storage as Storage)
			const map = reactive(new Map([['default', 0]]))
			const set = reactive(new Set(['default']))
			const store = defineStore(`runtime-${++id}`, () => ({ map, set }), {
				persist: {
					key: 'snapshot',
					overwrite: true,
					serialize: state => JSON.stringify({ map: [...state.map!], set: [...state.set!] }),
					deserialize: (value) => {
						const state = JSON.parse(value)
						return { map: new Map<string, number>(state.map), set: new Set<string>(state.set) }
					},
				},
			})()
			expect([...map]).toEqual(provided ? [['saved', 10]] : [])
			expect([...set]).toEqual(provided ? ['saved'] : [])
			map.set('edited', 20)
			set.add('edited')
			expect(store.$state.map === map).toBe(true)
			expect(JSON.parse(storage.data.get('snapshot') as string)).toEqual({ map: provided ? [['saved', 10], ['edited', 20]] : [['edited', 20]], set: provided ? ['saved', 'edited'] : ['edited'] })
		}
	})
	it('keeps newly restored setup object fields reactive after a manual overwrite', () => {
		const storage = memoryStorage({ snapshot: '{}' })
		install(storage as Storage)
		const object = reactive<{ count?: number }>({ count: 0 })
		const store = defineStore(`runtime-${++id}`, () => ({ object }), {
			persist: { key: 'snapshot', overwrite: true },
		})()
		storage.data.set('snapshot', '{"object":{"count":10}}')
		store.$restore()
		object.count = 20
		expect(JSON.parse(storage.data.get('snapshot') as string)).toEqual({ object: { count: 20 } })
	})
	it('keeps setup reactive containers connected when saved root types are incompatible', () => {
		const storage = memoryStorage({ snapshot: '{"object":null,"array":{}}' })
		install(storage as Storage)
		const object = reactive({ count: 0 })
		const array = reactive([0])
		const store = defineStore(`runtime-${++id}`, () => ({ object, array }), {
			persist: { key: 'snapshot', overwrite: true },
		})()
		expect(store.$state).toEqual({ object: { count: 0 }, array: [0] })
		object.count = 20
		expect(JSON.parse(storage.data.get('snapshot') as string)).toEqual({ object: { count: 20 }, array: [0] })
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
