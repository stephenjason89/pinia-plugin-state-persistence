# PersistOptions

## Overview

`PersistOptions` is the configuration object passed to the `createStatePersistence` function. It allows you to customize how your Pinia store state is persisted.

### Properties

| Property        | Type                                | Description                                                                 |
|-----------------|-------------------------------------|-----------------------------------------------------------------------------|
| `key`           | `string`                            | Key used to store data in storage. Defaults to the store's ID.             |
| `debug`         | `boolean`                          | Enables logging for debugging purposes. Defaults to `false`.               |
| `overwrite`     | `boolean`                          | Whether to overwrite the store state on initialization. Defaults to `false`.|
| `clientOnly`  | `boolean`                          | Determines if storage operations should be restricted to the client environment only. Defaults to false.|
| `storage`       | `Storage \| AsyncStorage`          | Storage mechanism for persisting data. Supports synchronous (e.g., `localStorage`) and asynchronous options (e.g., `localforage`). |
| `filter`        | `(mutation, state) => boolean`     | Filters which mutations trigger persistence.                               |
| `serialize`     | `(state) => string`                | Custom function for serializing the state.                                 |
| `deserialize`   | `(state: string) => Partial<S>`    | Custom function for deserializing the state.                               |

### Example Usage

```javascript
createStatePersistence({
	key: 'example-store',
	debug: true,
	overwrite: true,
	clientOnly: true, // Since `sessionStorage` is null in SSR environments, this flag doesn't have an effect here. However, if the storage mechanism supports both client and server environments, this ensures the persistence runs on the client only.
	storage: window?.sessionStorage, // Nullish coalescing ensures no errors in SSR environments where 'window' is undefined.
	filter: mutation => mutation.type !== 'increment',
	serialize: JSON.stringify,
	deserialize: JSON.parse,
})
```

### Default Values

If no options are provided, the plugin uses the following defaults:

```javascript
createStatePersistence({
	key: storeId, // Defaults to the store's ID
	debug: false, // Debugging disabled
	overwrite: false, // Do not overwrite existing state
	storage: localStorage, // Use localStorage by default
	serialize: JSON.stringify, // Default serialization
	deserialize: JSON.parse, // Default deserialization
})
```
