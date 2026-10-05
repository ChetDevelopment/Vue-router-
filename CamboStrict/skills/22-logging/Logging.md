# Logging

## Purpose

Implement structured, consistent, and actionable logging across all services to enable debugging, observability, auditing, and operational awareness. Logging is the first line of defence when something goes wrong in production—well-structured logs reduce mean time to resolution (MTTR) and provide the data needed to understand system behaviour.

## Responsibilities

- Define and enforce standard log formats (structured JSON) across all services.
- Select and maintain the logging library and configuration for the tech stack.
- Ensure all log entries include correlation IDs for request tracing across services.
- Implement log sampling for high-volume paths to balance observability with cost.
- Configure log aggregation and search infrastructure (Elasticsearch, Loki, CloudWatch Logs).
- Define log retention policies in accordance with compliance and cost requirements.
- Monitor logging health—ensure logs are being shipped and indexed, not dropped.
- Audit logs for accidentally logged secrets, PII, or sensitive data.

## Decision Process

1. Determine the log level for the event:
   - **DEBUG**: Detailed information for diagnosing problems. Not emitted in production under normal conditions. Enable via dynamic config for specific services or users during debugging sessions.
   - **INFO**: Normal operational events that confirm the system is working as expected. Examples: request started, request completed, cache refreshed, batch job started/finished.
   - **WARN**: Something unexpected happened but the system recovered automatically or the request can still succeed. Examples: retry attempt, rate limit approaching, degraded response from dependency.
   - **ERROR**: A condition that prevents the current operation from succeeding. The request fails but the service is still running. Examples: database query failed, payment declined, validation error.
   - **FATAL**: The service or component cannot continue and will shut down or crash. Examples: database migration failed on startup, out-of-memory error, configuration validation error on boot.
2. Determine if the event is actionable. If no one will take action based on the log entry, do not write it. INFO and above must justify their existence with a clear action or alert.
3. Decide whether the event is high-volume (>1000 events/second). If yes, apply sampling: log every event for ERROR and FATAL, but sample WARN at 10% and INFO at 1% during normal operations. Increase sampling during debugging sessions via dynamic config.
4. Check if the event contains sensitive data (PII, credentials, payment card numbers, session tokens). If yes, redact or hash the sensitive fields before logging. Never log raw request bodies that may contain sensitive data.
5. Determine the context to include: correlation ID, service name, timestamp (ISO 8601 UTC), severity, message, error stack trace (for ERROR/FATAL), and any business-relevant fields (user ID, order ID, resource ID). Do not log the entire request object.
6. Choose the destination: local stdout (container logs), a log aggregator, or a separate audit log stream. Security and audit events go to a dedicated stream with immutable retention.
7. Implement the log statement using the structured logging API. Use key-value pairs, not string interpolation. Example: `logger.info("order_created", order_id=order.id, total=order.total)` not `logger.info(f"Order {order.id} created for {order.total}")`.
8. Verify the log output in a development or staging environment. Check that fields are correctly structured, correlation IDs are propagated, and no sensitive data leaks.

## Inputs

- Service code that needs observability
- Correlation ID from the incoming request (HTTP header, message queue header)
- Business events that require an audit trail
- Error and exception objects with stack traces
- Configuration for log levels (default and dynamic overrides)
- Sampling rate configuration per service and log level

## Outputs

- Structured JSON log entries written to stdout/stderr in a consistent schema
- Correlation IDs attached to every log entry for request tracing
- Aggregated and indexed logs in the central logging platform
- Audit logs with immutable retention for compliance-relevant events
- Dashboards visualising log volume, error rates, and top error messages
- Alert rules that trigger on ERROR and FATAL log patterns

## Rules

1. Never log secrets. This includes passwords, API keys, session tokens, database connection strings, private keys, and any credential material. Use a log redaction library or a pre-commit hook to catch secrets before they reach the log stream.
2. Never log PII unless required by compliance and explicitly approved. If PII must be logged (e.g., for fraud investigation), log it in a separate, access-controlled stream with limited retention.
3. Never log in hot paths. A log statement in a tight loop (e.g., in a request parser, a data serializer, or a hot database query) can cause significant performance degradation. Evaluate the performance impact before adding a log statement.
4. Never log in catch blocks without re-throwing or handling the error. A log statement alone does not handle the error. If you catch an exception, log it and then re-throw, return a fallback, or take corrective action.
5. Do not log the same event at multiple levels. Choose one level and stick with it. Duplicate log entries create noise and increase costs.
6. Do not log stack traces for expected errors. A validation error does not need a stack trace. Reserve stack traces for unexpected exceptions at ERROR level.
7. Do not log in the constructor of a class. Constructor logging fires during dependency injection setup, creating noise in every test and startup sequence. Log at the point of actual use.
8. Do not log sensitive query parameters in URLs. A URL like `/api/users?token=abc123` should have the `token` parameter redacted before logging.
9. Do not log binary data or large objects. Log a reference (file path, object key, document ID) instead of the full payload. Large log entries increase shipping latency and storage costs.
10. All log entries must be parseable by automated tools. Use structured JSON, not free-form text. Free-form text logs require human reading and cannot be reliably searched or alerted on.

## Best Practices

1. Use structured logging libraries (structlog, slog, Serilog, python-json-logger) that output JSON by default. Avoid `printf`-style logging that produces unstructured text.
2. Include a correlation ID in every log entry. Generate it at the service boundary (API gateway or first service that receives the request) and propagate it via HTTP headers or message metadata. This connects logs across services.
3. Use consistent field names across services. Standardise on `correlation_id`, `service_name`, `duration_ms`, `status_code`, `error_kind`. A common schema makes cross-service queries possible.
4. Log at the boundary, not the interior. Log when a request enters the system, when it exits, and when it calls an external dependency. Internal function calls do not need logging—let the function's return value communicate success or failure.
5. Add contextual information to logs using a context object or thread-local storage. Every log statement in a request handler should automatically include the request ID, user ID, and tenant ID without explicitly passing them to each log call.
6. Use dynamic log level configuration so operators can increase logging verbosity for a specific service or user without redeploying. Tools like Flagger or K8s ConfigMap watches enable this.
7. Test log statements in CI. Write assertions that verify the presence of correlation IDs, the correct log level, and the absence of sensitive data. A "log linter" prevents common mistakes.
8. Sample high-volume logs strategically. Log 100% of errors, 10% of warnings, 1% of info, and 0% of debug by default. When debugging a specific user or request, increase the sampling rate for that correlation ID.
9. Use log rotation and retention policies. Keep hot logs for 7 days (fast search), warm logs for 30 days (slower search), and cold logs for 90 days (archived S3/Glacier). Compliance logs may require longer retention.
10. Monitor log shipping health. A silent log sink (logs are emitted but not indexed) is a dangerous blind spot. Alert when log shipping latency exceeds 5 minutes or when log volume drops below a threshold.

## Anti-patterns

1. **Logging everything**: Emitting debug-level logs for every line of code. This overwhelms storage, increases costs, and makes it harder to find real signals in the noise.
2. **Logging in catch blocks and swallowing**: Catching an exception, logging it, and continuing as if nothing happened. The system enters an inconsistent state and no one notices because the error was "handled."
3. **String interpolation logging**: `logger.info(f"User {id} logged in")` instead of `logger.info("user_login", user_id=id)`. String interpolation prevents automated parsing, correlation, and aggregation.
4. **Logging as debugging**: Adding temporary log statements to debug an issue, then forgetting to remove them. These accumulate and become noise. Use a debugger or structured debug logging that is off by default.
5. **Inconsistent field naming**: One service logs `userId`, another logs `user_id`, another logs `user-id`. Cross-service queries become impossible. Enforce a naming convention.
6. **Logging without context**: A log entry that says "operation failed" with no indication of what operation, for which user, on what resource. This is useless for debugging.
7. **Logging large objects**: Logging the full request or response body for every API call. This multiplies log storage, increases latency, and may log sensitive data.

## Edge Cases

1. **Logging during application startup**: Startup logs are critical for diagnosing deployment failures but are often lost because the log aggregator is not ready yet. Write startup logs to a local file as a fallback.
2. **Logging in shutdown hooks**: During a graceful shutdown, some dependencies (log aggregator client, network) may already be closed. Handle errors from the logging framework gracefully—do not crash during shutdown because of a failed log write.
3. **Logging from background jobs**: Background jobs (cron, queue workers) do not have an incoming HTTP request with a correlation ID. Generate a unique correlation ID per job execution and include the job name and execution ID in every log entry.
4. **Logging in libraries**: Third-party libraries may log at inappropriate levels or log sensitive data. Configure the logging framework to redirect third-party logs to a separate stream or suppress them entirely.
5. **Logging during a cascade failure**: When the system is under extreme load (thundering herd, DDoS), logging every request can make the situation worse. Implement a "log circuit breaker" that drops below-ERROR logs when the system is in a degraded state.
6. **Logging in serverless functions**: Serverless platforms (AWS Lambda, Cloud Functions) do not support log shipping via stdout to a sidecar. Write structured JSON to stdout and forward using the platform's native log subscription mechanism.
7. **Logging with zero-duration operations**: An operation that completes in under 1ms may show as `duration_ms: 0`. Log durations in microseconds or nanoseconds for sub-millisecond operations to avoid false-zero measurements.

## Validation Checklist

- [ ] All log entries use structured JSON format with consistent field names.
- [ ] Every log entry includes a correlation ID (from request context or generated for background jobs).
- [ ] No secrets, credentials, or PII appear in application logs.
- [ ] Log levels are used consistently: DEBUG for diagnostics, INFO for normal ops, WARN for recoverable issues, ERROR for failures, FATAL for crashes.
- [ ] No log statements in hot paths or tight loops.
- [ ] Log sampling is configured for high-volume services with a clear strategy.
- [ ] Log retention policies are defined and enforced (hot/warm/cold stages).
- [ ] Log shipping health is monitored with alerts for latency or volume drops.
- [ ] Audit logs are shipped to a separate, immutable stream with compliance retention.
- [ ] Dynamic log level configuration is available (no redeploy needed to change levels).
- [ ] Third-party library logs are configured to an appropriate level (typically WARN+).
- [ ] Stack traces are reserved for unexpected exceptions at ERROR level, not for validation errors.

## Engineering Examples

### Example 1: Adding structured logging to a distributed system

A Python e-commerce microservice originally logged with print statements:

```python
print(f"Order {order_id} created for user {user_id}")
```

This was replaced with structured logging using the `structlog` library:

```python
import structlog

logger = structlog.get_logger()

def create_order(user_id: str, items: list):
    logger.info("order.created", user_id=user_id, item_count=len(items))
    # ... business logic ...
    logger.info("order.completed", order_id=order.id, total=order.total)
```

In production, the output is a single JSON line per log entry:

```json
{"event": "order.created", "user_id": "usr_123", "item_count": 3, "timestamp": "2025-07-17T10:30:00Z", "service": "order-service", "correlation_id": "req_abc"}
{"event": "order.completed", "order_id": "ord_456", "total": 5999, "timestamp": "2025-07-17T10:30:01Z", "service": "order-service", "correlation_id": "req_abc"}
```

The structured format allows the aggregation platform to index `user_id` and `order_id` as searchable fields. The team can now query "all orders in the last hour with total > 5000" or "all events for a specific user_id across services."

### Example 2: Implementing correlation IDs for request tracing

A request enters the system through an API gateway. The gateway generates a correlation ID and passes it via an HTTP header to downstream services:

```
POST /orders
X-Correlation-Id: cid_abc123
```

The order service extracts the header and propagates it to the payment service via an HTTP client:

```python
import structlog

logger = structlog.get_logger()

async def handle_order_request(request):
    correlation_id = request.headers.get("X-Correlation-Id", str(uuid4()))
    structlog.contextvars.bind_contextvars(correlation_id=correlation_id)

    logger.info("order.request.received")
    payment_result = await payment_client.charge(
        amount=order.total,
        headers={"X-Correlation-Id": correlation_id}
    )
    logger.info("order.request.completed", payment_status=payment_result.status)
```

When the payment service processes the request, it reads the correlation ID from its request headers and includes it in all its log entries. Now a single query in the log aggregator—`{correlation_id="cid_abc123"}`—returns all log entries across the gateway, order service, and payment service for that request. This reduces MTTR from hours to minutes when debugging cross-service failures.

### Example 3: Avoiding common logging pitfalls

**Pitfall 1: Logging secrets**

```python
# Bad: logs the full database URL including password
logger.info("connecting_to_database", url=db_url)

# Good: logs the hostname only
from urllib.parse import urlparse
parsed = urlparse(db_url)
logger.info("connecting_to_database", host=parsed.hostname, port=parsed.port)
```

The team added a pre-commit hook that scans for patterns like `password=`, `token=`, `secret=` in log statements and blocks the commit with a warning.

**Pitfall 2: Logging in a hot path**

A logging statement was added to a deserialization function called 50,000 times per second:

```python
# Bad: log in every deserialization call
def deserialize(payload: bytes):
    logger.debug("deserializing_payload", size=len(payload))
    return json.loads(payload)
```

Each JSON serialization of the log entry added 0.2ms of overhead, increasing total response time by 10 seconds per second of wall time. Removed the log statement because the deserialization either succeeds (nothing to log) or throws an exception (which is caught at a higher level and logged with context).

**Pitfall 3: Logging PII**

A log statement accidentally included the user's email address:

```python
# Bad: logs email (PII in GDPR-regulated environment)
logger.info("user_registered", email=user.email, user_id=user.id)

# Good: logs only the user ID
logger.info("user_registered", user_id=user.id)
```

The team added a log review step in code review: every PR that adds a log statement is checked for PII fields. A linter rule flags any log field whose name contains `email`, `phone`, `address`, `ssn`, or `credit_card`.
