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

### Default Behavior

If no options are provided, the plugin uses the following defaults:

```ts twoslash
// @noErrors
import { createStatePersistence } from 'pinia-plugin-state-persistence'

createStatePersistence({
	key: store.$id, // Defaults to the store's ID
	debug: false, // Debugging disabled
	overwrite: false, // Do not overwrite existing state
	storage: localStorage, // Use localStorage by default
	serialize: JSON.stringify, // Default serialization
	deserialize: JSON.parse, // Default deserialization
})
```
