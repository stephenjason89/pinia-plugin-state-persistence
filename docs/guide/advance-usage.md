# Advanced Use Cases

This page explores advanced options and configurations available in your project to enhance state management and persistence. These options provide developers with powerful tools to create robust, efficient, and user-friendly applications.

## `$restore`

The `$restore` function allows you to manually synchronize the state from persistent storage back into the Pinia store. While `$restore` is automatically called during initialization, you may use it in scenarios where:

- The persistent storage is updated manually and needs to be synced back to the store.
- State modifications occur outside the scope of the normal flow.

### Example Usage

```typescript
const store = useStore()

// Restore the state from storage manually
store.$restore()
```

Use this functionality sparingly for specific cases to ensure the store stays in sync with storage.

## `$persist`

The `$persist` function forces the store to persist its current state into the configured storage. Normally, persistence is automatically handled via `$subscribe`, but `$persist` is useful in scenarios where:

- State changes are not detected by `$subscribe`.
- Custom logic requires explicitly saving the state.

### Example Usage

```typescript
const store = useStore()

// Force persist the current state to storage manually
store.$persist()
```

This is particularly helpful in batch updates or custom save operations that bypass normal mutation flows.

## Conclusion

The `$restore` and `$persist` functions, along with comprehensive plugin configurations, provide flexibility and power for state management. By hooking into Pinia's `$subscribe`, most persistence needs are automatically managed, ensuring seamless state synchronization. These functions, however, offer additional control for edge cases, such as handling manual updates to storage or unique custom scenarios. Leverage these tools to build sophisticated applications with reliable persistence and efficient state synchronization.
