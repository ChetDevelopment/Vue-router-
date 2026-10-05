# Offline-First & PWA Patterns

## Purpose
Establish an engineering framework for building Progressive Web Apps that function reliably under poor or absent network conditions, using service workers, cache strategies, background sync, and local storage to deliver a first-class offline experience that gracefully recovers connectivity.

## Responsibilities
- Implement the service worker lifecycle (install, activate, fetch, message) with proper version management, skip-waiting, and clients-claim patterns.
- Select and implement cache strategies (Cache First, Network First, Stale While Revalidate, Cache Only, Network Only) appropriate to each resource type.
- Deliver a meaningful offline fallback page or UI when the user navigates to an uncached page without connectivity.
- Queue user mutations (form submissions, edits, deletes) using Background Sync API and replay them when connectivity returns, handling conflicts.
- Store application data offline using IndexedDB with structured schemas, indexes, and versioned migrations.
- Configure the web app manifest with correct icons, display mode, theme color, start URL, and scope.
- Handle the install prompt event to encourage users to add the PWA to their home screen, respecting the user's choice not to be asked again.
- Notify users when a new version of the service worker is available and prompt them to update (skip-waiting or reload-to-update).

## Decision Process
1. Identify the resource types in the application: static assets (JS, CSS, fonts, images), API responses (JSON data), user-generated content, and third-party resources. Each type may require a different cache strategy.
2. For static assets (JS, CSS, fonts), use Cache First with a versioned cache name. These files change only on deployment, so once cached they never need network validation until the SW version changes.
3. For API responses that are read-heavy and rarely change (product catalog, reference data), use Stale While Revalidate: serve the cached version immediately and fetch a fresh version in the background to update the cache.
4. For API responses that must always be current (user balance, order status), use Network First with a timeout fallback to cache. If the network responds within N seconds, serve fresh data; otherwise fall back to cached data.
5. For user-generated content that is submitted offline (form fill, comment), queue the request in IndexedDB and register a Background Sync event. When connectivity returns, replay the queued mutations in order.
6. Design the offline fallback strategy: a static offline page (`/offline.html`) that is pre-cached during install. For navigation requests that fail, respond with the offline page. For API requests that fail, return a cached response or a graceful error object.
7. Build the IndexedDB schema with object stores for each data domain, create indexes for query patterns (by ID, by date, by status), and define version-upgrade handlers that migrate data between schema versions.
8. Configure the manifest with a 192px and 512px icon, `display: standalone` for app-like experience, `theme_color` matching the brand primary, `background_color` to avoid white flash on splash, and `start_url` pointing to the authenticated home page.
9. Handle the `beforeinstallprompt` event: prevent the default automatic prompt, store the event, and show a custom install button in the UI. After the user installs or dismisses, suppress the prompt permanently (use a flag in localStorage).
10. Implement update notification logic: on `controllerchange` event or when the waiting SW is detected, show a toast or banner informing the user of an available update with a "Reload" button that calls `skipWaiting()` then reloads all clients.

## Inputs
- Application resource inventory: list of all static assets, API endpoints, and third-party resources with their update frequency and criticality for offline use.
- User research indicating the most common offline scenarios (commuting, traveling, rural areas) and the features users expect to work offline.
- Data sensitivity requirements: which user data can be stored client-side, for how long, and whether it must be encrypted at rest in IndexedDB.
- API endpoint documentation with request/response schemas, authentication requirements, and idempotency guarantees (for safe background sync replay).
- Brand assets: app icons in multiple sizes, splash screen colors, and theme color.

## Outputs
- Service worker script (`sw.js`) implementing the lifecycle, cache strategies, offline fallback, and update notification.
- Cache strategy configuration map: resource URL pattern → strategy name → cache name.
- Background sync handler: IndexedDB queue for offline mutations, sync event registration, replay logic with conflict detection.
- IndexedDB schema definition with object stores, indexes, and migration handlers.
- Manifest JSON (`manifest.json`) with complete configuration and icon references.
- Install prompt component: custom UI that listens for `beforeinstallprompt`, shows/hides the install button, and tracks dismissal.
- Update notification component: banner or toast with "Update available — reload" action.

## Rules
- The service worker MUST be registered from the root scope (`/sw.js`) to intercept all navigation requests. Registering from a subdirectory limits the SW's scope.
- Cache names MUST be versioned (e.g., `static-v2`, `api-v1`). During the `activate` event, delete caches that do not match the current version to prevent stale and bloated caches.
- The offline fallback page MUST be pre-cached during the `install` event so it is always available without a network request.
- Background sync events MUST be registered with a minimum interval and must handle idempotency — the server must be able to detect and reject duplicate mutations (use a unique mutation ID).
- IndexedDB data for deleted entities MUST be cleaned up after successful sync to prevent replay of stale mutations.
- The `beforeinstallprompt` event MUST NOT be suppressed unconditionally — only prevent the automatic prompt and defer to the custom UI. Suppressing the event for all users hurts install rates.
- Update detection MUST poll the service worker's state or listen for `updatefound` — and the user must be notified with a clear action to activate the update. Auto-updating without user consent on a PWA can cause data loss.
- Third-party resources (CDN scripts, analytics, fonts) that fail to load offline MUST NOT block page rendering — use fallbacks or `crossorigin="anonymous"` with appropriate cache strategies.

## Best Practices
- Use Workbox (Google's service worker library) to avoid writing raw SW code. Workbox provides pre-caching, runtime caching strategies, background sync, and injectable manifest generation.
- Pre-cache all static assets during the `install` event using the Workbox precache list, which auto-generates a revision hash for each file to invalidate the cache on deployment.
- Implement a cache size limit for runtime caches using Workbox's `ExpirationPlugin` to prevent the cache from growing unbounded (e.g., max 50 entries, max age 30 days).
- Store user preferences (language, theme, saved state) in localStorage for simple key-value data and IndexedDB for structured or large datasets.
- Use `IndexedDB` with a promise-based wrapper (idb by Jake Archibald) to avoid the callback-heavy IndexedDB API directly.
- Test offline behavior using Chrome DevTools' "Offline" mode, "Slow 3G" throttling, and the "Bypass for Network" checkbox in the Application > Service Workers panel.
- Log service worker lifecycle events to the console during development and to an analytics event in production so you can monitor install success, update frequency, and offline usage.
- Use the `NavigationPreload` API (supported in modern Chromium-based browsers) to reduce navigation request latency when the SW is handling the fetch event.
- Handle the case where the user has the app installed and the server deploys a new version — avoid forcing an immediate reload if the user is in the middle of a data entry flow.
- Set a reasonable `start_url` in the manifest — usually the main authenticated route like `/dashboard` — and ensure the SW intercepts navigation to that URL even when launched from the home screen.

## Anti-patterns
- Caching dynamic API responses with Cache First strategy — the user will see stale data until the cache expires. Use Network First or Stale While Revalidate for dynamic content.
- Registering the service worker on every page load without checking if it is already registered. Multiple registrations cause redundant installs and conflicting SW instances.
- Using `localStorage` for large datasets (thousands of records). localStorage is synchronous and has a ~5MB limit. Use IndexedDB for any substantial offline data store.
- Assuming that background sync will eventually succeed without handling conflicts. The server may reject a mutation due to version conflicts, deleted parent entities, or expired sessions.
- Serving the offline fallback page for API fetch failures — the frontend should handle API errors gracefully within the app UI, not redirect to a generic offline page.
- Failing to update the service worker version when deploying new assets. Without a version change, the SW will continue serving the old cached assets indefinitely.
- Ignoring the `Content-Type` header when caching responses — caching an error page (HTML) as the response for an API endpoint (JSON) will cause parsing errors in the app.
- Adding the service worker scope as a narrow path (`/app/sw.js`). This prevents the SW from intercepting navigation to sibling routes like `/app/settings` — use root scope.

## Edge Cases
- The user submits a form while offline, the mutation is queued in IndexedDB, and the user navigates away. Background sync fires when connectivity returns but the user's session token has expired. The sync handler must detect the 401 response, invalidate the token, and prompt the user to re-authenticate — silently failing or retrying indefinitely is incorrect.
- Two tabs open simultaneously with different SW versions. The older tab may have a different cache state. The `message` event must be used to coordinate update notifications and avoid showing the update banner on the tab that already updated.
- The device storage is full and IndexedDB cannot write the offline mutation queue. The app must catch the `QuotaExceededError`, inform the user, and offer to delete old cached data to free space.
- A cache-fetch for a large image or video is interrupted by the user going back online and navigating away. The SW should not keep the connection open indefinitely — implement a fetch timeout.
- The `beforeinstallprompt` event fires on a non-supporting browser or after the app is already installed. The event must be feature-checked before use, and the install button must be hidden when the app is already in standalone mode.
- A cached API response includes a `Set-Cookie` header. The SW must not overwrite cookies from cached responses — only forward `Set-Cookie` from fresh network responses.
- The user clears browsing data (including IndexedDB and Cache Storage). The SW must handle missing caches and storages gracefully by falling back to network requests and re-caching.

## Validation Checklist
- [ ] The service worker registers successfully and appears in the Application > Service Workers panel with "Activated" status.
- [ ] All static assets (JS, CSS, fonts) are served from cache on repeat visits with no network requests — verified by DevTools Network tab showing "(from ServiceWorker)".
- [ ] Offline fallback page is displayed when navigating to an uncached URL while offline — verified by toggling Offline mode in DevTools and navigating to a new page.
- [ ] API responses with Stale While Revalidate strategy serve cached data immediately and update in the background — verified by checking the Network tab for two requests (one from cache, one from network).
- [ ] Background sync queue replays mutations after coming back online — verified by: go offline, submit a form, go online, confirm the mutation reaches the server.
- [ ] IndexedDB data persists across page reloads and survives a hard refresh — verified by storing data, refreshing, and reading it back.
- [ ] The app install prompt appears only for users who have not dismissed it before — verified by clicking "Cancel" on the prompt, refreshing, and confirming the prompt does not reappear.
- [ ] Update notification appears when a new SW version is detected, and clicking "Reload" activates the new SW — verified by changing a file, redeploying, and checking the notification.
- [ ] Cache names are versioned and old caches are deleted during the `activate` event — verified by checking the Cache Storage panel before and after an update.
- [ ] Serving from cache does not serve a HTML error page when the original response was an API JSON payload — verified by simulating a network failure and checking the response `Content-Type`.

## Engineering Examples

### Example 1: Service worker with offline support for a field data entry app
A field service inspection app used by technicians in remote areas with intermittent connectivity needed full offline read-write capability. The team built a service worker using Workbox with three cache strategies: static assets (Cache First), inspection templates (Stale While Revalidate), and customer data (Network First with 3-second timeout). IndexedDB stored the technician's in-progress inspections as structured objects with auto-incrementing local IDs. When the technician submitted an inspection offline, the app wrote the data to IndexedDB and registered a Background Sync event named `sync-inspections`. The sync handler read queued inspections from IndexedDB, POSTed them to the server, and on success deleted the local copy. The server returned a global unique ID that was stored locally to prevent duplicate sync. Conflict resolution: if the server had a newer version of a customer record, the sync handler returned both versions and flagged it for manual review. The offline fallback page showed the technician's cached schedule and a message indicating they were offline. An IndexedDB `versionchange` event handler gracefully closed the database when a new SW needed exclusive access during upgrade.

### Example 2: Background sync for offline form submissions
A healthcare appointment booking app allowed patients to book, reschedule, and cancel appointments. The team identified that users often tried to book appointments in underground subway stations with no signal. They implemented a mutation queue in IndexedDB: each mutation had a `mutationId` (UUID), `type` (CREATE, UPDATE, DELETE), `endpoint`, `body`, `createdAt`, and `retryCount`. When the user submitted a form offline, the app showed an optimistic success UI ("Your request has been queued and will be submitted when you're back online") and wrote the mutation to the queue. A Background Sync event `sync-bookings` was registered. When connectivity returned, the sync handler read mutations ordered by `createdAt` and replayed them sequentially. The server checked `mutationId` for idempotency — if it had already processed that ID, it returned a 200 with the existing result instead of creating a duplicate. If a mutation failed with a 409 Conflict (e.g., the slot was no longer available), the sync handler paused, notified the user via a push notification, and moved the remaining queued mutations to a "failed" state for manual resolution.

### Example 3: PWA with full offline read capability for a documentation site
A technical documentation site for a developer SDK wanted to provide full offline read access so developers could study docs on flights. The team configured Workbox to pre-cache all documentation HTML files (generated at build time from Markdown) and serve them with Cache First. The navigation fallback logic served the cached index page for any documentation URL that was not explicitly cached, allowing the client-side router to handle the route client-side with the data already in the IndexedDB docs store. The documentation content was also stored in IndexedDB: a nightly build script fetched all articles from the CMS, converted them to HTML, and stored them in a versioned IndexedDB object store as `{ slug, title, content, updatedAt }`. The manifest was configured with `display: standalone`, `theme_color: #6366f1`, and icons in all required sizes. The install prompt was handled with a custom "Install Docs" button in the sidebar. When a new version of the documentation was deployed, the SW detected the update and showed a "New docs available — refresh" banner. The SW activation deleted the old IndexedDB docs store and triggered a re-fetch of the latest content.
