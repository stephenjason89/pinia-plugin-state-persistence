# Advanced Use Cases

This page explores advanced options and configurations available in your project to enhance state management and persistence. These options provide developers with powerful tools to create robust, efficient, and user-friendly applications.

## `$restore`

The `$restore` function allows you to manually synchronize the state from persistent storage back into the Pinia store. While `$restore` is automatically called during initialization, you may use it in scenarios where:

- The persistent storage is updated manually and needs to be synced back to the store.
- State modifications occur outside the scope of the normal flow.

### Example Usage

```typescript
const store = useStore()

// Restore the state from storage manually
store.$restore()
```

Use this functionality sparingly for specific cases to ensure the store stays in sync with storage.

## `$persist`

The `$persist` function forces the store to persist its current state into the configured storage. Normally, persistence is automatically handled via `$subscribe`, but `$persist` is useful in scenarios where:

- State changes are not detected by `$subscribe`.
- Custom logic requires explicitly saving the state.

### Example Usage

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

## Advanced Example

```ts twoslash
// @noErrors
import localForage from 'localforage'
import { defineStore } from 'pinia'
import { parse, stringify } from 'zipson'

export const useAuthStore = defineStore('auth', {
	state: () => ({
		user: {
			name: 'John Doe',
			email: 'john@example.com',
			password: 'mypassword',
			preferences: {
				language: 'en',
				timezone: 'UTC',
			},
		},
		token: 'jwt-token',
		permissions: ['read', 'write']
	}),
	persist: {
		debug: true, // Enable debugging
		key: {
			// Use different keys for user and permissions
			user: 'user-storage-key',
			permissions: 'permissions-storage-key'
		},
		storage: localForage, // Use localForage for persistence
		serialize: stringify, // Compress state with zipson
		deserialize: parse, // Decompress state with zipson
		include: ['user', 'permissions'], // Persist user and permissions
		exclude: ['user.preferences', 'user.password'], // Exclude certain properties
	},
})
```

### Key Points

- **Debugging**: Enable `debug` during development to track persistence actions.
- **Key**: Use the `key` option as an object to specify unique keys for storage.
- **Storage**: Use any storage implementation that supports `getItem`, `setItem`, and `removeItem`. This includes built-in options like `localStorage`, `sessionStorage`, cookies, or custom implementations tailored to your application's needs, as well as asynchronous solutions like `localForage`, or even cloud-based APIs for remote persistence.
- **Serialization/Deserialization**: Customize the state transformation process if needed.
- **Include/Exclude**: Use `include` and `exclude` to precisely control which properties are persisted, supporting dot notation for nested properties.

## Conclusion

The `$restore` and `$persist` functions, along with comprehensive plugin configurations like object key persistence, provide flexibility and power for state management. By hooking into Pinia's `$subscribe`, most persistence needs are automatically managed, ensuring seamless state synchronization. These tools offer additional control for edge cases, such as handling manual updates to storage, unique custom scenarios, or persisting individual state properties to specific keys. Leverage these options to build sophisticated applications with reliable persistence and efficient state synchronization.
