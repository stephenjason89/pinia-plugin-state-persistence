# Installation

Install the plugin with your preferred package manager:

```bash
npm install pinia-plugin-state-persistence
# or
yarn add pinia-plugin-state-persistence
# or
pnpm i pinia-plugin-state-persistence
# or
bun i pinia-plugin-state-persistence
```

## Vue Installation

Add the plugin to your Pinia store:

```javascript
import { createPinia } from 'pinia'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

const pinia = createPinia()

pinia.use(
	createStatePersistence({
		key: 'my-app',
		debug: true,
		storage: localStorage, // Default: localStorage
		deserialize: JSON.parse, // Optional custom deserialization
		serialize: JSON.stringify, // Optional custom serialization
	})
)

export default pinia
```
