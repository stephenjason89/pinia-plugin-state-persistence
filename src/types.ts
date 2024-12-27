import type { StateTree } from 'pinia'

export interface AsyncStorage {
	getItem: (key: string) => Promise<string | null> | string | null
	setItem: (key: string, value: string) => any
	removeItem: (key: string) => any
}

export interface PersistOptions<S extends StateTree = StateTree> {
	key?: string
	debug?: boolean
	overwrite?: boolean
	storage?: Storage | AsyncStorage
	filter?: (mutation: any, state: S) => boolean
	serialize?: (state: Partial<S>) => string
	deserialize?: (state: string) => Partial<S>
	merge?: (currentState: S, savedState: Partial<S>) => S
	include?: string | string[]
	exclude?: string | string[]
}

declare module 'pinia' {
	// eslint-disable-next-line unused-imports/no-unused-vars
	export interface DefineStoreOptionsBase<S extends StateTree, Store> {
		persist?: boolean | PersistOptions<S>
	}
}
