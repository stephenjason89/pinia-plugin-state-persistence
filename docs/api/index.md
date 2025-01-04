# API Reference

Welcome to the API Reference for `pinia-plugin-state-persistence`. Below is an overview of the main API features and utilities provided by the plugin.

## Table of Contents

- [Global Configuration](../guide/configuration)
  - Main function to configure global persistence behavior.
- [PersistOptions](./persist-options)
  - Store-level configuration options for state persistence.
- [createStatePersistence](../guide/configuration)
  - Main function to configure and use the plugin in your Pinia store.

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

| Parameter        | Type                 | Description                                                                                      |
|------------------|---------------------|--------------------------------------------------------------------------------------------------|
| `globalOptions`  | `GlobalConfiguration` | A configuration object to define global persistence behavior (see [Configuration](../guide/configuration)). |

### Notes

- The `createStatePersistence` function accepts global configuration options to apply consistent settings across stores.
- For store-specific behavior, refer to [PersistOptions](./persist-options).
- The key in the globalOptions object acts as a prefix for all store keys, ensuring consistent naming and avoiding conflicts.
- The plugin supports both synchronous (`localStorage`) and asynchronous (`localForage`) storage options.

For more details on using the plugin, see the [Guide](../guide/).
