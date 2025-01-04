<div align="center" style="filter: drop-shadow(-1px -1px 0px rgba(0, 0, 0, 0.3));">
  <img src="docs/public/logo.png" alt="Project Logo" width="300">
</div>
<p align="center" style="margin-top: 25px">
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

- **Universal Storage Support**: Works with both synchronous and asynchronous storage mechanisms, including `localStorage`, `cookies`, and libraries like `localForage` or even custom `remote APIs`.
- **Customizable Persistence**: Configure key names, mutation filters, and serialization/deserialization methods.
- **Debugging Support**: Includes a built-in logger to track plugin operations.
- **State Overwriting**: Optionally overwrite the store state during initialization.
- **SSR Compatibility**: Fully supports server-side rendering environments, addressing edge cases with seamless state handling.

## Why Choose This Plugin?

- **Zero Dependencies**: This plugin is lightweight and has no external dependencies (other than Pinia itself), ensuring minimal impact on your application's bundle size.
- **Compact Size**: The bundle's minified gzip size is only **1 kB**, making it highly efficient for production use.
- **Async Storage Support**: Unlike other plugins, this plugin natively supports asynchronous storage mechanisms such as `localForage`, making it ideal for modern applications.
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
import localForage from 'localforage'
import { createPinia } from 'pinia'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

const pinia = createPinia()

pinia.use(createStatePersistence({
	key: 'my-app',
	debug: true,
	storage: localForage, // By default, `localStorage` is used if no storage option is specified
	clientOnly: true, // Ensures storage operations are restricted to the client-side, preventing access during SSR.
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

## Advanced Use Cases

This page explores advanced options and configurations available in your project to enhance state management and persistence. These options provide developers with powerful tools to create robust, efficient, and user-friendly applications.

### `$restore`

The `$restore` function allows you to manually synchronize the state from persistent storage back into the Pinia store. While `$restore` is automatically called during initialization, you may use it in scenarios where:

- The persistent storage is updated manually and needs to be synced back to the store.
- State modifications occur outside the scope of the normal flow.

#### Example Usage

```typescript
const store = useStore()

// Restore the state from storage manually
store.$restore()
```

Use this functionality sparingly for specific cases to ensure the store stays in sync with storage.

### `$persist`

The `$persist` function forces the store to persist its current state into the configured storage. Normally, persistence is automatically handled via `$subscribe`, but `$persist` is useful in scenarios where:

- State changes are not detected by `$subscribe`.
- Custom logic requires explicitly saving the state.

#### Example Usage

```typescript
const store = useStore()

// Force persist the current state to storage manually
store.$persist()
```

This is particularly helpful in batch updates or custom save operations that bypass normal mutation flows.

## Object Key Persistence

The plugin now supports persisting state properties on separate keys when an object is provided for the `key` option. This allows finer control over how state properties are stored.

### Example Configuration

```typescript
import { defineStore } from 'pinia'

export const useExampleStore = defineStore('example', {
	state: () => ({
		userId: 1,
		token: 'Bearer ...',
	}),
	persist: {
		key: {
			userId: 'user-id-storage-key',
			token: 'user-token-storage-key',
		}
	},
})
```

### Behavior

- Each state property specified in the `key` object is serialized and stored individually under its respective storage key.
- Properties not included in the `key` object will fall back to the default storage behavior and will use `store.$id` as the storage key.
- This approach is particularly useful for large stores where persisting state properties to different storage keys is needed.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

For questions or support, please open an issue or start a discussion on [GitHub](https://github.com/stephenjason89/pinia-plugin-state-persistence/issues).
