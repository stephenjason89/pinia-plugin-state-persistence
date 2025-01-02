import type { StateTree } from 'pinia'

type MaybePromise<T> = T | Promise<T>

export interface Storage {
	getItem: (key: string) => MaybePromise<string | object | null>
	setItem: (key: string, value: string) => MaybePromise<any>
	removeItem: (key: string) => MaybePromise<any>
}

export interface PersistOptions<S extends StateTree = StateTree> {
	key?: string
	debug?: boolean
	overwrite?: boolean
	clientOnly?: boolean
	storage?: Storage
	filter?: (mutation: any, state: S) => boolean
	serialize?: (state: Partial<S>) => string
	deserialize?: (state: string) => Partial<S>
	merge?: (currentState: S, savedState: Partial<S>) => S
	include?: string | string[]
	exclude?: string | string[]
}

declare module 'pinia' {
	export interface PiniaCustomProperties {
		$persist: () => void
		$restore: () => void
	}
	// eslint-disable-next-line unused-imports/no-unused-vars
	export interface DefineStoreOptionsBase<S extends StateTree, Store> {
		persist?: boolean | PersistOptions<S>
	}
}
