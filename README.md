# Pinia Plugin - State Persistence

## Overview

This project is a Pinia plugin designed to provide state persistence capabilities for Vue applications. It enables developers to persist store states across sessions using various storage options, including synchronous and asynchronous storage mechanisms. The plugin is configurable and supports advanced features like filtering mutations and custom serialization/deserialization.

## Features

- **Universal Storage Support**: Works with both synchronous and asynchronous storage mechanisms, including `localStorage` and libraries like `localforage`.
- **Customizable Persistence**: Configure key names, mutation filters, and serialization/deserialization methods.
- **Debugging Support**: Includes a built-in logger to track plugin operations.
- **State Overwriting**: Optionally overwrite the store state during initialization.

## Installation

### Prerequisites

- Vue 3
- Pinia
- TypeScript (optional but recommended)

### Steps

1. Install the plugin:

   ```bash
   npm install pinia-plugin-state-persistence
   # or
   yarn add pinia-plugin-state-persistence
   ```

2. Add the plugin to your Pinia store:

```javascript
import localforage from 'localforage'
import { createPinia } from 'pinia'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

const pinia = createPinia()

pinia.use(createStatePersistence({
	key: 'my-app',
	debug: true,
	storage: localforage, // By default, `localStorage` is used if no storage option is specified
}))

export default pinia
```

## Usage

### Configuration Options

The plugin accepts a `PersistOptions` object with the following properties:

| Property        | Type                                | Description                                                                 |
|-----------------|-------------------------------------|-----------------------------------------------------------------------------|
| `key`           | `string`                            | Key used to store data in storage. Defaults to the store's ID.             |
| `debug`         | `boolean`                          | Enables logging for debugging purposes. Defaults to `false`.               |
| `overwrite`     | `boolean`                          | Whether to overwrite the store state on initialization. Defaults to `false`.|
| `storage`       | `Storage \| AsyncStorage`            | Storage mechanism for persisting data. Supports synchronous (e.g., `localStorage`) and asynchronous options (e.g., `localforage`). |
| `filter`        | `(mutation, state) => boolean`     | Filters which mutations trigger persistence.                               |
| `serialize`     | `(state) => string`                | Custom function for serializing the state.                                 |
| `deserialize`   | `(state: string) => Partial<S>`    | Custom function for deserializing the state.                               |

### Example Store

Define a Pinia store with persistence enabled:

```javascript
import { defineStore } from 'pinia'

export const useExampleStore = defineStore('example', {
	state: () => ({
		count: 0,
		user: null,
	}),
	actions: {
		increment() {
			this.count++
		},
	},
	// persist: true` for default persistence behavior
	persist: {
		key: 'example-store',
		filter: mutation => mutation.type !== 'increment',
	},
})
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

For questions or support, please open an issue or start a discussion on [GitHub](https://github.com/stephenjason89/pinia-plugin-state-persistence/issues).
