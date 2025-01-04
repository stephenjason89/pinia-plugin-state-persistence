# Configuration

## Options

The `pinia-plugin-state-persistence` accepts a configuration object with the following properties:

| Property      | Type                            | Description                                                                                                                            |
|---------------|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `key`         | `string`                        | Key used to store data in storage. Defaults to the store's ID.                                                                         |
| `debug`       | `boolean`                       | Enables logging for debugging purposes. Defaults to `false`.                                                                           |
| `overwrite`   | `boolean`                       | Whether to overwrite the store state on $restore. Defaults to `false`.                                                                 |
| `storage`     | `Storage \| AsyncStorage`       | Storage mechanism for persisting data. Supports synchronous (e.g., `localStorage`) and asynchronous options (e.g., `localForage`).     |
| `filter`      | `(mutation, state) => boolean`  | Filters which mutations trigger persistence.                                                                                           |
| `serialize`   | `(state) => string`             | Custom function for serializing the state.                                                                                             |
| `deserialize` | `(state: string) => Partial<S>` | Custom function for deserializing the state.                                                                                           |
| `include`     | `string \| string[]`            | Specifies a store property or an array of properties to include for persistence. Dot notation is supported (e.g., `"user.settings"`).  |
| `exclude`     | `string \| string[]`            | Specifies a store property or an array of properties to exclude from persistence. Dot notation is supported (e.g., `"user.password"`). |

## Example Configuration

Here is an example of how to configure persistence in a Pinia store:

```ts twoslash
// @noErrors
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
	state: () => ({
		settings: {
			theme: 'dark',
			notifications: true,
			privacy: 'public',
			experimentalFeatures: false,
		},
		password: 'supersecret',
		token: 'abc123',
		profile: {
			age: 30,
			address: '123 Main St',
		},
	}),
	persist: {
		key: 'user-store',
		include: ['settings.theme', 'settings.notifications', 'profile.age'], // Persist theme, notifications, and age
	},
})
```

### Default Behavior

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
	include: undefined, // Include all properties by default
	exclude: undefined, // Exclude no properties by default
})
```

### Best Practices

1. **Storage Type**:
   - Use `localStorage` for simple, synchronous storage needs.
   - Use `localForage` or other async storage options for larger or non-blocking storage.
   - Use `cookies` for cross-domain persistence or authentication-related data.
   - Consider cloud-based solutions or custom remote API implementations for distributed or server-side persistence.

2. **Debugging**:
   - Enable `debug` mode during development but disable it in production for optimal performance.

3. **Filter Strategy**:
   - Exclude mutations that do not impact the persistent state (e.g., UI-only updates).

4. **Error Handling**:
   - Wrap `deserialize` and `serialize` functions with `try-catch` blocks to manage unexpected errors.

5. **Include/Exclude Strategy**:
   - Use `include` for minimal persistence and `exclude` to remove sensitive or transient data.
