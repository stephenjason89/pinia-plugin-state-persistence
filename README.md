# Pinia Plugin - State Persistence

## Overview

This project is a Pinia plugin designed to provide state persistence capabilities for Vue applications. It enables developers to persist store states across sessions using various storage options, including synchronous and asynchronous storage mechanisms. The plugin is configurable and supports advanced features like filtering mutations and custom serialization/deserialization.

## Features

- **Universal Storage Support**: Works with both synchronous and asynchronous storage mechanisms, including `localStorage` and libraries like `localforage`.
- **Customizable Persistence**: Configure key names, mutation filters, and serialization/deserialization methods.
- **Debugging Support**: Includes a built-in logger to track plugin operations.
- **State Overwriting**: Optionally overwrite the store state during initialization.
- **SSR Compatibility**: Fully supports server-side rendering environments, addressing edge cases with seamless state handling.

## Why Choose This Plugin?

- **Async Storage Support**: Unlike other plugins, this plugin natively supports asynchronous storage mechanisms such as `localforage`, making it ideal for modern applications.
- **Enhanced Flexibility**: Offers advanced configuration options, including custom merge strategies, state filters, and serialization methods, ensuring it adapts to diverse use cases.
- **Reliable State Management**: Resolves common issues with state persistence in both client-side and SSR setups, providing a smoother developer experience.
- **Developer-Centric Approach**: Built with contributions and feedback in mind, ensuring issues are addressed promptly and features align with real-world needs.

## Installation

### Prerequisites

- Nuxt 3 / Vue 3
- Pinia

### Steps

1. Install the plugin with your preferred package manager:

   ```bash
   npm install pinia-plugin-state-persistence
   # or
   yarn add pinia-plugin-state-persistence
   # or
   pnpm i pinia-plugin-state-persistence
   # or
   bun i pinia-plugin-state-persistence
   ```

2. Add the plugin to your Pinia store:

```javascript
import { destr } from 'destr'
import localforage from 'localforage'
import { createPinia } from 'pinia'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

const pinia = createPinia()

pinia.use(createStatePersistence({
	key: 'my-app',
	debug: true,
	storage: localforage, // By default, `localStorage` is used if no storage option is specified
	deserialize: destr, // By default, `JSON.parse` is used if not specified
}))

export default pinia
```

### Nuxt Integration

To persist state using cookies in a Nuxt application, we recommend using `cookie-universal` for its robust cookie synchronization capabilities. This ensures that cookie changes on the server propagate to the client and vice versa.

Here is an example Nuxt Plugin implementation:

```javascript
import cookies from 'cookie-universal'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

export default defineNuxtPlugin((nuxtApp) => {
	const event = nuxtApp.ssrContext?.event
	const Cookies = cookies(event?.node.req, event?.node.res)

	nuxtApp.$pinia.use(
		createStatePersistence({
			storage: {
				getItem: Cookies.get,
				setItem: (key, value) => Cookies.set(key, value),
				removeItem: Cookies.remove,
			},
		}),
	)
})
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
