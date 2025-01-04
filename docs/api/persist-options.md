# PersistOptions

## Overview

`PersistOptions` is the configuration object passed to the `createStatePersistence` function. It allows you to customize how your Pinia store state is persisted.

### Properties

| Property      | Type                                | Description                                                                                                                                                                                                                                                                                                                                          |
|---------------|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `key`         | `string \| Record<keyof S, string>` | Key/s used to store data in storage. Defaults to the store's ID.                                                                                                                                                                                                                                                                                     |
| `debug`       | `boolean`                           | Enables logging for debugging purposes. Defaults to `false`.                                                                                                                                                                                                                                                                                         |
| `overwrite`   | `boolean`                           | When true, replaces the entire store state with the persisted state during [$restore](/guide/advance-usage.md#restore). For [object keys](/guide/advance-usage.md#object-key-persistence), unmapped properties are replaced, and mapped properties are patched individually, effectively acting as an overwrite for those keys. Defaults to `false`. |
| `clientOnly`  | `boolean`                           | Determines if storage operations should be restricted to the client environment only. Defaults to false.                                                                                                                                                                                                                                             |
| `storage`     | `Storage \| AsyncStorage`           | Storage mechanism for persisting data. Supports synchronous options like `localStorage` and `cookies`, asynchronous options such as `localForage`, or fully custom storage implementations (e.g., fetching from a `remote API`).                                                                                                                     |
| `filter`      | `(mutation, state) => boolean`      | Filters which mutations trigger persistence.                                                                                                                                                                                                                                                                                                         |
| `serialize`   | `(state) => string`                 | Custom function for serializing the state.                                                                                                                                                                                                                                                                                                           |
| `deserialize` | `(state: string) => Partial<S>`     | Custom function for deserializing the state.                                                                                                                                                                                                                                                                                                         |

### Default Values

If no options are provided, the plugin uses the following defaults:

```ts twoslash
// @noErrors
import { createStatePersistence } from 'pinia-plugin-state-persistence'

createStatePersistence({
	key: storeId, // Defaults to the store's ID
	debug: false, // Debugging disabled
	overwrite: false, // Do not overwrite existing state
	storage: localStorage, // Use localStorage by default
	serialize: JSON.stringify, // Default serialization
	deserialize: JSON.parse, // Default deserialization
})
```
