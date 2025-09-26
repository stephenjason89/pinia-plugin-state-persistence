# Advanced Use Cases

This page explores advanced options and configurations available in your project to enhance state management and persistence. These options provide developers with powerful tools to create robust, efficient, and user-friendly applications.

## `$onRestore`

The `$onRestore` method helps you wait for the initial store restoration to complete, especially when working with asynchronous storage like `localForage` or `indexedDB`. This eliminates timing issues where components mount before async storage data has been loaded.

### Problem it Solves

When using asynchronous storage, the store initialization happens before the data has been loaded from storage. This can cause issues in component `onMounted` hooks where you need to check if persisted data exists before making server requests.

### Example Usage

#### Promise-based approach

```typescript
const store = useUserStore();

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

#### Callback-based approach

```typescript
import { onMounted } from "vue";
import { useUserStore } from "@/stores/user";

export default {
  setup() {
    const userStore = useUserStore();

    onMounted(() => {
      // Use callback for restoration completion
      userStore.$onRestore(() => {
        // Now it's safe to check persisted data
        if (!userStore.userData.length) {
          // No persisted data, fetch from server
          userStore.fetchUserData();
        } else {
          // Use persisted data
          console.log("Using cached user data:", userStore.userData);
        }
      });
    });

    return { userStore };
  },
};
```

## `$restore`

The `$restore` function allows you to manually synchronize the state from persistent storage back into the Pinia store. While `$restore` is automatically called during initialization, you may use it in scenarios where:

- The persistent storage is updated manually and needs to be synced back to the store.
- State modifications occur outside the scope of the normal flow.

### Example Usage

```typescript
const store = useStore();

// Restore the state from storage manually
store.$restore();
```

Use this functionality sparingly for specific cases to ensure the store stays in sync with storage.

## `$persist`

The `$persist` function forces the store to persist its current state into the configured storage. Normally, persistence is automatically handled via `$subscribe`, but `$persist` is useful in scenarios where:

- State changes are not detected by `$subscribe`.
- Custom logic requires explicitly saving the state.

### Example Usage

```typescript
const store = useStore();

// Force persist the current state to storage manually
store.$persist();
```

This is particularly helpful in batch updates or custom save operations that bypass normal mutation flows.

## Object Key Persistence

The plugin supports persisting state properties on separate keys when an object is provided for the `key` option. This allows finer control over how state properties are stored.

### Example Configuration

```typescript
import { defineStore } from "pinia";

export const useExampleStore = defineStore("example", {
  state: () => ({
    userId: 1,
    token: "Bearer ...",
  }),
  persist: {
    key: {
      userId: "user-id-storage-key",
      token: "user-token-storage-key",
    },
  },
});
```

### Behavior

- Each state property specified in the `key` object is serialized and stored individually under its respective storage key.
- Properties not included in the `key` object will fall back to the default storage behavior and will use `store.$id` as the storage key.
- This approach is particularly useful for large stores where persisting state properties to different storage keys is needed.

## Multiple Storage Support

The plugin supports persisting state properties to multiple storages by allowing the `persist` option to accept an array of persistence configurations. This enables fine-grained control over where and how state properties are stored.

### Example Configuration

```typescript
import { defineStore } from "pinia";

export const useExampleStore = defineStore("example", {
  state: () => ({
    userId: 1,
    token: "Bearer ...",
    preferences: { theme: "dark" },
  }),
  persist: [
    {
      key: "user-data",
      storage: localStorage,
      include: ["userId", "token"],
    },
    {
      key: "preferences-storage",
      storage: sessionStorage,
      include: ["preferences"],
    },
  ],
});
```

### Behavior

- Each persistence configuration applies to specific state properties based on the `include` and `exclude` options.
- Different storages can be used for different pieces of state (e.g., `localStorage` for authentication and `sessionStorage` for UI preferences).
- When multiple persistence configurations apply to the same state keys, they will be processed in order, and the last configuration may overwrite earlier ones.
- The `overwrite` option is not allowed as persistence is sequential, with later configurations overriding previous ones.

This feature is particularly useful for applications requiring fine control over storage strategies, such as segregating sensitive authentication data from non-sensitive UI preferences.

## Conclusion

The `$restore` and `$persist` functions, along with comprehensive plugin configurations like object key persistence and multiple storage support, provide flexibility and power for state management. By hooking into Pinia's `$subscribe`, most persistence needs are automatically managed, ensuring seamless state synchronization. These tools offer additional control for edge cases, such as handling manual updates to storage, unique custom scenarios, or persisting individual state properties to specific keys and storages. Leverage these options to build sophisticated applications with reliable persistence and efficient state synchronization.
