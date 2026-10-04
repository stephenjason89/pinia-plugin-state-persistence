import type { PersistOptions, Storage } from '../../src/types.js'
import { defineStore } from 'pinia'
import { createStatePersistence } from '../../src/index.js'

interface ExampleState {
	count: number
	label: string
	enabled: boolean
	profile: { name: string }
}

const fullState: PersistOptions<ExampleState> = {
	serialize: state => JSON.stringify(state.count),
	deserialize: value => ({ count: Number(value) }),
}

const mappedState: PersistOptions<ExampleState, Partial<ExampleState> | ExampleState[keyof ExampleState]> = {
	key: { count: 'count', label: 'label', enabled: 'enabled' },
	serialize: state => typeof state === 'object' ? JSON.stringify(state) : String(state),
	deserialize: value => Number(value),
}

const nativeStorage: Storage = localStorage
const rawStorage: Storage = {
	getItem: () => false,
	setItem: async (_key, value) => {
		const accepted: string | number | boolean | object | null = value
		return accepted
	},
	removeItem: async () => {},
}

const nativeSessionStorage: Storage = sessionStorage
nativeStorage.setItem('key', 'value')
nativeSessionStorage.setItem('key', 'value')
rawStorage.setItem('count', 1)
rawStorage.setItem('enabled', false)
rawStorage.setItem('empty', null)
rawStorage.setItem('profile', { name: 'name' })
// @ts-expect-error Symbols are not supported storage values.
rawStorage.setItem('unsupported', Symbol('unsupported'))

const invalidSerializer: PersistOptions<ExampleState> = {
	// @ts-expect-error Serializers must return strings.
	serialize: () => 1,
}
const invalidDeserializedState: PersistOptions<ExampleState> = {
	// @ts-expect-error Deserializers must return whole-state or property values.
	deserialize: () => Symbol('invalid'),
}

createStatePersistence<ExampleState>({ serialize: state => JSON.stringify(state.count) })
defineStore('typed-full-state', {
	state: (): ExampleState => ({ count: 1, label: 'a', enabled: true, profile: { name: 'a' } }),
	persist: { serialize: state => JSON.stringify(state.count) },
})

const invalidKey: PersistOptions<ExampleState> = {
	// @ts-expect-error Mapped storage keys must be strings.
	key: { count: 1 },
}

defineStore('typed-mapped-state', {
	state: (): ExampleState => ({ count: 1, label: 'a', enabled: true, profile: { name: 'a' } }),
	persist: mappedState,
})

void [fullState, invalidSerializer, invalidDeserializedState, invalidKey]
