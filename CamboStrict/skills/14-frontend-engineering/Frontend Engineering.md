# Frontend Engineering

## Purpose

To provide a principled approach for building resilient, performant, and accessible frontend applications. This skill covers the entire client-side engineering lifecycle: component architecture, data fetching patterns, routing, form management, error handling, loading states, optimistic updates, responsive design, accessibility compliance, and bundle optimization. The goal is to produce frontend code that anticipates failure, loads fast, works for every user, and remains maintainable as the application grows.

## Responsibilities

- Design a component architecture that enforces unidirectional data flow, clear parent-child boundaries, and separation of presentational and container components.
- Implement data fetching patterns that handle every state: loading, success, empty, error, and stale-while-revalidate.
- Own client-side routing: route definition, lazy-loaded route components, navigation guards (authentication required, unsaved changes), and scroll restoration.
- Manage form state and validation with controlled inputs, cross-field validation rules, asynchronous validation, and submission state tracking (submitting, succeeded, failed).
- Build error boundaries that catch rendering errors gracefully, log the error context, and provide recovery actions (retry, go back, reload).
- Implement loading skeletons and progress indicators that match the content layout to reduce cumulative layout shift (CLS).
- Apply optimistic updates to improve perceived performance, with rollback logic on server rejection.
- Ensure responsive layouts that work on all viewport sizes: mobile-first, breakpoint-aware, and touch-friendly.
- Comply with WCAG 2.2 AA standards: keyboard navigation, screen reader announcements, focus management, color contrast, and reduced motion support.
- Optimize the production bundle: code splitting, tree shaking, image optimization, font subsetting, and critical CSS extraction.

## Decision Process

1. **Determine the rendering strategy.** Is the page mostly static content (use SSR/SSG) or highly interactive (use client-side rendering with hydration)? For dashboards and admin panels, prefer client-side rendering. For content-heavy pages, prefer SSR or SSG for faster time-to-interactive.
2. **Choose the component decomposition.** Identify repeated UI patterns. Extract them into reusable components with well-defined props. If a component manages state or side effects, keep it as a container. If it only renders based on props, make it a presentational component.
3. **Decide where data fetching lives.** For page-level data, fetch in route loaders or page components. For reusable data (e.g., current user, notifications), use a global data cache (React Query, SWR, Apollo) with stale-while-revalidate. Avoid fetching data in deeply nested child components unless it is scoped to that subtree.
4. **Select the form management approach.** For simple forms (3-5 fields with basic validation), use local state. For complex forms with cross-field validation, dynamic fields, and async validation, use a form library (React Hook Form, Formik, Final Form).
5. **Design the error handling strategy.** Define error boundaries for each major section of the app. Decide which errors are recoverable (retry button) and which are fatal (redirect to error page). Log all caught errors to an observability service.
6. **Plan for loading states.** For every data fetch, design a skeleton that mirrors the content layout. For mutations, decide between a blocking spinner (simpler) and optimistic update (better UX but requires rollback logic).
7. **Apply responsive breakpoints.** Define breakpoints (mobile < 640px, tablet 640-1024px, desktop > 1024px). Design mobile-first: start with the narrowest layout, then add `@media (min-width: ...)` overrides. Test on real devices, not just DevTools emulation.
8. **Audit accessibility at each milestone.** Run axe-core or Lighthouse for automated checks. Manually test keyboard navigation. Verify screen reader announcements for dynamic content updates (aria-live regions).
9. **Analyze the bundle.** Use a bundler analyzer (webpack-bundle-analyzer, vite-bundle-visualizer) to identify large dependencies. Split code by routes. Lazy-load heavy components (charts, rich text editors, image viewers).
10. **Measure Core Web Vitals in CI.** Use Lighthouse CI or Playwright to collect LCP, FID/INP, and CLS scores on every PR. Set a performance budget and fail the build if exceeded.

## Inputs

- UI design mockups (Figma, Sketch) converted to component trees.
- API response schemas defining the shape of data for each page and mutation.
- Route definitions from the product specification (URL paths, query parameters, navigation guards).
- Accessibility requirements (WCAG level, target audience, supported assistive technologies).
- Performance budgets (max bundle size, LCP target, CLS target).
- Browser support matrix (evergreen browsers, IE11 if required, mobile browsers).
- Design system tokens (colors, typography, spacing, breakpoints, animation durations).

## Outputs

- Component files structured by feature or domain, with associated styles, tests, and stories.
- Data fetching hooks or service modules that expose `{ data, error, isLoading, isValidating }` for every API resource.
- Route configuration files with lazy-loaded component references and navigation guards.
- Form components with validated, accessible inputs and submission state management.
- Error boundary components at each route or major section boundary.
- Loading skeletons that match content dimensions to reduce CLS.
- Responsive stylesheets using CSS custom properties, media queries, and container queries.
- Accessibility audit reports with pass/fail per WCAG criterion.

## Rules

1. **Do not fetch data in reducers or global stores.** Server state belongs in a dedicated cache layer (React Query, SWR, RTK Query), not in a global state store. Global stores are for client-only state (UI state, theme preferences, form drafts).
2. **Every component must handle the loading state.** If a component depends on async data, it must render something meaningful while loading (skeleton, spinner, or placeholder). The loading state must not cause layout shift.
3. **Every component must handle the error state.** If data fetching fails, the component must show an error message with a retry action. Do not silently hide errors or show a blank page.
4. **Do not mutate props or state directly.** Use immutable update patterns. In React, use `setState` with a callback or a state management library that enforces immutability (Immer, Redux Toolkit).
5. **All form inputs must be controlled or have a ref-based validation mechanism.** Uncontrolled inputs without validation are unacceptable for production forms.
6. **Accessibility is not optional.** Every interactive element must be keyboard accessible. Every image must have alt text. Every form input must have a label. Color must not be the sole means of conveying information.
7. **Lazy-load below-the-fold content.** Images, iframes, and heavy components below the initial viewport must use `loading="lazy"` or dynamic imports. The initial render must contain only critical content.
8. **Responsive design must be tested on real devices.** Device emulation in DevTools is insufficient. Test on an actual phone and tablet for touch interactions, viewport size, and network conditions.
9. **Do not rely solely on client-side rendering for SEO-critical pages.** For pages that need search engine indexing, use SSR, SSG, or prerendering. At minimum, ensure the server-rendered HTML contains the core content.
10. **Use semantic HTML elements.** Render `<nav>` for navigation, `<main>` for primary content, `<button>` for actions (not `<div>` with an onClick), and heading elements (`<h1>`–`<h6>`) in a logical hierarchy.

## Best Practices

1. **Co-locate styles, tests, and stories with components.** Keep a component's stylesheet, unit test, and Storybook story in the same directory as the component file. This makes it easy to find all related files and delete them together.
2. **Use a CSS-in-JS or utility-first approach consistently.** If using Tailwind CSS, enforce consistent spacing, colors, and typography from the design system config. If using CSS Modules or styled-components, extract shared styles into a theme object.
3. **Normalize data before storing in cache.** Flatten nested API responses into normalized entities (e.g., `{ users: { byId: {}, allIds: [] } }`). This prevents duplicate data and makes updates easier (update one entity and all references update).
4. **Use TypeScript strictly.** Define interfaces for every prop type, every API response, and every state slice. Use `strict: true` in tsconfig. Avoid `any`. Prefer `z.infer<typeof schema>` for types derived from validation schemas.
5. **Write integration tests for critical user flows.** Test the happy path: user logs in, sees dashboard, clicks item, sees detail page. Also test error states: network failure, validation error, empty state. Use Testing Library and Playwright or Cypress.
6. **Implement code splitting at the route level.** Each route should dynamically import its page component. Avoid loading all pages in a single bundle. Use `React.lazy()` or Next.js dynamic imports.
7. **Use a service layer for API calls.** Do not scatter `fetch()` or `axios` calls across components. Create API modules (`api/users.ts`, `api/orders.ts`) that export typed functions. This centralizes base URL, headers, error handling, and authentication token injection.
8. **Throttle or debounce expensive operations.** Input change handlers that trigger API calls (search-as-you-type) must be debounced (300ms). Resize handlers (window resize, scroll) must be throttled.
9. **Use `requestAnimationFrame` for animations.** Avoid animating with `setInterval` or `setTimeout`. Use CSS transitions/animations where possible, and `requestAnimationFrame` for JavaScript-driven animations.
10. **Maintain a CHANGELOG for visual changes.** Every UI change should be documented with before/after screenshots attached to the PR. This helps catch visual regressions before they reach production.

## Anti-patterns

1. **Global state for everything.** Putting every piece of data (server state, UI state, form state, route state) into a single Redux store. This creates unnecessary re-renders, complex reducers, and high cognitive overhead. Fix: use the right tool for each type of state (React Query for server, Zustand/context for UI, form libraries for forms).
2. **Giant page components.** A single component that fetches data, manages form state, handles routing logic, and renders the entire page. Unmaintainable and untestable. Fix: split into smaller components with single responsibilities. Use container/presentational separation.
3. **Loading spinners for everything.** Showing a spinning indicator for every data fetch without skeletons. This causes layout shift when the content finally loads and provides no sense of the content structure. Fix: use skeleton screens that match the content layout.
4. **Ignoring the empty state.** When a list has no items, showing a blank page or an empty container. Users don't know if data is loading, empty, or errored. Fix: design explicit empty states with a helpful message and a call to action (e.g., "No orders yet. Create your first order.").
5. **Optimistic updates without rollback.** Applying optimistic UI changes and never reverting them if the server rejects the mutation. Users see data that does not exist. Fix: always handle the error callback. Revert to the previous state and show a notification explaining the failure.
6. **Inline styles.** Using `style={{ ... }}` for everything instead of CSS classes. This prevents caching, makes overrides difficult, and does not support media queries or pseudo-classes. Fix: use CSS classes (CSS Modules, Tailwind, styled-components).
7. **No error boundaries.** A JavaScript error in a single component causes the entire React tree to unmount, showing a white screen. Fix: wrap each route or major section in an error boundary that catches rendering errors, logs them, and shows a fallback UI.
8. **Accessibility as an afterthought.** Building the entire UI and then running an accessibility audit. It is significantly harder to retrofit accessibility than to build it in from the start. Fix: include accessibility checks in the definition of done for every component.
9. **Over-optimizing prematurely.** Adding memoization (`useMemo`, `useCallback`, `React.memo`) to every component before measuring performance. This adds complexity and can hurt performance if the dependency arrays are incorrect. Fix: profile first, then memoize only identified bottlenecks.
10. **Direct DOM manipulation alongside React.** Using jQuery or `document.getElementById` to manipulate DOM elements inside a React component. This causes reconciliation conflicts and unpredictable behavior. Fix: use React refs and state for all DOM interactions.

## Edge Cases

1. **Rapid form submission.** A user clicks the submit button multiple times before the first request completes. The server receives duplicate mutations. Fix: disable the submit button immediately after the first click. Show a submitting indicator. If using optimistic updates, ensure idempotency keys are sent.
2. **Network failure mid-mutation.** The user fills a long form and submits, but the network drops. The mutation fails. The form should preserve the entered data and show a clear error with a retry button. Never clear the form on error.
3. **Stale data after navigatio.** The user navigates back to a previously visited page, which shows cached data that is now stale. Fix: use a stale-while-revalidate strategy. Show the cached data immediately, then refetch in the background. Notify the user of new data with a subtle indicator.
4. **Concurrent mutations on the same resource.** The user opens two tabs and edits the same entity in both. The second save overwrites the first without merging. Fix: use optimistic concurrency control—send the resource version or last-modified timestamp with the mutation. The server rejects the mutation if the version does not match.
5. **Accessibility of dynamic content updates.** A toast notification appears, but screen readers do not announce it. A list is filtered by search input, but the results change without announcement. Fix: use `aria-live="polite"` regions for dynamic updates. Announce the number of results after filtering.
6. **Window resize during data fetch.** The user rotates their phone or resizes the browser window while a data fetch is in progress. The fetch completes with data formatted for the previous viewport. Fix: make components responsive by design (CSS handles layout, not JavaScript). Avoid hard-coding pixel values based on window size.
7. **Keyboard trap in modals.** A user tabs through a modal, and the focus moves to elements behind the modal instead of wrapping within the modal. Fix: implement focus trapping: when the modal opens, move focus to the first interactive element. Keep focus within the modal until it closes. Return focus to the triggering element on close.
8. **Race conditions in search-as-you-type.** The user types "apple" quickly. Requests fire for "a", "ap", "app", "appl", "apple". Each response may arrive out of order. The final displayed results might be from an earlier request. Fix: use a unique request identifier or an abort controller. Cancel the previous in-flight request when a new one fires. Discard responses that do not match the latest query.

## Validation Checklist

- [ ] Every component handles loading, empty, error, and success states for its data dependencies.
- [ ] Error boundaries wrap each route or major section and provide a recovery action.
- [ ] All form inputs are controlled, validated on blur and submit, and disable the submit button while submitting.
- [ ] Optimistic updates have rollback logic on server error.
- [ ] No data fetching occurs inside reducers or global stores; server state uses a dedicated cache layer.
- [ ] All interactive elements are keyboard accessible and have visible focus indicators.
- [ ] Dynamic content updates are announced by screen readers via `aria-live` regions.
- [ ] The production bundle is analyzed for large dependencies; route-level code splitting is implemented.
- [ ] Images below the fold use `loading="lazy"`. Above-the-fold images are optimized and have explicit dimensions.
- [ ] The layout is tested on real mobile and tablet devices (not just DevTools emulation).
- [ ] All images have descriptive alt text. All form inputs have associated labels.
- [ ] Color is not the sole means of conveying information (supplement with icons, text, or patterns).
- [ ] No jQuery or direct DOM manipulation alongside the framework.
- [ ] Form submissions are idempotent (disabled button, idempotency key).
- [ ] Search inputs use debouncing and cancel previous in-flight requests.
- [ ] Focus is managed properly on modal open/close and route navigation.

## Engineering Examples

### Example 1: Building a Resilient Data Fetching Layer (React)

A team builds a dashboard that displays user analytics data from three different API endpoints. The naive approach fetches data in each component with `useEffect`. After refactoring:

- An API service layer (`api/analytics.ts`) exports typed functions: `getPageViews(dateRange)`, `getUserSessions(dateRange)`, `getConversionRates(dateRange)`. Each function uses a shared `apiClient` instance that attaches auth headers, handles 401 responses (redirect to login), and parses JSON.
- Data fetching uses `@tanstack/react-query`. Each component calls `useQuery` with a query key that includes the `dateRange`. When the user changes the date range filter, React Query automatically refetches all dependent queries with the new key.
- Every `useQuery` call destructures `{ data, isLoading, isError, error, refetch }`. The component renders a skeleton while loading, an error message with a "Retry" button on failure, and the actual data on success. The skeleton matches the layout: a table skeleton with rows for the analytics table, a bar chart skeleton for the chart widget.
- Stale-while-revalidate: `staleTime: 30_000` (consider data fresh for 30 seconds) and `gcTime: 5 * 60 * 1000` (keep in cache for 5 minutes). When the user navigates away and back within 5 minutes, the cached data is shown instantly, and a background refetch updates it.
- Mutations (e.g., changing a campaign budget) use `useMutation`. The mutation is optimistic: the UI updates immediately with the new budget. If the server responds with an error, the UI reverts to the previous value and a toast shows the error. The mutation also invalidates the related query to ensure consistency.

The result: the dashboard feels instant, handles network failures gracefully, and never shows a blank or broken state.

### Example 2: Handling Form State with Validation (React Hook Form + Zod)

A multi-step registration form collects user personal info, address, payment details, and account preferences. Requirements: cross-field validation (password confirmation), async validation (email uniqueness), conditional fields (different billing based on country), and state persistence across steps.

Implementation:

- Each step is a separate component. The parent `RegistrationWizard` manages the active step index and passes `control`, `register`, `setValue`, `formState` from React Hook Form.
- A single Zod schema covers the entire form: `z.object({ personalInfo: ..., address: ..., payment: ..., preferences: ... })`. Each step validates its own fields with `trigger()` before allowing navigation to the next step.
- Cross-field validation: `password` and `confirmPassword` use a Zod refinement (`z.string().refine(...)`) that compares the two fields. The error message is displayed under `confirmPassword`.
- Async validation: The `email` field has a `validate` function that debounces (300ms) and calls an API endpoint to check uniqueness. During validation, a loading spinner appears next the input. If the email is taken, the error is displayed inline.
- Conditional fields: When the user selects "United States" as the country, a "State" dropdown appears. React Hook Form's `watch("country")` triggers `setValue` to add/remove the state field, and the Zod schema is extended conditionally using `z.discriminatedUnion`.
- Form state persistence: The form state is saved to `sessionStorage` on every `onChange` event (debounced 1s). If the user refreshes the page, the form is restored from sessionStorage. After successful submission, sessionStorage is cleared.

The result: a robust multi-step form that recovers from page refresh, provides instant validation feedback, and handles complex conditional logic without excessive re-renders.

### Example 3: Implementing Accessible Navigation (React + Next.js)

A marketing site has a primary navigation with dropdown menus, a mobile hamburger menu, a search bar, and a language switcher. The team needs to make it fully accessible.

Implementation:

- **Semantic HTML**: The navigation is wrapped in `<nav aria-label="Primary">`. Dropdown menus are `<ul>` elements. Each menu item is an `<a>` (or `<button>` if no navigation).
- **Keyboard navigation**: The hamburger button toggles `aria-expanded` and `aria-controls`. When the menu opens, focus moves to the first menu item. Arrow keys navigate between items. Escape closes the menu and returns focus to the hamburger button. `Tab` cycles through focusable elements, but focus is trapped within the mobile menu while open.
- **Dropdown menus**: On desktop, dropdowns open on hover (CSS only) and on focus (`:focus-within`). On keyboard, Tab into the parent item opens the dropdown. Arrow keys navigate sub-items. Escape closes the dropdown.
- **Search bar**: The search input has `<label>` (visually hidden but accessible) and `aria-label="Search"`. The search results list has `role="listbox"` with `aria-activedescendant` pointing to the highlighted result. Arrow keys navigate results, Enter selects, Escape closes.
- **Skip link**: The very first focusable element on the page is a "Skip to content" link that moves focus to `<main id="main-content">`. This is visually hidden until focused.
- **Focus indicators**: All interactive elements have a visible `:focus-visible` ring (2px solid with offset). The custom focus ring does not rely on `outline: none` alone; it uses `box-shadow` or `outline` with a visible color that meets 3:1 contrast ratio against the background.
- **Screen reader announcements**: When the mobile menu opens, `aria-live="polite"` announces "Navigation menu opened". When search results update, "X results found" is announced.
- **Reduced motion**: If `prefers-reduced-motion: reduce` is set, all CSS transitions and animations are disabled (`transition: none`, `animation: none`). The hamburger menu opens instantly without slide animation.

The result: the navigation is fully usable by keyboard-only users, screen reader users, and users with motion sensitivity. It passes WCAG 2.2 AA audits with zero violations.
