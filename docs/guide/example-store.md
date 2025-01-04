# Introduction

This document provides examples of how to configure state persistence in your Pinia stores. For a detailed breakdown of available configuration options, refer to the [`PersistOptions`](../api/persist-options.md) documentation.

## Basic Store Example
Here is an example of how to configure persistence in a Pinia store:
```ts twoslash
// @noErrors
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
	state: () => ({
		settings: {
			theme: 'dark',
			notifications: true,
			privacy: 'public',
			experimentalFeatures: false,
		},
		password: 'supersecret',
		token: 'abc123',
		profile: {
			age: 30,
			address: '123 Main St',
		},
	}),
	persist: {
		debug: true, // Enable debug logging
		key: 'user-store',
		include: ['settings.theme', 'settings.notifications', 'profile.age'], // Persist theme, notifications, and age
		filter: (mutation, state) => state.profile.age < 18, // Exclude persisting if age is less than 18
	},
})
```

## Advanced Store Example

```ts twoslash
// @noErrors
import localForage from 'localforage'
import { defineStore } from 'pinia'
import { parse, stringify } from 'zipson'

export const useAuthStore = defineStore('auth', {
	state: () => ({
		user: {
			name: 'John Doe',
			email: 'john@example.com',
			password: 'mypassword',
			preferences: {
				language: 'en',
				timezone: 'UTC',
			},
		},
		token: 'jwt-token',
		permissions: ['read', 'write']
	}),
	persist: {
		debug: true, // Enable debugging
		key: {
			// Use different keys for user and permissions
			user: 'user-storage-key',
			permissions: 'permissions-storage-key'
		},
		storage: localForage, // Use localForage for persistence
		serialize: stringify, // Compress state with zipson
		deserialize: parse, // Decompress state with zipson
		include: ['user', 'permissions'], // Persist user and permissions
		exclude: ['user.preferences', 'user.password'], // Exclude certain properties
	},
})
```

## Key Points

1. **Best Practices**:
   - Avoid persisting sensitive data (e.g., passwords, tokens) or transient properties.
   - Use `include` for minimal persistence and `exclude` to remove sensitive or transient data.
   - Leverage `debug` mode during development for tracking, but disable it in production for optimal performance.

2. **Key Management**:
   - Use the `key` option as a string for a single key or as an object to specify unique keys for different parts of the state.

3. **Storage Options**:
   - **Synchronous**: Use `localStorage`, `sessionStorage`, or cookies for small and fast storage needs.
   - **Asynchronous**: Use `localForage` or other async solutions for larger datasets or non-blocking behavior.
   - **Cloud-Based**: For distributed or server-side persistence, consider remote APIs or custom solutions.

4. **Serialization/Deserialization**:
   - Transform and compress state as needed using libraries like `zipson` or custom serializers.

5. **Include/Exclude**:
   - Control persistence granularity using `include` and `exclude`, supporting dot notation for nested properties.

6. **Filter**:
   - Use the `filter` function to apply custom logic for deciding whether specific mutations or states should be persisted.
     Example: Exclude persistence for users below a certain age:
     ```ts
     filter: (mutation, state) => state.profile.age >= 18
     ```
