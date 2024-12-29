<div align="center" style="filter: drop-shadow(-1px -1px 0px rgba(0, 0, 0, 0.3));">
  <img src="docs/public/logo.png" alt="Project Logo" width="300">
</div>
<p align="center">
 Persist Pinia States Anywhere, Effortlessly
</p>
<p align="center">
  <a href="https://npmjs.com/package/pinia-plugin-state-persistence"><img src="https://img.shields.io/npm/v/pinia-plugin-state-persistence?style=flat-square&labelColor=FFD700&color=FFA500" alt="npm"></a>
  <a href="https://bundlephobia.com/result?p=pinia-plugin-state-persistence"><img src="https://img.shields.io/bundlephobia/minzip/pinia-plugin-state-persistence?style=flat-square&labelColor=32CD32&color=FFA500" alt="minizipped size"></a>
  <a href="https://github.com/stephenjason89/pinia-plugin-state-persistence/blob/main/LICENSE"><img src="https://img.shields.io/github/license/stephenjason89/pinia-plugin-state-persistence?style=flat-square&labelColor=FFD700&color=32CD32" alt="license"></a>
</p>
<p align="center">
  <a href="https://stephenjason89.github.io/pinia-plugin-state-persistence"><b>Documentation</b></a>
</p>

## Overview

This project is a Pinia plugin designed to provide state persistence capabilities for Vue applications. It enables developers to persist store states across sessions using various storage options, including synchronous and asynchronous storage mechanisms. The plugin is configurable and supports advanced features like filtering mutations and custom serialization/deserialization.

## Features

- **Universal Storage Support**: Works with both synchronous and asynchronous storage mechanisms, including `localStorage` and libraries like `localforage`.
- **Customizable Persistence**: Configure key names, mutation filters, and serialization/deserialization methods.
- **Debugging Support**: Includes a built-in logger to track plugin operations.
- **State Overwriting**: Optionally overwrite the store state during initialization.
- **SSR Compatibility**: Fully supports server-side rendering environments, addressing edge cases with seamless state handling.

## Why Choose This Plugin?

- **Zero Dependencies**: This plugin is lightweight and has no external dependencies (other than Pinia itself), ensuring minimal impact on your application's bundle size.
- **Compact Size**: The bundle's unpacked size is just **15.3 kB**, with a minified gzip size of only **1 kB**, making it highly efficient for production use.
- **Async Storage Support**: Unlike other plugins, this plugin natively supports asynchronous storage mechanisms such as `localforage`, making it ideal for modern applications.
- **Queueing Mechanism**: Introduces a queueing mechanism to eliminate race condition issues during state persistence.
- **Enhanced Flexibility**: Offers advanced configuration options, including custom merge strategies, state filters, and serialization methods, ensuring it adapts to diverse use cases.
- **Reliable State Management**: Resolves common issues with state persistence in both client-side and SSR setups, providing a smoother developer experience.
- **Developer-Centric Approach**: Built with contributions and feedback in mind, ensuring issues are addressed promptly and features align with real-world needs.

## Installation

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
