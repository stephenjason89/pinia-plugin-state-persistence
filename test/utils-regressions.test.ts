import type { PersistOptions, Storage } from '../src/types'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'bun:test'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import { createStatePersistence } from '../src/index'
import { applyStateFilter, enqueue, fingerprint, getNestedValue, getObjectDiff } from '../src/utils'

function memoryStorage(initial: Record<string, string> = {}) {
	const data = new Map(Object.entries(initial))
	return {
		data,
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => { data.set(key, value) },
		removeItem: (key: string) => { data.delete(key) },
	}
}

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason: unknown) => void
	const promise = new Promise<T>((onResolve, onReject) => {
		resolve = onResolve
		reject = onReject
	})
	return { promise, resolve, reject }
}

function activate(storage: Storage) {
	const pinia = createPinia()
	pinia.use(createStatePersistence({ storage }))
	createApp({ render: () => null }).use(pinia)
	setActivePinia(pinia)
}

let nextId = 0
function makeStore<S extends Record<string, any>>(state: () => S, persist: PersistOptions<S>, id = `utils-${++nextId}`) {
	return defineStore(id, { state, persist: persist as any })()
}

describe('own-property persistence', () => {
	it('includes special own paths without changing object prototypes', () => {
		const state = JSON.parse('{"__proto__":{"auditPollution":"saved"},"constructor":{"name":"own"},"toString":"own"}')
		try {
			const result = applyStateFilter(state, '__proto__.auditPollution', null)
			const polluted = Object.hasOwn(Object.prototype, 'auditPollution')
			expect(polluted).toBe(false)
			expect(Object.hasOwn(result, '__proto__')).toBe(true)
			expect(JSON.parse(JSON.stringify(applyStateFilter(state, ['__proto__.auditPollution', 'constructor.name', 'toString'], null)))).toEqual(state)
			expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
		}
		finally {
			delete (Object.prototype as any).auditPollution
		}
	})

	it('never reads inherited include or exclude paths', () => {
		const state = Object.create({ inherited: { secret: 'prototype' } })
		state.own = 'value'
		expect(getNestedValue(state, 'inherited.secret')).toBeUndefined()
		expect(applyStateFilter(state, ['inherited.secret', 'toString', 'own'], null)).toEqual({ own: 'value' })
		expect(applyStateFilter(state, null, 'constructor.name')).toEqual({ own: 'value' })
	})

	it('keeps unmapped special own fields in the object diff', () => {
		const state = JSON.parse('{"constructor":"own constructor","toString":"own toString","count":1}')
		expect(getObjectDiff(state, { count: 'count-key' })).toEqual({ constructor: 'own constructor', toString: 'own toString' })
	})

	it('queues special storage keys as own entries and recovers after rejection', async () => {
		for (const key of ['toString', 'constructor', '__proto__']) {
			const queues = {}
			const events: number[] = []
			const first = enqueue(queues, key, async () => {
				events.push(1)
				throw new Error('storage failed')
			})
			const second = enqueue(queues, key, () => {
				events.push(2)
			})
			await expect(first).rejects.toThrow('storage failed')
			await second
			await Promise.resolve()
			expect(events).toEqual([1, 2])
			expect(Object.getPrototypeOf(queues)).toBe(Object.prototype)
			expect(Object.hasOwn(queues, key)).toBe(false)
		}
	})

	it('round-trips Pinia stores through special storage keys', async () => {
		for (const key of ['toString', 'constructor', '__proto__']) {
			const storage = memoryStorage({ [key]: '{"count":5}' })
			activate(storage)
			const first = makeStore(() => ({ count: 0 }), { key })
			expect(first.count).toBe(5)
			first.count = 10
			await first.$onPersist()
			expect(storage.data.get(key)).toBe('{"count":10}')

			activate(storage)
			const restored = makeStore(() => ({ count: 0 }), { key }, first.$id)
			expect(restored.count).toBe(10)
		}
	})

	it('round-trips unmapped special own fields with mapped Pinia persistence', () => {
		const storage = memoryStorage()
		const state = () => JSON.parse('{"constructor":"own constructor","toString":"own toString","count":1}')
		activate(storage)
		const first = makeStore(state, { key: { count: 'count-key' } })
		first.$persist()
		expect(JSON.parse(storage.data.get(first.$id)!)).toEqual({ constructor: 'own constructor', toString: 'own toString' })

		activate(storage)
		const restored = makeStore(() => JSON.parse('{"constructor":"default","toString":"default","count":0}'), { key: { count: 'count-key' } }, first.$id)
		expect(restored.$state).toEqual(state())
	})
	it('restores mapped own special property names without changing the state prototype', () => {
		const storage = memoryStorage({ special: '"saved"' })
		activate(storage as Storage)
		const store = makeStore(() => JSON.parse('{"__proto__":"default"}'), {
			key: JSON.parse('{"__proto__":"special"}'),
		})
		expect(Object.hasOwn(store.$state, '__proto__')).toBe(true)
		expect(Reflect.get(store.$state, '__proto__')).toBe('saved')
		expect(Object.getPrototypeOf(store.$state)).toBe(Object.prototype)
	})
	it('does not persist inherited values for missing mapped special property names', () => {
		const storage = memoryStorage()
		activate(storage as Storage)
		const store = makeStore(() => ({ other: 0 }), {
			key: JSON.parse('{"__proto__":"proto-key","constructor":"constructor-key"}'),
		})
		store.$persist()
		expect(storage.data.has('proto-key')).toBe(false)
		expect(storage.data.has('constructor-key')).toBe(false)
	})
	it('round-trips an empty mapped own state key in serialized and raw storage', () => {
		for (const deepCopy of [false, true]) {
			const storage = memoryStorage()
			const state = () => ({ '': 'default' })
			const persist = { key: { '': 'empty-key' }, deepCopy }
			activate(storage as Storage)
			const store = makeStore(state, persist)
			store[''] = 'saved'
			activate(storage as Storage)
			const restored = defineStore(store.$id, { state, persist })()
			expect(restored['']).toBe('saved')
		}
	})

	it('restores new own prototype-named fields without changing prototypes', () => {
		for (const mapped of [false, true]) {
			const saved = mapped ? '{"attacker":"saved"}' : '{"__proto__":{"attacker":"saved"},"nested":{"__proto__":{"attacker":"nested"}}}'
			const storage = memoryStorage(mapped ? { special: saved } : { 'new-special': saved })
			activate(storage)
			const store = defineStore('new-special', {
				state: () => ({ count: 0, nested: {} as Record<string, any> }),
				persist: mapped ? { key: JSON.parse('{"__proto__":"special"}') } : true,
			})()
			expect(Object.getPrototypeOf(store.$state)).toBe(Object.prototype)
			expect(Object.hasOwn(store.$state, '__proto__')).toBe(true)
			expect(Object.getOwnPropertyDescriptor(store.$state, '__proto__')!.value.attacker).toBe('saved')
			if (!mapped) {
				expect(Object.getPrototypeOf(store.nested)).toBe(Object.prototype)
				expect(Object.hasOwn(store.nested, '__proto__')).toBe(true)
			}
		}
	})

	it('restores an absent own constructor field from an asynchronous snapshot', async () => {
		const read = deferred<string>()
		activate({ getItem: () => read.promise, setItem() {}, removeItem() {} })
		const store = defineStore('new-constructor', { state: () => ({ count: 0 }), persist: true })()
		read.resolve('{"constructor":"saved"}')
		await store.$onRestore()
		expect(Object.hasOwn(store.$state, 'constructor')).toBe(true)
		expect(store.$state.constructor as unknown).toBe('saved')
	})
})

describe('included path shape', () => {
	it('preserves nested arrays when including individual array item fields', () => {
		const state = { items: [{ name: 'a', secret: 'first' }, { name: 'b', secret: 'second' }] }
		const filtered = applyStateFilter(state, ['items.0.name', 'items.1.name'], null)
		expect(Array.isArray(filtered.items)).toBe(true)
		expect(filtered).toEqual({ items: [{ name: 'a' }, { name: 'b' }] })
		expect(state.items[0].secret).toBe('first')
	})

	it('does not write into live state when parent and child includes overlap', () => {
		for (const include of [['user', 'user.name'], ['user.name', 'user']]) {
			let writes = 0
			const user = new Proxy({ name: 'a', password: 'secret' }, {
				defineProperty(target, property, descriptor) {
					writes++
					return Reflect.defineProperty(target, property, descriptor)
				},
			})
			expect(applyStateFilter({ user }, include, 'user.password')).toEqual({ user: { name: 'a' } })
			expect(writes).toBe(0)
			expect(user.password).toBe('secret')
		}
	})

	it('round-trips included array item fields through Pinia without changing array type', () => {
		const storage = memoryStorage()
		activate(storage)
		const first = makeStore(() => ({ items: [{ name: 'a', secret: 'first' }, { name: 'b', secret: 'second' }] }), { include: ['items.0.name', 'items.1.name'] })
		first.$persist()
		expect(JSON.parse(storage.data.get(first.$id)!)).toEqual({ items: [{ name: 'a' }, { name: 'b' }] })
		expect(first.items[0].secret).toBe('first')

		activate(storage)
		const restored = makeStore(() => ({ items: [] as Array<{ name: string }> }), {}, first.$id)
		expect(Array.isArray(restored.items)).toBe(true)
		expect(restored.items).toEqual([{ name: 'a' }, { name: 'b' }])
	})
})

describe('async restore fingerprints', () => {
	it('distinguishes BigInt state values while preserving normal JSON comparisons', () => {
		expect(fingerprint(0n)).not.toBe(fingerprint(100n))
		expect(fingerprint(5n)).toBe(fingerprint(5n))
		expect(fingerprint({ count: 1, name: 'a' })).toBe(JSON.stringify({ count: 1, name: 'a' }))
		expect(fingerprint(new Date('2026-01-01'))).toBe(JSON.stringify(new Date('2026-01-01')))
		expect(fingerprint(undefined)).toBe(fingerprint(undefined))
		expect(fingerprint(() => {})).not.toBe(fingerprint(undefined))
		expect(fingerprint(Symbol('value'))).not.toBe(fingerprint(undefined))
		class JsonValue {
			count = 1
		}
		expect(fingerprint(new JsonValue())).toBe('{"count":1}')
		expect(fingerprint({ toJSON: () => ({ count: 1 }) })).toBe('{"count":1}')
	})

	it('never reports unsupported or cyclic values as reliably unchanged', () => {
		const cyclic: Record<string, unknown> = {}
		cyclic.self = cyclic
		for (const value of [cyclic, { counts: new Map([['count', 1]]) }, { values: new Set([1]) }, { pattern: /first/ }, { count: 1n }, new Map([['count', undefined]]), new Set([Number.NaN])]) {
			expect(fingerprint(value)).not.toBe(fingerprint(value))
		}
	})

	it('keeps live BigInt changes made before a custom async restore completes', async () => {
		const read = deferred<string | null>()
		const storage = { ...memoryStorage(), getItem: () => read.promise }
		activate(storage)
		const store = makeStore(() => ({ count: 0n }), {
			serialize: state => JSON.stringify(state, (_key, value) => typeof value === 'bigint' ? value.toString() : value),
			deserialize: value => ({ count: BigInt(JSON.parse(value).count) }),
		})
		store.count = 100n
		read.resolve('{"count":"5"}')
		await store.$onRestore()
		await store.$onPersist()
		expect(store.count).toBe(100n)
		expect(storage.data.get(store.$id)).toBe('{"count":"100"}')
	})

	it('still restores unchanged top-level BigInt fields asynchronously', async () => {
		const read = deferred<string | null>()
		activate({ ...memoryStorage(), getItem: () => read.promise })
		const store = makeStore(() => ({ count: 0n }), {
			serialize: state => JSON.stringify(state, (_key, value) => typeof value === 'bigint' ? value.toString() : value),
			deserialize: value => ({ count: BigInt(JSON.parse(value).count) }),
		})
		read.resolve('{"count":"5"}')
		await store.$onRestore()
		expect(store.count).toBe(5n)
	})

	it('keeps live Map changes made before a custom async restore completes', async () => {
		const read = deferred<string | null>()
		const storage = { ...memoryStorage(), getItem: () => read.promise }
		activate(storage)
		const store = makeStore(() => ({ counts: new Map([['count', 0]]) }), {
			serialize: state => JSON.stringify({ counts: [...state.counts!.entries()] }),
			deserialize: value => ({ counts: new Map<string, number>(JSON.parse(value).counts) }),
		})
		store.counts.set('count', 100)
		read.resolve('{"counts":[["count",5]]}')
		await store.$onRestore()
		await store.$onPersist()
		expect(store.counts.get('count')).toBe(100)
		expect(storage.data.get(store.$id)).toBe('{"counts":[["count",100]]}')
	})

	it('restores unchanged top-level Map fields with a custom async codec', async () => {
		const mapRead = deferred<string | null>()
		activate({ ...memoryStorage(), getItem: () => mapRead.promise })
		const mapStore = makeStore(() => ({ counts: new Map([['count', 0]]) }), {
			serialize: state => JSON.stringify({ counts: [...state.counts!.entries()] }),
			deserialize: value => ({ counts: new Map<string, number>(JSON.parse(value).counts) }),
		})
		mapRead.resolve('{"counts":[["count",5]]}')
		await mapStore.$onRestore()
		expect(mapStore.counts.get('count')).toBe(5)
	})

	it('restores unchanged top-level Set fields with a custom async codec', async () => {
		const setRead = deferred<string | null>()
		activate({ ...memoryStorage(), getItem: () => setRead.promise })
		const setStore = makeStore(() => ({ values: new Set<number>() }), {
			serialize: state => JSON.stringify({ values: [...state.values!] }),
			deserialize: value => ({ values: new Set<number>(JSON.parse(value).values) }),
		})
		setRead.resolve('{"values":[5]}')
		await setStore.$onRestore()
		expect([...setStore.values]).toEqual([5])
	})

	it('keeps live Set changes made before a custom async restore completes', async () => {
		const read = deferred<string | null>()
		const storage = { ...memoryStorage(), getItem: () => read.promise }
		activate(storage)
		const store = makeStore(() => ({ values: new Set<number>() }), {
			serialize: state => JSON.stringify({ values: [...state.values!] }),
			deserialize: value => ({ values: new Set<number>(JSON.parse(value).values) }),
		})
		store.values.add(100)
		read.resolve('{"values":[5]}')
		await store.$onRestore()
		await store.$onPersist()
		expect([...store.values]).toEqual([100])
		expect(storage.data.get(store.$id)).toBe('{"values":[100]}')
	})

	it('compares top-level container content and types without colliding with JSON strings', () => {
		for (const value of [new Map([['count', 1]]), new Set([1]), /first/g, runInNewContext('new Map([["count", 1]])'), runInNewContext('new Set([1])'), runInNewContext('/first/g')]) {
			const comparison = fingerprint(value)
			expect(comparison).toBe(fingerprint(value))
			expect(comparison).not.toBe(fingerprint(comparison))
		}
		expect(fingerprint(new Map([['count', 1]]))).not.toBe(fingerprint([['count', 1]]))
		expect(fingerprint(new Set([1]))).not.toBe(fingerprint([1]))
		expect(fingerprint(/first/g)).not.toBe(fingerprint(/second/g))
		expect(fingerprint(/first/g)).not.toBe(fingerprint(/first/i))
		const pattern = /first/g
		const before = fingerprint(pattern)
		pattern.lastIndex = 100
		expect(fingerprint(pattern)).not.toBe(before)
	})

	it('keeps live RegExp lastIndex changes made before a custom async restore completes', async () => {
		const read = deferred<string | null>()
		activate({ ...memoryStorage(), getItem: () => read.promise })
		const store = makeStore(() => ({ pattern: /first/g }), {
			serialize: state => JSON.stringify({ pattern: [state.pattern!.source, state.pattern!.flags, state.pattern!.lastIndex] }),
			deserialize: (value) => {
				const [source, flags, lastIndex] = JSON.parse(value).pattern
				return { pattern: Object.assign(new RegExp(source, flags), { lastIndex }) }
			},
		})
		store.pattern.lastIndex = 100
		read.resolve('{"pattern":["saved","g",5]}')
		await store.$onRestore()
		expect(store.pattern.source).toBe('first')
		expect(store.pattern.lastIndex).toBe(100)
	})

	it('conservatively keeps nested unsupported async values but permits synchronous custom restoration', async () => {
		const options = {
			key: 'map-state',
			serialize: (state: { profile?: { counts: Map<string, number> } }) => JSON.stringify({ profile: { counts: [...state.profile!.counts.entries()] } }),
			deserialize: (value: string) => ({ profile: { counts: new Map<string, number>(JSON.parse(value).profile.counts) } }),
		}
		const read = deferred<string | null>()
		activate({ ...memoryStorage(), getItem: () => read.promise })
		const asynchronous = makeStore(() => ({ profile: { counts: new Map([['count', 0]]) } }), options)
		read.resolve('{"profile":{"counts":[["count",5]]}}')
		await asynchronous.$onRestore()
		expect(asynchronous.profile.counts.get('count')).toBe(0)

		activate(memoryStorage({ 'map-state': '{"profile":{"counts":[["count",5]]}}' }))
		const synchronous = makeStore(() => ({ profile: { counts: new Map([['count', 0]]) } }), options)
		expect(synchronous.profile.counts.get('count')).toBe(5)
	})

	it('distinguishes non-finite and signed numbers from JSON collisions', async () => {
		expect(fingerprint(Number.NaN)).not.toBe(fingerprint(null))
		expect(fingerprint(Number.POSITIVE_INFINITY)).not.toBe(fingerprint(null))
		expect(fingerprint(-0)).not.toBe(fingerprint(0))
		expect(fingerprint({ count: Number.NaN })).not.toBe(fingerprint({ count: null }))
		const read = deferred<string>()
		activate({ getItem: () => read.promise, setItem() {}, removeItem() {} })
		const store = defineStore('non-finite', {
			state: () => ({ count: null as number | null }),
			persist: { serialize: value => JSON.stringify(value, (_key, current) => Number.isNaN(current) ? 'NaN' : current) },
		})()
		store.count = Number.NaN
		read.resolve('{"count":5}')
		await store.$onRestore()
		expect(Number.isNaN(store.count)).toBe(true)
	})
})
