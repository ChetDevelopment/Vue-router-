# Analytics & Event Tracking

## Purpose
Provide a disciplined engineering framework for instrumenting analytics and event tracking that produces clean, consistent, trustworthy data — defining the event taxonomy, implementing page view and custom event tracking, managing user identity, ensuring GDPR compliance, and abstracting the analytics provider to prevent vendor lock-in.

## Responsibilities
- Design and maintain a centralized event taxonomy: a documented catalog of every tracked event with its name, properties, trigger condition, and business question it answers.
- Implement automatic page view tracking on every route change, capturing URL, referrer, title, and user-agent metadata.
- Provide a developer API for firing custom events with required and optional properties, enforcing property types and existence at development time.
- Track anonymous users with a device-scoped identifier and merge anonymous events with the logged-in user identity when the user authenticates.
- Manage session boundaries: create a session ID on app load, extend it on user activity, and terminate it after 30 minutes of inactivity.
- Ensure GDPR/ePrivacy compliance by obtaining consent before activating non-essential tracking, and honoring opt-out without data loss for essential analytics.
- Batch events client-side and flush them periodically or on page unload to reduce HTTP requests and avoid losing the last events.
- Abstract the analytics provider behind a uniform interface so the application code never imports from Google Analytics, Mixpanel, PostHog, or Amplitude directly.
- Instrument A/B experiment tracking by firing exposure events with experiment ID, variant ID, and user ID when a user is assigned to a variant.

## Decision Process
1. Define the event taxonomy structure: events are named `{domain}.{action}` (e.g., `checkout.payment_submitted`), with snake_case or camelCase consistently. Document each event in a shared spreadsheet or a markdown file in the repository.
2. Categorize events into levels: Level 1 (page views, session start/end), Level 2 (core user actions — add to cart, submit form, play video), Level 3 (engagement signals — scroll depth, time on page, hover interactions), Level 4 (business outcomes — purchase, signup, upgrade). Not all levels need to be tracked from day one.
3. Define event properties with types and validation rules: `required` properties that must always be present, `optional` properties with defaults, and `PII` properties that must be explicitly marked for scrubbing.
4. Choose a user identification strategy: use a randomly generated anonymous ID stored in localStorage for unauthenticated users. On login, call `analytics.identify(userId, traits)` and link the anonymous session to the identified user.
5. Implement session management: generate a UUID session ID on app initialization, store it in memory, and every user action extends the session TTL. Inactivity for 30 minutes generates a new session ID.
6. Build the GDPR consent flow: load a consent management platform (CMP) or a custom consent dialog. Only initialize non-essential trackers (marketing, personalization) after consent. Essential analytics (page views, performance monitoring) may fire without consent if anonymized and covered under the "legitimate interest" basis.
7. Implement event batching: collect events in an in-memory queue, batch them into groups of 10 or every 5 seconds (whichever comes first), and send them as a single POST request. On `beforeunload`, flush the queue synchronously.
8. Design the analytics abstraction layer: create an `analytics.ts` module that exports `track`, `pageView`, `identify`, and `reset` functions. Each function delegates to the registered providers. The module never exposes provider-specific details.
9. Set up event debugging: in development mode, log every event to the console with its name, properties, and timestamp. Provide a browser extension or DevTools panel to inspect the event stream.
10. Establish an event naming review process: every new event must be proposed via a PR that adds it to the taxonomy document, and an analytics stakeholder (PM or data engineer) must approve the event name and properties before it is implemented.

## Inputs
- Business questions document listing the KPIs and funnel steps the company wants to measure (conversion rate, retention, feature adoption, funnel drop-off).
- Privacy legal requirements: GDPR, ePrivacy, CCPA, and any industry-specific regulations (HIPAA, COPPA) governing data collection and consent.
- Existing analytics setup audit: current providers being used, events being tracked (if any), and data quality issues.
- User identity system design: how users are authenticated, what identifiers are available (user ID, email, hashed email), and how anonymous → identified merging works.
- Experimentation roadmap: list of A/B tests planned for the next quarter, each with its experiment ID, variants, and success metrics.

## Outputs
- Event taxonomy document: a table with columns for Event Name, Category, Description, Required Properties, Optional Properties, PII Flag, and Business Question.
- Analytics abstraction module: `analytics.ts` (or `analytics/index.ts`) with typed `track`, `pageView`, `identify`, `reset` functions and a provider registration API.
- Provider adapters: one file per provider (Google Analytics 4, Mixpanel, PostHog, Amplitude) implementing the same interface.
- Consent management integration: a consent dialog component, a consent state store (persisted in localStorage), and provider initialization that checks consent before activating.
- Session management utility: session ID generation, activity extend, timeout detection, and session-end event firing.
- Event batching middleware: queue implementation, flush timer, and unload handler.
- Analytics debugger: a development-only overlay showing the real-time event stream.

## Rules
- Application code MUST NOT import from any analytics provider SDK directly. All tracking goes through the abstraction module. Direct SDK imports create vendor lock-in and make provider switches error-prone.
- PII (personally identifiable information) MUST NOT be sent to analytics providers unless explicitly approved by legal and marked as PII in the taxonomy. Email, name, and phone number must be hashed or excluded.
- Page view events MUST fire on every route change, including when the user navigates with the browser's back/forward buttons. The abstraction layer must listen to the router's `afterNavigate` or equivalent hook.
- Event names MUST follow the `{domain}.{action}` pattern with no spaces or special characters. Event names must be consistent across platforms (web, iOS, Android) for the same action.
- The analytics abstraction layer MUST support multiple providers simultaneously — events are sent to all registered providers. This enables gradual migration between providers.
- Consent state MUST be checked before initializing any non-essential provider. If a user revokes consent, the provider must be de-initialized and a "consent revoked" event (containing no PII) must be sent to the essential provider.
- Events that fail to send (network error, provider down) MUST be queued for retry (up to 3 retries with exponential backoff) and then dropped silently. They must never crash the application or block the UI.
- Every event MUST include a `timestamp` property (ISO 8601) and a `session_id` property so the data team can reconstruct session boundaries server-side if needed.

## Best Practices
- Type the `track` function with a discriminated union or overloaded types so that TypeScript enforces the correct properties for each event name. This catches property type errors at compile time.
- Flush the event queue on page unload using `sendBeacon()` (or the provider's equivalent) to guarantee events are delivered even if the page is closed immediately after the action.
- Use a data layer variable approach (like Google Tag Manager's `dataLayer`) for SSR applications: queue events during SSR and flush them when the client-side analytics initializes.
- Generate a `page_view_id` (UUID) for each page view and attach it to all events that occur during that page view. This allows the data team to join page view events with interaction events.
- Implement ad-blocker detection: if the analytics provider's SDK fails to load or a test request is blocked, degrade gracefully and log a warning. Do not show errors to the user.
- Set up a data quality dashboard that monitors event volume, missing properties, and unexpected property types. Alert when event volume drops by more than 20% (indicating a tracking bug).
- Create a "tracking playground" page in the development environment where engineers can fire arbitrary events with custom properties and see them appear in the debug log and the provider's debug view.
- Document the event taxonomy close to the code: a `tracking-events.ts` file that exports constants for every event name and a function that creates the event payload with proper typing.

## Anti-patterns
- Firing page view events manually in every component's `useEffect` or `onMount` instead of listening to the router's navigation events once. This causes duplicate page views and inconsistent tracking.
- Sending raw user email addresses or names as event properties. If personalization requires user identification, use a hashed or anonymized identifier.
- Calling provider SDK methods directly in components (`gtag('event', ...)` or `mixpanel.track(...)`). This couples the application to a specific provider and makes switching providers or adding a second provider extremely painful.
- Implementing tracking without a documented taxonomy. Engineers invent event names on the fly, resulting in `button_clicked`, `ButtonClick`, `btn_click`, and `click_on_button` all meaning the same thing.
- Blocking the main thread to send analytics events. Analytics must be fire-and-forget with no `await` on the send operation.
- Tracking every mouse movement, scroll pixel, and keystroke without a clear business question. Event volume is not free — it costs bandwidth, storage, and engineering time to analyze.
- Ignoring ad-blockers and assuming all events reach the provider. Build a fallback measurement strategy using first-party tracking or server-side events for critical conversion events.
- Failing to test analytics in staging. Analytics code paths are often excluded from testing, leading to broken tracking that is only discovered when the data team complains about missing data weeks later.

## Edge Cases
- The user is in airplane mode or has a poor connection. Events must be queued and retried. If the user performs 200 actions offline, the queue must batch them efficiently and not send 200 individual requests when connectivity returns.
- The user clears their browser data, losing the anonymous ID. A new anonymous ID is generated, and the user appears as a new visitor. The analytics system must handle this gracefully — it is not a bug.
- The user logs out of the application. The analytics session must reset: the identified user link is broken, and a new anonymous session begins. The `reset()` function must clear the user identity from all providers.
- The user is in incognito/private browsing mode. localStorage may not persist the anonymous ID across sessions. The anonymous ID is generated fresh each session, inflating unique visitor counts — this should be documented as a known limitation.
- The analytics provider's CDN is down. The provider SDK may fail to load. The application must not crash — the analytics abstraction must handle the SDK not being initialized and silently drop events.
- A single user action triggers multiple events (e.g., adding an item to cart fires `cart.item_added` and `cart.updated`). The `page_view_id` must be the same for all these events so the data team can correlate them.
- The user has a browser extension that blocks analytics requests. The `sendBeacon` call may be blocked. The application should not retry indefinitely — drop the events and log a counter to a first-party endpoint to track analytics blocking rates.

## Validation Checklist
- [ ] All event names in the source code match the taxonomy document — verified by a CI script that extracts event names from the code and compares them against the taxonomy.
- [ ] Every `track()` call has the correct required properties and no extra properties beyond what the taxonomy defines — verified by TypeScript types (compilation check).
- [ ] Page view events fire on every route change including back/forward navigation — verified by navigating the app in a test environment and checking the provider's debug view.
- [ ] Anonymous events are correctly associated with the identified user after login — verified by: (1) track an event while logged out, (2) log in, (3) confirm the provider shows a single user profile with both the anonymous and identified events.
- [ ] Session boundaries are correct: a session starts on app load, extends on activity, and a new session starts after 30 minutes of inactivity — verified by automated session test.
- [ ] Consent flow works: non-essential providers do not initialize before consent; events are not sent to non-essential providers before consent; event queue is empty after consent is given — verified by end-to-end consent test.
- [ ] Event batching works: events are grouped and sent in batches, not individually — verified by inspecting the network tab.
- [ ] Provider abstraction works: swapping the active provider (e.g., from GA4 to PostHog) requires no changes to application code — verified by switching the provider configuration and running the tracking test suite.
- [ ] PII is not present in any event payload sent to analytics providers — verified by a proxy or webhook that intercepts events and scans for PII patterns (email, phone, name).
- [ ] Events are not lost on page unload — verified by checking the analytics provider's data for the last event fired before navigating away.

## Engineering Examples

### Example 1: Complete event taxonomy for an e-commerce platform
A mid-market e-commerce platform with a 5% conversion rate wanted to understand where drop-offs occurred in the purchase funnel. The data team created a taxonomy with 40 events across 6 domains: `session` (session_start, session_end), `product` (product_view, product_image_click, product_variant_switch), `cart` (cart_item_added, cart_item_removed, cart_viewed, cart_abandoned), `checkout` (checkout_started, checkout_shipping_entered, checkout_payment_submitted, checkout_completed), `account` (signup_started, signup_completed, login, logout), and `engagement` (scroll_25, scroll_50, scroll_75, scroll_100, video_play, video_complete). Each event had a required property `session_id` and `page_view_id`. The `checkout.payment_submitted` event included `payment_method` (card, PayPal, Apple Pay), `total_amount`, `currency`, `coupon_code`, and `is_first_purchase`. The taxonomy was stored as a YAML file in the repository and a CI job validated that the application code only used events from this taxonomy. The analytics abstraction typed the `track` function with the event name as the first discriminated union argument, so TypeScript enforced correct properties per event. After implementing the taxonomy, the team built a funnel analysis dashboard that showed the exact step where users dropped off, leading to a targeted redesign of the shipping step that increased conversion by 12%.

### Example 2: GDPR-compliant analytics with consent management
A European SaaS company serving EU customers needed to comply with GDPR and ePrivacy directive for analytics tracking. The team implemented a consent management flow using a custom consent dialog that presented three tiers: strictly necessary (page views, session data, performance monitoring), functional (user preferences, feature usage), and marketing (personalization, retargeting). The consent state was stored in localStorage and sent to the server to be persisted in the user profile. The analytics abstraction checked the consent state before initializing each provider: PostHog was initialized only after "functional" consent and Google Ads only after "marketing" consent. When the user revoked consent, the provider was de-initialized by calling its `reset()` or `opt_out()` method and clearing any persisted cookies. A first-party endpoint (`/api/analytics/consent`) logged consent changes with a timestamp for audit purposes. Essential analytics (page views, session data) were sent to a self-hosted Plausible instance that did not use cookies and was configured as the essential provider. The team also implemented a "Do Not Sell My Personal Information" link for CCPA compliance, which set a global opt-out cookie checked by all providers.

### Example 3: Analytics abstraction layer for multi-provider support
A growth-stage startup used Mixpanel for product analytics but was considering migrating to PostHog for cost reasons. Rather than replacing Mixpanel calls one-by-one, the engineering team built an analytics abstraction layer in `src/lib/analytics/index.ts`. The module exported four functions: `track(event, properties)`, `pageView(properties)`, `identify(userId, traits)`, and `reset()`. Each function iterated over a list of registered providers and called the corresponding method on each provider's adapter. Provider adapters were separate files implementing an `AnalyticsProvider` interface with methods `init(config)`, `track(event, props)`, `pageView(props)`, `identify(id, traits)`, `reset()`, and `shutdown()`. The configuration was a simple array in the environment config: `providers: ['mixpanel', 'posthog']`. When the migration was ready, the team removed 'mixpanel' from the array, kept both running for a month to compare data, then removed the Mixpanel adapter entirely. The application code never changed. The abstraction also handled initialization timing: it waited for the DOM to be ready, checked consent, then called `init()` on each approved provider.
