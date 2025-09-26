# API Reference

Welcome to the API Reference for `pinia-plugin-state-persistence`. Below is an overview of the main API features and utilities provided by the plugin.

## Table of Contents

- [Global Configuration](../guide/configuration)
  - Main function to configure global persistence behavior.
- [PersistOptions](./persist-options)
  - Store-level configuration options for state persistence.
- [createStatePersistence](../guide/configuration)
  - Main function to configure and use the plugin in your Pinia store.
- [$onRestore](#onrestore)
  - Store method to wait for restoration to complete.

## `createStatePersistence`

### Overview

The `createStatePersistence` function initializes the state persistence plugin for Pinia. This function accepts a global configuration object that determines how the state is stored and retrieved for all stores.

### Syntax

```ts twoslash
// @noErrors
import { createStatePersistence } from 'pinia-plugin-state-persistence'

createStatePersistence(globalOptions: GlobalPersistOptions)
```

### Parameters

| Parameter       | Type                  | Description                                                                                                 |
| --------------- | --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `globalOptions` | `GlobalConfiguration` | A configuration object to define global persistence behavior (see [Configuration](../guide/configuration)). |

### Notes

- The `createStatePersistence` function accepts global configuration options to apply consistent settings across stores.
- For store-specific behavior, refer to [PersistOptions](./persist-options).
- The key in the globalOptions object acts as a prefix for all store keys, ensuring consistent naming and avoiding conflicts.
- The plugin supports both synchronous (`localStorage`) and asynchronous (`localForage`) storage options.

For more details on using the plugin, see the [Guide](../guide/).

## `$onRestore`

### Overview

The `$onRestore` method waits for the initial store restoration to complete. This is particularly useful when working with asynchronous storage (like `localForage` or `indexedDB`) where you need to ensure data has been loaded from storage before proceeding with operations that depend on the persisted state.

### Syntax

```ts twoslash
// @noErrors
// Promise-based (async/await)
await store.$onRestore();

// Callback-based
store.$onRestore(() => {
  // Restoration complete
});
```

### Parameters

| Parameter  | Type         | Description                                                      |
| ---------- | ------------ | ---------------------------------------------------------------- |
| `callback` | `() => void` | Optional callback function to execute when restoration completes |

### Returns

| Type            | Description                                            |
| --------------- | ------------------------------------------------------ |
| `Promise<void>` | Promise that resolves when the store has been restored |

### Example Usage

```typescript
const store = useMyStore();

// Promise-based (async/await)
onMounted(async () => {
  await store.$onRestore();
  // Safe to check persisted data
  if (!store.userData.length) {
    await store.fetchUserData();
  }
});

// Callback-based
onMounted(() => {
  store.$onRestore(() => {
    // Safe to check persisted data
    if (!store.userData.length) {
      store.fetchUserData();
    }
  });
});
```

### Use Cases

- **Async Storage**: When using `localForage`, `indexedDB`, or other asynchronous storage solutions
- **Component Initialization**: Ensuring persisted data is available before making server requests
- **Conditional Logic**: Making decisions based on whether persisted data exists
- **Loading States**: Coordinating loading indicators with data restoration

### Notes

- For synchronous storage (like `localStorage`), this method completes immediately since no async restoration is needed
- The method waits for any ongoing async restoration, it does NOT trigger a new restoration
- If restoration has already completed, the method resolves immediately
- This eliminates the need for unreliable delays when working with async storage
- Available on all stores that have persistence enabled
- Supports both Promise-based (async/await) and callback-based usage patterns
