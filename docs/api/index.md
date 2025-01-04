# API Reference

Welcome to the API Reference for `pinia-plugin-state-persistence`. Below is an overview of the main API features and utilities provided by the plugin.

## Table of Contents

- [PersistOptions](./persist-options)
    - Configuration options for state persistence.
- [createStatePersistence](#createStatePersistence)
    - Main function to configure and use the plugin in your Pinia store.

## `createStatePersistence`

### Overview

The `createStatePersistence` function initializes the state persistence plugin for Pinia. This function accepts a configuration object (`PersistOptions`) that determines how the state is stored and retrieved.

### Syntax

```ts twoslash
// @noErrors
import { createStatePersistence } from 'pinia-plugin-state-persistence'

createStatePersistence(options: PersistOptions)
```

### Parameters

| Parameter | Type             | Description                                                                                      |
|-----------|------------------|--------------------------------------------------------------------------------------------------|
| `options` | `PersistOptions` | A configuration object to define persistence behavior (see [PersistOptions](./persist-options)). |

## Notes

- For a detailed list of configuration options, refer to [PersistOptions](./persist-options).
- Always ensure the `key` in the `options` object is unique to avoid conflicts across stores.
- The plugin supports both synchronous (`localStorage`) and asynchronous (`localForage`) storage options.

For more details on using the plugin, see the [Guide](../guide/).
