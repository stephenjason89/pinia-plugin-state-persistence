import type { StateTree } from 'pinia'

type MaybePromise<T> = T | Promise<T>

export type StorageValue = string | number | boolean | object | null

// Keep native string-only storage methods assignable alongside raw-value adapters.
/* eslint-disable ts/method-signature-style */
export interface Storage {
	getItem(key: string): MaybePromise<StorageValue>
	setItem(key: string, value: StorageValue): MaybePromise<any>
	removeItem(key: string): MaybePromise<any>
}
/* eslint-enable ts/method-signature-style */

export interface PersistOptions<S extends StateTree = StateTree, SerializationValue = Partial<S>> {
	key?: string | Record<keyof S, string> | Record<string, string>
	debug?: boolean
	overwrite?: boolean
	clientOnly?: boolean
	storage?: Storage
	filter?: (mutation: any, state: S) => boolean
	serialize?: (state: SerializationValue) => string
	deserialize?: (state: string) => Partial<S> | S[keyof S]
	deepCopy?: boolean
	include?: string | string[]
	exclude?: string | string[]
}

export interface GlobalPersistOptions<S extends StateTree = StateTree> extends Omit<PersistOptions<S>, 'key' | 'include' | 'exclude'> {
	key?: string
}

declare module 'pinia' {
	export interface PiniaCustomProperties {
		$persist: () => MaybePromise<void>
		$restore: () => MaybePromise<void>
		$onRestore: (callback?: () => void) => Promise<void>
		$onPersist: (callback?: () => void) => Promise<void>
	}
	// eslint-disable-next-line unused-imports/no-unused-vars
	export interface DefineStoreOptionsBase<S extends StateTree, Store> {
		persist?: boolean | PersistOptions<S> | Omit<PersistOptions<S>, 'overwrite'>[]
	}
}
