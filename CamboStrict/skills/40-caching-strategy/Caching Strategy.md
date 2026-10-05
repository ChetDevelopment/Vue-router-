# Caching Strategy

## Purpose
Caching improves system performance, reduces latency, and lowers infrastructure costs by storing frequently accessed data in a faster storage layer than the primary data source. A deliberate caching strategy prevents redundant computation, reduces database load, and improves user experience — but done poorly, it introduces staleness, cache stampedes, and hard-to-debug data inconsistencies. The purpose of this document is to establish a framework for deciding what to cache, at which layer, for how long, and how to invalidate the cache correctly.

## Responsibilities
1. **Cache Layer Selection** — Determine the appropriate cache layer for each data type: browser cache for static assets, CDN for publicly cacheable responses, in-memory cache for application-hot data, and distributed cache (Redis/Memcached) for data shared across application instances.
2. **Cache Invalidation Design** — Implement invalidation strategies that prevent stale data from being served while avoiding excessive cache misses. Choose among TTL-based, event-driven, and write-through invalidation based on data volatility and consistency requirements.
3. **Stampede Prevention** — Protect the cache and the origin server from being overwhelmed when a popular cached item expires and multiple concurrent requests all attempt to regenerate it simultaneously.
4. **Granularity Decisions** — Decide whether to cache entire responses, individual objects, or query results. Finer granularity improves cache hit rates but increases complexity and storage overhead.
5. **Cache Key Design** — Design cache keys that uniquely identify cached content, incorporate versioning for schema changes, and support efficient bulk invalidation via key patterns (e.g., prefix-based deletion).
6. **Monitoring & Observability** — Track cache hit rates, miss rates, eviction counts, and staleness metrics. Alert on unexpected drops in hit rate that may indicate a broken invalidation path.
7. **Cache Warmup** - Pre-populate the cache with critical data after a deployment or cache flush to avoid a cold-start period where every request misses the cache.
8. **HTTP Caching Compliance** — Configure correct <code>Cache-Control</code>, <code>ETag</code>, and <code>Last-Modified</code> headers so that browsers and CDNs cache responses correctly without explicit application-level cache management.

## Decision Process
1. **Identify the data access pattern.** Measure the read-to-write ratio and the acceptable staleness window. Data that is read frequently and updated rarely (e.g., product catalog, reference data) is a strong caching candidate. Data that is written frequently and must be immediately consistent (e.g., inventory counts) is a poor candidate.
2. **Determine the consistency requirement.** For each piece of data, classify the staleness tolerance: (a) strong consistency — every read must reflect the latest write, (b) bounded staleness — reads may be up to N seconds stale, (c) eventual consistency — reads may be arbitrarily stale within reason. Only (b) and (c) are suitable for caching.
3. **Select the cache layer.** If the data is static and public, use a CDN. If the data is user-specific but shareable across sessions (e.g., user profile), use a distributed cache. If the data is request-scoped and short-lived, use in-memory cache. If the data is private and session-scoped, use the browser cache with private directives.
4. **Choose the invalidation strategy.** For data with bounded staleness tolerance, use TTL-based expiry. For data where staleness is unacceptable beyond a few seconds, use write-through (update cache on every write) or write-behind (asynchronously update cache after write). For data that changes via external events, use event-driven invalidation (publish a cache-invalidation event on message queue).
5. **Design the cache key.** Include entity type, identifier or query parameters, and a version number in the key (e.g., <code>product:v2:123</code>). Use a consistent delimiter. When the data schema changes, bump the version to invalidate all old keys without scanning.
6. **Implement stampede protection.** For cache-aside, use a mutex or probabilistic early expiration (memcache "X-REQ" pattern). For CDN and reverse-proxy caches, use request collapsing (only one request fetches from origin while others wait). For compute-heavy cache regeneration, use a background refresh job.
7. **Set appropriate TTLs.** Start conservative (short TTLs) and increase as you measure hit rates. If a TTL is too long, stale data accumulates. If too short, the cache is ineffective. Consider using stale-while-revalidate to serve stale data while asynchronously fetching fresh data.
8. **Monitor and tune.** Track cache hit ratio, origin load, and staleness incidents. Establish a baseline before caching, then measure improvement. If hit ratio drops below 50% for a cached item, reconsider whether caching is appropriate for that data.

## Inputs
- **Application traffic patterns** — Read-to-write ratios, request rates, and latency percentiles from production monitoring.
- **Data volatility characteristics** — How often does each data entity change? Is it time-based (session expires), event-driven (order placed), or user-triggered (profile updated)?
- **Consistency requirements** — SLAs for data freshness from product requirements or compliance regulations.
- **Infrastructure budget** — Available memory for in-memory caching, budget for Redis/Memcached instances, and CDN costs.
- **Deployment architecture** — Number of application instances, whether they share a cache cluster, and whether sticky sessions are used.

## Outputs
- **Cache classification matrix** — A table listing every cacheable data entity, its cache layer, TTL, invalidation strategy, cache key pattern, and stampede protection mechanism.
- **Cache invalidation event catalog** — For event-driven invalidation, a documented list of every event type that triggers cache invalidation, which keys it invalidates, and the expected latency of invalidation propagation.
- **Cache key schema** — A specification of key formats, versioning conventions, and prefix patterns used for bulk invalidation.
- **Monitoring dashboard** — A Grafana or Datadog dashboard showing cache hit rate by layer and entity, eviction rate, and origin server load reduction.
- **Cache warmup script** — A script or configuration that pre-populates the cache with critical data after a deployment or full cache flush.
- **HTTP cache header guide** — Documentation for developers on how to set <code>Cache-Control</code>, <code>ETag</code>, and <code>Last-Modified</code> on every API response.

## Rules
1. **Never cache sensitive data without explicit authorization.** PII, authentication tokens, session identifiers, and financial data must not be cached in shared caches (CDN, Redis, Memcached) unless encrypted and scoped to a specific user session with <code>Cache-Control: private</code>.
2. **Always set a maximum TTL.** Every cache entry must have a finite TTL. An infinite TTL guarantees eventual staleness and makes invalidation bugs invisible until data is permanently wrong. The maximum TTL across all cache layers must be documented.
3. **Cache keys must be deterministic.** The same logical data must always produce the same cache key. Do not include request-specific data (timestamps, random values, session IDs) in cache keys for shareable data.
4. **Invalidate by prefix, not by scan.** When you need to invalidate a group of related keys (e.g., all product keys when the catalog version changes), use a prefix-based deletion (<code>product:v2:*</code>) or key versioning, not a full scan and delete.
5. **Always handle cache misses gracefully.** A cache miss must not result in an error. The application must fall back to the primary data source. A cache outage must not cause a service outage.
6. **Do not cache write-heavy data.** If an entity's write rate exceeds its read rate, caching adds overhead with no benefit. The exception is write-behind caching for absorbing write spikes (e.g., analytics events).
7. **Monitor cache hit ratios per entity.** A 99% overall hit rate may hide a critical entity with a 10% hit rate. Monitor and alert on a per-key-pattern basis.
8. **Test invalidation paths in CI.** Write integration tests that insert data, verify the cache is populated, perform an update or delete, and verify the cache is invalidated. Cache invalidation bugs are silent until a customer complains about stale data.

## Best Practices
1. **Use the cache-aside pattern as the default.** The application checks the cache first; on a miss, it loads from the database, stores in cache, and returns. This pattern is simple, resilient to cache failures, and works for most read-heavy workloads.
2. **Implement probabilistic early expiration for hot keys.** When a cache entry is nearing its TTL, serve the stale value to a fraction of requests while one request asynchronously refreshes it. This prevents stampedes on popular keys.
3. **Version your cache keys.** When the data schema or serialization format changes, bump the version in the cache key (<code>user:v2:42</code> vs <code>user:v1:42</code>). Old keys will naturally expire, avoiding deserialization errors.
4. **Compress large cache values.** For values larger than 10 KB, compress with LZ4, Snappy, or Gzip before storing in the cache. Measure the CPU trade-off: compression may be slower than the cache miss it saves.
5. **Set connection limits and timeouts on cache clients.** A misconfigured Redis client with unlimited connections can exhaust file handles. Set a pool size (e.g., 10 connections per instance) and a 2-second timeout.
6. **Use cache warming after deployments.** After a code deploy that changes cache key schemas or after a full cluster flush, run a script that loads the most-accessed entities into the cache to avoid a cold-start period.
7. **Prefer CDN caching for static assets with content-addressable names.** Use filenames with content hashes (<code>main.a1b2c3.js</code>) and set <code>Cache-Control: public, max-age=31536000, immutable</code>. Never invalidate; deploy a new file with a new hash.
8. **Log cache misses with the key and reason.** When a cache miss occurs, log the key and whether it was a hard miss (key does not exist) or a soft miss (key expired). This data helps tune TTLs and identify invalidation problems.

## Anti-patterns
1. **Caching as a substitute for database indexing.** If a query is slow because of a missing database index, adding a cache may mask the performance problem but does not fix it. Fix the index first, then add caching if needed.
2. **Write-through on every write without considering write amplification.** Updating the cache on every single write when the data is read infrequently wastes cache writes and adds latency. Use TTL-based expiry for low-read data instead.
3. **Same TTL for all entities.** Setting a uniform 5-minute TTL on every cache entry regardless of how often the data changes. Reference data that changes monthly gets evicted needlessly, while real-time inventory gets served stale.
4. **Caching entire database tables in application memory.** Loading a full lookup table (e.g., country codes) into every application instance's memory is wasteful. Use a shared distributed cache for reference data so that one cache miss populates for all instances.
5. **Nested cache calls in request processing.** A single request that checks cache, then loads from DB, then checks another cache, then loads from another DB creates unpredictable latency. Minimize the number of cache round trips per request.
6. **Cache-aside with a long TTL and no invalidation event.** Setting a 24-hour TTL on user profiles and never invalidating when a user updates their profile. Users see stale data for up to 24 hours. Use a shorter TTL or event-driven invalidation.
7. **Using the same Redis instance for cache and persistent data.** Redis is primarily an in-memory cache. Storing critical data that cannot be lost (e.g., job queues with no persistence) in the same instance as cache data that can be evicted leads to data loss on eviction.

## Edge Cases
1. **Cache stampede on a key that takes 30 seconds to regenerate.** When the key expires, 100 concurrent requests all miss the cache and all trigger the expensive computation. Without stampede protection, the origin server is overwhelmed and latency spikes. Solution: probabilistic early expiration or a mutex with request coalescing.
2. **Drift between cache and database due to partial failures.** A write-through pattern updates the database successfully but the cache update fails. The cache now contains stale data. Solution: always set a TTL (eventual consistency) or use a transactional outbox with a retry mechanism for cache updates.
3. **Cache key collision.** Two different data types that happen to produce the same cache key (e.g., <code>"user:1"</code> for a user and <code>"user:1"</code> for a user_settings). Always prefix keys with the entity type and version.
4. **Large cache entries causing eviction of all other entries.** If a single key stores 500 MB of data (e.g., a cached report), it can evict thousands of smaller entries. Set a per-key size limit and consider splitting large blobs into chunks or caching them differently.
5. **Stale cache serving data after a rollback.** A deployment introduces a bug, the bug writes bad data to the database, the cache is written with bad data, and then a rollback restores the old database state. The cache continues serving the bad data. Always flush or version the cache on deploy/rollback.
6. **Clock skew between cache cluster nodes.** In a distributed cache with TTL-based expiry, if one node's clock is 5 minutes ahead, entries on that node expire earlier than expected. Use synchronized NTP across all cache nodes and prefer relative TTLs (seconds from now) over absolute expiry timestamps.

## Validation Checklist
- [ ] Every cache entry has a finite TTL.
- [ ] Cache keys include a version number for schema migrations.
- [ ] Cache miss does not cause an error (graceful fallback to origin).
- [ ] Cache invalidation is tested in CI for every write path.
- [ ] No sensitive data (PII, secrets) is stored in shared caches without encryption.
- [ ] Cache hit rate per entity is monitored with alerts for drops >20%.
- [ ] Stampede protection is implemented for all hot keys with regeneration cost >100 ms.
- [ ] Compression is configured for cache values >10 KB.
- [ ] Cache client has connection pooling and timeouts configured.
- [ ] HTTP Cache-Control headers are set correctly on all API responses (<code>private</code> vs <code>public</code>, <code>max-age</code>, <code>stale-while-revalidate</code>).
- [ ] A cache warmup process runs after every deployment and full cache flush.
- [ ] Large cache entries (>1 MB) are identified and handled separately.

## Engineering Examples

### Example 1: Implementing Cache-Aside with Redis for an API

A product listing API reads from a PostgreSQL database. The query joins across five tables and takes 200 ms on average. The API receives 5,000 requests per second. The database CPU is at 80%.

**Approach:** Implement cache-aside with Redis. The request handler checks Redis for key <code>product_list:v2:{query_hash}</code>, where <code>query_hash</code> is a SHA256 of the normalized query parameters (category, sort order, page). On a cache miss, the handler executes the database query, serializes the result to JSON, stores it in Redis with a TTL of 300 seconds, and returns the result. On subsequent requests, the handler returns the cached JSON in under 5 ms. A write to any product in a category invalidates all listing keys for that category using a Redis SCAN with prefix <code>product_list:v2:{category}:*</code>.

**Result:** Database CPU drops to 15%. P99 latency drops from 600 ms to 15 ms. Invalidation events ensure that new products appear in listings within 1 second of being published. The cache hit ratio stabilizes at 92%.

### Example 2: Preventing Cache Stampede on Popular Content

A news website publishes an article that goes viral. The article's content is cached in Redis with a 5-minute TTL. When the TTL expires, 10,000 concurrent readers all miss the cache and hit the database, which takes 3 seconds to construct the full article response (including author bio, related articles, and ad placements). The database falls over.

**Approach:** Implement probabilistic early expiration (also known as the "X-REQ" pattern). Each request checks the TTL remaining. If less than 20% of the original TTL remains, the request has a 1% probability of being the one to refresh the cache early. The other 99% continue to receive the stale value. The chosen 1% fetch the fresh data from the database asynchronously and update the cache. Additionally, implement a Redis mutex: on cache miss, the first request acquires a lock (<code>SET article:456:lock NX EX 5</code>), fetches from the database, and stores in cache; other requests wait briefly (spin, up to 50 ms) and then read the newly cached value.

**Result:** During the viral article's lifecycle, the database never receives more than a single concurrent request per cache key. The article is always served within 5 ms for 99% of requests, and the 1% that trigger a refresh see the fresh data within 3 seconds. The database stays at 30% CPU.

### Example 3: Using CDN Caching for Static Assets with Proper Invalidation

A React application is deployed to an S3 bucket behind CloudFront. The team frequently deploys changes, but users see old JavaScript and CSS files because the browser caches them aggressively.

**Approach:** Switch to content-addressable filenames. The build process generates filenames with a content hash: <code>main.a1b2c3d4.js</code>, <code>styles.e5f6g7h8.css</code>. The HTML file is never cached (<code>Cache-Control: no-cache</code>). The JS/CSS files are served with <code>Cache-Control: public, max-age=31536000, immutable</code>. The CDN is configured to forward the <code>Cache-Control</code> header and cache these assets at the edge. When a new build is deployed, the HTML references new filenames; browsers request the new files, and the CDN serves them from the edge cache (or fetches from S3 on first request). No explicit invalidation of CDN cache is needed because the filenames change.

**Result:** Browsers cache static assets for one year, eliminating re-downloads on repeat visits. Deployments are instant: as soon as the HTML is updated, the new assets are referenced. The CDN edge cache serves 99% of asset requests without hitting S3. The team no longer needs to create CloudFront invalidation requests on every deploy.
