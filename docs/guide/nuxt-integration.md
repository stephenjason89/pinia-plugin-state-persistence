# Nuxt Integration

To persist state using cookies in a Nuxt application, we recommend using [`cookie-universal`](https://github.com/microcipcip/cookie-universal/tree/master) for its robust cookie synchronization capabilities. This ensures that cookie changes on the server propagate to the client and vice versa.

```javascript
import cookies from 'cookie-universal'
import { createStatePersistence } from 'pinia-plugin-state-persistence'

export default defineNuxtPlugin((nuxtApp) => {
	const event = nuxtApp.ssrContext?.event
	const Cookies = cookies(event?.node.req, event?.node.res)

	nuxtApp.$pinia.use(
		createStatePersistence({
			storage: {
				getItem: Cookies.get,
				setItem: (key, value) => Cookies.set(key, value),
				removeItem: Cookies.remove,
			},
		})
	)
})
```
