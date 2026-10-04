import type { PersistOptions, Storage } from 'pinia-plugin-state-persistence'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

const options: PersistOptions<{ count: number }> = { serialize: state => JSON.stringify(state.count) }
const storage: Storage = localStorage
createStatePersistence({ storage })

async function createStore() {
	const { defineStore } = await import('pinia')
	const store = defineStore('commonjs-consumer', { state: () => ({ count: 0 }), persist: options })()
	await store.$persist()
}

const invalid: PersistOptions<{ count: number }> = {
	// @ts-expect-error Packaged declarations must reject non-string serializer output.
	serialize: () => 1,
}
void [createStore, invalid]
