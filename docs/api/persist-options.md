# PersistOptions
## Overview

`PersistOptions` is the configuration object passed at the store level when using this plugin. It allows you to customize how each store's state is persisted.

## Properties

| Property      | Type                                | Description                                                                                                                                                                                                                                                                                                         |
|---------------|-------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `key`         | `string \| Record<keyof S, string>` | Key(s) used to store data in storage. Defaults to the store's ID.                                                                                                                                                                                                                                                   |
| `debug`       | `boolean`                           | Enables logging for debugging purposes. Defaults to `false`.                                                                                                                                                                                                                                                        |
| `overwrite`   | `boolean`                           | When true, replaces restored nested values and combines mapped keys with the fallback bucket before replacement. Option stores delete omitted top-level fields; setup stores clear omitted fields to `undefined` while preserving refs. Defaults to `false`. |
| `clientOnly`  | `boolean`                           | Determines if storage operations should be restricted to the client environment only. Defaults to false.                                                                                                                                                                                                            |
| `storage`     | `Storage`           | Storage mechanism for persisting data. Supports synchronous options like `localStorage` and `cookies`, asynchronous options such as `localForage`, or fully custom storage implementations (e.g., fetching from a `remote API`).                                                                                    |
| `filter`      | `(mutation, state) => boolean`      | Filters which mutations trigger persistence.                                                                                                                                                                                                                                                                        |
| `serialize`   | `(state) => string`                 | Custom function for serializing the state.                                                                                                                                                                                                                                                                          |
| `deserialize` | `(state: string) => Partial<S> \| S[keyof S]`     | Custom function for deserializing the state.                                                                                                                                                                                                                                                                        |
| `deepCopy`    | `boolean`                           | Copies values through the configured codecs. Native Web Storage keeps serialized strings; custom adapters receive deserialized values and must support raw objects and primitives. See [storage compatibility](/guide/features.md#storage-compatibility-and-deepcopy).                                                                                                                                 |
| `include`     | `string \| string[]`                | Specifies a store property or an array of properties to include for persistence. Dot notation is supported to target nested properties (e.g., `"user.settings"`). If provided, only these properties will be persisted.                                                                                             |
| `exclude`     | `string \| string[]`                | Specifies a store property or an array of properties to exclude from persistence. Dot notation is supported to target nested properties (e.g., `"user.password"`). If provided, all properties except these will be persisted.                                                                                      |

## Default Values

If no options are provided at the store level, the plugin uses the following defaults:

```ts twoslash
// @noErrors
import { defineStore } from 'pinia'

export const useStore = defineStore('exampleStore', {
	persist: {
		key: 'exampleStore', // Defaults to the store's ID
		debug: false, // Debugging disabled
		overwrite: false, // Do not overwrite existing state
		filter: () => true, // Always allow persistence
		clientOnly: false, // Run on both server and client
		storage: localStorage, // Use localStorage by default
		serialize: JSON.stringify, // Default serialization
		deserialize: JSON.parse, // Default deserialization
		deepCopy: false, // Default deepCopy
		include: undefined, // Include all properties by default
		exclude: undefined, // Exclude no properties by default
	},
})
```
