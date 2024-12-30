# Example Store

Here’s how to define a Pinia store with persistence enabled:

```ts twoslash
// @noErrors
import { defineStore } from 'pinia'

export const useExampleStore = defineStore('example', {
	state: () => ({
		count: 0,
		user: null,
	}),
	actions: {
		increment() {
			this.count++
		},
		setUser(user) {
			this.user = user
		},
	},
	persist: {
		key: 'example-store', // Make sure key is unique
		debug: true, // Enable debug logging
		filter: mutation => mutation.type !== 'increment', // Exclude increment mutations
		storage: localStorage, // Use localStorage for persistence
		serialize: JSON.stringify, // Custom serialization (default)
		deserialize: JSON.parse, // Custom deserialization (default)
	},
})
```
