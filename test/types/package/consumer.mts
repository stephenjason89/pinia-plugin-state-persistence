import type { PersistOptions, Storage } from 'pinia-plugin-state-persistence'
import { defineStore } from 'pinia'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

const options: PersistOptions<{ count: number }> = { serialize: state => JSON.stringify(state.count) }
const storage: Storage = localStorage
createStatePersistence({ storage })
const store = defineStore('esm-consumer', { state: () => ({ count: 0 }), persist: options })()
store.$persist()
