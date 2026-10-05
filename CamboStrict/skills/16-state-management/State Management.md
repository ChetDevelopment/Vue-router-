# State Management

## Purpose

To provide a comprehensive framework for managing state in frontend applications. This skill covers the taxonomy of state (local vs. global, server vs. client), state machines for complex flows, immutable update patterns, state normalization, selector optimization, derived state, middleware for side-effect orchestration, persistence strategies, and time-travel debugging. The goal is to eliminate ad-hoc state patterns by codifying clear principles for when and how to manage each category of state, resulting in predictable, debuggable, and performant applications.

## Responsibilities

- Classify every piece of state into the correct category: local component state, global client state, server cache state, URL/route state, or persisted state. Each category uses a different tool and pattern.
- Abstract server state behind a dedicated caching layer that handles deduplication, caching, background refetching, and optimistic mutations. Never store server responses in a global client store.
- Implement state machines (finite state machines or statecharts) for UI flows that have multiple states and complex transitions (form submission, data fetching, multi-step wizards).
- Enforce immutable update patterns across all state updates to enable change detection, time-travel debugging, and predictable re-renders.
- Normalize nested relational data into flat entity stores to eliminate duplicate data and simplify updates.
- Design and use selectors—memoized functions that derive computed values from state. Selectors prevent unnecessary recomputation and re-renders.
- Handle derived state explicitly: computed values (full name from first + last), aggregated values (cart total from items), filtered lists. Do not store derived values alongside source data.
- Implement middleware to orchestrate side effects: logging state changes, persisting state to localStorage, queuing actions for replay, or triggering analytics events.
- Configure state persistence: serialize critical state (user preferences, form drafts, auth tokens) to localStorage, sessionStorage, IndexedDB, or secure cookies. Deserialize on app load.
- Enable time-travel debugging in development: record every state change (action + snapshot) and allow undo/redo by replaying actions from the beginning up to the desired index.

## Decision Process

1. **Determine the scope of the state.** Is the state needed only by a single component? Use `useState` (React) or a local reactive variable. Is it shared by a small subtree? Use `useContext` or a lightweight store (Zustand/Jotai). Is it global across many unrelated components? Use a global store (Redux, Zustand, Pinia).
2. **Determine the origin of the data.** Is the data fetched from a server (user profile, product list)? It is server state. Use a dedicated cache layer (React Query, SWR, Apollo Client, RTK Query). Never put server state into a global client store.
3. **Determine the volatility of the state.** Is the state ephemeral (search input, dropdown open/close)? Keep it local. Is it durable (theme preference, auth token)? Persist it. Is it shared across sessions (shopping cart)? Persist and hydrate.
4. **Model complex flows as state machines.** If a component has more than 4 boolean states (isLoading, isError, isSuccess, isValidating), replace them with a single state machine. Finite state machines prevent impossible states (e.g., `isLoading && isSuccess` both true).
5. **Normalize data when it is relational.** If the same entity appears in multiple lists or nested under different parents, normalize it. Store entities in a map keyed by ID (`byId: { [id]: Entity }`), and store references in ordered arrays (`allIds: string[]`).
6. **Choose the middleware strategy.** Define which side effects middleware handles: logging in development, persistence (subscribe to state changes and write to storage), and analytics (fire events on specific state changes). Avoid middleware that directly modifies state as a side effect.
7. **Design selectors with memoization.** For expensive computations (filtering a list of 10,000 items, computing derived totals), use memoized selectors (Reselect, `createSelector`). The memoized function re-computes only when its input dependencies change.
8. **Plan for persistence.** Identify which state slices survive a page refresh. Auth tokens persist in an HTTP-only cookie or secure storage. User preferences (theme, locale) persist in localStorage. Form drafts persist in sessionStorage. Cache server state in memory only; let the cache layer handle rehydration.
9. **Establish update granularity.** Avoid storing large objects that update frequently (e.g., an entire user object when only the avatar URL changes). Store fine-grained values or use atomic patches. This minimizes re-render scope.
10. **Instrument for debugging.** In development, log every state change with the action name, previous state, next state, and the difference (diff). Store the last 50-100 actions in a ring buffer for production debugging. Enable Redux DevTools or equivalent for time-travel inspection.

## Inputs

- API response schemas (TypeScript interfaces, OpenAPI specs) that define the shape of server data.
- Component trees showing which components share which state.
- User flows that involve state transitions: multi-step forms, wizards, checkout processes, authentication flows.
- Persistence requirements: what state must survive page refresh, what state is session-only, what state must be cleared on logout.
- Performance requirements: maximum re-render frequency, maximum state size, target time-to-interactive.
- Accessibility requirements: state changes that must be announced to screen readers (loading, validation errors, mutations).

## Outputs

- State store configuration: store creation, middleware setup, devtools integration.
- Normalized entity schemas: `byId/allIds` structures for relational data.
- Selector functions: memoized derived state computations.
- State machine definitions: states, transitions, guards, and side effects.
- Persistence configuration: storage keys, serialization/deserialization, migration strategies for schema changes.
- Action creators and reducers or equivalent state update functions.
- Integration tests that verify state transitions, edge cases, and persistence round-trips.

## Rules

1. **Server state never goes into a global client store.** Client stores (Redux, Zustand, Pinia) are for UI state, not server data. Use React Query, SWR, Apollo, or RTK Query for server cache. Violating this rule leads to stale data, sync bugs, and excessive re-renders.
2. **State mutations must be immutable (unless the library handles it).** Never do `state.value = newValue` or `state.items.push(newItem)`. Use spread operators, `Object.assign`, Immer, or immutable array methods (`.map`, `.filter`, `.concat`). In Zustand/Redux, return a new object from the update function.
3. **Derived state must not be stored alongside source state.** Do not store `fullName` if `firstName` and `lastName` exist. Do not store `cartTotal` if `cartItems` and their prices exist. Compute derived values with selectors or `useMemo`.
4. **State machines must cover all transitions.** For any given state, define valid next states and the events that trigger each transition. Guard conditions must be explicit predicates, not implicit checks inside the transition handler.
5. **Selectors must be colocated with the state they read.** A selector for `selectUserById` lives in the same file as the user slice/reducer. This keeps the selector in sync with the state shape.
6. **Persisted state must have a version number.** When the state shape changes, use a migration function that transforms the persisted state from the previous version to the current version. If migration fails, clear the persisted state and start fresh.
7. **Middleware must not depend on the order of other middleware.** Each middleware should operate on the action/state independently. If middleware must run in a specific order (e.g., logging before persistence), this must be documented and enforced by the middleware composition.
8. **Global state must be lazy-initialized.** Do not eagerly create stores for features the user has not visited. Use lazy store instantiation or code-split store creation alongside the feature module.
9. **All asynchronous state updates must handle loading, error, and success states.** Do not expose a single `data` field without also exposing `isLoading` and `error`. Consumers must be able to distinguish between "not yet loaded", "loading", "errored", and "loaded".
10. **State that is only used by a single component must stay local.** Prematurely globalizing state (putting everything in Redux from the start) creates unnecessary coupling and re-renders. Lift state up only when it is genuinely shared.

## Best Practices

1. **Use Immer for complex immutable updates.** For deeply nested state updates (e.g., update the third item's address city in a list of orders), use Immer's `produce` to write mutable-style code that produces an immutable result. This eliminates spread operator nesting.
2. **Normalize state before storing.** When you receive an API response with nested objects, normalize it immediately (using `normalizr` or a custom function). Store entities flat. Reference relationships by ID. This simplifies updates and avoids duplication.
3. **Use atomic selectors.** Each selector should read one piece of state or derive one value. Avoid selectors that return objects with multiple unrelated values. This enables fine-grained re-render control.
4. **Co-locate state logic with feature modules.** Do not put all reducers, actions, and selectors in a single global directory. Create a `features/orders/state/` directory that exports the slice, selector, and action creators for the orders feature. Import and register it in the root store.
5. **Use Zustand for simple global state and Redux for complex state machines.** Zustand is excellent for theme, locale, and UI preferences. Redux (with Redux Toolkit) is appropriate when you need middleware, devtools, normalized state, and time-travel debugging at scale.
6. **Test reducers and selectors in isolation.** A reducer is a pure function `(state, action) => state`. Test it by dispatching actions and asserting the resulting state. A selector is a pure function `(state) => derivedValue`. Test it by passing mock state and asserting the derived value.
7. **Use selectors to encapsulate state shape.** Components should never access `state.orders.byId` directly. They should call `selectOrderById(state, id)`. This means you can restructure the state without changing every component.
8. **Persist state selectively, not wholesale.** Do not `JSON.parse(localStorage.getItem('wholeState'))`. Select only the slices that need persistence (auth tokens, preferences, draft data). This reduces serialization overhead and avoids persisting transient data.
9. **Throttle persistence writes.** Writing to localStorage on every state change is expensive. Use a debounced write (500ms) or write only when the app/section loses focus (`blur` or `visibilitychange` events).
10. **Enable Redux DevTools in development only.** In production, strip DevTools middleware to reduce bundle size. Use `__REDUX_DEVTOOLS_EXTENSION_COMPOSE__` with `composeWithDevTools({ trace: true })` conditionally.

## Anti-patterns

1. **Putting server state into Redux.** Fetching data in a component, dispatching a `SET_USERS` action, and storing the full response in a Redux reducer. Now the Redux store is a second cache that must be kept in sync. Fix: use React Query or RTK Query for server state. Redux for UI state only.
2. **Storing derived state.** Computing `fullName` from `firstName + lastName` and storing it in the state object. When `firstName` changes, the developer must remember to also update `fullName`. Fix: compute derived values with selectors.
3. **Over-normalization.** Normalizing every piece of state even when the data is never referenced by ID. For a simple list of to-do items that is rendered once and never updated by ID, normalization adds unnecessary complexity. Fix: normalize only when data is relational and cross-referenced.
4. **Giant reducers.** A single reducer that handles every action type for an entire domain. It is hundreds of lines long and handles user CRUD, authentication, and preferences all in one switch statement. Fix: split into multiple slices, each handling a specific subset of state.
5. **State in multiple places.** The same piece of data (e.g., current user) stored in React Query cache, a Zustand store, and a context provider. Updates must be synchronized across all three. Fix: pick one source of truth and derive others from it.
6. **Over-use of context.** Putting every piece of global state into a React Context. When any context value changes, every consumer of that context re-renders, even if the changed value is irrelevant to them. Fix: split contexts by concern. Use Zustand or Redux for performance-sensitive global state.
7. **Mutating state directly in Zustand.** Because Zustand allows mutable-style updates (`set((state) => { state.items.push(newItem) })`) without explicit immutability enforcement, developers may accidentally mutate state outside of `set()`. Fix: always use `set()` with a new object or use Immer middleware.
8. **Forgetting to clean up state on logout.** When a user logs out, the store still contains the previous user's data, cached queries, and UI state. If another user logs in, they briefly see the previous user's data. Fix: on logout, reset all stores and clear all query caches.

## Edge Cases

1. **Stale closure in selectors.** A selector closes over a variable (like `currentUserId`) that is outdated by the time the selector runs. The selector returns data for the wrong user. Fix: pass the variable as a parameter to the selector (`selectUserById(state, id)`) rather than closing over it.
2. **Race conditions in state initialization.** The app loads and reads persisted state from localStorage while simultaneously fetching server data. The server data arrives first and is displayed, then the persisted state is hydrated and overwrites the server data. Fix: delay hydration until after the first successful server fetch. Or use a "hydrated" flag that blocks renders until hydration completes.
3. **Excessive re-renders from coarse selectors.** A selector returns an object `{ user, orders, notifications }`. Any change to any of these three values causes the component to re-render. Fix: use atomic selectors or `useSyncExternalStore` with shallow equality comparison.
4. **Corrupted persisted state.** A user has a stale localStorage entry with a state shape from an older version. When the app loads, it tries to access properties that no longer exist, causing errors. Fix: version the persisted state. On load, check the version and run a migration. If migration fails or version is missing, clear the entry.
5. **Circular dependencies in normalized state.** User A references Order B, and Order B references User A. When normalizing, the normalization library may infinite-loop. Fix: use a schema that defines entity boundaries. Do not include circular references in the same normalization pass.
6. **State that depends on other state.** `selectedItemId` refers to an item that is later deleted from the list. The selectedItemId becomes stale, pointing to nothing. Fix: use a selector that validates the reference exists. If the referenced item is deleted, the selector returns `null` and the component shows a fallback.
7. **Form state with unsaved changes and route navigation.** The user has unsaved changes in a form and tries to navigate away. The state must be preserved and a confirmation prompt shown. Fix: store form draft state in a context or store that persists across navigation. Use a navigation guard (`beforeRouteLeave`, `onBeforeUnmount`) that checks for unsaved changes.
8. **Optimistic update with concurrent modifications.** User A and User B both edit the same document. User A's optimistic update sets the title to "A", then User B's optimistic update sets the title to "B" (overwriting User A's change before the server confirms either). Fix: use a versioning or timestamp-based conflict resolution. The server rejects outdated writes, and the client reverts the optimistic update.

## Validation Checklist

- [ ] Server state is managed by a dedicated cache layer (React Query, SWR, Apollo, RTK Query)—not in a global client store.
- [ ] State mutations are immutable: new objects are returned, existing objects are never modified.
- [ ] Derived state is computed via selectors or `useMemo`, never stored alongside source data.
- [ ] Persisted state has a version number and a migration strategy for schema changes.
- [ ] Global state is only used when state is genuinely shared across multiple unrelated components.
- [ ] Every async state variable is accompanied by `isLoading` and `error` fields, not just `data`.
- [ ] Selectors are memoized and colocated with the slice they read from.
- [ ] Reducers are split into slices by domain; no single reducer exceeds 100 lines.
- [ ] On logout, all stores and caches are cleared to prevent data leakage between users.
- [ ] Form state with unsaved changes is persisted across navigation and restored on return.
- [ ] Zustand/Redux DevTools are enabled in development only, stripped in production.
- [ ] Normalized state uses `byId/allIds` patterns for relational data.
- [ ] Complex UI flows use a state machine instead of multiple boolean flags.
- [ ] Persistence writes are throttled/debounced and happen only for selected state slices.
- [ ] State initialization handles the race between persisted state hydration and server data fetching.

## Engineering Examples

### Example 1: Managing Complex Form State (React + Zustand + Immer)

A multi-step checkout form collects shipping address, billing address, payment details, and order review. Requirements: cross-step validation, address auto-complete, conditional fields, draft persistence on page refresh, and a clear error recovery path.

Implementation:

- **State structure**: A Zustand store holds the entire checkout state as a nested object. Immer middleware enables mutable-style updates. The store exposes atomic actions: `setShippingAddress`, `setBillingSameAsShipping`, `setPaymentDetails`, `setCurrentStep`.
- **Draft persistence**: On every state change (debounced 1 second), the entire checkout state is serialized to `sessionStorage`. On app load, the store is hydrated from `sessionStorage`. After successful order placement, `sessionStorage` is cleared.
- **Conditional fields**: The billing address form is hidden by default (when `billingSameAsShipping` is true). When the user toggles the checkbox, `setBillingSameAsShipping(false)` adds the billing address fields. The store action resets the billing address fields to empty.
- **Cross-step validation**: The "Next" button in step 1 triggers validation of step 1 fields only (using Zod). If valid, `setCurrentStep(2)` is called. The Zustand store does not hold error state; errors are managed locally by React Hook Form.
- **Error recovery**: If the payment API call fails, the store stays at step 3 (payment details) with the user-entered data intact. The component displays the server error message and enables editing.
- **Immer benefits**: The checkout state has nesting 4 levels deep. Without Immer, updating `state.shipping.address.city` would require spreading at every level. With Immer, the update is `state.shipping.address.city = newValue` inside `produce()`.

### Example 2: Caching Server Responses with Stale-While-Revalidate (React Query)

A social media feed displays posts, comments, and user profiles. The feed must feel fast while keeping data reasonably fresh.

Implementation:

- **Query key structure**: `['posts', { feedType: 'following', page: 1 }]`. The query key encodes all parameters that affect the response. When the user switches from "Following" to "Trending", the query key changes and React Query fetches new data.
- **Stale time & GC time**: `staleTime: 60_000` (consider data fresh for 1 minute). During that minute, navigating to the same feed shows cached data instantly without a network request. `gcTime: 300_000` (keep inactive queries in cache for 5 minutes). If the user navigates away and back within 5 minutes, they see the cached data while a background refetch happens.
- **Background refetching**: After 60 seconds of staleness, if the user navigates back to the feed, React Query triggers a background fetch. The existing data is shown immediately, then replaced when the new data arrives. A subtle "Updated" indicator appears at the top of the feed.
- **Optimistic mutations**: When the user likes a post, the mutation immediately increments the like count in the cache. If the server rejects the mutation (e.g., post is deleted), the count is reverted and a toast shows the error.
- **Cache invalidation**: When the user creates a new post, `queryClient.invalidateQueries({ queryKey: ['posts'] })` marks all post list queries as stale. The next time the feed is viewed, it refetches.
- **Selective caching**: User profile data is cached with `staleTime: 300_000` (5 minutes) because profile info changes infrequently. Comment data is cached with `staleTime: 30_000` (30 seconds) because comments may appear frequently.

The result: the feed feels instant because most navigations use cached data. Background refetches keep data fresh without blocking the UI.

### Example 3: Implementing Undo/Redo (Redux Toolkit + Immer)

A diagram editor allows users to add, move, and delete shapes. Users expect to undo/redo changes with Ctrl+Z / Ctrl+Y.

Implementation:

- **State structure**:

```typescript
interface EditorState {
  present: DiagramState;       // Current diagram state
  past: DiagramState[];         // Previous states for undo
  future: DiagramState[];       // States for redo
}
```

- **Action history**: Every mutation action (ADD_SHAPE, MOVE_SHAPE, DELETE_SHAPE, CHANGE_COLOR) is intercepted by a custom middleware. Before applying the action, the middleware pushes the current `present` state onto `past`. It clears `future` (any previous redo stack is invalidated by a new action).
- **Undo action**: Pops the last state from `past`, pushes the current `present` onto `future`, and sets `present` to the popped state.
- **Redo action**: Pops the last state from `future`, pushes the current `present` onto `past`, and sets `present` to the popped state.
- **Maximum history**: `past` is capped at 100 entries. When the cap is reached, the oldest entry is removed (shift).
- **Throttling consecutive identical actions**: If the user drags a shape (MOVE_SHAPE fires on every pixel change), the undo stack would grow by hundreds of entries for a single drag. Fix: coalesce consecutive MOVE_SHAPE actions into a single undo entry. Only the first and last positions are stored.
- **Immer integration**: Each state snapshot is a frozen Immer `Draft` object. Immer's structural sharing ensures that unchanged parts of the diagram are shared between snapshots, keeping memory usage manageable.
- **Keyboard shortcuts**: The editor component listens for `Ctrl+Z` (undo) and `Ctrl+Shift+Z` / `Ctrl+Y` (redo). These dispatch `undo()` and `redo()` actions. The undo/redo buttons in the toolbar are disabled when `past.length === 0` / `future.length === 0`.

This pattern gives users full undo/redo capabilities without excessive memory usage, even for complex diagrams with hundreds of shapes and thousands of actions.
