# Serverless Engineering

## Purpose

Establish a disciplined approach to designing, implementing, deploying, and operating serverless applications using AWS Lambda, Azure Functions, or Google Cloud Functions. This skill addresses the unique constraints of serverless compute — ephemeral runtimes, cold starts, event-driven invocation, stateless execution, and pay-per-use billing — and provides concrete patterns for building reliable, observable, and cost-efficient serverless systems.

## Responsibilities

- Structuring handler code to separate business logic from infrastructure concerns (routing, serialization, error formatting).
- Mitigating cold start latency through dependency minimization, lazy loading, and runtime selection.
- Ensuring functions are stateless and that any state externalization (DB, cache, object store) is intentional and managed.
- Connecting functions to event sources (SQS, SNS, EventBridge, Kinesis, HTTP API) with appropriate batching, concurrency, and retry configuration.
- Composing multiple functions into workflows using Step Functions, EventBridge, or direct invocation with explicit error handling.
- Setting timeouts, memory sizes, and concurrency limits based on observed performance and cost trade-offs.
- Handling failures with dead-letter queues (DLQs), poison-pill management, and idempotent processing.
- Implementing connection pooling and reuse across warm invocations while avoiding stale connections.
- Instrumenting functions with structured logging, metrics, and distributed tracing (X-Ray, OpenTelemetry).
- Optimizing function costs by right-sizing memory, reducing execution time, and minimizing invocation count.

## Decision Process

1. **Choose the right compute service.** Prefer Lambda/Cloud Functions for event-driven, short-lived, or variable-load workloads. Use containers (Fargate, Cloud Run) for long-running, stateful, or predictable-load workloads. Do not force serverless on every problem.
2. **Select a runtime with cold start characteristics that match the latency budget.** For latency-sensitive APIs (e.g., user-facing endpoints), prefer AWS Lambda with Provisioned Concurrency or use a runtime with fast startup (Node.js, Python, Go over Java/C#).
3. **Decompose the application into functions around business events, not HTTP verbs.** A function should handle one event type (e.g., `OrderPlaced`, `PaymentConfirmed`). Avoid monolithic functions that route internally based on event type.
4. **Design the handler in three layers:** the handler adapter (parses event, formats response), the service layer (business logic, idempotent), and the data layer (repositories, external clients). Test each layer independently.
5. **Determine batching and concurrency settings for stream-based sources.** For SQS and Kinesis, set batch size and maximum concurrency to balance throughput against downstream load. Enable `bisectBatchOnError` for SQS to isolate poison-pill messages.
6. **Configure retries, DLQs, and error handling at the source, not in code.** Use the event source's built-in retry policy and DLQ configuration. Implement idempotency keys at the service layer to safely handle duplicate deliveries.
7. **Right-size memory based on profiled performance.** Run load tests at 128 MB, 256 MB, 512 MB, 1024 MB, and 2048 MB. Choose the smallest memory where P99 latency meets the SLO. CPU allocation scales with memory in Lambda.
8. **Implement proper initialization logic.** Initialize database connections, HTTP clients, and configuration outside the handler function so they persist across warm invocations. Use lazy initialization for expensive or rarely-used dependencies.
9. **Set function timeouts intentionally.** The timeout should be just above the P99.9 execution time under load. Too short causes spurious failures; too long lets a stuck function consume billable time and prevents scaling.
10. **Instrument every function with structured JSON logging.** Include correlation IDs, function name, version, cold start flag, duration, and memory used. Send logs to a centralized platform (CloudWatch, Datadog, Loki).

## Inputs

- API specifications (OpenAPI) or event schemas (EventBridge, SNS, SQS) defining function input/output.
- Latency SLOs and traffic patterns (peak RPS, concurrency) from product requirements.
- Downstream system capacity limits (max DB connections, third-party API rate limits).
- Security requirements around IAM roles, VPC placement, and encryption.
- Budget constraints defining maximum monthly spend per function or workload.
- Observability tooling decisions (structured logging format, tracing configuration).

## Outputs

- A function template directory with handler, service, and repository stubs, test fixtures, and CI configuration.
- Infrastructure-as-Code definitions (SAM, CDK, Serverless Framework, Terraform) for each function.
- Deployment scripts and CI/CD pipelines configured for serverless deployment with canary releases.
- Monitoring dashboards showing invocation count, error rate, duration percentile, cold start rate, and cost per invocation.
- Runbooks for common failure modes (throttling, DLQ processing, dead-letter remediation).
- A cost allocation report mapping function invocations to business transactions.

## Rules

1. **Functions must be stateless.** Do not store data in local variables, file system, or in-memory caches that must survive across invocations. The execution environment may be recycled at any time.
2. **Never use the `aws-sdk` v2 for JavaScript; always use `@aws-sdk/client-*` v3 modular imports.** The v2 SDK increases cold start time by hundreds of milliseconds by bundling all service clients.
3. **Set a reserved concurrency limit on every function.** This prevents a runaway function from consuming all available concurrency in the account and starving other functions.
4. **DLQs must be configured for every event-source-mapped function.** Messages that fail after the maximum retry count must be routed to a DLQ. Set up an alarm on the DLQ message count.
5. **Every handler must return a structured response.** For HTTP functions, return status code, headers, and body. For async functions, return a status object that CloudWatch can alarm on.
6. **Do not run database migrations or schema changes from within a function handler.** Schema changes are deployment-time operations, not runtime operations.
7. **Functions must include a correlation ID in every log line and outgoing request.** Extract the ID from the event or generate one. Propagate it to downstream services via headers or message attributes.
8. **Keep deployment artifacts small.** The zipped deployment package must not exceed 50 MB (Lambda limit 250 MB, but cold start penalty increases with size). Exclude test files, documentation, and development tooling.
9. **Use environment variables for configuration that changes between environments.** Do not hard-code stage names, table names, or endpoint URLs.
10. **Monitor and alarm on the `Throttles` and `DeadLetterQueueMessageCount` metrics.** These indicate that concurrency is exhausted or errors are not being handled.

## Best Practices

1. **Implement Provisioned Concurrency for latency-sensitive functions.** Pre-warm a baseline number of execution environments to eliminate cold starts for steady-state traffic. Combine with Application Auto Scaling to adjust during traffic spikes.
2. **Use AWS Lambda Power Tuning to programmatically find the optimal memory setting.** This Step Functions state machine invokes the function at multiple memory levels and reports cost-speed trade-offs.
3. **Build functions with the `handler` pattern that receives a rich context object.** Include request ID, function name, memory limit, and remaining execution time. Log the context on cold starts for debugging.
4. **Structure error handling to differentiate between retryable and non-retryable errors.** Throw an exception for retryable errors (transient downstream failures); return an error response for non-retryable errors (validation failures, forbidden actions).
5. **Use AWS X-Ray or OpenTelemetry for distributed tracing.** Trace from the event source through the function to downstream calls. This is the only way to debug latency in composed serverless applications.
6. **Design for eventual consistency when using async event sources.** Messages may be delivered out of order, more than once, or after a significant delay. Implement idempotent handlers and sequence-number checks.
7. **Use environment variables for configuration but validate them at cold start.** Validate that all required env vars are present and correctly formatted during initialization, not during invocation.
8. **Secure function endpoints with IAM authorization or Lambda authorizers.** Do not expose functions publicly without authentication. Use `AWS_IAM` auth or a custom authorizer for HTTP APIs.
9. **Test with realistic event payloads.** Create fixture files matching the exact event shape from API Gateway, SQS, SNS, S3, and EventBridge. Use these in unit tests and local emulation (SAM local, LocalStack).
10. **Separate CI/CD concerns: build in CI, deploy in CD.** Build the deployment artifact in the CI stage and promote the same artifact through environments without rebuilding.

## Anti-patterns

1. **Initializing heavy resources inside the handler function.** Creating a database connection, loading configuration files, or instantiating SDK clients on every invocation dramatically increases execution time and cost. Move these to the initialization scope.
2. **Trying to enforce exactly-once processing at the function level.** Serverless event sources deliver at least once by design. Instead of fighting this guarantee, design idempotent handlers that can safely process duplicates.
3. **Putting a monolithic application in a single Lambda function with internal routing by event type.** This defeats the purpose of serverless — independent scaling, independent deployment, and minimal cold start scope per function.
4. **Storing session state in Lambda execution context.** Execution environments are reused across invocations but can be recycled at any time. User sessions will be lost. Use DynamoDB, ElastiCache, or a similar external store.
5. **Ignoring cold start metrics in performance monitoring.** An API with 200 ms P50 but 5-second P99 due to cold starts will fail its latency SLO. Track cold start rate and duration explicitly.
6. **Setting function timeout to 15 seconds (the maximum) by default.** Long timeouts mask performance problems and increase cost during degraded states. Set timeouts based on actual observed P99.9 durations plus a safety margin.
7. **Using `require` or `import` statements that load the entire SDK.** For Node.js, use tree-shakeable imports from `@aws-sdk/client-dynamodb` rather than importing the entire `aws-sdk`. For Python, import only the specific clients needed.
8. **Running functions inside a VPC unnecessarily.** VPC-enabled functions lose access to the public internet and require NAT Gateway, adding latency and cost. Only use VPC when the function must access RDS, ElastiCache, or other VPC-only resources.

## Edge Cases

1. **SQS FIFO queues with Lambda concurrency.** FIFO queues process messages in order, but Lambda concurrency must be set to 1 per queue to maintain order. Higher concurrency breaks FIFO ordering. Use standard queues when order is not required.
2. **Lambda in a VPC with no NAT Gateway.** The function will have no internet access, which breaks calls to external APIs, S3 (without VPC endpoint), and other AWS services. Either add NAT Gateway or configure VPC endpoints for each service.
3. **Execution environment reuse and stale connections.** A database connection opened during a warm start may become stale after the DB-side idle timeout. Use a connection pool with health checks and lazy validation before use.
4. **Cold start during traffic spikes.** When traffic surges, Lambda creates many new execution environments simultaneously, which can overwhelm downstream resources (database connection pool, API rate limits). Use reserved concurrency and gradually increasing deployment.
5. **Deployment with new IAM roles not yet propagated.** If a function deployment changes IAM roles, there may be a propagation delay of several seconds. Implement a startup health check that the CI/CD pipeline waits on before marking the deployment successful.
6. **Lambda with over 1000 concurrent invocations hitting account limits.** The default AWS account concurrency limit is 1000 across all functions. Plan for increased limits and implement a concurrency management strategy with reserved concurrency.

## Validation Checklist

- [ ] Handler is decomposed into adapter, service, and data layers.
- [ ] External dependencies (DB connections, HTTP clients) are initialized outside the handler.
- [ ] Functions are instrumented with structured JSON logging including correlation ID.
- [ ] Reserved concurrency limit is configured for every function.
- [ ] DLQ is configured for every event-source-mapped function.
- [ ] Memory setting is chosen based on load testing at multiple memory levels.
- [ ] Timeout is set to P99.9 plus a 20-30% buffer.
- [ ] No secrets or environment-specific values are hard-coded in source.
- [ ] Function artifact size is under 50 MB compressed.
- [ ] Provisioned Concurrency or reserved capacity is configured for latency-sensitive functions.
- [ ] Throttles and DLQ metrics have CloudWatch alarms configured.
- [ ] Function is not inside a VPC unless it accesses VPC-only resources.
- [ ] Deployment artifact is built once in CI and promoted through environments without rebuilding.
- [ ] Distributed tracing is enabled and traces are sampled at appropriate rates.
- [ ] Unit tests exist for each layer with realistic event fixtures.

## Engineering Examples

### Example 1: Optimizing Lambda Cold Starts for a Node.js API

A REST API built with AWS Lambda, API Gateway HTTP API, and Node.js 20. The function was experiencing 3-second cold starts that violated the 500 ms P99 latency SLO.

Optimizations applied:

1. **Modular SDK imports:** Replaced `const AWS = require('aws-sdk')` with individual clients from `@aws-sdk/client-dynamodb` and `@aws-sdk/client-sqs`.
2. **Dependency pruning:** Removed `moment` (replaced with native `Intl.DateTimeFormat`), removed `lodash` (replaced with native methods), and removed `axios` (used native `fetch` introduced in Node 18).
3. **Lazy initialization:** The DynamoDB client and configuration loader are initialized at module level but the actual table name resolution and schema validation are deferred to first invocation.
4. **Provisioned Concurrency:** Set a baseline of 10 provisioned environments with Application Auto Scaling to handle spikes.

Result: Cold start time reduced from 3200 ms to 280 ms. Warm invocation times remained at 15 ms. The annual Lambda cost decreased by 40% due to reduced execution time.

### Example 2: Fan-Out Pattern with SQS and Lambda

An order processing system where one incoming order event must trigger inventory deduction, payment processing, shipping label generation, and notification dispatch.

Architecture:
- API Gateway receives the `OrderCreated` event and writes it to an SQS standard queue.
- A dispatcher Lambda reads from the queue, validates the event, and publishes to three SNS topics: `inventory`, `billing`, `shipping`.
- Each SNS topic fans out to its own SQS queue, consumed by a dedicated Lambda function.
- Each consumer function has its own reserved concurrency, timeout, and DLQ.

Key decisions:
- Batch size on the dispatcher: 1 to avoid partial batch failures in the fan-out logic.
- `bisectBatchOnError: true` on consumer queues to isolate poison-pill messages.
- Each consumer function idempotent: checks a `processed_events` DynamoDB table with TTL before processing.

This pattern handles 1000 orders/second with no data loss, automatic retry on downstream failures, and independent scaling of each processing step.

### Example 3: Error Handling with DLQs for Serverless Event Processing

A document processing pipeline: S3 uploads trigger Lambda to OCR the document and store results in DynamoDB.

Failure scenarios handled:
1. **Corrupted PDF:** Lambda throws validation error immediately. The S3 event is retried 3 times by Lambda, then routed to a DLQ SQS queue. A monitoring Lambda polls the DLQ and sends a notification to the operations team.
2. **DynamoDB write throttling:** The function catches `ProvisionedThroughputExceeded` and throws a retryable error. Lambda retries with backoff (up to 6 hours of retries by default if DLQ is not triggered).
3. **Out of memory:** If the PDF is too large, the function times out. Configured memory to max (10 GB) and timeout to 5 minutes for large documents. Documents exceeding limits are sent to the DLQ with a structured error payload.

DLQ processing runbook:
- DLQ alarm triggers a Slack notification.
- An operator examines the DLQ message, checks the error type, and either replays the message (fixing the root cause first) or discards it.
- For replay, the message is sent back to the source SQS queue via the AWS Console or CLI.
