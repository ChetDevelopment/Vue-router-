# Scalability

## Purpose

The Scalability skill defines the principles, patterns, and practices for designing systems that can handle increasing load without degrading performance or reliability. It covers both vertical and horizontal scaling approaches, data partitioning strategies, caching tiers, async processing, and traffic management. The goal is to ensure that the system can grow cost-effectively by adding resources proportionally while maintaining predictable latency and availability under peak demand.

## Responsibilities

- Analyze system capacity requirements and model growth projections for traffic, data volume, and concurrency.
- Design stateless application tiers to enable horizontal scaling through simple replication.
- Implement database sharding strategies for write-heavy or large-volume data stores, ensuring even data distribution and query routing.
- Configure and manage read replicas to offload read traffic from primary databases, including replication lag monitoring.
- Design and maintain caching tiers (application cache, distributed cache, CDN) with appropriate invalidation strategies.
- Integrate CDN layers for static asset delivery and, where appropriate, edge caching of API responses.
- Implement async processing queues for non-interactive workloads, including dead-letter handling and consumer autoscaling.
- Select and configure load balancing algorithms (round-robin, least connections, consistent hashing, weighted) based on workload characteristics.
- Configure auto-scaling policies with meaningful metrics (CPU, memory, queue depth, request rate) and cooldown periods to avoid thrashing.
- Implement throttling mechanisms with backpressure propagation to prevent cascading overload failures.

## Decision Process

1. **Identify the bottleneck.** Measure current system performance and locate the constraint: is it CPU, memory, disk I/O, network bandwidth, database connections, or an external service rate limit? Use profiling, tracing, and observability data. Without a clear bottleneck, scaling efforts are misdirected.

2. **Determine scaling axis.** Decide whether to scale vertically (bigger instance) or horizontally (more instances). Vertical scaling is simpler but has a ceiling and introduces a single point of failure. Horizontal scaling requires stateless design but offers unlimited capacity and fault tolerance. Prefer horizontal for production services, vertical only for legacy or stateful components that cannot be partitioned.

3. **Design for statelessness.** Ensure that application instances do not store session state, cache data, or file artifacts locally. Move session state to a distributed store (Redis, Memcached) or use JWT tokens. Move file storage to object stores (S3, GCS, Azure Blob). Ensure any instance can handle any request at any time.

4. **Choose a data scaling strategy.** For relational databases, evaluate read replicas (for read-heavy workloads), sharding (for write-heavy large datasets), or both. For NoSQL databases, choose the partitioning key based on access patterns. Document the shard key strategy and the rebalancing procedure.

5. **Design the caching strategy.** Identify cacheworthy data: frequently read, infrequently written, and tolerant of staleness. Choose between in-process cache (fast but per-instance), distributed cache (consistent across instances, e.g., Redis), and CDN (global edge, static or semi-static). Define TTLs, invalidation triggers, and cache-aside vs. write-through semantics.

6. **Select load balancing algorithm.** Round-robin works for homogeneous instances. Least connections helps when request duration varies. Consistent hashing is needed for cache affinity or sticky sessions (avoid if possible). Weighted distribution handles heterogeneous instance sizes. For gRPC, use client-side load balancing.

7. **Implement async processing.** Identify any request-path work that does not require an immediate response: email sending, report generation, data export, notification dispatch. Move these to a message queue (RabbitMQ, Kafka, SQS). Configure consumer concurrency, batch size, and autoscaling based on queue depth.

8. **Configure autoscaling.** Set minimum and maximum instance counts based on expected traffic floors and ceilings. Choose scaling metrics: CPU utilization (general), request count per instance (for web services), queue depth (for workers). Set cooldown periods (300 seconds minimum) to prevent thrashing. Test autoscaling with load testing to verify responsiveness.

9. **Implement throttling and backpressure.** Define rate limits per tenant, per user, or per endpoint. Use token bucket or sliding window algorithms. When the system is under load, return 429 (Too Many Requests) with a `Retry-After` header. Propagate backpressure through the call chain: if a downstream service is slow, the upstream should fail fast rather than queueing requests.

10. **Test and validate.** Conduct load tests, stress tests, and soak tests against the scaled system. Verify that adding instances linearly improves throughput (scalability coefficient > 0.8). Test cache hit ratios under peak load. Validate that autoscaling reacts within the expected time and does not overshoot.

## Inputs

- Traffic patterns and growth projections from product and operations teams.
- Baseline performance metrics: average and peak requests per second, concurrent users, data volume, storage growth rate.
- Application architecture diagrams showing component dependencies and data flow.
- Database query patterns: read-to-write ratio, hot key analysis, slow query log.
- Service-level objectives: target p99 latency, throughput requirements, uptime SLA.
- Budget constraints and cost models for compute, storage, and network resources.
- Observability data from monitoring tools (Datadog, Grafana, New Relic, CloudWatch).

## Outputs

- Scalability architecture design document with rationale for each decision.
- Stateless application tier implementation with session externalization.
- Database scaling plan: replicas, shards, shard key specification, rebalancing procedures.
- Caching layer implementation with configuration (TTL, max memory, eviction policy).
- CDN integration for static assets and optionally for dynamic content.
- Async processing pipelines with queue definitions, consumer groups, and autoscaling policies.
- Load balancer configuration (algorithm, health check, SSL termination).
- Autoscaling policies and scaling tests validating responsiveness.
- Throttling configuration (rate limits, burst allowances, headers).
- Load testing reports showing system behavior under projected peak load.

## Rules

1. Statelessness is a prerequisite for horizontal scaling. If an instance stores state locally, it cannot be replaced without data loss or user disruption.
2. Any caching layer must have a documented invalidation strategy. A cache with no invalidation plan will eventually serve stale or incorrect data.
3. Read replicas must be monitored for replication lag. If lag exceeds 5 seconds, the application must failover reads to the primary or return staleness information to the client.
4. Database sharding must be designed for the query patterns, not for storage convenience. A poor shard key causes hot spots and uneven distribution.
5. Autoscaling policies must include both scale-out and scale-in rules. Scale-in must have a longer cooldown than scale-out to avoid oscillations.
6. Backpressure must propagate: if a service cannot handle the load, it must reject requests early rather than buffering them indefinitely. Buffering hides the problem and causes cascading failures.
7. Consistent hashing should be used for cache and database sharding when the cluster size changes. This minimizes the number of keys that need to be remapped.
8. Load balancers must have health checks that reflect the actual service availability, not just process liveness. A service that is alive but returning 500s is not healthy.
9. Async queues must have dead-letter queues and monitoring. Messages that cannot be processed must be isolated, inspected, and reprocessed or discarded.
10. Scalability testing must be performed before every major feature launch. Do not assume the previous architecture will handle new traffic patterns.

## Best Practices

- Start with vertical scaling for early-stage products to minimize complexity. Migrate to horizontal scaling when the system consistently exceeds 70% resource utilization.
- Use connection pooling for all database and cache clients. Opening a new connection per request is a scalability anti-pattern that exhausts ports and file descriptors.
- Implement compression for network payloads (gzip, brotli for HTTP; Snappy, Zstandard for message queues). This reduces bandwidth and latency for large payloads.
- Design for data locality: place compute close to the data store. If the database is in us-east-1, run the application in us-east-1. Cross-region latency adds 50-100ms per request.
- Use dedicated read replicas for reporting and analytics queries that would otherwise compete with production traffic. Run heavy aggregations against the replica.
- Implement cache warming for frequently accessed data after deployment or cache flush. Cold cache leads to a thundering herd against the database.
- Use exponential backoff with jitter for retries in async processing. This prevents the "retry storm" that occurs when all consumers retry simultaneously after a failure.
- Monitor the scalability coefficient: the ratio of throughput increase to instance count increase. If adding 2× instances only yields 1.5× throughput, investigate lock contention or shared resource saturation.
- Implement gradual connection draining before scaling in. Allow in-flight requests to complete before terminating an instance. Set a maximum drain time of 30 seconds.
- Document the maximum capacity of each system component (e.g., database max connections, Redis max memory, Kafka partition count). Use these as alert thresholds and scaling triggers.

## Anti-patterns

- **Premature optimization.** Adding Redis, sharding, and CDN before measuring actual bottlenecks. This adds complexity without evidence of need. Measure first, optimize second.
- **Using sticky sessions for state.** Tying a user to a specific instance prevents seamless instance replacement and complicates scaling. Externalize session state to a distributed store.
- **Ignoring the thundering herd.** When a cache key expires, and 100 concurrent requests all try to rehydrate it simultaneously, the database is overwhelmed. Use mutex locks or probabilistic early expiration.
- **Over partitioning (too many shards).** Each shard adds operational overhead. Start with a reasonable number (e.g., 8-16 shards) and rebalance as data grows. Do not create hundreds of shards upfront.
- **Scaling every tier equally.** If the bottleneck is the database, scaling the application tier only increases the number of connections contending for the database. Scale the constrained tier first.
- **Ignoring cold start times.** If autoscaling launches instances that take 5 minutes to initialize, the system will be overloaded before the new instances become effective. Pre-warm instances or set lower thresholds.
- **Autoscaling based only on CPU.** CPU may not correlate with load if the service is I/O-bound (database, network, disk). Use application-specific metrics like request queue depth or concurrent requests.
- **Synchronous processing of all requests.** Every synchronous call ties up a thread and increases response time. Identify which operations can be async and move them off the critical path.

## Edge Cases

- **Cache stampede during cache flush.** If the entire cache is flushed simultaneously, all requests hit the database until the cache is repopulated. Use staggered cache eviction (TTL with jitter) or incremental invalidation.
- **Autoscaling triggers during a flash crowd.** A sudden traffic spike (e.g., product launch, viral content) triggers rapid scale-out. If the autoscaler takes too long, the system may become unresponsive. Pre-provision a buffer and use predictive scaling when possible.
- **Replication lag causes stale reads.** A user writes data, then immediately reads from a replica that has not yet replicated the write. For read-after-write consistency, route the read to the primary or implement read-your-writes consistency at the application layer.
- **Shard rebalancing causes downtime.** When a shard is split or moved, the data must be migrated. During migration, queries that hit the affected shard may fail or be slow. Use virtual shards or consistent hashing to minimize data movement.
- **Database connection pool exhaustion.** Under high load, all connections are in use and new requests queue up. When requests time out, the pool does not release connections immediately, causing a snowball effect. Set connection pool limits and timeouts appropriately.
- **Queue backlog grows faster than consumers can process.** When a producer outruns consumers, the queue grows indefinitely, increasing latency and potential data loss. Implement producer-side throttling and consumer autoscaling based on queue depth.
- **Cross-region replication latency.** If a service spans multiple regions, data synchronization latency can cause inconsistency. For strong consistency, route all writes to a primary region. For eventual consistency, design the application to tolerate stale data.

## Validation Checklist

- [ ] Application tier is stateless: no local session state, no local file storage, no in-memory caches that cannot be regenerated.
- [ ] Caching strategy is documented with TTL, invalidation triggers, and fallback behavior if the cache is unavailable.
- [ ] Database scaling plan is documented: read replicas (count, lag monitoring) or sharding (shard key, count, rebalancing procedure).
- [ ] Load balancer health checks reflect actual service health (not just process liveness). Unhealthy instances are removed within 30 seconds.
- [ ] Autoscaling policies are configured with meaningful metrics, appropriate cooldown, and minimum/maximum instance limits.
- [ ] Async processing queues have dead-letter queues, consumer monitoring, and autoscaling based on queue depth.
- [ ] Throttling is implemented for all public endpoints with documented rate limits and `Retry-After` headers.
- [ ] Backpressure mechanisms are tested: if a downstream service slows down, upstream services reject requests instead of queuing.
- [ ] Load testing confirms the system handles projected peak traffic with acceptable latency and error rate.
- [ ] Scalability coefficient is measured: adding 2× instances yields at least 1.6× throughput improvement.
- [ ] Cold start times are measured and autoscaling thresholds are adjusted to account for them.

## Engineering Examples

### Example 1: Scaling a Read-Heavy API with Caching and Replicas

A social media API serves user profile data at 10,000 requests per second (95% reads, 5% writes). The database (PostgreSQL) is the bottleneck: at 8,000 reads/second, CPU is at 85%, and p99 read latency exceeds 2 seconds. The team implements a two-tier scaling strategy.

First tier (caching): The team introduces Redis as a distributed cache using the cache-aside pattern. Profile data is cached with a key format `user:{id}:profile` and a TTL of 5 minutes. When a profile is updated, the cache entry is invalidated and lazily rehydrated on the next read. Cache hit ratio reaches 92%, reducing database reads to 800/second.

Second tier (read replicas): The remaining 800 reads/second (uncached profiles and cache misses) still put pressure on the primary. The team provisions two read replicas in the same region. The application uses a read/write split: writes go to the primary, reads go to a read replica (round-robin across replicas). Replication lag is monitored and alerts fire if lag exceeds 3 seconds. If a replica lags, reads are redirected to the primary temporarily.

The combined result: the primary database CPU drops to 30%, p99 read latency drops to 50ms, and the system handles 10,000 req/s with headroom. The caching layer also reduces egress costs from the database. The team later adds a CDN for avatar images, reducing cache misses by another 30%.

### Example 2: Designing a Sharding Strategy for User Data

A SaaS platform stores user-created documents. The documents table grows by 2 TB per year and will exceed 10 TB in 2 years. A single PostgreSQL instance cannot handle the write throughput or storage. The team decides to shard the documents table across multiple PostgreSQL instances.

Shard key selection: The team analyzes query patterns. 80% of queries access documents by `user_id` (e.g., "list my documents", "get document by ID for this user"). 20% access by `document_id` globally (e.g., "share link"). The team chooses `user_id` as the shard key with consistent hashing to distribute users evenly across shards.

Implementation: Document IDs are UUIDs. The application uses a shard router middleware that hashes `user_id` to determine the shard number (shard_count = 16). The middleware maintains a map of shard number → database connection string. Queries by `document_id` require querying all shards in parallel (scatter-gather), which is acceptable because it is only 20% of queries and caching reduces the frequency.

Rebalancing: As data grows, the team may need to increase shard count. They plan for virtual shards: they create 1024 virtual shards mapped to 16 physical shards. To add a shard, they remap some virtual shards to the new physical shard and migrate only the affected data. This minimizes data movement.

Results: Write throughput scales linearly with shard count. Each shard handles 1/16th of the write load. Storage is distributed. Scatter-gather queries on `document_id` have p99 latency of 200ms (acceptable for the share-link use case).

### Example 3: Implementing Backpressure for a Message Processing System

An order processing service consumes messages from a Kafka topic and writes to an external ERP system that has a rate limit of 100 requests/second. Under peak load, the consumer processes 500 messages/second, overwhelming the ERP and causing connection timeouts and retries.

The team implements backpressure in three layers:

Layer 1 (consumer-side throttling): The Kafka consumer uses a semaphore to limit concurrent ERP requests to 100. When the semaphore is exhausted, the consumer pauses polling from Kafka, which causes the consumer lag to increase but prevents the ERP from being overloaded.

Layer 2 (producer-side throttling): The upstream order service observes increased latency from the order processing service (because backpressure is propagating). The order service implements a circuit breaker: if the order processing service returns 429 or latency exceeds 5 seconds, the circuit opens and new orders are rejected immediately with a 429 response.

Layer 3 (client-side backoff): The frontend receives the 429 from the order service and displays a "system is busy, please retry" message with exponential backoff. The frontend also implements a client-side queue to hold pending orders and retry with jitter.

The team adds monitoring for consumer lag, semaphore utilization, and circuit breaker state. Alerts fire when consumer lag exceeds 100,000 messages (approximately 10 minutes of processing at max throughput). The backpressure chain ensures the ERP is never overloaded, and the system degrades gracefully rather than failing catastrophically.
