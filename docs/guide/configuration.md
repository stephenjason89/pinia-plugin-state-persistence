# Configuration

## Options

The `pinia-plugin-state-persistence` accepts a configuration object with the following properties:

| Property        | Type                                | Description                                                                 |
|-----------------|-------------------------------------|-----------------------------------------------------------------------------|
| `key`           | `string`                            | Key used to store data in storage. Defaults to the store's ID.             |
| `debug`         | `boolean`                          | Enables logging for debugging purposes. Defaults to `false`.               |
| `overwrite`     | `boolean`                          | Whether to overwrite the store state on initialization. Defaults to `false`.|
| `storage`       | `Storage \| AsyncStorage`            | Storage mechanism for persisting data. Supports synchronous (e.g., `localStorage`) and asynchronous options (e.g., `localforage`). |
| `filter`        | `(mutation, state) => boolean`     | Filters which mutations trigger persistence.                               |
| `serialize`     | `(state) => string`                | Custom function for serializing the state.                                 |
| `deserialize`   | `(state: string) => Partial<S>`    | Custom function for deserializing the state.                               |

## Example Configuration

Here is an example of how to configure the plugin:

```javascript
createStatePersistence({
	key: 'example-store',
	debug: true,
	overwrite: true,
	storage: localStorage, // Use localStorage for persistence
	filter: mutation => mutation.type !== 'increment', // Exclude certain mutations
	serialize: JSON.stringify, // Custom serialization
	deserialize: JSON.parse, // Custom deserialization
})
```

### Key Points

- **Key**: Ensure that the `key` is unique for each store to prevent conflicts.
- **Debugging**: Enable `debug` during development to track persistence actions.
- **Storage**: Choose between synchronous (`localStorage`) or asynchronous (`localforage`) based on your app's requirements.
- **Filters**: Use the `filter` option to fine-tune which mutations should trigger persistence.
- **Serialization/Deserialization**: Customize the state transformation process if needed.

### Default Behavior

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
