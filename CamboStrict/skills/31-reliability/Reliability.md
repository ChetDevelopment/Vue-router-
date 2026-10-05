# Reliability

## Purpose

The Reliability skill establishes the principles and practices for designing, building, and operating systems that meet their availability and correctness objectives under adverse conditions. It covers fault tolerance patterns, redundancy strategies, resilience mechanisms (circuit breakers, retry policies, bulkheads, graceful degradation), health monitoring, and systematic reliability testing. The goal is to ensure the system continues to function correctly despite failures in its components, dependencies, or infrastructure.

## Responsibilities

- Design and implement fault-tolerant architectures that eliminate single points of failure at every tier (compute, network, storage, dependencies).
- Configure redundancy for all critical components: multiple instances per service, multi-AZ deployments, and active-passive or active-active failover.
- Implement circuit breakers for all external and internal service calls to prevent cascading failures and allow graceful recovery.
- Define retry policies with exponential backoff and jitter for transient failures, with clear limits to prevent retry storms.
- Implement bulkhead patterns to isolate failure domains, ensuring that a failure in one component does not exhaust shared resources (thread pools, connections, memory).
- Design graceful degradation paths: when a non-critical dependency fails, the system should continue serving core functionality with reduced capability.
- Define and implement health check endpoints (liveness, readiness, and dependency health) for every service.
- Configure automated failover strategies for stateful services (databases, message brokers, caches) with clear recovery time objectives (RTO) and recovery point objectives (RPO).
- Conduct chaos engineering experiments and reliability testing (failure injection, latency injection, load shedding) to validate system resilience.
- Continuously measure and report reliability metrics: uptime, error budget consumption, mean time between failures (MTBF), mean time to recovery (MTTR).

## Decision Process

1. **Classify the failure modes.** Identify all possible failure modes for each component: network partition, instance crash, resource exhaustion, upstream dependency failure, data corruption, configuration error, and malicious attack. Rank by likelihood and impact to prioritize mitigation efforts.

2. **Determine the blast radius for each failure.** For each failure mode, answer: how many users are affected? How many dependent services are affected? Is data lost? Is the failure contained or cascading? Software engineer hours needed to recover? Use this to assign priority (P0, P1, P2).

3. **Choose the redundancy model.** For stateless services, use active-active with multiple instances behind a load balancer (N+1 or N+2 redundancy). For stateful services, choose between active-passive (simpler, failover time of 30–120 seconds) and active-active (lower RTO, but requires conflict resolution). For databases, use synchronous replication within a region and async replication across regions.

4. **Implement the circuit breaker.** For each external dependency call, wrap the call in a circuit breaker with three states: closed (normal), open (failing fast), half-open (testing recovery). Set the failure threshold (e.g., 5 consecutive failures), timeout duration for open state (e.g., 30 seconds), and the number of success calls needed in half-open state to close (e.g., 3).

5. **Define the retry policy.** Retry only for transient failures (timeout, 503, 429, network error). Never retry for 4xx client errors (400, 401, 403, 404) or for destructive operations unless idempotency is guaranteed. Use exponential backoff: initial delay 100ms, multiplier 2, max delay 10 seconds, max retries 3. Add jitter (±25%) to prevent thundering herd.

6. **Design bulkheads.** Identify shared resource pools (thread pools, database connections, HTTP connections, memory). Partition them so that a failure in one logical unit (e.g., "user service calls") does not exhaust the pool and starve other units (e.g., "product service calls"). Each bulkhead gets its own pool with reserved capacity.

7. **Design graceful degradation.** For each non-critical dependency, define what happens when it is unavailable. Example: if the recommendation engine is down, show default/popular recommendations instead of failing the page. If the search service is slow, show a simplified search or cached results. Never let a non-critical dependency take down the entire page or API.

8. **Implement health checks.** Every service exposes `GET /health` with three tiers: liveness (process is running), readiness (service can accept traffic), and dependency (reachability of database, cache, message broker, and critical upstream services). Readiness and dependency checks are used by the load balancer to remove unhealthy instances. Liveness is used by the orchestrator to restart deadlocked processes.

9. **Configure automated failover.** For stateful services, define the failover trigger (e.g., 3 consecutive failed health checks), the failover action (promote replica, update DNS, update connection strings), and the fallback procedure (promote original after recovery). Test failover monthly. Document the expected RTO and RPO for each stateful service.

10. **Plan chaos experiments.** Start with small, controlled experiments in staging: kill one instance, inject 2-second latency to a dependency, block a network port, saturate CPU on one node. Observe the system behavior. Gradually move experiments to production in low-traffic hours with a blast radius limit and a kill switch. Use tools like Chaos Monkey, Gremlin, or Litmus.

## Inputs

- Architecture diagrams showing service dependencies, data flows, and deployment topology.
- Service-level objectives (SLOs) and error budgets for each service.
- Monitoring dashboards and alert configurations (latency, error rate, throughput, saturation).
- Incident postmortems and reliability trend data.
- Dependency inventory: all internal and external services with their criticality (critical, important, non-critical).
- Database and cache replication configuration (sync/async, RPO).
- Load balancer and orchestrator configurations (health check intervals, thresholds).
- Capacity planning data: peak traffic, resource utilization, connection counts.

## Outputs

- Fault tolerance design document with redundancy strategy, circuit breaker configuration, and bulkhead allocation.
- Circuit breaker implementations for all external and internal service calls with tested thresholds.
- Retry policy configuration (max retries, backoff, jitter) integrated into HTTP clients and message consumers.
- Bulkhead configurations for thread pools, connection pools, and memory partitions.
- Graceful degradation implementations with defined fallback behavior for each non-critical dependency.
- Health check endpoints with documented response format and check logic.
- Failover procedures for all stateful services with tested RTO/RPO.
- Chaos engineering experiment plan with results, observations, and remediation items.
- Reliability dashboard showing uptime, error budget burn rate, MTBF, and MTTR.

## Rules

1. Every service dependency must be classified as critical, important, or non-critical. Critical dependencies (database, auth) cause total service failure when down. Non-critical dependencies (recommendation, analytics) must never cause total service failure.
2. Circuit breakers must be applied to every remote call. A failure in any downstream service must not cascade into the upstream service.
3. Retries must use exponential backoff with jitter. Fixed-interval retries create a thundering herd that amplifies the original failure.
4. Idempotency is required for any operation that can be retried. The retry must produce the same result as a single invocation, regardless of how many times it is applied.
5. Health checks must be stupid simple. If a health check itself can fail due to transient issues (e.g., DNS resolution timeout), the service will appear unhealthy and be removed from rotation unnecessarily.
6. Bulkheads must have reserved capacity for critical operations. Do not let a non-critical feature consume all database connections and starve a critical feature.
7. Failover must be tested at least quarterly. An untested failover is a planned outage. Document the expected RTO and RPO for each failover scenario.
8. Graceful degradation must be the default behavior. If a dependency fails, the service must continue serving with degraded functionality, not return a 500 error.
9. Configuration errors must be treated as a failure mode. Implement configuration validation at startup and reject invalid configurations before they reach production.
10. Chaos experiments must have a blast radius limit, a kill switch, and clear success criteria. An experiment that causes a production incident is a failed experiment.

## Best Practices

- Use the bulkhead pattern at multiple layers: separate thread pools for different service dependencies, separate database connection pools for different query types (reads vs. writes, critical vs. non-critical), and separate message queue consumers for different message types.
- Set circuit breaker timeouts to at least 2× the p99 latency of the dependency. This prevents the circuit from tripping due to normal latency variance.
- Implement health check aggregation at the load balancer: if an instance fails dependency health checks for 3 consecutive probes (each probe interval is 10 seconds), remove it from rotation.
- Use client-side retry with a fallback response. If a dependency fails after retries, return a sensible default or cached value instead of propagating the error.
- Monitor error budget burn rate at multiple time windows (1 hour, 6 hours, 24 hours). A sudden high burn rate in the 1-hour window should trigger immediate investigation.
- Implement graceful shutdown: when a service receives a SIGTERM, stop accepting new requests, drain in-flight requests (up to 30 seconds), and then exit. This prevents dropped connections during deployments or autoscaling events.
- Use health check endpoints to validate configuration at startup: if a critical dependency is unreachable at startup, fail fast rather than starting in a degraded state.
- Protobuf-based gRPC services should implement health checking using the standard gRPC Health Checking Protocol. This is more robust than HTTP-based health checks for gRPC services.
- Implement "stale" read fallback: when the primary database is unreachable and the read replica has stale data, serve stale data with a warning header (`Warning: 110 stale-data`). This is better than a 500 error for most read-heavy use cases.
- Document the "bad day" runbook for each service: what happens when three things fail at once (e.g., database replica lag spikes, the cache cluster loses a node, and traffic is 2× peak).

## Anti-patterns

- **Infinite retries.** An unbounded retry loop will exhaust resources and amplify the failure. Always set a maximum retry count and a maximum total retry duration.
- **Tight coupling through shared thread pools.** If all service calls share the same thread pool, a slow dependency consumes all threads and blocks calls to healthy dependencies.
- **Ignoring the "noisy neighbor" problem.** A single tenant or user generating excessive traffic can degrade the experience for all other users. Implement per-tenant rate limiting and bulkheads.
- **Monitoring but no automated response.** Alerting without automated failover or circuit breakers means the system relies on human response time to prevent incidents.
- **Testing reliability only in staging.** Staging environments lack production traffic patterns, data volumes, and real-world failure modes. Perform chaos experiments in production with guardrails.
- **Over-reliance on a single availability zone.** A single AZ deployment is a single point of failure. Deploy across at least 3 AZs in production.
- **Hard-coded dependency endpoints.** If a database endpoint is hard-coded, promoting a replica during failover requires a code change and redeployment. Use service discovery or a connection string that can be updated at runtime.

## Edge Cases

- **Circuit breaker half-open state thundering herd.** When the circuit transitions to half-open and allows one request through, if that request succeeds, all waiting requests hit the dependency simultaneously. Implement a gradual half-open: allow 1 request, wait 5 seconds, allow 2 requests, wait, etc.
- **Retry during a long outage.** If a dependency is down for 30 minutes, retrying every few seconds for 30 minutes wastes resources and contributes to the failure. Use a circuit breaker to stop retrying entirely after the first few failures.
- **Replication lag and failover data loss.** When a primary database fails and the replica has 5 seconds of lag, the last 5 seconds of writes are lost. The application must be designed to tolerate this loss (idempotent writes, compensating transactions).
- **Partial failure in load balancer health checks.** If some dependencies pass health checks and others fail, should the instance be considered healthy? Use a voting strategy: if >50% of critical dependencies pass, the instance is healthy. Otherwise, remove it.
- **Cascading failure from configuration push.** A new configuration pushed to all instances simultaneously causes all instances to restart and become unhealthy at the same time. Use gradual configuration rollouts with health check verification.
- **Latency-induced cascading failure.** When a dependency becomes slow, upstream services keep connections open longer, exhausting connection pools and causing cascading timeouts. Circuit breakers and client-side timeouts mitigate this.

## Validation Checklist

- [ ] Every service dependency has a circuit breaker with configured thresholds (failure count, timeout, half-open retry count).
- [ ] Retry policy is configured with exponential backoff, jitter, and a maximum retry count. Idempotency is confirmed for retried operations.
- [ ] Bulkheads are implemented for thread pools and connection pools: critical and non-critical operations have dedicated pools.
- [ ] Graceful degradation is implemented for all non-critical dependencies. The system continues to serve core functionality when non-critical dependencies fail.
- [ ] Health check endpoints are implemented (liveness, readiness, dependency) and integrated with the orchestrator or load balancer.
- [ ] Failover procedures are documented and tested for all stateful services (database, cache, message broker).
- [ ] Automated failover is configured with clear triggers and fallback procedures.
- [ ] Chaos experiments have been conducted in staging (and production with guardrails). Findings are documented and remediated.
- [ ] Error budget burn rate monitoring is configured and alerts are set for fast, medium, and slow burn rates.
- [ ] Graceful shutdown is implemented: the service stops accepting new requests, drains in-flight requests, and exits within the timeout.
- [ ] The "bad day" runbook exists and covers scenarios where multiple dependences fail simultaneously.

## Engineering Examples

### Example 1: Implementing Circuit Breakers for External API Calls

A payment processing service calls an external fraud detection API. The API has a p95 latency of 200ms, but occasionally spikes to 10 seconds. During the spike, the payment service's HTTP connection pool is exhausted, and all payment requests start timing out. The team implements a circuit breaker using the resilience4j library.

Configuration:
- Failure threshold: 5 consecutive failures (timeout, 5xx, or connection error).
- Timeout for each call: 1 second (5× p95 to allow for normal variance).
- Open state duration: 30 seconds.
- Half-open retry count: 3 successful calls to close the circuit.
- Fallback: when the circuit is open, the payment service uses a local rules engine to make a decision (accept with manual review, decline, or return an error to the client).

The circuit breaker prevents the external API failure from cascading into the payment service. During the 30-second open window, the payment service avoids calling the fraud API entirely and uses the fallback. After 30 seconds, the circuit transitions to half-open, allowing one request through. If it succeeds, more requests are allowed gradually. If it fails, the circuit reopens.

The team monitors the circuit breaker state via metrics (circuit_open, circuit_half_open, circuit_closed) and alerts when the circuit is open for more than 5 minutes out of any 15-minute window. This indicates a sustained external dependency failure that requires manual intervention.

### Example 2: Designing Graceful Degradation for a Search Feature

An e-commerce site has a product search feature backed by Elasticsearch. Elasticsearch is a critical dependency (users cannot find products without it), but it is also complex and prone to failure. The team designs three degradation levels:

Level 1 (Elasticsearch is slow, p99 > 2 seconds): The search service switches from "full search" (faceted, ranked, with spelling correction) to "basic search" (simple keyword matching, no facets, no ranking). The response includes a header `X-Search-Degraded: basic`. The UI shows a banner: "Search is limited. Results may not be complete."

Level 2 (Elasticsearch is down): The search service falls back to a PostgreSQL full-text search on a cached product catalog. This is significantly slower and less accurate but functional. The response includes `X-Search-Degraded: postgres-fallback`. The UI shows a banner: "Search is temporarily unavailable. Showing basic results."

Level 3 (Both Elasticsearch and PostgreSQL search are unavailable): The search service returns a cached top-100 product list (computed hourly and stored in Redis). The search input is disabled and the cached results are displayed with `X-Search-Degraded: cached`. The UI shows: "Search is unavailable. Showing popular products."

The degradation levels are implemented as a fallback chain: the caller tries the primary search, catches specific exceptions (timeout, connection refused, 503), and calls the next fallback. Each fallback has its own circuit breaker and timeout. The team tests all three degradation levels weekly.

### Example 3: Using Bulkheads to Isolate Failure Domains

A notification service sends email, SMS, and push notifications. Each channel has a different provider with different latency and failure characteristics. Initially, all three channels shared a single HTTP connection pool (100 connections). When the email provider slowed down (taking 30 seconds per request), it consumed all 100 connections, blocking SMS and push notifications entirely.

The team implements bulkheads: each notification channel gets its own HTTP connection pool.

- Email pool: 40 connections (15 reserved, 25 shared). Timeout: 30 seconds.
- SMS pool: 30 connections (10 reserved, 20 shared). Timeout: 10 seconds.
- Push pool: 30 connections (10 reserved, 20 shared). Timeout: 5 seconds.

Reserved connections ensure that each channel always has a minimum capacity, even under load. Shared connections allow borrowing if one channel is idle and another is busy.

Additionally, the team applies thread pool bulkheads at the application tier:
- Email worker thread pool: 10 threads.
- SMS worker thread pool: 10 threads.
- Push worker thread pool: 10 threads.

When the email provider is slow, only the email thread pool is affected. SMS and push continue to function normally. The team also monitors each pool's utilization and alerts when any pool is consistently at 90%+ utilization, indicating the need to increase capacity.

The bulkhead pattern ensures that a failure in one notification channel does not affect the reliability of other channels. During a subsequent email provider outage, SMS and push notifications continued to operate at full capacity, and the email queue backed up without impacting other services.
