# API Reference

Welcome to the API Reference for `pinia-plugin-state-persistence`. Below is an overview of the main API features and utilities provided by the plugin.

## Table of Contents

- [PersistOptions](./persist-options)
    - Configuration options for state persistence.
- [createStatePersistence](#createStatePersistence)
    - Main function to configure and use the plugin in your Pinia store.

---

## `createStatePersistence`

### Overview

The `createStatePersistence` function initializes the state persistence plugin for Pinia. This function accepts a configuration object (`PersistOptions`) that determines how the state is stored and retrieved.

### Syntax

```javascript
import { createStatePersistence } from 'pinia-plugin-state-persistence'

createStatePersistence(options: PersistOptions)
```

### Parameters

| Parameter   | Type            | Description                                                                 |
|-------------|-----------------|-----------------------------------------------------------------------------|
| `options`   | `PersistOptions`| A configuration object to define persistence behavior (see [PersistOptions](./persist-options)). |

### Example Usage

#### Basic Example
```javascript
import { createPinia } from 'pinia'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

const pinia = createPinia()

pinia.use(createStatePersistence({
	key: 'my-app', // Custom key for storage
	storage: localStorage, // Use localStorage
}))
```

#### Advanced Example
```javascript
pinia.use(createStatePersistence({
	key: 'example-store',
	debug: true, // Enable debug logging
	overwrite: true, // Overwrite state on initialization
	storage: localStorage, // Use localStorage
	serialize: JSON.stringify, // Custom serialization
	deserialize: JSON.parse, // Custom deserialization
	filter: mutation => mutation.type !== 'increment', // Exclude specific mutations
}))
```

---

## Notes

- For a detailed list of configuration options, refer to [PersistOptions](./persist-options).
- Always ensure the `key` in the `options` object is unique to avoid conflicts across stores.
- The plugin supports both synchronous (`localStorage`) and asynchronous (`localForage`) storage options.

For more details on using the plugin, see the [Guide](../guide/).
