import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import * as esm from 'pinia-plugin-state-persistence'
import { createApp, reactive } from 'vue'

const cjs = createRequire(import.meta.url)('pinia-plugin-state-persistence')

let id = 0
for (const [format, { createStatePersistence }] of [['esm', esm], ['cjs', cjs]]) {
	function install(storage) {
		const pinia = createPinia()
		pinia.use(createStatePersistence({ storage }))
		createApp({ render: () => null }).use(pinia)
		setActivePinia(pinia)
	}

	test(`${format}: restores large setup arrays and keeps their reactive connection`, () => {
		const saved = Array.from({ length: 200_000 }, (_, index) => index)
		let writes = 0
		let persisted
		install({
			getItem: () => JSON.stringify({ items: saved }),
			setItem: (_key, value) => {
				writes++
				persisted = JSON.parse(value)
			},
			removeItem() {},
		})
		const items = reactive([])
		const store = defineStore(`node-${++id}`, () => ({ items }), { persist: { overwrite: true } })()
		assert.equal(store.items, items)
		assert.equal(items.length, saved.length)
		assert.equal(items[100_000], 100_000)
		assert.equal(items.at(-1), 199_999)
		assert.equal(writes, 0)
		items[199_999] = -1
		assert.equal(writes, 1)
		assert.equal(persisted.items.at(-1), -1)
	})

	test(`${format}: groups large asynchronous manual restores without storage feedback`, async () => {
		let snapshot = null
		let writes = 0
		install({
			getItem: () => Promise.resolve(snapshot),
			setItem: () => { writes++ },
			removeItem() {},
		})
		const items = reactive([])
		const store = defineStore(`node-${++id}`, () => ({ items }), { persist: { overwrite: true } })()
		await store.$onRestore()
		const mutations = []
		store.$subscribe(mutation => mutations.push(mutation.type), { flush: 'sync' })
		snapshot = JSON.stringify({ items: Array.from({ length: 200_000 }, (_, index) => index) })
		await store.$restore()
		assert.equal(store.items, items)
		assert.equal(items.length, 200_000)
		assert.deepEqual(mutations, ['patch function'])
		assert.equal(writes, 0)
	})

	test(`${format}: retains values when raw storage aliases the live setup array`, () => {
		let snapshot = null
		install({ getItem: () => snapshot, setItem() {}, removeItem() {} })
		const items = reactive([1, 2])
		const store = defineStore(`node-${++id}`, () => ({ items }), { persist: { overwrite: true } })()
		snapshot = { items }
		store.$restore()
		assert.equal(store.items, items)
		assert.deepEqual(items, [1, 2])
	})
}
