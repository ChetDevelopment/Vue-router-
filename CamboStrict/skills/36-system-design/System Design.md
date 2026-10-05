# System Design

## Purpose

Provide a comprehensive framework for designing large-scale distributed systems that meet explicit quality attributes for performance, reliability, scalability, and maintainability. This skill enables engineers to make informed architectural decisions about capacity estimation, load balancing, caching, database selection, CDN strategy, message queues, consistency models, and fault tolerance patterns when building systems that must operate reliably under production loads.

## Responsibilities

- Estimate system capacity requirements including traffic volume, storage needs, network bandwidth, and compute resources based on business projections and user behavior assumptions
- Design load balancing strategies that distribute traffic across multiple servers, data centers, or regions while handling server failures gracefully
- Select and configure caching layers including browser caching, CDN caching, application caching, and database caching with appropriate eviction policies and invalidation strategies
- Choose database technologies (relational, document, key-value, columnar, graph) based on data model, access patterns, consistency requirements, and scaling characteristics
- Design CDN strategies for static and dynamic content delivery, including cache control headers, edge computing for dynamic content, and origin shielding
- Select and configure message queue and event streaming technologies for asynchronous communication, workload decoupling, and event-driven architectures
- Evaluate and decide between microservices and monolith architectures based on team size, organizational structure, domain complexity, and operational capabilities
- Define consistency models (strong, eventual, causal, read-your-writes) for different system operations and implement appropriate conflict resolution strategies

## Decision Process

1. Understand the system requirements by clarifying the functional scope, expected traffic patterns, data volume, latency SLAs, availability targets, and regulatory constraints. Interview stakeholders to distinguish between hard requirements and nice-to-have aspirations.

2. Estimate capacity using back-of-the-envelope calculations. Estimate daily active users, requests per second, data generated per request, storage growth per month, and peak-to-average traffic ratio. Use these estimates to determine initial infrastructure sizing and identify scaling bottlenecks.

3. Design the API layer and load balancing strategy. Determine how clients will reach the system: DNS-based load balancing, hardware load balancers, or cloud load balancers. Define the routing strategy: round-robin, least connections, geographic proximity, or consistent hashing for session affinity.

4. Select the appropriate database technology based on the data model and access patterns. Relational databases for structured data with complex relationships and strong consistency requirements. Document databases for flexible schemas and rapid iteration. Key-value stores for high-throughput lookups. Columnar databases for analytical queries. Consider polyglot persistence for different data types.

5. Design the caching strategy identifying which data should be cached, at which layer (browser, CDN, application, database), for how long (TTL), and how invalidation works. Cache the results of expensive computations, frequently accessed database queries, and session data. Avoid caching user-specific data at shared layers.

6. Design the asynchronous processing pipeline using message queues or event streams. Identify which operations can be performed asynchronously without affecting user experience: email notifications, report generation, data processing pipelines, image/video transcoding. Choose between at-least-once, at-most-once, and exactly-once delivery semantics.

7. Evaluate the microservices vs monolith decision based on team size, domain complexity, and operational maturity. Start with a well-structured monolith unless the team size (>10 per service), domain boundaries, or independent scaling requirements clearly justify microservices. Extract services incrementally.

8. Design the consistency model for each data operation. Strong consistency for financial transactions, inventory management, and critical state changes. Eventual consistency for social feeds, analytics, and cached data. Read-your-writes consistency for user profiles and settings. Causal consistency for collaborative features.

9. Design fault tolerance mechanisms including redundancy, health checks, circuit breakers, retry with exponential backoff, bulkheads, and graceful degradation. Identify single points of failure and eliminate them through redundancy. Define fallback behavior when dependencies are unavailable.

10. Validate the design against the requirements. Walk through the most common user scenarios and the most critical failure scenarios. Verify that the design meets latency SLAs, availability targets, and capacity requirements. Identify security vulnerabilities and operational risks.

## Inputs

- Functional requirements and system scope
- Traffic estimates: daily active users, requests per second, peak vs average ratios
- Data volume estimates: storage per user/transaction, total storage growth per month/year
- Latency SLAs: p50, p95, p99 response time targets
- Availability targets: desired uptime percentage, recovery time objective (RTO), recovery point objective (RPO)
- Budget constraints for infrastructure and operational costs
- Team size, skill level, and operational capabilities
- Regulatory and compliance requirements for data handling and storage

## Outputs

- System architecture diagram showing all components, data flow, and network boundaries
- Capacity estimation document with traffic, storage, and compute projections
- Database schema or data model with technology selection rationale
- Load balancing and traffic routing specification
- Caching strategy with layers, eviction policies, and invalidation mechanisms
- Message queue or event stream architecture with topic/queue definitions
- Microservices vs monolith decision document with rationale
- Consistency model specification for each data operation
- Fault tolerance and disaster recovery plan
- Security architecture including authentication, authorization, and data protection

## Rules

1. Every system component must have at least one redundancy mechanism for production deployments. Single points of failure must be explicitly identified and eliminated. A component that fails and takes down the system is unacceptable.
2. Capacity estimates must be documented with explicit assumptions. Every estimate (traffic volume, storage growth, request rate) must state the assumption it is based on. When assumptions change, estimates must be updated.
3. Database selection must be based on data model and access patterns, not familiarity or popularity. Choosing MongoDB for a heavily relational dataset or PostgreSQL for a document store produces suboptimal results. Match the database to the data.
4. Caching must have explicit invalidation or TTL policies. Data that is cached indefinitely without invalidation will serve stale data. Every cached item must have a documented invalidation trigger or maximum TTL.
5. Asynchronous operations must be monitored through queue depths, processing latency, and dead-letter queues. Messages that cannot be processed after retries must be stored in a dead-letter queue for manual inspection, not silently dropped.
6. Circuit breakers must be implemented for all inter-service synchronous calls. A failing downstream service must not cascade failures to upstream services. Circuit breakers should trip based on error rate thresholds and have configurable recovery timeouts.
7. Rate limiting must be implemented at the API gateway or load balancer level. Rate limits protect backend services from traffic spikes, abusive clients, and DDoS attacks. Rate limit responses (HTTP 429) must include Retry-After headers.
8. All inter-service communication must be encrypted in transit. Internal traffic between services is not exempt from security requirements. mTLS or equivalent encryption must be configured for all service-to-service communication.
9. Health check endpoints must be implemented for every service. Health checks must test the service's critical dependencies and internal state, not just return 200 OK. Unhealthy services must be automatically removed from load balancer rotation.
10. The design must include observability: distributed tracing for request flow, structured logging for debugging, and metrics for monitoring and alerting. A system without observability cannot be operated reliably at scale.

## Best Practices

1. Use back-of-the-envelope calculations to validate architecture decisions before committing to specific technologies. A simple calculation of requests per second × data per request can reveal whether a single database instance will handle the load or whether sharding is required.
2. Implement the Cache-Aside pattern as the default caching strategy. The application first checks the cache. On cache miss, it loads data from the database and populates the cache with a TTL. This pattern is simple, reliable, and works for most use cases.
3. Use consistent hashing for cache and database sharding to minimize redistribution when nodes are added or removed. Consistent hashing ensures that only K/N keys are remapped (where K is total keys and N is number of nodes) rather than all keys.
4. Design for idempotency in message processing. Message queues inherently deliver at-least-once. Message consumers must be idempotent to prevent duplicate processing from causing incorrect state. Use message IDs or idempotency keys to detect duplicates.
5. Implement exponential backoff with jitter for retry logic. Fixed-interval retries cause thundering herd problems when all clients retry simultaneously. Jitter randomizes retry timing to spread the load and improve recovery.
6. Use the Bulkhead pattern to isolate failures. Separate thread pools or connection pools for different services prevent a failure in one dependency from consuming all resources and affecting other dependencies.
7. Deploy in at least three availability zones within a region for production workloads. Three zones provide fault tolerance with quorum-based consensus for stateful services and eliminate the single-zone failure scenario.
8. Use blue-green or canary deployments for zero-downtime releases. Rolling updates with health check verification ensure that new versions are functional before traffic is fully routed to them.
9. Implement read replicas for read-heavy workloads. Most applications have read-to-write ratios exceeding 10:1. Read replicas offload query traffic from the primary database and can scale horizontally for increasing read demand.
10. Document architecture decisions using ADRs to capture context, options considered, and rationale. System design decisions made without documentation will be questioned, reversed, or repeated when the original context is forgotten.

## Anti-patterns

1. **Premature scaling**: Designing a distributed system with sharding, microservices, and event sourcing when the application has 100 users and fits on a single server. Premature scaling adds massive complexity without any benefit. Start simple and scale when actual metrics justify it.
2. **Single database for everything**: Using one database for OLTP, OLAP, search, caching, and session storage. Different workloads have different requirements. A database optimized for transactional integrity is terrible for analytical queries and vice versa.
3. **Caching everything without a strategy**: Adding a cache layer (Redis, Memcached) without defining what is cached, TTL values, invalidation triggers, or cache warming procedures. This produces cache inconsistency, stale data, and cold-start performance problems.
4. **Chatty microservices**: Microservices that require 10+ synchronous calls to serve a single request. Chatty communication creates tight coupling, high latency, and complex failure scenarios. Aggregate data or use API composition patterns.
5. **Ignoring data consistency**: Designing all operations for strong consistency when eventual consistency would suffice, or assuming eventual consistency without handling conflicts. Both extremes produce problems. Match consistency to business requirements.
6. **No monitoring or observability**: Designing and deploying the system without distributed tracing, centralized logging, or metrics dashboards. Operating a system without observability is like flying a plane without instruments. Problems cannot be diagnosed until users report them.

## Edge Cases

1. **Thundering herd on cache expiration**: A cached value with 60-second TTL expires, and 1,000 concurrent requests all hit the database simultaneously. Use cache re-computation with locking (only one thread recomputes, others wait) or stale-while-revalidate (serve stale data while refreshing in the background).
2. **Database connection pool exhaustion**: Under high load, all database connections are in use and new requests queue up, eventually timing out and returning errors. Use connection pool sizing based on the database's max connections, implement queue timeouts, and add read replicas for read-heavy workloads.
3. **Network partition or split-brain**: In a distributed system, network connectivity between nodes is lost but both partitions remain operational. Use a consensus protocol (Raft, Paxos) with quorum-based decisions. The partition with fewer nodes stops accepting writes to prevent data divergence.
4. **Data center failure**: A complete data center outage takes all instances in that region offline. Design for multi-region deployment with active-active (both regions serve traffic) or active-passive (one region serves, the other is standby) failover. Test failover regularly.
5. **Slow consumer in message queues**: A message consumer processes messages slower than they are produced, causing unbounded queue growth and increased latency. Implement backpressure: slow down producers when queue depth exceeds a threshold, scale consumers horizontally, or drop non-critical messages.
6. **Clock skew in distributed systems**: Server clocks drift, causing time-based operations (lease expiration, token validation, ordering) to behave incorrectly. Use monotonic clocks for elapsed time measurement, NTP synchronization, and avoid relying on system clock for cross-node ordering decisions.

## Validation Checklist

- [ ] Capacity estimates are documented with explicit assumptions for traffic, storage, and compute
- [ ] System architecture diagram shows all components, data flow, and network boundaries
- [ ] Database technology selection is justified by data model and access patterns
- [ ] Caching strategy includes layers, TTL values, and invalidation mechanisms
- [ ] Message queue or event stream design includes dead-letter queue and retry policy
- [ ] Load balancing strategy is defined with health checks and auto-scaling
- [ ] Circuit breakers are implemented for all inter-service synchronous calls
- [ ] Rate limiting is configured at the API gateway level
- [ ] All inter-service communication is encrypted in transit
- [ ] Fault tolerance mechanisms (redundancy, bulkheads, graceful degradation) are documented
- [ ] Observability (tracing, logging, metrics) is designed into the system
- [ ] Disaster recovery plan is documented with RTO and RPO targets

## Engineering Examples

### Example 1: Designing a URL Shortener

**Requirements:** A URL shortener service that handles 100 million URLs created per month, 10,000 reads per second (redirects), with 5ms p50 and 20ms p99 redirect latency. URLs live forever.

**Capacity estimation:**
- Writes: 100M / (30 days × 86400 s) = ~38 writes/second (peak ~100 writes/s)
- Reads: 10,000 reads/second sustained (peak ~30,000 reads/s)
- Storage: 100M URLs × 500 bytes per record (short code + long URL + metadata) = 50 GB/month → 600 GB/year
- Read-to-write ratio: ~260:1 (heavily read-heavy)

**Architecture:**
- API layer: Stateless REST API behind a cloud load balancer with auto-scaling
- Write path: API servers validate URL, generate a unique short code (base62 encoded random ID), write to database, return short URL
- Read path: API servers look up short code, return HTTP 308 redirect to the long URL

**Database:** Amazon DynamoDB (or any key-value store)
- Partition key: short_code. No sort key needed for simple key-value lookups
- Strongly consistent reads for URL creation (avoid duplicate short codes)
- Eventually consistent reads for redirects (acceptable trade-off for lower latency)
- DAX (DynamoDB Accelerator) caching layer for hot URLs reduces read latency to sub-millisecond

**Caching strategy:**
- Application-level cache (Redis): Cache the most frequently accessed 10 million URLs
- Cache-aside pattern: On redirect, check Redis → miss → check DynamoDB → populate Redis with 24-hour TTL
- Invalidation: When a URL is deleted or deactivated, delete the cache entry (rare operation)

**Fault tolerance:**
- API servers: Auto-scaling group with health checks, deployed across 3 availability zones
- DynamoDB: Managed service with built-in replication across 3 AZs
- Redis cluster: Multi-AZ deployment with automatic failover
- Rate limiting: 100 writes/second per API key, 50,000 reads/second per API key

**Performance validation:** Load testing showed 12ms p99 redirect latency under 30,000 reads/second, well within the 20ms target. Cache hit rate was 92% for the top 10 million URLs, covering 98% of redirect traffic.

### Example 2: Designing a Real-Time Chat System

**Requirements:** A group chat system supporting 50 million daily active users, 10,000 messages per second peak, sub-100ms message delivery latency, offline message storage for 30 days, end-to-end encryption optional.

**Capacity estimation:**
- Messages per second: 10,000 peak, 2,000 average
- Message size: Average 1 KB (text only, no media)
- Storage: 10K msg/s × 1 KB × 86400 s = 864 GB/day → 26 TB/month for 30-day retention
- Connections: 50M DAU × 30% peak concurrency = 15M concurrent WebSocket connections

**Architecture:**
- WebSocket gateway: Stateless servers that maintain persistent WebSocket connections. Uses consistent hashing to distribute connections across gateways
- Message broker: Apache Kafka for message ingestion and fan-out. Each chat room is a Kafka topic partition
- Message storage: Cassandra for time-series message storage with 30-day TTL
- Presence service: Redis with pub/sub for online status tracking

**Message flow:**
1. User A sends message → WebSocket gateway receives it
2. Gateway publishes message to Kafka topic for the chat room (partition key = room_id)
3. Kafka consumer processes the message: stores in Cassandra, publishes to Redis pub/sub for room subscribers
4. WebSocket gateway subscribes to Redis pub/sub for rooms its connected users are in
5. Gateway pushes message to all connected WebSocket clients in the room

**Consistency:**
- Message ordering within a room is guaranteed by Kafka partition ordering (all messages for a room go to the same partition)
- Read-your-writes: The sender's message is displayed immediately from local state; server confirmation on Kafka ack
- Eventual consistency for message history: Cassandra read repairs handle inconsistent replicas

**Fault tolerance:**
- WebSocket gateways are stateless; client reconnection re-establishes the connection to any gateway
- Kafka provides message durability with configurable replication factor (3)
- If the consumer fails, Kafka partitions are rebalanced to remaining consumers
- Support for message backfill: On reconnection, client requests messages since last known message ID

**Performance validation:** Load testing demonstrated 50ms p50 and 95ms p99 delivery latency under 15,000 messages/second. The system handled 2 million concurrent WebSocket connections across 100 gateway instances.

### Example 3: Designing a Video Streaming Platform

**Requirements:** A video streaming platform with 10 million daily active users, 1 million concurrent streams at peak, support for 4K resolution, sub-2-second startup time, 99.99% availability.

**Capacity estimation:**
- Concurrent streams: 1M peak
- Bandwidth: 1M streams × 15 Mbps (4K stream) = 15 Tbps peak
- Storage: 500 hours of new content uploaded per day × 4 GB/hour (4K) = 2 TB/day
- Catalog: 100,000 titles × 4 GB average = 400 TB total storage
- Metadata requests: 5 requests per user session × 10M DAU = 50M metadata requests/day = ~580 requests/second

**Architecture:**
- **Ingestion pipeline:**
  - Upload API accepts video files (up to 50 GB) through resumable upload protocol
  - Uploaded files stored in S3 (source bucket)
  - AWS Elemental MediaConvert transcodes video into multiple resolutions (240p, 480p, 720p, 1080p, 4K) and formats (HLS, DASH)
  - Transcoded segments stored in S3 (output bucket) with CDN origin configuration

- **Delivery pipeline:**
  - CDN: CloudFront or Akamai with edge locations worldwide. Cache HLS/DASH manifest files and video segments at edge
  - Content catalog metadata (titles, descriptions, thumbnails) served from read replicas of PostgreSQL
  - User recommendations: Redis cache with precomputed recommendations per user
  - Authentication and authorization: JWT-based with short-lived tokens (1 hour) verified at edge

- **Streaming protocol:**
  - HLS with 6-second segment duration for adaptive bitrate streaming
  - Client requests manifest.m3u8, which lists available resolutions
  - Client selects appropriate resolution based on available bandwidth and buffer size
  - ABR (Adaptive Bitrate) algorithm in client switches between resolutions dynamically

**Caching strategy:**
- CDN caches video segments aggressively; cache hit rate expected >95% for popular content
- Manifest files cached at CDN with 30-second TTL (updated when new resolutions are available)
- Metadata cached in Redis with 5-minute TTL, invalidated when content metadata is updated
- User watch history cached in Redis with 24-hour TTL

**Fault tolerance:**
- Multi-CDN strategy for regional failures (primary CDN with backup CDN)
- Origin shield to reduce load on S3 origins
- Thumbnail and metadata endpoints are decoupled from video delivery; thumbnail failures don't affect playback
- Graceful degradation: If ABR algorithm fails to fetch a segment, client falls back to a lower resolution

**Performance validation:** CDN caching achieved 97% cache hit rate for video segments. Median startup time was 800ms (under the 2-second target). During a regional CDN outage, traffic switched to the backup CDN with 2 minutes of increased latency (30s DNS propagation + 90s cache warming).
