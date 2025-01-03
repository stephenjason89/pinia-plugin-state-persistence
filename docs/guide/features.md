# Features

## Key Features

- **Universal Storage Support**: Compatible with a wide range of storage mechanisms:
    - **Synchronous Storage**:
        - `localStorage`
        - `sessionStorage`
        - Cookies
    - **Asynchronous Storage**:
        - `indexedDB` (via libraries like `localforage`)
        - Cloud-based storage solutions (via custom implementations)
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
- **Enhanced Flexibility**: Offers advanced configuration options for fine-tuning persistence behavior.
- **Developer-Centric**: Designed with real-world scenarios and use cases in mind.

---

### Supported Storage Types

| Storage Type          | Synchronous | Asynchronous | Customizable |
|-----------------------|-------------|--------------|--------------|
| `localStorage`        | ✅           | ❌            | ❌            |
| `sessionStorage`      | ✅           | ❌            | ❌            |
| Cookies               | ✅           | ❌            | ✅            |
| `indexedDB`           | ❌           | ✅            | ✅            |
| `localforage`         | ❌           | ✅            | ✅            |
| Cloud-based storages  | ❌           | ✅            | ✅            |
| Custom storage        | ✅/❌        | ✅/❌         | ✅            |

To add custom storage, implement the following interface:
```typescript
interface Storage {
	getItem: (key: string) => string | Promise<string | null> | null
	setItem: (key: string, value: string) => void | Promise<void>
	removeItem: (key: string) => void | Promise<void>
}
```
