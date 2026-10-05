# Monitoring

## Purpose

Provide real-time visibility into system health, performance, and capacity through well-defined metrics, meaningful dashboards, and actionable alerts. Monitoring enables the team to detect, diagnose, and respond to issues before they impact users, and provides data-driven insights for capacity planning and performance optimisation.

## Responsibilities

- Define and publish service-level indicators (SLIs) and service-level objectives (SLOs) for every service.
- Implement the RED method (Rate, Errors, Duration) for request-driven services and the USE method (Utilization, Saturation, Errors) for resource-oriented components.
- Build and maintain monitoring dashboards that surface actionable information, not vanity metrics.
- Configure alerting rules with appropriate thresholds, durations, and severity levels to minimise alert fatigue.
- Maintain on-call rotations with clear escalation paths and runbooks for every alert.
- Regularly review and tune alert thresholds, SLO targets, and dashboard layouts based on operational experience.
- Ensure monitoring infrastructure itself is monitored (watch the watchers).

## Decision Process

1. Identify the service type: request-driven (API, web server, queue consumer) or resource-oriented (database, cache, load balancer, queue).
   - For request-driven services, apply the RED method: measure Request Rate, Error Rate (as a percentage of total requests), and Duration (latency percentiles).
   - For resource-oriented components, apply the USE method: measure Utilization (% time resource is busy), Saturation (queue length or over-provisioning), and Errors.
2. Define SLIs for each service. An SLI is a carefully defined quantitative measure of a specific aspect of the service. Examples: "proportion of HTTP GET /orders requests that complete in under 500ms" or "proportion of database queries that return successfully within 100ms."
3. Set SLO targets for each SLI. An SLO is the target value for the SLI over a measurement window. Example: "99.9% of HTTP GET /orders requests complete in under 500ms over a 30-day rolling window." SLOs should be ambitious but achievable—90% is too easy, 99.999% is probably too expensive.
4. Define alerting rules based on SLOs. Use the "burn rate" approach: alert when the SLO is at risk of being violated based on the current error rate over a short window. For example, for a 99.9% SLO over 30 days, alert if error rate exceeds 0.1% over a 1-hour window (1-hour burn rate of 1, meaning you'd exhaust your error budget in 30 days at this rate) or if it exceeds 2% over a 5-minute window (5-minute burn rate of 20, meaning you'd exhaust your error budget in 1.5 hours).
5. Select the metrics instrumentation library (Prometheus client, OpenTelemetry SDK, statsd) and instrument the service code. Export metrics on a `/metrics` endpoint for Prometheus scraping or push to a metrics aggregator.
6. Build a monitoring dashboard for each service. Include:
   - RED metrics for request-driven services (rate, error rate, latency p50/p95/p99).
   - USE metrics for resource-oriented components (CPU utilization, memory saturation, disk I/O errors).
   - SLO burn rate panels showing remaining error budget.
   - Top-level health summary (green/red status for each dependency).
7. Set up alert routing: P0 (critical) alerts page the on-call engineer via phone. P1 (high) alerts page via SMS. P2 (medium) create a ticket in the incident management system. P3 (low) log to a dashboard with no direct notification.
8. Test alerting rules with a chaos experiment or a synthetic transaction that triggers each alert path. Verify that the alert fires, routes correctly, and the runbook enables the on-call to resolve the issue.
9. Review and tune monthly. Each month, review all alerts that fired, drop noisy alerts, adjust thresholds, and update SLO targets based on actual performance.

## Inputs

- Service architecture diagrams showing dependencies and data flow
- Traffic patterns and expected request rates from load testing
- Historical incident data indicating what has broken in the past
- SLO targets defined in collaboration with product and business stakeholders
- Resource capacity limits (CPU cores, memory, disk IOPS, network bandwidth)
- On-call schedule and escalation policy

## Outputs

- Instrumented services exporting RED/USE metrics on a `/metrics` endpoint
- SLO definitions documented with measurement methodology and target values
- Monitoring dashboards for every service and the overall system
- Alerting rules with severity levels, thresholds, durations, and routing
- Error budget tracking dashboards showing remaining budget per SLO
- Runbooks for every alert that fires (what to check, how to fix, escalation path)
- Monthly monitoring review report with tuning recommendations

## Rules

1. Every alert must be actionable. If an alert fires and the on-call can take no action, it is noise. Delete the alert. Actionable means: there is a clear runbook step to fix the issue, or the alert triggers an automated remediation.
2. Every alert must have a runbook. An alert without a runbook is a guess. The runbook must include: what the alert means, how to verify it, how to fix it, and when to escalate.
3. Do not alert on symptoms that users can see and report. If users are already complaining, the alert is redundant. Alert on leading indicators that predict user impact before it happens.
4. Do not use static thresholds for dynamic systems. CPU at 80% may be normal at peak traffic but alarming at 3 AM. Use dynamic baselines (seasonal decomposition, moving averages) or SLO-based burn rate alerts.
5. Do not alert on infrastructure health for individual instances in a redundant setup. One unhealthy pod in a Kubernetes deployment with 10 replicas is not an alert—it is auto-healed. Alert when the percentage of healthy instances drops below a threshold.
6. Do not create dashboards with no clear audience. Every dashboard should answer a specific question for a specific role (developer, operator, business stakeholder). If a dashboard does not answer a question, archive it.
7. Do not measure what you cannot act on. Collecting "requests per second" is useful because you can scale horizontally. Collecting "Java heap size" is useful because you can tune GC settings. Collecting "number of times the `toString` method was called" is useless.
8. Monitor the monitor. If Prometheus is down, alerts do not fire. If the alert manager is down, alerts do not route. Use a separate health-check service or a cloud provider's native health monitoring to watch the monitoring stack.
9. Measure everything in quantiles, not averages. An average latency of 200ms can hide 1% of requests that take 10 seconds. Use p50, p95, p99, and max latency to understand the true distribution.
10. Set up a "dashboard of dashboards" that shows the health of every service at a glance. Use a single pane of glass with red/yellow/green status based on SLO compliance. This is the first thing the on-call checks.

## Best Practices

1. Start with the RED method for every HTTP API service. Measure rate (requests/second), errors (HTTP 5xx rate), and duration (latency p50/p95/p99). These three metrics give you 80% of the observability you need.
2. Use the USE method for every infrastructure resource. Measure CPU utilization, memory saturation (swap usage, OOM kills), disk utilization (I/O wait, disk space), and network errors (packet drops, retransmits).
3. Define SLOs in terms of user experience, not internal metrics. Instead of "99.9% uptime," define "99.9% of search queries return results in under 1 second." Uptime is meaningless if the service is up but returning errors.
4. Use error budgets to balance reliability and velocity. An SLO of 99.9% over 30 days gives you 43 minutes of error budget per month. If the budget is nearly exhausted, slow down deployments and focus on reliability. If the budget is well-stocked, you can move faster.
5. Create separate dashboards for different audiences:
   - Operational dashboard: RED metrics, SLO burn rate, error rates—for the on-call.
   - Business dashboard: active users, transactions per day, revenue—for product managers.
   - Performance dashboard: latency by endpoint, slowest queries, GC stats—for developers.
6. Use "dashboard as text" for runbook links. Every dashboard should have a text panel that links to the runbook for the service and the on-call contact information.
7. Use multi-window, multi-burn-rate alerts. Fire a page when the error rate exceeds the SLO threshold over a short window (5 minutes) with a high burn rate (fast response for severe issues) AND over a longer window (1 hour) with a moderate burn rate (catch gradual degradation).
8. Review all alerts weekly in a "Monday morning alert review." Go through every alert that fired in the past week. Which were actionable? Which were noise? Adjust thresholds accordingly.
9. Instrument the deployment pipeline. Track deployment frequency, deployment failure rate, and time to roll back. These metrics measure your ability to deliver changes safely.
10. Use synthetic monitoring to measure user-facing availability from outside the network. A synthetic transaction (e.g., login → search → add to cart → checkout) run every minute from multiple geographic locations catches issues that internal monitoring misses (CDN failures, DNS issues, regional outages).

## Anti-patterns

1. **Dashboard wall of green**: A dashboard with dozens of panels that are all green and unchanging. It provides no information. Remove panels that never change or that nobody looks at.
2. **Alert fatigue**: Too many alerts, most of them noisy, causing the on-call to ignore or silence all alerts. The only cure is to reduce alert volume. Every alert that is dismissed without action should be reviewed for deletion.
3. **Vanity metrics**: Displaying metrics that look impressive but have no operational value (e.g., "total requests served since launch," "uptime percentage"). These metrics do not help diagnose issues or make decisions.
4. **Monitoring the wrong thing**: Measuring server CPU utilisation when the real bottleneck is database query performance. Understand your system's failure modes and measure the right things.
5. **No error budget tracking**: Setting SLOs but never tracking whether they are being met. An SLO without a budget is a wish. Track error budget consumption in a visible dashboard.
6. **Over-instrumentation**: Collecting hundreds of metrics per service because you can, not because you need them. Every metric has a cost: storage, processing, and cognitive load. Collect only what you use.
7. **On-call without runbooks**: Paging someone without giving them instructions. The on-call should be able to follow the runbook to resolve the issue. If a runbook requires deep system knowledge, document it.

## Edge Cases

1. **Zero-traffic services**: A background job service that runs once a day has no request rate or latency to measure. Monitor job execution: did it start, did it complete, did it complete successfully, how long did it take? Apply the batch job monitoring pattern, not RED.
2. **Spiky traffic patterns**: A service that receives traffic in bursts (e.g., a ticketing system during a popular event on-sale). Use bucket-style histograms for latency and set alert thresholds based on the peak expected traffic, not the average.
3. **Degraded but not down**: A service that is running but returning stale data (e.g., cache miss → falls back to a 5-minute-old snapshot). The RED metrics look fine (low latency, no errors) but the user experience is degraded. Monitor data freshness as a custom SLI.
4. **Global services with regional differences**: A service deployed in multiple regions may have different performance characteristics. Monitor per-region RED metrics and set per-region SLOs. A latency spike in one region should not trigger a global alert.
5. **Monotonic counters vs gauges**: Understanding the difference is critical for alerting. Monotonic counters (total requests, total errors) reset on restart and must be aggregated with `rate()` or `increase()`. Gauges (CPU utilization, queue depth) represent a point-in-time value and can be alerted on directly.
6. **Metrics cardinality explosion**: Tagging metrics with high-cardinality values (user ID, session ID, request ID) creates millions of time series and crashes the metrics store. Use labels only for low-cardinality values (service name, endpoint path, HTTP method, status code class).

## Validation Checklist

- [ ] Every request-driven service exports RED metrics (rate, error rate, latency p50/p95/p99).
- [ ] Every resource-oriented component exports USE metrics (utilization, saturation, errors).
- [ ] SLOs are defined for every critical service with documented measurement methodology.
- [ ] Error budget burn rate panels are visible on the operational dashboard.
- [ ] Every alert has a runbook linked from the alert notification.
- [ ] No alert fires without an actionable response (delete silent alerts).
- [ ] Dashboards are organised by audience (operational, business, performance) with clear purpose.
- [ ] Latency is measured in percentiles (p50, p95, p99), not averages.
- [ ] Alert thresholds use multi-window, multi-burn-rate logic, not static thresholds.
- [ ] The monitoring stack itself is monitored (Prometheus health, Alertmanager health).
- [ ] Monthly alert review identifies and removes noisy alerts.
- [ ] Synthetic monitoring runs every minute from at least two geographic regions.

## Engineering Examples

### Example 1: Defining SLOs for an API endpoint

A checkout API has three critical endpoints: `POST /cart/checkout`, `POST /payments/charge`, and `GET /orders/{id}`. The team defines SLOs for each:

- `POST /cart/checkout`: 99.9% of requests complete in under 2 seconds with a non-5xx status code over a 30-day rolling window.
- `POST /payments/charge`: 99.99% of requests complete in under 5 seconds with a non-5xx status code over a 30-day rolling window. Payment failures are business-critical and have a tighter SLO.
- `GET /orders/{id}`: 99.5% of requests complete in under 200ms over a 30-day window. Read endpoints are less critical.

Each SLO is instrumented as a Prometheus recording rule:

```yaml
groups:
  - name: slo
    rules:
      - record: slo:checkout_latency_2s_budget
        expr: |
          sum(rate(http_request_duration_seconds_count{endpoint="/cart/checkout", status_code!~"5.."}[30d]))
          / sum(rate(http_request_duration_seconds_count{endpoint="/cart/checkout"}[30d]))
```

The burn rate alert for the checkout endpoint:

```yaml
groups:
  - name: burn_rate
    rules:
      - alert: CheckoutSLORisk
        expr: |
          (1 - rate(http_request_duration_seconds_count{endpoint="/cart/checkout", status_code!~"5.."}[1h])
          / rate(http_request_duration_seconds_count{endpoint="/cart/checkout"}[1h]))
          > 0.001
        for: 5m
        labels:
          severity: page
        annotations:
          summary: "Checkout SLO burn rate alert"
```

The SLO dashboard shows a remaining error budget of 43 minutes per month. If the budget drops below 20% remaining, the team halts feature deployments and focuses on reliability.

### Example 2: Building a monitoring dashboard for a microservice

The order service dashboard is built in Grafana with three rows:

**Row 1: Health Summary**
- Service status (up/down) from a synthetic health check.
- Redis connection status, database connection status, payment service connectivity status.
- SLO compliance bar (green > 99.9%, yellow > 99%, red < 99%).

**Row 2: RED Metrics**
- Request rate (requests/second) with a 1-week comparison overlay.
- Error rate (% of total requests) with a line at the SLO threshold (0.1%).
- Latency heatmap showing p50, p95, p99 over time.
- Top 5 slowest endpoints p99 latency.

**Row 3: USE Metrics**
- Container CPU utilization per pod.
- Container memory usage vs limit.
- Database connection pool active vs max.
- Queue depth for the order processing queue.
- GC pause time (if JVM) or event loop lag (if Node.js).

The dashboard has a text panel at the top with a link to the runbook and the current on-call engineer's name. Each panel has a threshold line indicating the acceptable range. The dashboard auto-refreshes every 30 seconds.

### Example 3: Setting up effective alerting that reduces noise

The team initially had 50 alerting rules, most of which were static-threshold alerts: "CPU > 80%", "Memory > 80%", "Disk > 80%". The on-call was paged 15 times per night, and most pages were dismissed without action because the system auto-healed or the threshold was too sensitive.

The team redesigned the alerting strategy:

1. **Deleted 30 alerts**: CPU at 80% for a single pod is not actionable—Kubernetes auto-heals. Disk at 80% is actionable only if it is growing (trending to 100%). Replaced with: "disk usage will fill in 24 hours at current growth rate."

2. **Replaced static thresholds with SLO burn rate alerts**: Instead of "error rate > 1%," used "error rate > 0.1% for 5 minutes AND total errors > 10" for rapid degradation, plus "error rate > 0.1% for 1 hour" for slow degradation.

3. **Added a "this is probably the cause" alert**: When database query time spikes, suppress the "API latency spike" alert because the database is the likely root cause. Used alert dependencies to avoid paging twice for the same incident.

4. **Introduced a "watch" level for non-critical alerts**: Alerts that fire but do not require immediate action are sent to a Slack channel instead of paging the on-call. A human reviews them daily.

Result: the on-call receives 1-2 actionable pages per week instead of 15 per night. Each page has a runbook, a clear description of the impact, and a recommended remediation step. Alert fatigue dropped to zero.
