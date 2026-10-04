import type { PersistOptions, Storage } from '../src/types'
import { describe, expect, it } from 'bun:test'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import { createStatePersistence } from '../src/index'
import { applyStateFilter, enqueue, getNestedValue, getObjectDiff } from '../src/utils'

function memoryStorage(initial: Record<string, string> = {}) {
	const data = new Map(Object.entries(initial))
	return {
		data,
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => { data.set(key, value) },
		removeItem: (key: string) => { data.delete(key) },
	}
}

function deferred<T>(PromiseType = Promise) {
	let resolve!: (value: T) => void
	let reject!: (reason: unknown) => void
	const promise = new PromiseType<T>((onResolve, onReject) => {
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
	it('includes array length without changing its descriptor or live values', () => {
		const state = { items: [{ name: 'first' }, { name: 'second' }] }
		for (const include of ['items.length', ['items.0.name', 'items.length'], ['items', 'items.length']]) {
			const filtered = applyStateFilter(state, include, null)
			expect(Array.isArray(filtered.items)).toBe(true)
			expect(filtered.items.length).toBe(2)
			expect(Object.getOwnPropertyDescriptor(filtered.items, 'length')).toMatchObject({ enumerable: false, configurable: false })
			expect(state.items).toEqual([{ name: 'first' }, { name: 'second' }])
		}
		expect(applyStateFilter({ metadata: { length: 2 } }, 'metadata.length', null)).toEqual({ metadata: { length: 2 } })
	})

	it('persists an array length include through Pinia without rejecting', async () => {
		const storage = memoryStorage()
		activate(storage)
		const store = makeStore(() => ({ items: [1, 2] }), { include: 'items.length' })
		await store.$persist()
		expect(JSON.parse(storage.data.get(store.$id)!)).toEqual({ items: [null, null] })
		expect(store.items).toEqual([1, 2])
	})

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
