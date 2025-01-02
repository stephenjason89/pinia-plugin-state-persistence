# Configuration

## Options

The `pinia-plugin-state-persistence` accepts a configuration object with the following properties:

| Property        | Type                                | Description                                                                                                                        |
|-----------------|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `key`           | `string`                            | Key used to store data in storage. Defaults to the store's ID.                                                                     |
| `debug`         | `boolean`                          | Enables logging for debugging purposes. Defaults to `false`.                                                                       |
| `overwrite`     | `boolean`                          | Whether to overwrite the store state on $restore. Defaults to `false`.                                                             |
| `storage`       | `Storage \| AsyncStorage`            | Storage mechanism for persisting data. Supports synchronous (e.g., `localStorage`) and asynchronous options (e.g., `localforage`). |
| `filter`        | `(mutation, state) => boolean`     | Filters which mutations trigger persistence.                                                                                       |
| `serialize`     | `(state) => string`                | Custom function for serializing the state.                                                                                         |
| `deserialize`   | `(state: string) => Partial<S>`    | Custom function for deserializing the state.                                                                                       |

## Example Configuration

Here is an example of how to configure the plugin:

```ts twoslash
// @noErrors
import localforage from 'localforage'
import { createStatePersistence } from 'pinia-plugin-state-persistence'
import { parse, stringify } from 'zipson'

createStatePersistence({
	debug: true,
	storage: localforage, // Use localforage for persistence
	clientOnly: true, // Restricts storage to the client-side as localForage lacks support in SSR environments.
	filter: mutation => mutation.type !== 'increment', // Exclude certain mutations
	serialize: stringify, // Custom serialization
	deserialize: parse, // Custom deserialization
})
```

### Key Points

- **Debugging**: Enable `debug` during development to track persistence actions.
- **Storage**: Use any storage implementation that supports getItem, setItem, and removeItem. This includes built-in options like localStorage, sessionStorage, cookies, or custom implementations tailored to your application's needs, as well as asynchronous solutions like localforage.
- **Filters**: Use the `filter` option to fine-tune which mutations should trigger persistence.
- **Serialization/Deserialization**: Customize the state transformation process if needed.

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
})
```

### Tips and Best Practices

1. **Storage Type**:
    - Use `localStorage` for simple, synchronous storage needs.
    - Use `localforage` or other async storage options for larger or non-blocking storage.

2. **Debugging**:
    - Enable `debug` mode during development but disable it in production for optimal performance.

3. **Filter Strategy**:
    - Exclude mutations that do not impact the persistent state (e.g., UI-only updates).

4. **Versioning**:
    - Consider versioning your serialized state to handle breaking changes in state structure.

5. **Error Handling**:
    - Wrap `deserialize` and `serialize` functions with try-catch blocks to manage unexpected errors.
