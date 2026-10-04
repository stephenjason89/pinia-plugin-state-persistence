# Configuration

## Global Configuration

The `pinia-plugin-state-persistence` accepts a global configuration object passed to `createStatePersistence` with the following properties:

| Property      | Type                            | Description                                                                                                                                                                         |
|---------------|---------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `key`         | `string`                        | Key used as a prefix for all store keys when persisting data. Defaults to the store's ID if not provided at the store level. This is a global configuration property.               |                                                                         |
| `debug`       | `boolean`                       | Enables logging for debugging purposes. Defaults to `false`.                                                                                                                        |
| `overwrite`   | `boolean`                       | Whether to overwrite the store state on $restore. Defaults to `false`.                                                                                                              |
| `clientOnly`  | `boolean`                       | Determines if storage operations should be restricted to the client environment only. Defaults to false.                                                                            |
| `storage`     | `Storage`       | Storage mechanism for persisting data. Supports synchronous (e.g., `localStorage`) and asynchronous options (e.g., `localForage`).                                                  |
| `filter`      | `(mutation, state) => boolean`  | Filters which mutations trigger persistence.                                                                                                                                        |
| `serialize`   | `(state) => string`             | Custom function for serializing the state.                                                                                                                                          |
| `deserialize` | `(state: string) => Partial<S> \| S[keyof S]` | Custom function for deserializing the state.                                                                                                                                        |
| `deepCopy`    | `boolean`                       | Copies values through the configured codecs. Native Web Storage keeps strings; custom adapters must support deserialized objects and primitives. See [storage compatibility](/guide/features.md#storage-compatibility-and-deepcopy). |

### Global Configuration Default Behavior

If no global options are provided, the plugin uses the following defaults:

```ts twoslash
// @noErrors
import { createStatePersistence } from 'pinia-plugin-state-persistence'

createStatePersistence({
	key: '', // Acts as a prefix for all store keys when persisting data
	debug: false, // Debugging disabled
	overwrite: false, // Do not overwrite existing state
	storage: localStorage, // Use localStorage by default
	serialize: JSON.stringify, // Default serialization
	deserialize: JSON.parse, // Default deserialization
	deepCopy: false, // Default deepCopy
})
```

## Store Configuration

For configuring individual stores, refer to the [`PersistOptions`](/api/persist-options.md) documentation, which outlines properties for store-level customization.

Global codecs also apply to stores using mapped keys. Such codecs must accept both partial state objects and individual property values. Prefer a store-level codec with an explicit mapped input type when those values need different handling.
