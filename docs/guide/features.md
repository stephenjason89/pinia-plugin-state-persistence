# Features

## Key Features

- **Universal Storage Support**: Compatible with a wide range of storage mechanisms:

  - **Synchronous Storage**:
    - `localStorage`
    - `sessionStorage`
    - `cookies`
  - **Asynchronous Storage**:
    - `indexedDB` (via libraries like `localForage`)
    - `cloud-based storage solutions` (via custom implementations)
  - **Custom Storage**: Easily extend the plugin to work with any storage mechanism by implementing a `getItem`, `setItem`, and `removeItem` interface.

- **Customizable Persistence**:

  - Define custom key names for saved states.
  - Filter mutations to decide which should trigger persistence.
  - Use custom serialization/deserialization methods to fit your data handling needs.

- **Debugging Support**: Includes a built-in logger to track plugin operations and debug state persistence behavior.

- **State Overwriting**: Optionally overwrite the store state during initialization with persisted data, providing a seamless experience for users returning to the app.

- **SSR Compatibility**: Fully functional in server-side rendering environments, ensuring your app works seamlessly across client and server.

## Why Choose This Plugin?

- **Zero Dependencies**: Lightweight and relies solely on Pinia, with no external dependencies.
- **Compact Size**: Minified and gzipped size of only **1 kB**.
- **Queueing Mechanism**: Eliminates race condition issues when working with asynchronous storages.
- **Async Storage Support**: Includes `$onRestore()` method to easily wait for asynchronous storage restoration.
- **Enhanced Flexibility**: Offers advanced configuration options for fine-tuning persistence behavior.
- **Developer-Centric**: Designed with real-world scenarios and use cases in mind.

---

### Supported Storage Types

| Storage Type         | Synchronous | Asynchronous | Customizable |
| -------------------- | ----------- | ------------ | ------------ |
| `localStorage`       | ✅          | ❌           | ❌           |
| `sessionStorage`     | ✅          | ❌           | ❌           |
| Cookies              | ✅          | ❌           | ✅           |
| `indexedDB`          | ❌          | ✅           | ✅           |
| `localForage`        | ❌          | ✅           | ✅           |
| Cloud-based storages | ❌          | ✅           | ✅           |
| Custom storage       | ✅/❌       | ✅/❌        | ✅           |

<details>
<summary>To add custom storage (Click to expand)</summary>

Import the plugin's storage type when implementing an adapter:

```typescript
import type { Storage } from 'pinia-plugin-state-persistence'

const values = new Map<string, string | number | boolean | object | null>()
const storage: Storage = {
	getItem: key => values.get(key) ?? null,
	setItem: (key, value) => { values.set(key, value) },
	removeItem: (key) => { values.delete(key) },
}
```

Methods can return values synchronously or through a promise. Returning `null` from `getItem` means there is no saved entry.

</details>

## Storage compatibility and `deepCopy`

With `deepCopy: false`, the plugin writes the string returned by `serialize`. With `deepCopy: true`, it also calls `deserialize` to create a detached value. Native `localStorage` and `sessionStorage` keep a serialized string because Web Storage accepts strings only.

Custom adapters receive the deserialized value in deep-copy mode, including objects, arrays, numbers, booleans, and strings. Use an object-capable backend for these adapters. The plugin cannot infer whether a wrapper around Web Storage accepts raw objects. Keep `deepCopy: false` for string-only wrappers, or implement raw-value encoding and decoding inside the adapter.

The default codecs are `JSON.stringify` and `JSON.parse`. Deep-copy mode does not make circular references, functions, or BigInt JSON-compatible. Supply suitable codecs for unsupported values. Object-capable adapters can use their own cloning and value-preservation behavior.
