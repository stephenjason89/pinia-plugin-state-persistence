# Advanced Use Cases

This page explores advanced options and configurations available in your project to enhance state management and persistence. These options provide developers with powerful tools to create robust, efficient, and user-friendly applications.

## `$onRestore`

The `$onRestore` method helps you wait for the initial store restoration to complete, especially when working with asynchronous storage like `localForage` or `indexedDB`. This eliminates timing issues where components mount before async storage data has been loaded.

### Problem it Solves

When using asynchronous storage, the store initialization happens before the data has been loaded from storage. This can cause issues in component `onMounted` hooks where you need to check if persisted data exists before making server requests.

If you change a top-level state property before restoration finishes, your change is kept and the stored value for that property is ignored.

If a value cannot be compared safely during asynchronous restoration, its live value is kept instead of applying the stored value. This includes circular values, nested Maps, Sets, or regular expressions, objects containing BigInt, and Map/Set entries that JSON cannot represent distinctly. Top-level BigInt, Map, Set, and regular expression values can be compared. Custom codecs are still required to persist values the default JSON codecs cannot handle.

Await `$onRestore()` before resetting the store or logging out. Resetting an unchanged default while hydration is pending may not register a value change, so persisted data could otherwise be restored afterward. Disposing the store invalidates pending hydration and stops future automatic persistence subscriptions.

### Example Usage

```typescript
const store = useUserStore()

// Promise-based (async/await)
onMounted(async () => {
	await store.$onRestore()
	// Safe to check persisted data
	if (!store.userData.length) {
		await store.fetchUserData()
	}
})

// Callback-based
onMounted(() => {
	store.$onRestore(() => {
		// Safe to check persisted data
		if (!store.userData.length) {
			store.fetchUserData()
		}
	})
})
```

## `$onPersist`

The `$onPersist` method helps you wait for persistence operations to complete, especially when working with asynchronous storage. This is useful when you need to ensure data has been saved before proceeding with operations like showing success messages or navigating away.

### Example Usage

```typescript
const store = useUserStore()

// Promise-based (async/await)
async function saveData() {
	store.updateProfile({ name: 'John', email: 'john@example.com' })
	await store.$onPersist()
	// Safe to show success or navigate
	showSuccessMessage('Saved!')
}

// Callback-based
function saveData() {
	store.updateProfile({ name: 'John', email: 'john@example.com' })
	store.$onPersist(() => {
		// Safe to show success or navigate
		showSuccessMessage('Saved!')
	}).catch(showSaveError)
}
```

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

With `overwrite: true`, restored nested values replace existing nested values. Mapped keys and the fallback storage bucket are combined into one snapshot before replacement. Option stores delete top-level fields omitted from that snapshot. Setup stores keep omitted declared refs connected and clear their values to `undefined`, which JSON serialization omits. Compatible reactive object, array, Map, and Set roots are updated in place, and omitted roots are cleared while retaining their container type. Incompatible saved root types are skipped so setup actions keep their existing reactive connections.

A missing storage entry keeps defaults. An actual saved empty object clears existing values in overwrite mode. Changes made while asynchronous hydration is pending remain protected.

Whole-store snapshots, including the fallback storage bucket for mapped keys, must be plain objects whose prototype is `Object.prototype` (from any realm) or `null`. Arrays and other non-plain values are ignored, leaving the current state intact, with a warning when `debug: true`. This also applies to raw objects returned by custom storage adapters. Mapped property values can still be arrays or other values supported by the configured codecs and adapter.

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

### Persistence errors

$persist() returns a rejected promise when persistence fails, including synchronous storage or codec failures. `$onPersist()` rejects when the latest persistence attempt failed. Automatic mutation persistence handles failures without aborting your action, so await `$onPersist()` before reporting that changes were saved.

```typescript
try {
	await store.$persist()
	showSuccessMessage('Saved!')
}
catch (error) {
	showSaveError(error)
}
```

A callback passed to `$onPersist()` runs only after successful persistence. Handle its returned promise as well: a failed write or an exception thrown by the callback rejects that promise.

## Batch updates with `$patch`

Use Pinia's existing `$patch` function when one operation changes several state values. The plugin subscribes synchronously, so separate direct assignments trigger separate persistence callbacks. A function passed to `$patch` groups those changes into one callback per persistence configuration.

```typescript
store.$patch((state) => {
	state.profile.name = 'John'
	state.profile.email = 'john@example.com'
	state.preferences.theme = 'dark'
})
await store.$onPersist()
```

A local benchmark used one configuration, one storage key, a state containing 2,000 rows, and a JSON snapshot of about 337 KB. It changed a counter 100 times with an asynchronous adapter.

| Update pattern | Storage writes | Total serialized payload |
| --- | --- | --- |
| 100 direct assignments | 100 | About 33.7 MB |
| The same assignments inside one `$patch` | 1 | About 337 KB |

These are local-workload write counts. Timing varies by backend. Asynchronous storage still requires synchronous state filtering and serialization before writes are queued. Use `include` to keep snapshots focused, and group related changes with `$patch`. For mapped storage keys or multiple configurations, one callback can produce several writes.

## Object Key Persistence

The plugin supports persisting state properties on separate keys when an object is provided for the `key` option. This allows finer control over how state properties are stored.

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
		},
	},
})
```

### Behavior

- Each state property specified in the `key` object is serialized and stored individually under its respective storage key.
- Properties not included in the `key` object will fall back to the default storage behavior and will use `store.$id` as the storage key.
- This approach is particularly useful for large stores where persisting state properties to different storage keys is needed.

### Typed codecs for mapped values

A mapped configuration calls `serialize` for the fallback partial state object and for each mapped property. Its codec must accept both inputs. The second `PersistOptions` type parameter describes this input while preserving the default whole-state callback types.

```typescript
import type { PersistOptions } from 'pinia-plugin-state-persistence'

interface CounterState {
	count: number
	label: string
}

const persist: PersistOptions<CounterState, Partial<CounterState> | CounterState[keyof CounterState]> = {
	key: { count: 'counter-count' },
	serialize: value => JSON.stringify(value),
	deserialize: value => JSON.parse(value),
}
```

The deserializer can return a partial state object or a property value. A global custom codec used by a mapped configuration must also handle both kinds of input; the default global callback type remains the whole-state type for compatibility.

## Multiple Storage Support

The plugin supports persisting state properties to multiple storages by allowing the `persist` option to accept an array of persistence configurations. This enables fine-grained control over where and how state properties are stored.

### Example Configuration

```typescript
import { defineStore } from 'pinia'

export const useExampleStore = defineStore('example', {
	state: () => ({
		userId: 1,
		token: 'Bearer ...',
		preferences: { theme: 'dark' },
	}),
	persist: [
		{
			key: 'user-data',
			storage: localStorage,
			include: ['userId', 'token'],
		},
		{
			key: 'preferences-storage',
			storage: sessionStorage,
			include: ['preferences'],
		},
	],
})
```

### Behavior

- Each persistence configuration applies to specific state properties based on the `include` and `exclude` options.
- Different storages can be used for different pieces of state (e.g., `localStorage` for authentication and `sessionStorage` for UI preferences).
- When multiple persistence configurations apply to the same state keys, they will be processed in order, and the last configuration may overwrite earlier ones.
- The `overwrite` option is not allowed as persistence is sequential, with later configurations overriding previous ones.

This feature is particularly useful for applications requiring fine control over storage strategies, such as segregating sensitive authentication data from non-sensitive UI preferences.

## Conclusion

The `$restore` and `$persist` functions, along with comprehensive plugin configurations like object key persistence and multiple storage support, provide flexibility and power for state management. By hooking into Pinia's `$subscribe`, most persistence needs are automatically managed, ensuring seamless state synchronization. These tools offer additional control for edge cases, such as handling manual updates to storage, unique custom scenarios, or persisting individual state properties to specific keys and storages. Leverage these options to build sophisticated applications with reliable persistence and efficient state synchronization.
