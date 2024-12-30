# Installation

Install the plugin with your preferred package manager:

::: code-group
```sh [bun]
bun i pinia-plugin-state-persistence
```

```sh [pnpm]
pnpm add pinia-plugin-state-persistence
```

```sh [npm]
npm i pinia-plugin-state-persistence
```

```sh [yarn]
yarn add pinia-plugin-state-persistence
```
:::

## Vue Installation

Add the plugin to your Pinia store. Ensure that your project is set up with TypeScript for better type safety and developer experience.

### Example Setup

```ts twoslash
// @filename: pinia.ts
// @noErrors
import { createPinia } from 'pinia'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

// Initialize Pinia
const pinia = createPinia()

// Use the plugin with default localStorage
pinia.use(createStatePersistence())

export default pinia
```

### Notes:
1. **Default Storage**: The default storage mechanism is `localStorage`. To use a custom storage, replace the `storage` option.
2. **Imports**: Ensure the imports are correct for both `pinia` and `pinia-plugin-state-persistence`.
3. **Default Options**:
    - `serialize` and `deserialize`: The default behavior is `JSON.stringify` and `JSON.parse`. You can customize these functions for specific serialization needs.
4. **Plugin Usage**: This plugin must be applied to your Pinia instance before using it in your application.
5. **Debug Mode**: Set `debug: true` to see logs during development.

Add this file to your Pinia setup (e.g., `src/store/pinia.ts`) and import it in your main application file to initialize the Pinia store with persistence:

```ts twoslash
// @filename: main.ts
// @noErrors
import { createApp } from 'vue'
import App from './App.vue'
import pinia from './store/pinia'

const app = createApp(App)

// Use Pinia with persistence
app.use(pinia)

app.mount('#app')
```

### Troubleshooting:
- Ensure the `pinia-plugin-state-persistence` package is installed.
- Verify that `pinia` is properly installed and initialized in your project.
- Check browser compatibility for the chosen `storage` option (`localStorage` or other custom implementations).
