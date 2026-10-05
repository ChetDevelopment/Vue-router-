# Observability

## Purpose

Build systems that are inherently understandable from the outside by emitting structured data about their internal state. Observability goes beyond monitoring—it enables engineers to ask arbitrary questions about system behaviour without needing to deploy new code. By correlating logs, metrics, and traces, teams can debug issues across distributed systems, understand performance characteristics, and make data-driven decisions about architecture changes.

## Responsibilities

- Implement the three pillars of observability (logs, metrics, traces) for every service.
- Adopt the OpenTelemetry standard for instrumentation to avoid vendor lock-in.
- Ensure distributed tracing spans are propagated across service boundaries (HTTP, message queues, gRPC).
- Implement sampling strategies that balance observability completeness with cost.
- Correlate logs, metrics, and traces so engineers can navigate between them seamlessly.
- Drive observability-driven development: instrument new features as they are built, not retrofitted.
- Maintain the observability infrastructure (tracing backend, log aggregator, metrics store) and ensure it scales with the system.

## Decision Process

1. Determine the interaction pattern of the service: synchronous (HTTP/gRPC request-response), asynchronous (message queue, event bus), or batch (scheduled job, stream processor). Each pattern requires different instrumentation.
2. For synchronous services, instrument with OpenTelemetry auto-instrumentation to capture inbound and outbound HTTP/gRPC calls. This provides distributed tracing with minimal code changes.
3. For asynchronous services, manually instrument span creation and context propagation. Message queues cannot be auto-instrumented—you must inject trace context into the message headers on publish and extract it on consume.
4. For batch jobs, create a root span for the job execution and child spans for each unit of work (e.g., per record processed). Include the batch ID and record offset as span attributes.
5. Choose the sampling strategy:
   - **Head-based (probability) sampling**: Sample a fixed percentage of traces (e.g., 5% of all requests). Simple but misses rare events.
   - **Tail-based sampling**: Sample based on trace properties after the trace completes (e.g., sample all traces with errors, sample 1% of successful traces). More accurate but requires a tracing backend that supports it.
   - **Dynamic sampling**: Increase sampling rate for high-value requests (paying customers, API endpoints with high business impact) and decrease for low-value health checks.
   - **Edge case sampling**: Always sample the first request from a new user, requests that trigger alerts, and requests that take longer than the p99 latency.
6. Define span attributes that are included in every span: service name, span kind (client/server/internal), HTTP method, HTTP status code, URL path (with IDs redacted), and duration. Add business-specific attributes (order ID, user ID, payment ID) for filtering.
7. Configure the OpenTelemetry exporter to send spans to the tracing backend (Jaeger, Tempo, Honeycomb, Datadog). Use batch exporting with gzip compression to minimise network overhead.
8. Correlate the three pillars: include the trace ID and span ID in every log entry. Include the trace ID as a metric label on key RED metrics. This enables the workflow: dashboard shows latency spike → click to see trace → click to see associated logs.
9. Implement observability-driven development (ODD): before writing a new feature, define what questions you need to answer about it in production. Instrument the code to answer those questions. Then write the feature.
10. Test the observability instrumentation with a chaos experiment: introduce a failure (slow database, dropped connection) and verify that the traces, logs, and metrics tell the complete story of what went wrong.

## Inputs

- Service architecture diagrams showing service boundaries and communication patterns
- OpenTelemetry SDK and collector configuration
- Business requirements for understanding user behaviour in production
- Incident post-mortems highlighting observability gaps
- Cost constraints for observability infrastructure (storage and compute for traces)
- Existing logging and metrics infrastructure (log aggregator, Prometheus, Grafana)

## Outputs

- Services instrumented with OpenTelemetry SDK producing traces, metrics, and logs
- Distributed traces spanning all services in a request path
- Trace context propagated across HTTP headers, message queue headers, and gRPC metadata
- Correlation between pillars: logs include trace ID, metrics include trace ID as a label
- Sampling configuration balancing completeness and cost
- Service maps showing dependencies and traffic flow
- Observability dashboards that surface RED metrics with trace drill-down capability

## Rules

1. Every service must emit traces, metrics, and logs. A service that emits only logs is not observable—you cannot understand its performance or its interactions with other services. A service that emits only metrics cannot be debugged when a specific request fails.
2. Every span must have a meaningful name. `HTTP GET` is a bad span name—it tells you nothing. `GET /orders/{id}` is good. Include the route pattern, not the actual path with IDs.
3. Do not sample out error traces. Errors are the most important traces for debugging. Sample 100% of traces that contain an error span, even if the overall sampling rate is 1%. This is non-negotiable.
4. Do not propagate sensitive data in span attributes. PII, credentials, and payment details must never appear in trace data. Span attributes are often stored longer than logs and may be accessible by more people.
5. Do not create spans for trivial operations. A span for reading a single cache key adds overhead without value. Create spans for operations that cross a network boundary, perform significant computation, or are potential failure points.
6. Do not use metrics where traces are more appropriate. Metrics aggregate data and lose individual request context. If you need to debug a specific slow request, you need a trace, not a metric.
7. Do not use traces where metrics are more appropriate. If you need to alert on a sustained high error rate, a metric is the right tool. Traces are for individual request analysis, not aggregated alerting.
8. Span duration must be measured correctly. Use the system's monotonic clock, not the wall clock, to measure span duration. Wall clock time can jump forward or backward due to NTP adjustments, causing negative or wildly inaccurate durations.
9. Do not block the request on trace export. Trace exporters should be asynchronous and non-blocking. If the tracing backend is slow or unavailable, the request must still complete normally. Use a timeout on the export and drop spans if the exporter queue is full.
10. Propagate trace context everywhere: HTTP headers, message queue headers, gRPC metadata, and even database query comments (for SQL databases that support it). Without propagation, the trace is broken and useless.

## Best Practices

1. Use OpenTelemetry as the single instrumentation standard. Avoid vendor-specific SDKs (Datadog APM, New Relic agent) directly in your code. OpenTelemetry abstracts the vendor and gives you the freedom to switch backends without re-instrumenting.
2. Use semantic conventions for span attributes. OpenTelemetry defines standard attribute names for HTTP (`http.method`, `http.status_code`, `http.url`), database (`db.system`, `db.statement`), messaging (`messaging.system`, `messaging.destination`), and RPC (`rpc.service`, `rpc.method`). Follow these conventions so that all services emit standardised data.
3. Add business-specific attributes to spans. In addition to HTTP attributes, add `order.id`, `user.id`, `payment.id`, `tenant.id`. These enable filtering traces by business entity, which is invaluable for debugging customer-reported issues.
4. Use baggage for cross-cutting concerns. OpenTelemetry baggage allows you to propagate key-value pairs across service boundaries without adding them to every RPC call. Use baggage for tenant ID, user role, and A/B test variant.
5. Implement consistent span hierarchy: a root span for the request, child spans for each outbound call (database query, HTTP call to another service, message publish), and nested spans for internal operations that are potential failure points.
6. Use sampling with a purpose. Default head-based sampling at 1% is a reasonable starting point, but add rules to increase sampling for:
   - Requests from paying customers (sample at 100%).
   - Requests to new or modified endpoints (sample at 100% for the first week after deployment).
   - Requests that exceed the p99 latency threshold (sample at 100%).
   - Health check endpoints (sample at 0%—they add no value).
7. Correlate logs and traces by including `trace_id` and `span_id` in every structured log entry. This is the single most impactful observability investment you can make. When an error occurs, you can find the trace that shows exactly what happened before, during, and after the error.
8. Build a "trace view" button into your logging dashboard. Every log entry that has a trace ID should have a clickable link that opens the trace in the tracing backend. This reduces the time to understand an error from minutes to seconds.
9. Monitor the observability pipeline itself. Track: spans exported per second, export error rate, export latency, sampler decision count. Alert if the export error rate exceeds 1% or if the export queue is consistently full (indicating the exporter cannot keep up).
10. Use service graphs (auto-generated from trace data) to visualise dependencies and traffic flow. A service graph shows you which services call which other services, with request rate and error rate on each edge. This is invaluable for understanding the blast radius of a failure.

## Anti-patterns

1. **Observability as an afterthought**: Building a feature and then adding observability instrumentation later. This leads to incomplete traces, missing metrics, and log statements that do not contain the right context. Instrument during development, not after.
2. **Only logs**: Relying solely on logs for debugging distributed systems. Logs from a single service cannot show you the full picture of a request spanning 10 services. You need traces to see the full path.
3. **Manual correlation**: Manually correlating log entries across services by timestamp. Timestamps are not synchronised perfectly across machines. Use trace IDs for precise correlation.
4. **Over-sampling**: Sampling 100% of traces without considering the cost. Tracing 100% of requests for a high-traffic service (10,000 req/s) generates terabytes of trace data per day and significantly increases infrastructure cost. Sample strategically.
5. **PII in traces**: Including customer email, IP address, or credit card numbers in span attributes. Span data is often stored in a different system (tracing backend) with different access controls than logs. Treat span attributes as potentially public.
6. **No error budget for observability**: Not allocating compute and storage resources for the observability stack. Instrumentation that is throttled or dropped because the observability backend cannot handle the load is effectively absent.
7. **Observability silos**: Logs in Elasticsearch, metrics in Prometheus, traces in Jaeger, with no cross-linking or common IDs. Engineers waste time switching between tools and manually correlating data.

## Edge Cases

1. **Async processing with no parent request**: Background workers and event consumers do not have an incoming HTTP request. Generate a root trace context when the job starts and close it when the job completes. Include the job type, job ID, and any relevant payload summary as span attributes.
2. **Head-of-line blocking tracing**: When a slow consumer blocks a queue, the trace for the publishing service shows a successful publish, but the consuming service never starts processing. The missing consumer trace is itself a signal. Monitor for traces that were started (publish) but never completed (consume).
3. **Sampling conflict**: Head-based sampling selects 1% of traces, but the error rate in the system is 0.5%. You should be sampling 100% of error traces, but head-based sampling may discard the error trace before it is identified as an error. Use tail-based sampling or dynamic sampling that boosts error trace selection.
4. **Trace context in streaming systems**: Systems like Kafka Streams, Apache Flink, or Spark Streaming process records in micro-batches. Traditional request-scoped tracing does not apply—a single batch may contain records from thousands of original requests. Use "sampled trace" attributes on individual records within the batch and create a separate trace for the batch processing itself.
5. **Span attribute cardinality**: Adding high-cardinality attributes (user ID, session ID, request ID) to spans can cause performance issues in the tracing backend. Use low-cardinality attributes (user tier, region, endpoint name) for filtering and include high-cardinality values only in log entries.
6. **Different sampling rates per service**: If the frontend service samples at 1% and the downstream payment service samples at 10%, a trace may be incomplete—the frontend span exists but the payment span was not sampled. Align sampling configurations across services or use a centralised sampling decision service.

## Validation Checklist

- [ ] Every service emits OpenTelemetry traces, metrics, and logs.
- [ ] Trace context is propagated across all service boundaries (HTTP, gRPC, message queues).
- [ ] All log entries include `trace_id` and `span_id` fields.
- [ ] Error traces are sampled at 100%.
- [ ] No PII or secrets are present in span attributes.
- [ ] Span names follow OpenTelemetry semantic conventions and include route patterns.
- [ ] Sampling strategy is documented and configurable without code changes.
- [ ] The observability pipeline is monitored (export rate, error rate, latency).
- [ ] A service graph is generated from trace data and is up-to-date.
- [ ] Observability instrumentation is included in the same PR as the feature (not retrofitted).
- [ ] The on-call engineer can go from an alert → dashboard → trace → logs in under 30 seconds.
- [ ] Cost of observability infrastructure is tracked and reviewed monthly.

## Engineering Examples

### Example 1: Implementing distributed tracing across microservices

A ride-sharing platform has three services: the mobile gateway, the ride matching service, and the payment service. A user's request to book a ride flows through all three services.

The gateway service receives the HTTP request and creates the root span:

```python
from opentelemetry import trace
from opentelemetry.propagate import inject

tracer = trace.get_tracer(__name__)

async def handle_book_ride(request):
    with tracer.start_as_current_span("POST /rides/book") as span:
        span.set_attribute("user.id", request.user.id)
        span.set_attribute("ride.type", request.ride_type)
        # ... process request ...
        # Make HTTP call to ride matching service
        headers = {}
        inject(headers)  # Inject trace context into outgoing headers
        await http_client.post("http://matching/rides", headers=headers, json=body)
```

The matching service receives the request and extracts the trace context:

```python
from opentelemetry.propagate import extract

async def handle_match_ride(request):
    context = extract(request.headers)
    with tracer.start_as_current_span("POST /rides/match", context=context) as span:
        span.set_attribute("ride.id", ride_id)
        # ... matching logic ...
        # Publish message to payment queue
        headers = {"traceparent": span.get_span_context().trace_id}
        await queue.publish("payment_required", headers=headers, body=message)
```

The payment service consumes the message and extracts the trace context from the message headers:

```python
async def handle_payment_message(message):
    context = extract(message.headers)
    with tracer.start_as_current_span("process payment", context=context) as span:
        span.set_attribute("payment.amount", message.amount)
        # ... process payment ...
```

When debugging a slow booking, the engineer queries the tracing backend for traces with `user.id = "user_456"`. The trace shows: gateway service completed in 200ms (normal), matching service completed in 50ms (normal), payment service took 4500ms (slow). The engineer clicks on the payment span and sees a span attribute `db.statement: "UPDATE payments SET status = 'completed' WHERE id = ?"` with a duration of 4400ms. The database query is slow. The engineer then checks the database monitoring dashboard and sees a missing index on the `payments` table. The fix: add an index on `status`. The entire debugging process took 5 minutes because the trace told the complete story.

### Example 2: Correlating logs and traces for debugging

An e-commerce platform's checkout service logs the following entry when a payment fails:

```json
{
  "timestamp": "2025-07-17T10:30:00Z",
  "level": "ERROR",
  "message": "payment_failed",
  "service": "checkout-service",
  "trace_id": "tr_abc123",
  "span_id": "sp_def456",
  "user_id": "usr_789",
  "order_id": "ord_012",
  "error": "insufficient_funds",
  "payment_provider": "stripe"
}
```

The engineer clicks on the `trace_id` (which is a link in the logging dashboard) and opens the trace in the tracing backend. The trace shows:

- The checkout service called the payment service, which responded with HTTP 402.
- The payment service span shows a child span for the Stripe API call: `duration: 1200ms, http.status_code: 402`.
- The Stripe API call span has an attribute `stripe.error.code: "card_declined"`.

The engineer also sees a span for a database query that the checkout service ran before the payment call: `SELECT credit_limit FROM users WHERE id = ?`. The span shows `duration: 3000ms`—this is unusually slow. The engineer suspects that the slow database query caused the total checkout time to exceed a timeout threshold, which may have caused a different code path. By correlating the trace (showing the slow query) with the log (showing the payment failure), the engineer identifies two issues: a missing database index causing slow queries, and a payment failure that may have been triggered by the slow query (the payment provider timed out). The root cause was the missing index. Fixing the index resolved both the slow query and the payment failure.

### Example 3: Using observability to diagnose a performance issue

A content streaming service experiences intermittent buffering during peak hours. Users report that videos pause and buffer, but the team cannot reproduce the issue internally.

The team uses observability to diagnose the issue:

1. **Metrics dashboard**: Shows that the CDN origin response time spikes from 50ms to 2000ms during peak hours, correlating with the buffering reports. The CDN origin is the application server, not a separate CDN provider.

2. **Traces**: The engineer filters for traces with `http.route = "/video/{id}"` and `duration > 1000ms` during the peak hour. Opening a slow trace shows:
   - The API server receives the request (10ms).
   - The server calls the metadata database to fetch video metadata (1500ms—slow).
   - The server calls the storage service to fetch the video file (800ms).
   - Total: 2310ms.

3. **Logs**: The engineer searches for logs with `trace_id` matching the slow trace. The logs show:
   ```
   {"trace_id": "tr_xyz", "message": "db.query.start", "query": "SELECT * FROM videos WHERE id = ?"}
   {"trace_id": "tr_xyz", "message": "db.query.end", "duration_ms": 1480}
   ```

4. **Span details**: The metadata span shows `db.statement: "SELECT * FROM videos v JOIN video_metadata vm ON v.id = vm.video_id WHERE v.id = ?"`. The query joins two large tables without an index on the join column.

5. **Metrics drill-down**: The engineer checks the database metrics dashboard and sees `database.table.scan.count` for the `video_metadata` table is high during peak hours. The table is being scanned instead of seeking an index.

The fix: add a composite index on `video_metadata.video_id`. After the index is added, the engineer monitors the same metrics: CDN origin response time drops back to 50ms, no more buffering reports. The traces now show the metadata query completes in 5ms instead of 1500ms.

The key insight: the engineer used metrics to identify the symptom (latency spike), traces to identify the root cause (slow database query), and logs to understand the exact query being executed. Without all three pillars, the diagnosis would have taken hours or days instead of 20 minutes.
