# Performance Engineering

## Purpose

To provide a systematic methodology for measuring, analyzing, and optimizing the performance of web applications and backend services. This skill covers performance budgets, profiling, bottleneck identification, lazy loading, code splitting, caching strategies, CDN usage, database query optimization, N+1 problem resolution, connection pooling, asset optimization, and Core Web Vitals. The goal is to establish performance as a measurable, testable, and continuously monitored attribute of the system—not an afterthought addressed during a crisis.

## Responsibilities

- Define and enforce performance budgets for key metrics: bundle size, LCP, FID/INP, CLS, API response times, and database query latency.
- Profile both frontend (browser DevTools, Lighthouse, WebPageTest) and backend (APM tools, flame graphs, CPU profiling) to identify bottlenecks.
- Identify and resolve performance bottlenecks through targeted optimization: reducing JavaScript execution time, optimizing critical rendering path, tuning database queries, and eliminating unnecessary network requests.
- Implement lazy loading and code splitting to reduce initial bundle size and defer non-critical resources (components, routes, images, fonts).
- Design caching strategies at every layer: browser cache (Cache-Control headers), CDN cache, application cache (Redis, in-memory), and database cache (query cache, materialized views).
- Configure CDN usage for static assets, edge caching of API responses, and geographic distribution of content.
- Analyze and optimize database queries: add missing indexes, rewrite N+1 queries, use query analysis tools (EXPLAIN ANALYZE), and implement query result caching.
- Detect and fix the N+1 query problem in ORMs: use eager loading, batch loading, or data loaders to reduce database round-trips.
- Manage database connection pools: set optimal pool sizes, monitor for connection leaks, and handle connection storms.
- Optimize frontend assets: image compression, responsive images, font subsetting, CSS minification, JavaScript tree-shaking, and critical CSS inlining.
- Monitor and improve Core Web Vitals (LCP, FID/INP, CLS, TTFB) for every page. Set up CI checks that fail on regressions.

## Decision Process

1. **Establish baselines.** Measure current performance for every critical user journey: homepage load, search results, checkout flow, API endpoint. Collect LCP, CLS, INP, TTFB, bundle size, API latency (p50, p95, p99), and database query latency.
2. **Set performance budgets.** Define maximum acceptable values: bundle < 300KB gzipped, LCP < 2.5s, CLS < 0.1, INP < 200ms, API p95 < 500ms, DB query p95 < 100ms. Document these budgets and enforce them in CI.
3. **Identify the bottleneck.** Use the 80/20 rule: find the single largest contributor to the metric you need to improve. For LCP, it is usually the largest image or hero element. For INP, it is usually a long JavaScript task. For database queries, it is usually a missing index or an N+1 pattern.
4. **Choose the optimization target by impact.** Prioritize optimizations by expected impact and effort. Removing a blocking render resource may improve LCP by 1 second (high impact, medium effort). Micro-optimizing a hot loop in JavaScript may improve INP by 10ms (low impact, high effort).
5. **Select the caching strategy by data type.** For static assets (images, fonts, CSS, JS): aggressive caching with content hash in URL (immutable, 1 year). For API responses: short TTL (60s) with stale-while-revalidate. For database queries: cache results with a TTL based on data volatility.
6. **Decide between lazy loading and eager loading.** Lazy load anything that is not visible in the initial viewport: images below the fold, off-screen components, heavy third-party widgets. Eager load critical resources: hero image, above-the-fold CSS, main JavaScript bundle.
7. **Choose the data fetching strategy.** For initial page load, prefer server-side data fetching (SSR) to avoid client-side waterfalls. For subsequent navigations, prefetch data that is likely to be needed (predictive prefetching based on hover intent or link visibility).
8. **Analyze database query plans.** For any slow query, run `EXPLAIN ANALYZE` (PostgreSQL) or equivalent. Look for sequential scans on large tables, missing indexes, or unexpected nested loops. Add composite indexes that match the query's WHERE, ORDER BY, and JOIN clauses.
9. **Determine optimal connection pool size.** Formula: `pool_size = (max_connections - superuser_reserved) * (1 - connection_overhead_margin)`. For PostgreSQL, start with `pool_size = 20` per instance and monitor for connection wait events. Use PgBouncer or similar for connection pooling at scale.
10. **Monitor in production, not just staging.** Performance characteristics differ between staging and production (data volume, traffic patterns, hardware). Use RUM (Real User Monitoring) for frontend metrics and APM for backend. Set up alerts for metric regressions.

## Inputs

- Lighthouse/WebPageTest reports for each critical page.
- APM traces (Datadog, New Relic, OpenTelemetry) showing service and query latencies.
- Database query logs with durations and EXPLAIN plans.
- Bundle analysis reports (webpack-bundle-analyzer, Vite bundle visualizer).
- Core Web Vitals data from CrUX (Chrome User Experience Report) or RUM.
- Performance budgets from product or engineering leadership (if defined).
- Server resource utilization metrics (CPU, memory, disk I/O, network).

## Outputs

- Performance budget configuration files (Lighthouse CI, Bundlesize, or custom scripts).
- Optimized assets: compressed images (WebP/AVIF), subset fonts, minified and tree-shaken JavaScript bundles, critical CSS inlined in `<head>`.
- Database migrations that add indexes, rewrite queries, or introduce materialized views.
- Caching layer configuration: Redis cache key schemas, TTLs, and invalidation strategies.
- CDN configuration: origin pull rules, cache behaviors, geographic routing.
- Lazy loading implementations: dynamic imports, `loading="lazy"` on images, intersection observer for components.
- Monitored dashboards with percentile charts (p50/p95/p99) for all key metrics, with alert thresholds.
- CI pipeline steps that fail when performance budgets are exceeded.

## Rules

1. **Every image must have explicit width and height attributes** (or `aspect-ratio` CSS) to prevent Cumulative Layout Shift. The attribute values should match the intrinsic dimensions of the image or the intended display size.
2. **All JavaScript bundles must be code-split at the route level.** No route should load the entire application bundle. Use dynamic imports for route components, heavy libraries, and infrequently used features (e.g., rich text editor, charting library).
3. **Do not block the critical rendering path with render-blocking resources.** Inline critical CSS in `<head>`. Defer non-critical CSS. Use `<link rel="preload">` for above-the-fold resources. Use `<script async>` or `<script defer>` for non-critical JavaScript.
4. **Database queries must be analyzed with EXPLAIN before and after optimization.** Never deploy a query change without running EXPLAIN to verify the query plan uses the expected indexes.
5. **All API responses must include caching headers.** At minimum: `Cache-Control: no-cache` for dynamic responses and `Cache-Control: public, immutable, max-age=31536000` for versioned static assets.
6. **N+1 queries must be eliminated.** Use eager loading (`JOIN`, `INCLUDES`), batch loading (DataLoader), or query batching. If an ORM generates N+1 queries, rewrite the query using the ORM's eager loading API or switch to raw SQL for the hot path.
7. **Font files must be subsetted and served with `font-display: swap`.** Subset fonts to include only the characters used on the page (latin, common punctuation). `font-display: swap` prevents invisible text during font load (FOUT is preferred over FOIT).
8. **Connection pools must be sized appropriately and monitored for leaks.** Set a maximum pool size. Instrument the pool to track active, idle, and waiting connections. Set up alerts when connections exceed 80% of the pool capacity.
9. **Use HTTP/2 or HTTP/3 for all connections.** HTTP/2 multiplexing reduces head-of-line blocking. Ensure your CDN and server support HTTP/2. Upgrade to HTTP/3 for further latency reduction on mobile networks.
10. **Third-party scripts must be loaded with `async` or `defer` and evaluated for performance impact.** Measure the impact of each third-party script (analytics, chat widgets, ads) on LCP and INP. If a script degrades performance by more than 10%, consider self-hosting, deferring, or removing it.

## Best Practices

1. **Set performance budgets in CI and fail the build on regression.** Use Lighthouse CI, bundlesize, or a custom tool to compare metrics against the budget. The PR should show a performance diff comment. If LCP increases by more than 100ms or bundle size by more than 10KB, the build fails.
2. **Use WebP or AVIF for all images with a PNG/JPEG fallback.** AVIF provides 50% smaller file sizes than JPEG at equivalent quality. Use `<picture>` element with `<source>` tags for modern formats and a fallback `<img>`. Encode at quality 80-85 for a balance of size and quality.
3. **Preconnect to critical origins.** Use `<link rel="preconnect" href="https://api.example.com">` for origins that the page will connect to early (CDN, API server, font host). This eliminates DNS resolution and TCP/TLS negotiation time from the critical path.
4. **Use a service worker for offline support and cache-first strategies.** For static assets, use a cache-first strategy (serve from cache, update in background). For API responses, use a network-first strategy with a fallback to cache when offline.
5. **Implement virtualization for long lists.** When rendering more than 100 items, use a virtualized list (react-window, TanStack Virtual) that only renders visible items. This reduces DOM size, memory usage, and layout time.
6. **Use a CDN with edge caching for static assets and API responses.** Configure cache-control headers to maximize cache hit ratio on the CDN. Use origin shield to reduce load on the origin server. Use geographic routing to serve content from the nearest edge node.
7. **Optimize the critical rendering path.** Ensure the initial HTML response is under 14KB (the first TCP slow-start window). Inline critical CSS. Defer JavaScript by splitting it into async chunks. Preload hero images and fonts.
8. **Use `requestIdleCallback` for non-urgent work.** Analytics logging, prefetching, and data syncing can be deferred to browser idle time. This prevents these tasks from competing with user interactions.
9. **Implement stale-while-revalidate for API responses.** Return cached data immediately (within milliseconds) while refreshing the cache in the background. This provides instant perceived load times while keeping data reasonably fresh.
10. **Profile in production, not just development.** Use the Performance API (`performance.mark()`, `performance.measure()`) to instrument custom metrics. Send them to RUM providers (Datadog RUM, New Relic Browser). Development DevTools profiles do not reflect real user conditions (CPU throttling, network latency, cache states).

## Anti-patterns

1. **Optimizing without measuring.** Spending a week micro-optimizing a function that accounts for 1% of total load time while ignoring a 2MB hero image that is the primary LCP contributor. Fix: always measure first. Use the Performance panel and Lighthouse to identify the actual bottleneck.
2. **Premature code splitting.** Splitting every component into its own chunk, resulting in hundreds of tiny HTTP requests (waterfall). HTTP/2 multiplexing helps, but too many chunks still incur parse/execute overhead. Fix: split at meaningful boundaries (routes, feature modules, heavy libraries). Use a bundle analyzer to validate the chunk distribution.
3. **Over-caching without invalidation.** Setting `max-age=31536000` on an API response and never invalidating it. Users see stale data for up to a year. Fix: use `stale-while-revalidate` or set a realistic `max-age` with a cache-busting mechanism (versioned URLs, ETags, or explicit invalidation via webhooks).
4. **Adding indexes without analyzing query patterns.** Adding an index on every column because "indexes speed up queries." This bloats the database and slows down writes. Fix: analyze the slowest queries first. Add only the indexes that EXPLAIN shows will be used.
5. **Using the default database connection pool size.** HikariCP default is 10 connections, but the application has 40 concurrent requests, causing queuing. Or setting `max_connections=500` on a small database server, leading to resource exhaustion. Fix: calculate pool size based on CPU cores, database capacity, and expected concurrency.
6. **Ignoring the performance budget on third-party scripts.** A marketing team adds a live chat widget that loads an additional 500KB of JavaScript and makes 10 requests. This increases LCP by 2 seconds, but no one notices because it is not caught in CI. Fix: include third-party scripts in the performance budget. Monitor their impact with RUM.
7. **Blocking the main thread with synchronous operations.** Using `JSON.parse` on a 10MB string on the main thread, or performing a `for` loop over 100,000 items to process data. This blocks all user interactions. Fix: use Web Workers for CPU-intensive tasks. Use streaming parsers for large payloads.
8. **Loading everything on initial page load.** A single-page application that loads all routes, all components, and all data on the initial page load. The bundle is 2MB and the initial API call fetches data for every section of the app. Fix: lazy-load routes, code-split components, fetch data on-demand by section.
9. **Not optimizing database queries after schema changes.** A new column is added to a table, and an existing query `SELECT *` now fetches 10x more data, slowing down the response. Fix: avoid `SELECT *`. Always specify the exact columns needed. Run EXPLAIN after schema migrations.
10. **Using client-side rendering when SSR is needed.** A content-heavy page renders entirely on the client after JavaScript loads. The user sees a blank page for 3 seconds (poor FCP and LCP). Fix: use SSR or static generation for content pages. Hydrate interactivity on top of server-rendered HTML.

## Edge Cases

1. **Slow connections (2G/3G).** Users on slow networks may wait 10+ seconds for a page to load. The app should show a meaningful loading state immediately (a skeleton, not a blank page) and progressively enhance. Use `Network Information API` (`navigator.connection.effectiveType`) to conditionally disable data-heavy features.
2. **Cache stampede.** When a cached value expires and hundreds of concurrent requests all try to regenerate it simultaneously, overwhelming the origin server. Fix: use "probabilistic early expiration" or a mutex/lock around cache regeneration so only one request regenerates the cache.
3. **Low-end devices.** A mobile phone with 2GB RAM and a slow CPU struggles with a 5MB JavaScript bundle. The app takes 30 seconds to become interactive. Fix: use a performance budget tailored to low-end devices (bundle < 200KB, fewer animations, reduced DOM complexity). Use device memory API (`navigator.deviceMemory`) to serve a lightweight experience.
4. **Third-party script failures.** An analytics script fails to load and blocks the page for 5 seconds before timing out. Fix: use `<script async>` so the script does not block rendering. Set a timeout for third-party scripts using an AbortController or `<script>` with `integrity` and `crossorigin` but no blocking.
5. **Database connection storms after a deployment.** All application instances restart simultaneously and open new database connections, exceeding the pool limit. Existing queries fail with "too many connections." Fix: implement graceful connection warmup. Start instances one at a time with a delay. Use PgBouncer to pool connections at a higher level.
6. **Large datasets in the browser.** An API returns 50,000 rows and the frontend tries to render them all in a `<table>`. The browser freezes for 10 seconds. Fix: implement server-side pagination or virtual scrolling. Limit the dataset size at the API level. Reject requests that exceed a configurable limit.
7. **Memory leaks from event listeners.** A single-page application that navigates between routes without properly cleaning up event listeners, timers, or subscriptions. Over time, memory usage grows and the page becomes sluggish. Fix: use a framework that auto-clears effects (React's `useEffect` cleanup). Monitor heap snapshots in Chrome DevTools.
8. **Unthrottled resize/scroll handlers.** A scroll handler that recalculates layout on every scroll event (60fps). This causes jank and drains battery. Fix: throttle or debounce event handlers. Use `IntersectionObserver` for visibility-based actions instead of scroll handlers. Use `ResizeObserver` instead of resize event handlers.

## Validation Checklist

- [ ] Every page meets the performance budget: LCP < 2.5s, CLS < 0.1, INP < 200ms, TTFB < 800ms.
- [ ] Lighthouse score is >= 90 for Performance, Accessibility, and Best Practices on every critical page.
- [ ] No render-blocking resources (CSS or JS) in the critical path except critical CSS.
- [ ] All images have explicit `width` and `height` or `aspect-ratio` CSS set.
- [ ] All images use modern formats (WebP/AVIF) with `<picture>` and fallback.
- [ ] JavaScript bundles are code-split at the route level; no route loads the entire app bundle.
- [ ] Database queries with the highest latency have EXPLAIN plans reviewed and optimized.
- [ ] N+1 queries are eliminated (confirmed by ORM query log or database monitoring).
- [ ] API responses include caching headers (`Cache-Control`, `ETag`, or `Last-Modified`).
- [ ] Connection pool size is configured and monitored; alerts exist for pool exhaustion.
- [ ] Third-party scripts are loaded with `async` or `defer` and are included in the performance budget.
- [ ] Fonts are subsetted and use `font-display: swap`.
- [ ] Stale-while-revalidate is implemented for API responses where freshness can tolerate a delay.
- [ ] Virtual scrolling is implemented for lists exceeding 100 items.
- [ ] CDN is configured for static assets with geographic routing and origin shield.

## Engineering Examples

### Example 1: Reducing Initial Bundle Size for a Web App (React + Vite)

A dashboard application has a 1.2MB gzipped bundle. Lighthouse reports an LCP of 4.2s on mobile 3G. The team needs to reduce the bundle to under 300KB gzipped and improve LCP to under 2.5s.

Analysis (using `vite-bundle-visualizer`):

- The monolithic bundle includes:
  - `@ant-design/icons`: 200KB (tree-shaken to 150KB)
  - `@ant-design/charts`: 400KB (used on a single "Analytics" route)
  - `moment-timezone`: 80KB (only 1 function used)
  - `lodash`: 70KB (only 5 functions used)
  - All page components in a single chunk

Optimizations applied:

1. **Route-level code splitting**: Each page is dynamically imported: `const Dashboard = () => import('./pages/Dashboard')`. The initial bundle is now just the layout, navigation, and home page. The Analytics chart library loads only when the user navigates to `/analytics`.
2. **Replace heavy libraries**: `moment-timezone` replaced with `date-fns-tz` (5KB). `lodash` replaced with individual lodash-es imports (tree-shaken to ~5KB). `@ant-design/icons` replaced with a custom icon subset (10KB, only 20 icons used).
3. **Lazy-load the chart library**: The chart component is dynamically imported: `const Chart = React.lazy(() => import('@ant-design/charts'))`. It is wrapped in a `<Suspense>` boundary with a skeleton matching the chart dimensions.
4. **Tree-shaking**: Ensure all imports use named imports (`import { Button } from 'antd'`), not wildcard imports (`import * as Antd from 'antd'`). Configure Rollup/Vite's `manualChunks` to split vendor libs into reasonable chunks.
5. **Compression**: Enable brotli compression on the CDN (reduces bundle size by an additional 20% compared to gzip).

Result: initial bundle reduces from 1.2MB to 220KB gzipped. LCP improves from 4.2s to 1.8s. Lighthouse performance score goes from 45 to 92.

### Example 2: Optimizing a Slow Database Query (PostgreSQL)

An e-commerce site's product listing page loads in 8 seconds. The database query for listing products with filters (category, price range, in-stock) takes 6 seconds.

Initial query:

```sql
SELECT * FROM products
WHERE category_id = 5
  AND price BETWEEN 10 AND 100
  AND stock_count > 0
ORDER BY created_at DESC;
```

EXPLAIN ANALYZE reveals a sequential scan on the `products` table (5 million rows), with a filter that eliminates 95% of rows after reading them. No indexes are used.

Optimizations:

1. **Composite index**: Create a composite index matching the WHERE and ORDER BY clauses:
   `CREATE INDEX idx_products_category_price_stock ON products (category_id, price, stock_count, created_at DESC);`
   This is a covering index for the query. PostgreSQL can filter by `category_id`, range-scan `price`, filter `stock_count > 0`, and return results in `created_at DESC` order—all from the index, without touching the heap.

2. **Partial index**: Since `stock_count > 0` is always required, a partial index reduces size:
   `CREATE INDEX idx_products_listing ON products (category_id, price, created_at DESC) WHERE stock_count > 0;`

3. **Remove `SELECT *`**: Replace with explicit columns: `SELECT id, name, price, image_url, rating FROM ...`. This reduces I/O by 60% (the row is wider than the required columns).

4. **Add pagination**: Use keyset pagination (cursor-based) instead of `OFFSET/LIMIT`:
   `WHERE (created_at, id) < ($last_created_at, $last_id) ORDER BY created_at DESC LIMIT 20`
   This avoids scanning and discarding rows on subsequent pages.

Result: Query time drops from 6s to 12ms (500x improvement). The product listing page now loads in 300ms total.

### Example 3: Implementing Effective Caching for an API Endpoint (Node.js + Redis)

A news website's homepage API endpoint aggregates headlines from 5 internal sources. The endpoint processes each source, merges the results, sorts by timestamp, and returns the top 50 headlines. It takes 800ms to compute and is called 100 times/second under load.

Caching strategy:

1. **Application cache (Redis)**: Cache the aggregated response in Redis with key `homepage:headlines:v2`. Set TTL to 60 seconds. On cache hit, return the cached response immediately (~5ms). On cache miss, compute the response, store it in Redis, and return it.
2. **Cache warming**: On deployment or after cache invalidation, a background job immediately computes the homepage cache so the first user request does not experience a cache miss.
3. **Stale-while-revalidate**: When the cache is stale (TTL exceeded), serve the stale response immediately and trigger an async recomputation. The `stale-while-revalidate` header is set to 300 seconds. This means even if Redis is down, the CDN edge can serve stale content for up to 5 minutes.
4. **CDN caching**: The API response includes `Cache-Control: public, max-age=30, stale-while-revalidate=300`. The CDN caches the response at the edge. 50% of requests are served from the CDN edge cache (nearest to the user). 40% are served from Redis. Only 10% hit the origin server.
5. **Cache invalidation**: When a new article is published, a webhook from the CMS invalidates the `homepage:headlines:v2` key in Redis and purges the CDN cache. The next request recomputes the response with the new article included.

Result: p95 latency drops from 800ms to 15ms. The origin server load drops from 100 req/s to 10 req/s. The CDN bandwidth costs are reduced because fewer requests reach the origin.
