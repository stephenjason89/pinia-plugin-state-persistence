# Nuxt Integration

To persist state using cookies in a Nuxt application, we recommend using [`cookie-universal`](https://github.com/microcipcip/cookie-universal/tree/master) for its robust cookie synchronization capabilities. This ensures that cookie changes on the server propagate to the client and vice versa.

### Example Setup

```ts twoslash
// @filename: pinia-persistence.ts
// @noErrors
import type { Pinia } from 'pinia'
import cookies from 'cookie-universal'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

export default defineNuxtPlugin((nuxtApp) => {
	const event = nuxtApp.ssrContext?.event // Access server-side request/response
	const Cookies = cookies(event?.node.req, event?.node.res) // Initialize cookie-universal with SSR context

    ;(nuxtApp.$pinia as Pinia).use(
		createStatePersistence({
			storage: {
				getItem: Cookies.get, // Get item from cookies
				setItem: Cookies.set, // Set item in cookies
				removeItem: Cookies.remove, // Remove item from cookies
			},
		}),
	)
})
```

### Notes:
1. **Default Storage**: The default storage mechanism is `localStorage`. This example demonstrates using cookies for storage instead.
2. **SSR Context**: Ensure `cookie-universal` is properly initialized with the server-side context (`req` and `res`) for seamless SSR integration.
3. **Custom Storage**: Replace `localStorage` with cookies or any other storage mechanism using the `storage` option.
4. **Debug Mode**: Enable debugging during development with the `debug` option.

Add this file as a Nuxt plugin (e.g., `plugins/pinia-persistence.ts`) and ensure it is loaded in your Nuxt application.

### Troubleshooting:
- Ensure the `pinia-plugin-state-persistence` and `cookie-universal` packages are installed.
- Verify that `pinia` and `cookie-universal` are properly configured in your Nuxt project.
- Check browser and server behavior for cookie synchronization and state persistence.
