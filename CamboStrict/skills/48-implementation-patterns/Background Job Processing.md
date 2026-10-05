# Background Job Processing

## Purpose

Establish a comprehensive system for offloading long-running, scheduled, or failure-prone work from the main application request cycle into reliable background job queues. This skill covers job definition, queuing, worker processing, retry logic with backoff, dead letter queues, scheduled/cron jobs, prioritization, concurrency control, progress tracking, idempotency, and graceful shutdown. The goal is background processing that never loses jobs, handles failures gracefully, and scales with application demand.

## Responsibilities

- Managing job queues as the primary mechanism for decoupling application logic from background work — every operation that takes more than 200ms, has a high failure probability, or does not need an immediate response should be queued as a background job.
- Implementing worker architecture that processes jobs from queues with configurable concurrency, graceful shutdown, and health monitoring.
- Configuring job retry policies with exponential backoff and jitter so that transient failures (network timeouts, database deadlocks, rate limits) are retried without overwhelming downstream services.
- Routing permanently failed jobs to a dead letter queue for manual inspection and replay, preventing queues from being blocked by poison messages.
- Scheduling recurring jobs (cron) for periodic tasks: daily report generation, weekly data cleanup, hourly cache warming, and minutely health checks.
- Implementing job prioritization: high-priority jobs (payment processing, password reset emails) are processed before low-priority jobs (analytics aggregation, data exports) even if enqueued later.
- Controlling concurrency per job type and globally: limiting the number of simultaneous jobs that process video transcoding (max 2 concurrent, resource-intensive) vs email sending (max 20 concurrent, I/O-bound).
- Tracking job progress for long-running operations: exposing progress percentage (0-100) and status updates so the application can show progress bars or status indicators to users.
- Designing idempotent job execution: a job must be safe to run multiple times (at-least-once delivery) without producing duplicate side effects — using idempotency keys, upsert operations, or transactional outbox patterns.
- Implementing graceful shutdown: when a worker process receives a SIGTERM, it stops accepting new jobs, waits for running jobs to complete (with a configurable timeout), and then exits cleanly without losing jobs.

## Decision Process

1. Identify job boundaries: analyze the application for operations that should be background jobs — all external API calls (email, SMS, push notifications), file processing (image resizing, video transcoding, CSV parsing), long database operations (report generation, data migration), and scheduled maintenance tasks.
2. Choose a job queue infrastructure: Redis-backed queues (Bull, BullMQ, Sidekiq) for most applications due to low latency and simple setup; RabbitMQ or Amazon SQS for high-throughput or guaranteed delivery requirements; Google Cloud Tasks or Azure Queue for serverless environments.
3. Define job types and schemas: each job type has a unique name (`send_email`, `transcode_video`, `generate_report`), a typed payload (JSON schema or zod schema), and a handler function. Document the expected input and output for each job type.
4. Configure retry policy per job type: transient failures (network errors, 5xx, timeouts) → retry with exponential backoff (1min, 2min, 4min, 8min, 16min, max 5 retries). Permanent failures (invalid input, authentication errors) → no retry, send to dead letter immediately. Rate limit (429) → retry after `Retry-After` header value.
5. Design dead letter queue: create a separate DLQ queue/bucket for jobs that exceeded max retries. DLQ jobs include the original payload, error message, retry count, and timestamps. Set up alerts when DLQ size exceeds a threshold (e.g., >10 jobs in DLQ triggers a Slack notification).
6. Implement job prioritization: use Bull's priority system (1-100, lower = higher priority) for job types. Critical jobs (payment processing, password reset) get priority 1; user-facing jobs (email notifications, file processing) get priority 50; background analytics get priority 100.
7. Configure concurrency: per-job-type concurrency limits for resource-intensive operations (video transcoding: 2, image processing: 4) and global concurrency limit for the worker. Monitor CPU, memory, and database connection pool usage to tune concurrency.
8. Implement progress tracking for long jobs: jobs that take >10 seconds should call `job.progress(percentage)` periodically. The application polls or subscribes to job:completed events to update the UI.
9. Ensure idempotency: every job payload should include an idempotency key (e.g., `{ idempotencyKey: "payment:123:2024-01-01" }`). The job handler checks if the operation was already completed (check a processed_jobs cache or database column) and skips if already done.
10. Design graceful shutdown: catch SIGTERM/SIGINT, set worker to `paused` state (no new jobs), wait for running jobs to finish with a timeout (30s default), and then exit. Jobs that don't complete within the timeout are re-queued (returned to queue with `incomplete` status) automatically by the queue system.

## Inputs

- Job requirements: list of operations to be background-processed, their expected duration, resource requirements (CPU, memory, I/O), and failure profiles.
- Performance SLAs: maximum acceptable delay from enqueue to job completion for each job type (email: <1min, video transcoding: <10min, report generation: <1hr).
- Queue infrastructure: Redis connection details, SQS queue ARNs, or RabbitMQ connection string. Queue configuration (max concurrency, retry counts, TTLs).
- Job payload schemas: TypeScript types or JSON schemas defining the input data for each job type, matching the producer's data format.
- Scheduling requirements: cron expressions and timezone for recurring jobs, along with the job payload (which may be empty or contain configuration).
- Monitoring integration: metrics endpoint (Prometheus, DataDog) for job success/failure rates, queue depth, processing latency, and alerting thresholds.

## Outputs

- Job queue configuration: queue definitions with retry policies, TTLs, deduplication windows, priority settings, and concurrency limits for each job type.
- Job handler modules: typed handler functions for each job type that receive the job payload, perform the work, update progress, and handle errors appropriately.
- Worker service: a worker process (CLI command, Docker container, or serverless function) that polls queues and executes job handlers with concurrency control and graceful shutdown.
- Scheduler/cron service: a scheduler process that enqueues recurring jobs on schedule, with leader election to prevent duplicate scheduling in multi-instance deployments.
- Dead letter queue processor: a management UI or CLI tool for viewing DLQ jobs, inspecting error details, replaying fixed jobs, and discarding unrecoverable jobs.
- Monitoring dashboard: dashboards showing queue depth, job processing rate, success/failure rate, processing latency (p50, p95, p99), and DLQ size with alerting.
- Idempotency layer: a utility or middleware that checks/sets idempotency keys in Redis or database before executing job handlers, preventing duplicate side effects.

## Rules

1. Never run long-running operations synchronously in the request-response cycle — any operation that takes more than 200ms, involves an external API, or has a non-trivial failure rate must be queued as a background job.
2. Always set a TTL (time-to-live) for every job — jobs that cannot be processed within the TTL (e.g., password reset email older than 1 hour) should be automatically discarded rather than processed late.
3. Always use exponential backoff with jitter for retries — fixed-interval retries cause thundering herd problems when all retries happen simultaneously.
4. Never retry a job that will always fail (invalid input, authentication error, missing resource) — detect permanent failures and send to dead letter queue immediately without retrying.
5. Always implement idempotency for jobs that have side effects — at-least-once delivery means a job may run multiple times; without idempotency, duplicate charges, duplicate emails, and duplicate records occur.
6. Never enqueue a job without a unique identifier — every job must have a `jobId` or `idempotencyKey` that can be used for deduplication and traceability.
7. Always monitor queue depth and job age — set alerts on queue depth exceeding a threshold (e.g., >1000 jobs) and on oldest job age exceeding the expected processing time (e.g., >30 minutes).
8. Never throw unhandled exceptions in a job handler — wrap the handler body in try/catch, catch expected errors, and decide for each error type whether to retry, fail, or move to DLQ.
9. Always provide progress updates for jobs expected to take longer than 10 seconds — the application UI should be able to display a progress bar or status indicator.
10. Never deploy new job handler code without ensuring all currently queued jobs of that type are compatible with the new handler — use payload versioning or graceful backward compatibility.

## Best Practices

1. Use a mature job queue library (Bull, BullMQ, Sidekiq, Celery) rather than building on raw Redis lists — these libraries handle job serialization, retries, scheduling, rate limiting, and monitoring with battle-tested implementations.
2. Keep job payloads small and serializable (JSON) — include only IDs and references (e.g., `{ userId: 123, template: "welcome_email" }`), not large objects. The job handler fetches full data from the database using the IDs.
3. Version job payloads to handle handler changes: include a `version` field in the payload (e.g., `1`). When the handler changes incompatibly, create a new handler version (`sendEmailV2`) that processes old and new payloads, then drain old-format jobs before removing the old handler.
4. Implement rate limiting at the queue level for operations that call external APIs with rate limits (SendGrid: 100 emails/second, Twilio: 1 SMS/second). Use Bull's rate limiter or a token bucket to space out jobs.
5. Use separate queues for different job categories: a `critical` queue (high priority, low concurrency for payment jobs), a `default` queue (normal priority, normal concurrency), and a `bulk` queue (low priority, high concurrency for analytics).
6. Implement stall detection: if a worker picks up a job but doesn't complete it within the stall timeout (e.g., video transcoding: 5 minutes without progress update), another worker should pick it up. Bull uses "stalled jobs" detection for this.
7. Use job lifecycle events for observability: log `completed`, `failed`, `stalled`, and `delayed` events with job ID, type, duration, and error details — structured logging enables debugging and metrics.
8. Set `removeOnComplete` and `removeOnFail` to manage queue memory — keep completed jobs for 24 hours (for debugging) and failed jobs for 7 days (for DLQ processing), then auto-remove them.
9. Test job handlers with integration tests that enqueue a real job and verify the side effect (email sent, file created, database updated), not just unit tests of the handler function in isolation.
10. Implement leader election for cron jobs in multi-instance deployments — use Redis locks or Bull's `RepeatableJob` mechanism that only allows one instance to schedule recurring jobs, preventing duplicate cron firings.

## Anti-patterns

1. Synchronously processing long-running operations in the request cycle (e.g., waiting 30 seconds for an email to send before returning the HTTP response) — this ties up server resources and creates a poor user experience.
2. Using cron jobs for everything instead of job queues — cron jobs run on a fixed schedule regardless of whether there's work to do, and if the previous run hasn't finished, the next run starts anyway, causing overlap and resource contention.
3. Infinite retries with no backoff — if a downstream service is down, retrying every second for hours makes the outage worse by hammering the failing service.
4. Storing large payloads in the job queue — enqueuing a 10MB CSV file as the job payload overloads Redis/SQS memory; instead, store the file in object storage and include the file reference in the payload.
5. Not handling the "poison pill" scenario — a single malformed job can crash the worker, get retried, crash again, and block all other jobs. Use dead letter queues and maximum retry limits to isolate bad jobs.
6. Running jobs with unlimited concurrency — 100 simultaneous video transcodes can saturate CPU, memory, and disk I/O, slowing down all other jobs and potentially crashing the server.
7. Ignoring job processing latency — if the queue depth is high but jobs complete quickly, that's fine; if the queue depth is low but the oldest job is hours old, there's a worker issue or a stalled job.
8. Deploying new job handlers without draining the queue of old-format jobs — old jobs with the old payload format will crash the new handler, filling the dead letter queue.

## Edge Cases

1. Worker crash mid-job: if a worker crashes (OOM, hardware failure, kill -9) while processing a job, the job is "in flight" but never completed. The queue system's stalled job detection (visibility timeout in SQS, stalled job check in Bull) re-queues the job for another worker.
2. Duplicate job enqueue due to network retry: the producer enqueues a job, the queue responds (ack), but the producer doesn't receive the response due to network issue and retries. The idempotency key prevents the job from executing twice.
3. Job depends on another job (chaining): a "generate report" job depends on "aggregate data" completing first. Use job chaining (`job.then(nextJob)`) or a workflow engine (Bull's `QueueFlow` or Temporal) to handle dependencies, not polling from the dependent job.
4. Scheduled job misalignment on daylight saving time: a cron job at "2:30 AM" may run twice or not at all during DST transitions. Use UTC for all cron schedules and convert to user timezone only when rendering.
5. Queue backpressure: if the producer enqueues jobs faster than workers can process them, queue depth grows unbounded. Implement backpressure: the producer should check queue depth before enqueuing and apply its own rate limiting or alerting.
6. Job handler throws an error after partial side effects: a "charge credit card and send confirmation email" job charges the card but crashes before sending the email. Since the job is retried, the card is charged twice. Solution: separate jobs (charge_card, send_confirmation) or make the second step recoverable.
7. Database connection pool exhaustion from workers: many workers each holding a database connection can exhaust the connection pool. Limit global worker concurrency to `pool_size - 5` to reserve connections for web requests.
8. Redis outage: if Redis (the queue backend) goes down, no jobs can be enqueued or processed. Implement circuit breaker: if Redis is down, fail the enqueue operation immediately and return a 503 to the client rather than hanging indefinitely.

## Validation Checklist

- [ ] Every long-running or failure-prone operation is queued as a background job — no synchronous email sending, image processing, or external API calls in request handlers.
- [ ] Retry policy is configured per job type: exponential backoff with jitter for transient failures, no retry for permanent failures (DLQ instead).
- [ ] Dead letter queue is configured — jobs that exceed max retries are routed to DLQ and never lost.
- [ ] Job idempotency is implemented using idempotency keys — duplicate job execution does not produce duplicate side effects.
- [ ] Graceful shutdown works: SIGTERM stops accepting new jobs, waits for running jobs to complete (max 30s), and re-queues incomplete jobs.
- [ ] Cron/scheduled jobs are configured with UTC timezone and leader election to prevent duplicate execution.
- [ ] Concurrency limits are per job type (video: 2, email: 20) and globally (max 50 jobs total) — verified with load testing.
- [ ] Job payloads are small (<10KB, contain only IDs and references) — no large objects or files in the queue.
- [ ] Progress tracking is implemented for jobs expected to take >10 seconds — progress is reported at meaningful intervals.
- [ ] Queue depth and job age are monitored with alerts — >1000 queue depth or >30 min oldest job triggers notification.

## Engineering Examples

### Example 1: Implementing a Video Transcoding Pipeline with Job Queues

A video platform allows users to upload videos up to 4GB. When a video is uploaded, a `transcode_video` job is enqueued with payload `{ videoId: 456, sourceUrl: "s3://uploads/video.mp4", formats: ["mp4", "webm", "hls"], resolutions: ["720p", "1080p"] }`. The job handler: 1) updates the video status to "processing", 2) uses FFmpeg to transcode to each format/resolution combination, 3) uploads transcoded files to S3 with correct content types, 4) updates the video record with URLs and duration, 5) sets status to "ready". Progress is reported at each transcoding step (e.g., 25% after 720p MP4, 50% after 1080p MP4, etc.). Concurrency is limited to 2 simultaneous transcodes per worker (CPU-intensive). Retry policy: 3 retries with 5min, 15min, 30min backoff. If all retries fail, the job goes to DLQ and the video status is set to "failed" with an error description. The frontend polls `GET /api/videos/456` for status updates and shows a progress bar. Chained job: after transcoding completes, a `generate_thumbnail` job is enqueued with the transcoded video URL.

### Example 2: Designing a Scheduled Report Generation System

A SaaS analytics platform generates weekly and monthly reports for each customer account. A cron job (run weekly on Monday at 2:00 AM UTC) queries all active accounts and enqueues a `generate_report` job per account: `{ accountId: 789, reportType: "weekly", dateRange: { start: "2024-01-01", end: "2024-01-07" }, format: "pdf" }`. The job handler queries the data warehouse for the account's metrics, generates a PDF using Puppeteer with an HTML report template, uploads the PDF to S3 with a signed URL, and updates the account's report record. Priority is low (100) — reports can take hours and that's acceptable. Concurrency is 5 (to not overwhelm the data warehouse). If a job fails (data warehouse timeout), it retries with exponential backoff. If the job fails permanently (account cancelled mid-processing), it goes to DLQ and an admin is notified. The cron job uses leader election (Redis lock with `setnx`, TTL = job interval) so only one instance enqueues the jobs. After all report jobs complete, a summary `send_report_digest` job emails each account admin a link to their report.

### Example 3: Building a Dead Letter Queue for Failed Payment Retries

A subscription platform processes recurring payments. Every billing cycle, a `process_payment` job is enqueued for each active subscription: `{ subscriptionId: 123, amount: 29.99, currency: "USD", idempotencyKey: "payment:123:2024-01-01" }`. The handler charges the payment provider (Stripe). Possible outcomes: success (job completes), insufficient funds (retry with backoff: 1 day, 3 days, 7 days, 14 days), expired card (retry with notification to update card), fraud decline (no retry — send to DLQ). After all retries fail, the job moves to the dead letter queue. The DLQ processor is a dashboard where admins can: view the job payload and error history, manually trigger a retry (after customer updated their card), or mark the subscription as cancelled. An alert is sent to Slack when any payment DLQ has jobs >10, indicating a potential systemic issue. The idempotency key prevents double-charging if the job is retried after a successful charge (the handler checks if `payment:123:2024-01-01` was already processed). Graceful shutdown ensures in-flight payment jobs are not lost: the worker waits up to 30 seconds for current jobs to finish before exiting.
