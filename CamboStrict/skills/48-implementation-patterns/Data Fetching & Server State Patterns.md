# Data Fetching & Server State Patterns

## Purpose

Define a consistent, predictable system for fetching, caching, mutating, and synchronizing server state in client applications. This skill eliminates boilerplate, prevents common bugs like stale data and race conditions, and ensures users always see up-to-date information with appropriate loading and error feedback. It covers the full lifecycle of server data from initial fetch through cache management to optimistic mutations and revalidation.

## Responsibilities

- Managing loading states for every data fetch operation, providing granular loading indicators at the query level (not just a global spinner) so users know exactly what is loading.
- Handling error states with typed error objects, retry mechanisms, and fallback UI for every fetch operation, ensuring no failed request silently shows incorrect data.
- Implementing caching strategies that balance freshness with performance: in-memory caches, persisted caches (localStorage/IndexedDB), and HTTP cache headers.
- Maintaining stale-while-revalidate semantics: serve cached data instantly while refetching in the background, updating the UI seamlessly when fresh data arrives.
- Applying optimistic updates for mutations: update the UI instantly before the server confirms, then reconcile based on success or failure response.
- Managing pagination strategies for list endpoints, choosing between cursor-based and offset-based pagination based on the data characteristics and UX requirements.
- Deduplicating identical in-flight requests so that multiple component instances fetching the same data result in a single network request.
- Implementing retry logic with exponential backoff for transient failures, with configurable max retries and retry conditions (network error vs 5xx vs 4xx).
- Choosing between polling and WebSocket-based real-time updates based on freshness requirements, scale, and infrastructure complexity.
- Queuing mutations when offline and replaying them in order when connectivity is restored, with conflict detection for stale data.

## Decision Process

1. Identify the data source and access pattern: REST API, GraphQL, WebSocket stream, or server-sent events. Determine if the data is read-heavy (product catalog), write-heavy (chat messages), or mixed (collaborative documents).
2. Determine the freshness requirements: real-time (live cursor positions), near-real-time (notifications, <30s stale), session-fresh (user profile, <5min stale), or page-fresh (static data, fetch once per session).
3. Choose a caching strategy based on freshness: stale-while-revalidate for near-real-time, cache-then-network for session-fresh, network-only for real-time, cache-first for static reference data.
4. Select pagination strategy: cursor-based pagination for real-time feeds and infinite scroll (stable cursors, no offset drift), offset-based pagination for traditional page numbers and skip/limit APIs where total count is needed.
5. Decide on real-time mechanism: WebSocket for bi-directional low-latency communication (chat, collaborative editing), SSE for server-to-client streaming (notifications, feed updates), polling only as fallback when WebSocket/SSE are unavailable.
6. Design the request deduplication scope: application-wide deduplication for global data (current user), component-scoped deduplication for local data (list filters), or per-key deduplication with configurable stale time.
7. Configure retry policy: no retry for 4xx client errors (invalid input), up to 3 retries with exponential backoff for 5xx and network errors, immediate retry for rate-limit (429) after the `Retry-After` header duration.
8. Implement optimistic updates: determine which mutations can be optimistically applied (likes, follows, non-critical edits) vs which require server confirmation (payments, sensitive data changes). Define rollback logic for each optimistic update.
9. Design offline queue: persist pending mutations to IndexedDB with a mutation log, replay in FIFO order when online, detect conflicts via `If-Match`/`If-Unmodified-Since` headers or version fields, and notify the user of conflicts.
10. Plan cache invalidation: after any mutation, invalidate related query caches by tags or prefixes rather than blanket invalidation, and refetch only affected queries to minimize network usage.

## Inputs

- API contract: OpenAPI spec, GraphQL schema, or documented endpoint list with request/response shapes for all data operations.
- Freshness requirements: documented SLAs per data type (e.g., "user profiles must be fresh within 5 minutes, inventory within 30 seconds").
- Network conditions: expected user network quality (offline support needed, high-latency regions, data cost sensitivity).
- Pagination requirements: UX mockups showing infinite scroll vs paginated pages, expected data volumes (hundreds vs millions of records).
- Authentication context: token storage mechanism, refresh token flow, and how auth headers are attached to requests.
- Existing caching infrastructure: service worker setup, CDN configuration, and any existing cache layers.

## Outputs

- Data fetching layer: typed hooks, services, or repository functions that encapsulate all fetch, cache, and mutation logic, hiding network details from UI components.
- Loading state components: per-query loading indicators (skeletons, spinners, progress bars) that are composable and consistent across the application.
- Error handling utilities: typed error objects, error boundaries for fetch failures, retry buttons, and fallback UI components.
- Cache configuration: cache TTL per query key, stale time configuration, garbage collection policy, and persistence strategy.
- Optimistic update logic: optimistic state updaters with rollback functions, conflict resolution handlers, and notification components for failed mutations.
- Pagination components: infinite scroll wrappers, "Load More" buttons, page navigation controls, and pagination state management.
- Offline queue: mutation persistence layer, queue processor, conflict detection, and user-facing offline/online status indicators.

## Rules

1. Never show stale data without an indicator — every cached response that is served while a refetch is in flight must display a subtle "refreshing" indicator or stale badge.
2. Always handle the error state at the component level — never let a fetch error propagate uncaught to crash the page or show a blank white screen.
3. Always deduplicate identical concurrent requests — never send two simultaneous GET requests for the same resource from different components on the same page.
4. Never retry a 4xx error — client errors indicate a bug or invalid input; retrying will produce the same result and waste bandwidth.
5. Always invalidate related caches after a successful mutation — never leave stale data in the cache after creating, updating, or deleting a resource.
6. Never block the UI on mutation — show an optimistic update immediately for non-critical operations and reconcile later; only block for high-stakes mutations like payments.
7. Always provide a way to manually refetch — every data-fetching component must expose a refresh/retry action, not rely solely on automatic revalidation.
8. Never poll at a higher frequency than is needed — set the minimum polling interval based on documented freshness SLAs, not arbitrarily low.
9. Always handle the loading state granularly — show per-card skeletons or per-section spinners, never a full-page spinner that hides all content.
10. Never cache authenticated user data in shared caches (CDN, service worker) — user-specific data must be cached only in private in-memory or local caches.

## Best Practices

1. Use a dedicated server state library (TanStack Query, SWR, Apollo Client) rather than hand-rolling fetch + useState — these libraries handle caching, deduplication, and revalidation with battle-tested logic.
2. Define query keys as structured arrays (e.g., `['projects', projectId, 'tasks', filter]`) rather than string concatenation — structured keys enable partial cache invalidation and typed access.
3. Extract data fetching into custom hooks (`useUser`, `useProjects`, `useCreateProject`) that encapsulate all query/mutation logic, keeping components free of data-fetching concerns.
4. Use selectors in queries to transform or extract data at the query level (`useQuery(['project', id], fetch, { select: data => data.name })`) rather than transforming in components, enabling memoization.
5. Implement infinite queries (`useInfiniteQuery`) for infinite scroll rather than manually tracking page state — these APIs handle cursor accumulation, fetch-next-page, and cache management natively.
6. Set `staleTime` to a positive value (30s minimum) for most queries to avoid spinners on fast navigations — only set `staleTime: 0` for data that must be fresh on every render.
7. Use mutation callbacks (`onMutate`, `onError`, `onSettled`) for optimistic updates rather than manually updating the cache — these callbacks handle rollback and cache invalidation with proper error recovery.
8. Prefetch data likely to be needed soon using `queryClient.prefetchQuery` triggered by hover or intersection observer — this makes subsequent navigations feel instant.
9. Implement request cancellation for queries that use `AbortController` — when a component unmounts, cancel in-flight requests for that component to prevent state updates on unmounted components.
10. Log all failed queries with structured error details (URL, status, query key, timestamp) to a monitoring service for debugging production issues.

## Anti-patterns

1. Using `useEffect` + `useState` for data fetching without caching, deduplication, or revalidation — this leads to duplicate requests, stale data, and race conditions.
2. Putting all data fetching in one global provider with a single loading/error state — this causes the entire page to show a spinner when any single query is loading.
3. Polling at aggressive intervals (every 1-2 seconds) when WebSocket would be more appropriate — polling wastes bandwidth and battery, especially on mobile.
4. Optimistically updating without rollback logic — if the mutation fails, the UI shows incorrect data indefinitely with no way to recover.
5. Invalidating all caches on every mutation (`queryClient.invalidateQueries()`) — this refetches every active query, wasting bandwidth and causing UI flicker across unrelated parts of the page.
6. Storing server state in a global state manager (Redux, Zustand) alongside UI state — server state and UI state have different lifecycle and synchronization needs.
7. Calling refetch on component mount when the data is already fresh — this defeats the purpose of caching and causes unnecessary network requests.
8. Ignoring the `staleTime` configuration and leaving it at default (0) — this makes every data fetch a network request, eliminating all caching benefits.

## Edge Cases

1. Network flapping: when the network disconnects and reconnects rapidly (every few seconds), the retry logic must debounce and not exhaust retry limits on transient blips.
2. Cache poisoning: if a mutation returns successfully but the server state changed between the read and write, the optimistic update may conflict — handle with version checks or server-authoritative reconciliation.
3. Race conditions on rapid mutations: if a user likes and unlikes a post in quick succession, the second mutation's optimistic update must be based on the latest cached state, not the original state.
4. Pagination with live data: when new items are inserted at the top of a list while a user is on page 2, cursor-based pagination prevents duplicate or missed items, while offset-based pagination causes shifts.
5. Authentication token expiry: if a token expires mid-session, all subsequent fetches will fail with 401 — the data fetching layer must detect this, attempt token refresh, and retry the original request transparently.
6. Large query key spaces: when using structured query keys with filters, the cache can grow unbounded — implement a garbage collection policy that evicts least-recently-used cache entries after a max size.
7. Suspense mode with loading states: when React Suspense is enabled, loading states are handled by Suspense boundaries — all data fetching hooks must support suspense mode and not render their own loading states.
8. Server-side rendering: when fetching data on the server (Next.js, Remix), the cache must be dehydrated to the client to avoid a second fetch on hydration — use the framework's built-in dehydration/hydration utilities.

## Validation Checklist

- [ ] Every data-fetching hook returns `isLoading`, `isError`, `error`, `data`, and `refetch` properties (or framework equivalent).
- [ ] Loading states are granular (per-component or per-section), not a single full-page spinner.
- [ ] Error states render a user-friendly message and a retry action — no blank screens or uncaught error boundaries.
- [ ] Identical concurrent requests for the same query key result in a single network request (verified with network tab).
- [ ] Cache invalidation after mutations targets only affected query keys, not the entire cache.
- [ ] Optimistic updates are accompanied by rollback logic that restores the pre-mutation state on failure.
- [ ] Retry logic distinguishes between retryable (5xx, network error) and non-retryable (4xx) errors.
- [ ] Pagination implementations do not duplicate or skip items when data changes between pages (cursor-based preferred for dynamic lists).
- [ ] Offline mutations are queued and replayed in FIFO order when connectivity returns, with conflict detection.
- [ ] All fetch hooks support `AbortController` cancellation and clean up on unmount.

## Engineering Examples

### Example 1: Implementing a Data Fetching Layer with Stale-While-Revalidate

An e-commerce application fetches product listings. The team uses TanStack Query with `staleTime: 300000` (5 minutes) and `cacheTime: 600000` (10 minutes). When a user navigates to a previously viewed category, the cached product list is shown instantly while a background refetch updates the data. If the refetch returns updated inventory or pricing, the UI seamlessly updates individual product cards without flicker. The `useProducts` hook is defined with structured query key `['products', { category, sort, page }]` and uses `keepPreviousData: true` to avoid showing a spinner when pagination changes. Error handling: if the refetch fails (503 server busy), the cached data remains visible with a subtle "Showing cached data — update failed" banner and a retry button. The implementation uses TanStack Query's built-in stale-while-revalidate mechanism, requiring no custom code — only configuration of `staleTime` and `cacheTime`.

### Example 2: Handling Optimistic Updates for a Like/Unlike Feature

A social media feed uses optimistic updates for the like button. When a user clicks the heart icon on a post, the mutation's `onMutate` callback immediately increments the like count and fills the heart by updating the query cache for that post's key (`['post', postId]`). The mutation call is sent to the server. If the server responds with success, nothing changes — the UI already shows the correct state. If the server responds with an error (e.g., "you already liked this post" or "post not found"), the `onError` callback reverts the cache to the value captured in `onMutate` (stored via `context.previousPost`) and shows a toast notification explaining the failure. The button is disabled during the mutation via `isLoading` to prevent double-clicks. This pattern provides instant feedback while maintaining data integrity.

### Example 3: Implementing Cursor-Based Pagination

A messaging app displays conversation messages with infinite scroll. The API returns `{ data: Message[], nextCursor: string | null }`. The `useMessages(conversationId)` hook uses `useInfiniteQuery` with `getNextPageParam: (lastPage) => lastPage.nextCursor`. The query key is `['messages', conversationId]`. The hook returns `data.pages` which is flattened into a single message array. A "Load earlier messages" button or intersection observer triggers `fetchNextPage()`. When a new message arrives via WebSocket, it is prepended to the first page using `queryClient.setQueryData`. Because cursor-based pagination uses stable cursors (message creation timestamps encoded as base64), new messages at the top do not shift existing pages — users can scroll up to load older messages without duplication. The hook also uses `hasNextPage` to hide the "Load more" button when all messages are loaded, and `isFetchingNextPage` to show a small spinner at the bottom during page fetches.
