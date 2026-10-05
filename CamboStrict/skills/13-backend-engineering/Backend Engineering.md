# Backend Engineering

## Purpose

To provide a disciplined framework for designing, building, and maintaining production-grade backend services. This skill ensures that every backend component—from HTTP controllers to background job processors—is structured for reliability, observability, testability, and maintainability. The goal is to eliminate ad-hoc server logic by enforcing consistent layered architecture patterns that handle the full request lifecycle, external integration failure modes, and data access concerns with predictable outcomes.

## Responsibilities

- Architect server applications into clearly separated layers (controller, service, repository/infrastructure) with strict dependency direction.
- Own the request lifecycle: parsing, validation, authorization, business logic execution, response serialization, and error mapping.
- Implement middleware pipelines for cross-cutting concerns: logging, authentication, rate limiting, request ID tracing, and error recovery.
- Organize business logic into stateless service objects that encapsulate domain rules and are independently testable.
- Abstract data access behind repository or DAO interfaces to decouple business logic from storage specifics (SQL, NoSQL, file system, external API).
- Manage external integrations with resilience patterns: circuit breakers, retries with exponential backoff, timeouts, and fallback responses.
- Design and operate background job processing pipelines with queues, workers, dead-letter handling, and idempotency guarantees.
- Build API controllers (REST, GraphQL, or gRPC) that are thin adapters—no business logic, only request/response translation and delegation.
- Implement structured error handling at system boundaries: translate internal exceptions into standardized API error responses with appropriate HTTP status codes.
- Provide instrumentation hooks (metrics, structured logging, distributed tracing) at every layer for operational visibility.

## Decision Process

1. **Identify the entry point.** Determine whether the request originates from an HTTP call, a message queue event, a scheduled cron trigger, or a CLI invocation. This decides which controller/adapter layer handles the initial input.
2. **Map the request lifecycle.** Trace the path: deserialization → validation → authentication → authorization → business logic → data access → response serialization. Identify which middleware concerns apply at each stage.
3. **Extract business logic.** If a sequence of operations involves conditional rules, calculations, or multi-step workflows, move it into a service object. Services must not import HTTP request/response objects or database drivers directly.
4. **Choose the data access strategy.** For simple CRUD, use a direct repository. For complex queries with joins/aggregations, create a dedicated query object or read model. For write-heavy operations, consider a command handler pattern.
5. **Design for failure at integration points.** For every external API call, decide: timeout value, retry count, backoff multiplier, circuit breaker thresholds, and what happens when all retries are exhausted (fallback, fail-fast, or queue for replay).
6. **Decide background vs. synchronous.** If the operation does not need an immediate response (email dispatch, report generation, data sync), route it to a background job queue with a defined worker pool.
7. **Define error contracts.** For every public method on a service, specify what exceptions it throws and under what conditions. Map these to HTTP responses at the controller boundary, never in the service layer.
8. **Instrument for observability.** Add structured logging at entry/exit of every service method. Add metrics counters for success/failure. Add distributed tracing context propagation across async boundaries.
9. **Validate data at the boundary.** Use a schema validation library (Joi, Zod, Yup, Pydantic) at the controller layer. Never trust deserialized input. Re-validate only if data crosses a trust boundary (e.g., deserialized from a database column).
10. **Test in isolation.** Unit test services by mocking repositories. Integration test repositories against a real database in a test container. Test controllers with full request/response assertions using supertest or equivalent.

## Inputs

- HTTP requests (JSON bodies, query parameters, path parameters, headers, cookies, multipart uploads).
- Message queue events (JSON payloads from Kafka, RabbitMQ, SQS, Pub/Sub).
- Scheduled job triggers (cron expressions, interval timers).
- CLI arguments and flags.
- External API call results (success responses, error payloads, timeout exceptions).
- Database query results (rows, documents, key-value pairs).
- Configuration values (environment variables, secrets, feature flags).

## Outputs

- HTTP responses with status codes, headers, and serialized bodies (JSON, XML, ProtoBuf, plain text).
- Message queue events (published to topics/queues for downstream consumers).
- Mutated database state (inserted, updated, or deleted records).
- Side effects (emails sent, files written to object storage, cache entries populated/invalidated).
- Structured log entries with correlation IDs, severity levels, and structured metadata.
- Metrics and traces pushed to observability backends (Prometheus, Datadog, OpenTelemetry collector).
- Error responses following a consistent schema: `{ "error": { "code": "...", "message": "...", "details": {} } }`.

## Rules

1. **Controllers must not contain business logic.** A controller method must be at most 10 lines: parse input, call a service, serialize response. Any conditional branching beyond input parsing is a violation.
2. **Services must not depend on HTTP primitives.** Service method signatures use plain data objects (DTOs, value objects). No `Request`, `Response`, `HttpContext`, or `HttpServletRequest` types.
3. **Repositories must return domain objects, not database rows.** Map database results to domain entities inside the repository. Do not leak ORM entities or raw SQL result sets into the service layer.
4. **Every external call must have a timeout.** No unbounded waits. The timeout must be shorter than the client-facing request timeout to allow for fallback.
5. **All background jobs must be idempotent.** Job handlers must check if the work was already done before executing. Use a deduplication key (deterministic ID based on job payload).
6. **All secrets and configuration must be injected, not hard-coded.** Use environment variables, a secrets manager (Vault, AWS Secrets Manager), or a config service. Never commit secrets to version control.
7. **Every public API endpoint must have an OpenAPI/Swagger specification.** The spec is the source of truth for request/response schemas. Generate server stubs from the spec where feasible.
8. **Error responses must never expose stack traces.** Map every exception to a user-safe error code and message. Log the full stack trace server-side. Return only the safe payload to the client.
9. **All database migrations must be version-controlled and repeatable.** Use a migration tool (Flyway, Alembic, Prisma Migrate). Never mutate the schema by hand in production.
10. **Async boundaries must propagate tracing context.** Extract trace IDs from incoming headers (W3C Trace Context, Jaeger headers) and inject them into outgoing calls and log entries.

## Best Practices

1. **Use dependency injection explicitly.** Pass dependencies through constructors, not service locators or global singletons. This makes testing and reasoning about the graph straightforward.
2. **Prefer composition over inheritance for middleware.** Chain small, focused middleware functions rather than building a monolithic base controller class.
3. **Validate input schema at the edge with a library.** Use Zod (TypeScript), Pydantic (Python), Joi (Node.js), or Jakarta Validation (Java). Define schemas once, derive TypeScript types from them.
4. **Return early, fail fast.** Validate all preconditions at the top of a method. If a required resource is missing or a constraint is violated, throw an domain exception immediately.
5. **Use a standardised pagination pattern for list endpoints.** Accept `?page=1&per_page=20` or cursor-based `?cursor=...&limit=20`. Always return `total`, `next_cursor`, and `prev_cursor` or `page`/`per_page` metadata.
6. **Separate read models from write models (CQRS light).** If a read endpoint needs a different shape than the write entity, create a dedicated query handler or projection. Do not load full entities just to return a subset of fields.
7. **Use a rate limiter per client identity, not per IP.** Rate limit by API key or authenticated user ID. IP-based limiting is unreliable behind proxies and NATs.
8. **Write integration tests that exercise the real middleware stack.** Use test containers for databases and message brokers. Mock only external third-party APIs that cannot run locally.
9. **Implement health check endpoints.** Expose `/health` (liveness) and `/ready` (readiness). The readiness check validates database connectivity, message queue connectivity, and any critical dependency. The liveness check is a simple 200 OK.
10. **Log in structured JSON format.** Parseable log output (json or logfmt) enables automated log aggregation, alerting, and dashboarding. Include `request_id`, `duration_ms`, `status_code`, and `error` fields.

## Anti-patterns

1. **God services.** A service class with hundreds of lines and dozens of methods that coordinates every domain operation. Breaks SRP, makes testing impossible, and creates merge conflict nightmares. Fix: split into use-case-specific service objects.
2. **Leaky ORM entities.** Returning `UserEntity` (with lazy-loaded collections, password hashes, and audit timestamps) directly to the controller, which serializes it to JSON. Exposes internal schema, includes sensitive fields, and couples clients to database structure. Fix: map to response DTOs in the controller.
3. **Try-catch around every call.** Catching exceptions at every layer and re-throwing generic `RuntimeException` or `Error` destroys the error taxonomy. Fix: let domain exceptions propagate to a global error handler that maps them to HTTP responses.
4. **Hard-coded retry logic scattered everywhere.** Each service implements its own retry loop with different backoff strategies, leading to inconsistent behavior. Fix: use a centralised retry utility or a dedicated library (Polly, Resilience4j, Tenacity).
5. **Synchronous blocking of long-running operations.** Processing a 5-minute report generation inside an HTTP request handler, tying up a server thread. Fix: accept the request, enqueue a background job, return 202 Accepted immediately with a job ID.
6. **Mixing read and write concerns in one handler.** A single service method that reads data, performs validation, writes changes, sends an email, and logs an audit trail. Fix: use the command/query separation pattern. Reads call query handlers; writes call command handlers that may emit events.
7. **Database queries in loops.** Executing `SELECT * FROM orders WHERE user_id = ?` inside a `for` loop over users. The N+1 query problem destroys performance. Fix: batch queries with `WHERE IN (...)` or use a data loader pattern.
8. **Ignoring request cancellation.** Spawning CPU-intensive or long-running work without checking if the client disconnected (context cancellation). Fix: propagate `Context` / `CancellationToken` through the entire call chain and check `ctx.Err()` or `CancellationToken.IsCancellationRequested` before expensive operations.

## Edge Cases

1. **Idempotency key collisions.** Two requests arrive simultaneously with the same idempotency key. The system must use a database-level unique constraint or a distributed lock to ensure only one request is processed. The second request must wait and then return the stored result of the first.
2. **Stale read-after-write.** A client writes a resource and immediately reads it from a read replica that has not yet caught up. Fix: use read-your-writes consistency by reading from the primary for a configurable window after a write, or use cursor-based replication acknowledgment.
3. **Database deadlocks under concurrent writes.** Two transactions each lock rows the other needs. Fix: establish a consistent lock ordering across the codebase. For example, always lock the user row before the order row. Use retry logic with exponential backoff for deadlock victims.
4. **Partial external API degradation.** The external payment gateway is slow but not down. Retries with backoff increase latency and may exhaust the server thread pool. Fix: use circuit breaker that trips after a configurable failure threshold, then serves a degraded response or fails fast.
5. **Deserialisation of malformed input.** The request body contains numeric strings where numbers are expected, or deeply nested JSON that exceeds parser limits. Fix: enforce a maximum payload size at the HTTP server level. Use schema validation that coerces types safely or rejects malformed input with a 400 response.
6. **Unbounded queue growth.** Jobs are produced faster than workers can consume them, leading to memory exhaustion. Fix: monitor queue depth. Implement back-pressure by slowing down production when the queue exceeds a threshold. Use bounded queues with a dead-letter overflow strategy.
7. **Scheduled job overlap.** A cron job that runs every 5 minutes takes 10 minutes to execute, causing two instances to run concurrently. Fix: acquire a distributed lease or database lock before the job starts. If the lock cannot be acquired, skip the run. Log a warning about the overlap.
8. **Clock skew in distributed systems.** Two services running on machines with different system clocks produce inconsistent timestamps for event ordering. Fix: use monotonic clocks for duration measurement and logical clocks (Lamport or Hybrid Logical Clocks) for ordering events across nodes.

## Validation Checklist

- [ ] Controller contains no business logic: it delegates entirely to a service and returns a mapped response.
- [ ] Service method accepts and returns only plain objects or domain types (no HTTP primitives).
- [ ] Every external API call includes a timeout, retry policy, and fallback strategy.
- [ ] All database queries are wrapped in repository methods that return domain objects.
- [ ] Background job handlers enforce idempotency via a deduplication key and at-least-once delivery semantics.
- [ ] Error responses follow a consistent JSON schema and never expose internal stack traces.
- [ ] Structured logging includes `request_id`, `duration_ms`, and `error` fields for every request.
- [ ] OpenAPI specification exists for every public endpoint and matches the actual request/response schema.
- [ ] Health check endpoint returns 200 only when database and critical dependencies are reachable.
- [ ] Rate limiting is keyed by authenticated user or API key, not by raw IP address.
- [ ] All secrets are injected via environment variables or a secrets manager, never hard-coded.
- [ ] Database migrations are version-controlled and run through a dedicated migration tool.
- [ ] Tracing context is propagated across all async boundaries and injected into log entries.
- [ ] Maximum request body size is enforced at the HTTP server level to prevent resource exhaustion.

## Engineering Examples

### Example 1: Structuring a Layered Backend Service (Node.js/TypeScript)

A team builds an order management service. The initial implementation crammed everything into Express route handlers. After refactoring to a layered architecture:

- **Controller** (`orders.controller.ts`): Reads `req.params.orderId`, calls `ordersService.getOrderDetails(orderId)`, and maps the result to `res.status(200).json(orderResponse)`. Under 10 lines. No try/catch; errors propagate to a global error middleware.
- **Service** (`orders.service.ts`): Exposes `getOrderDetails(orderId: string): Promise<OrderDTO>`. Calls `orderRepo.findById(orderId)` and `paymentRepo.getPaymentStatus(orderId)`. If the order does not exist, throws `OrderNotFoundError`. If the payment status is `declined`, still returns the order with a warning flag. Does not import `Request` or `Response`.
- **Repository** (`orders.repository.ts`): Uses Prisma to query the database. Maps the Prisma result to an `Order` domain entity (plain object with only required fields, lazy-loaded collections eagerly resolved). Returns `null` if not found.
- **Global Error Handler**: A middleware that catches `OrderNotFoundError` → `404`, `PaymentDeclinedError` → `200` with warning, `ValidationError` → `400`, and `UnknownError` → `500` with a correlation ID. Logs the full error to the observability pipeline.

The result: each file is under 50 lines. Unit tests for the service mock both repositories. Integration tests for the repository run against a Postgres test container. The controller is tested with `supertest` against the full Express app.

### Example 2: Handling External API Failures Gracefully (Python/FastAPI)

A weather dashboard service aggregates data from three external weather APIs. If one provider is down, the service must still return results from the remaining providers.

Implementation:

- Every external API call uses `httpx.AsyncClient` with a 3-second timeout.
- The integration module defines a `call_weather_api(url, retries=2, backoff=1.0)` wrapper. Retries use exponential backoff: 1s, 2s. If all retries fail, `None` is returned (not an exception).
- A circuit breaker (using `pybreaker`) tracks failures per provider. After 5 consecutive failures, the breaker opens for 30 seconds. During the open state, the call is skipped entirely and `None` is returned immediately.
- The service layer collects results from all providers, filters out `None` values, and returns the aggregated data. If all three providers fail, the service returns a 503 with a structured error.
- Metrics: a `weather_api_requests_total` counter with labels `provider` and `status`. An alert fires when any provider has a >10% error rate over 5 minutes.

This design keeps the weather dashboard available even when individual providers are degraded, without blocking request threads.

### Example 3: Implementing a Background Job Processor (Go)

A document processing service needs to convert uploaded PDFs to text, generate thumbnails, and extract metadata. This must happen asynchronously to keep uploads fast.

Architecture:

- **Job queue**: Redis-backed (using `asynq`). The producer enqueues a job with payload `{ "document_id": "abc123", "uploaded_at": "..." }`.
- **Worker pool**: 4 concurrent goroutines dequeue jobs. Each worker processes one job at a time. Acknowledges the job only after successful processing.
- **Idempotency**: The job payload includes a deterministic `job_id` (hash of `document_id + upload_timestamp`). The worker checks a Redis set for this `job_id` before processing. If present, it skips and acknowledges immediately.
- **Retries**: On failure (e.g., corrupt PDF), the job is retried up to 3 times with exponential backoff (10s, 30s, 60s). After exhausting retries, the job moves to a dead-letter queue (another Redis list).
- **Dead-letter handler**: A separate worker process monitors the dead-letter queue. It alerts the operations team via Slack webhook, including the `document_id` and error message. An operator can manually re-enqueue the job after fixing the root cause.
- **Monitoring**: Job processing duration is exported as a histogram metric. Queue depth is monitored; if it exceeds 1000, an auto-scaling trigger adds more worker goroutines.

This pattern handles spikes in upload volume gracefully, provides visibility into failures, and ensures no documents are lost.
