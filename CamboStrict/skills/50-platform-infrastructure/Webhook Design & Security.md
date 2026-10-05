# Webhook Design & Security

## Purpose

Define authoritative patterns for designing, implementing, delivering, and verifying webhooks that are secure, reliable, observable, and easy to integrate with. This skill covers webhook event schema design, delivery guarantees (at-least-once, idempotent processing), retry with exponential backoff, idempotency keys, HMAC signature verification, payload verification, event filtering, consumer validation, dead webhook detection, and webhook management UI patterns.

## Responsibilities

- Designing a consistent webhook event schema that includes event ID, event type, timestamp, payload version, and the event payload.
- Implementing delivery guarantees: at-least-once delivery with retry logic and idempotent processing on the consumer side.
- Configuring retry policies with exponential backoff, jitter, and a maximum retry window (e.g., 24 hours).
- Designing idempotency keys that consumers can use to deduplicate events, and documenting how consumers should implement them.
- Signing webhook payloads with HMAC-SHA256 using a shared secret so consumers can verify authenticity.
- Implementing payload verification: providing the raw request body, signature header, and timestamp header so consumers can verify payload integrity.
- Supporting event filtering so consumers subscribe only to the event types they need.
- Validating consumer endpoints before sending events (challenge-response verification on registration).
- Detecting dead webhooks: endpoints that consistently fail or have not been reachable for a threshold period.
- Building a webhook management UI for consumers to view delivery logs, retry failed deliveries, and rotate secrets.

## Decision Process

1. **Define the event schema standard.** Every event must contain: `id` (UUID v7), `eventType` (namespaced: `order.created`, `payment.completed`), `createdAt` (ISO 8601), `payloadVersion` (integer), `payload` (the business object). Include `metadata` for delivery tracing (request ID, source service).
2. **Choose delivery semantics.** Design for at-least-once delivery. Advertise this guarantee to consumers. Implement consumer-side idempotency to handle duplicates. Never promise exactly-once delivery; it's not achievable in distributed systems.
3. **Design the retry policy.** Initial retry after 10 seconds, then 30s, 1m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 16h, 24h (12 retries over 24 hours). After 24 hours, move to the dead letter queue. Use full jitter to avoid thundering herd.
4. **Implement HMAC signing.** Generate a shared secret per consumer. Sign the raw request body using HMAC-SHA256. Include the signature in the `X-Webhook-Signature` header. Include the timestamp in `X-Webhook-Timestamp` to prevent replay attacks.
5. **Design the consumer verification flow.** When a consumer registers a webhook URL, send a verification request with a `challenge` parameter. The consumer must respond with the challenge value within 10 seconds. Only verified endpoints receive events.
6. **Implement event filtering.** Allow consumers to specify which event types they want to receive (e.g., `["order.created", "order.completed"]`). Filter at the producer side: do not send events the consumer hasn't subscribed to.
7. **Build delivery logging.** Every delivery attempt is logged with: consumer ID, event ID, URL, HTTP status, response body (truncated), duration, timestamp, and attempt number. Store logs for at least 30 days.
8. **Detect dead webhooks.** Track the last N delivery attempts (e.g., last 100). If the success rate is below a threshold (10%) or the endpoint has been unreachable for 7 days, mark the webhook as dead. Notify the consumer via email or dashboard.
9. **Provide a management UI.** Consumers need: a list of registered webhooks, delivery logs per webhook, the ability to retry a failed delivery, the ability to rotate the signing secret, and the ability to disable or delete a webhook.
10. **Implement event replay.** Consumers should be able to request replay of events for a time range (e.g., replay all events from the last 24 hours). This is essential for debugging and backfilling after an outage.

## Inputs

- Business event taxonomy: list of all event types the system can emit.
- Consumer requirements: which endpoints need which events, expected throughput, callback URL patterns.
- Security requirements: signing algorithm strength, secret rotation frequency, TLS requirements.
- Reliability requirements: acceptable delivery latency (P99), retry budget, dead letter handling.
- Compliance requirements: event data retention, audit logging, consumer identity verification.
- Scaling requirements: peak event throughput, number of registered webhooks, concurrent delivery capacity.

## Outputs

- Event schema definitions (JSON Schema or TypeScript types) for all webhook event types.
- Webhook delivery service with signing, retry, and dead letter queue.
- Consumer-facing API for webhook registration, management, and secret rotation.
- HMAC signature verification documentation and example code for consumers.
- Delivery log storage and query API.
- Dead webhook detection and notification system.
- Webhook management UI or dashboard.
- Integration tests for delivery, retry, idempotency, and signature verification.

## Rules

1. **Every webhook request must include an HMAC signature.** The `X-Webhook-Signature` header must contain `sha256=<hex-encoded-signature>`. Consumers must verify the signature before processing the event.
2. **Every webhook request must include a timestamp header.** The `X-Webhook-Timestamp` header must contain the Unix timestamp (seconds) of when the event was sent. Consumers must reject events with a timestamp older than 5 minutes (replay attack protection).
3. **Consumers must respond with a 200 OK status within 10 seconds.** Any other status (redirect, 4xx, 5xx) or timeout is treated as a delivery failure. The webhook system will retry according to the retry policy.
4. **Webhook delivery must use TLS 1.2 or higher for all connections.** Unencrypted HTTP endpoints must be rejected at registration time. Consumers must present a valid TLS certificate.
5. **Signing secrets must be rotatable without downtime.** Consumers can request a new secret via the management UI. Old and new secrets are both valid during a configurable rotation window (e.g., 24 hours).
6. **Events must be delivered in order per consumer per event type.** If a consumer subscribes to multiple event types, events of different types can be delivered out of order. Events of the same type must be delivered in the order they occurred.
7. **Consumer endpoints must be verified before receiving events.** The verification challenge-response must complete successfully. Unverified endpoints are marked as `pending` and receive no events.
8. **Webhook delivery logs must be immutable.** Once a delivery attempt is logged, it cannot be deleted or modified. Retention is at least 30 days for compliance auditing.
9. **Sensitive data must never be included in webhook payloads.** Credit card numbers, passwords, personal access tokens, and other secrets must be excluded or replaced with references (e.g., `payment_method_id` instead of the full card number).
10. **Event replay must not exceed the maximum retention period.** Events older than the retention period (e.g., 30 days) cannot be replayed. The replay request must specify a time range within the retention window.

## Best Practices

1. **Include the raw request body in the signature computation.** Do not sign the generated JSON; sign the exact bytes sent over the wire. This protects against encoding differences between the producer and consumer.
2. **Include the event ID in the idempotency key.** Consumers should store `event.id` and check for duplicates before processing. This is simpler and more reliable than custom idempotency key schemes.
3. **Provide consumer libraries for popular languages.** Publish a TypeScript, Python, and Go library that verifies signatures, parses events, and provides idempotent processing middleware. This reduces integration friction.
4. **Use a separate worker pool for webhook delivery.** Do not deliver webhooks from the request path of the API that produces events. Use background workers that pull from a queue to isolate delivery latency from API latency.
5. **Implement gradual delivery for high-throughput events.** If an event produces 100,000 deliveries, send them in batches over several minutes to avoid overwhelming consumer infrastructure. Implement a delivery scheduler with rate limiting per consumer.
6. **Monitor webhook delivery health.** Dashboard metrics: delivery success rate, P50/P95/P99 delivery latency, retry count distribution, dead webhook count, events in retry queue, and consumer response time distribution.
7. **Alert on delivery degradation.** If a consumer's success rate drops below 90% for 5 minutes, send an alert to the producer operations team. If it drops below 50%, also alert the consumer (via email or Slack) and consider pausing delivery.
8. **Support webhook URL rotation.** Consumers should be able to update their webhook URL without losing events. The old and new URLs should coexist during a transition period, with delivery to both URLs.
9. **Implement circuit breakers per consumer endpoint.** If a consumer endpoint returns 5xx errors 10 times in a row, pause delivery for 5 minutes. Resume with a trial delivery. If it fails again, extend the pause.
10. **Version the webhook payload.** Include `payloadVersion` in the event schema (integer, starting at 1). When the payload schema changes, create a new version. Consumers subscribe to a specific version. Older versions are deprecated over time.

## Anti-patterns

1. **Sending webhooks synchronously from the API request handler.** If the consumer is slow, the API response to the original client is delayed. Always send webhooks asynchronously via a background queue.
2. **Not signing webhook payloads.** Without a signature, consumers cannot verify that a webhook genuinely came from the producer. Any attacker who discovers the webhook URL can send fake events.
3. **Promising exactly-once delivery.** No distributed system can guarantee exactly-once delivery. Promise at-least-once and provide idempotency keys so consumers can deduplicate.
4. **Using a fixed retry interval (e.g., retry every 5 minutes without backoff).** This synchronized retry creates thundering herd problems and can overwhelm both the producer's retry system and the consumer's endpoint.
5. **Including sensitive data in the webhook payload.** Webhook payloads are often logged by the producer, the transport layer, and the consumer. Sensitive data in any of these logs is a compliance risk.
6. **Not providing a way for consumers to manage webhooks programmatically.** Forcing consumers to contact support to register, update, or delete webhooks does not scale. Provide a self-service API and UI.
7. **Not testing the consumer's endpoint during registration.** An invalid URL (typo, unreachable host) is only discovered when the first real event fails. Verify the endpoint sends the correct challenge response at registration.

## Edge Cases

1. **Consumer endpoint temporarily unavailable during a high-throughput event storm.** Retry with backoff, but if the queue grows too large, drop the oldest events to keep the queue bounded (losing old events is better than losing all events).
2. **Clock skew between producer and consumer.** If the consumer's clock is more than 5 minutes off from the producer's, all events will be rejected even if they are legitimate. Allow a configurable tolerance for timestamp validation (default 5 minutes, consumer can adjust).
3. **Consumer changing their webhook URL while events are being delivered.** Support a transition window where both old and new URLs receive events. The consumer can then switch their processing to the new URL and disable the old one.
4. **Signature secret compromise.** If a consumer's secret is leaked, the consumer must rotate it immediately. The old secret should be invalidated after the rotation window. The producer should force-rotate secrets periodically (e.g., every 90 days).
5. **Duplicate events from the producer's retry logic.** If the producer's database writes the event but the delivery worker crashes before deleting the event from the queue, the event may be delivered twice. Consumers must handle this with idempotent processing.
6. **Events that arrive out of order.** If a consumer processes `order.updated` before `order.created`, the consumer may not have the order record yet. Consumers should either buffer events or handle out-of-order processing gracefully.

## Validation Checklist

- [ ] Every webhook request includes `X-Webhook-Signature` (HMAC-SHA256) and `X-Webhook-Timestamp` headers.
- [ ] Event schema includes `id`, `eventType`, `createdAt`, `payloadVersion`, and `payload`.
- [ ] Consumer endpoints are verified (challenge-response) before receiving events.
- [ ] Retry policy uses exponential backoff with jitter over a 24-hour window.
- [ ] Dead letter queue captures events that failed after all retries.
- [ ] Delivery logs are stored immutably for at least 30 days.
- [ ] Idempotency keys are provided and consumers can deduplicate by event ID.
- [ ] Event filtering is supported per consumer (subscribe to specific event types).
- [ ] Dead webhook detection marks endpoints with <10% success rate over 100 deliveries.
- [ ] Management UI or API supports webhook registration, secret rotation, and delivery log access.
- [ ] Webhook delivery uses background workers, not synchronous API handlers.
- [ ] Sensitive data is excluded from webhook payloads.
- [ ] TLS 1.2+ is enforced for all webhook connections.
- [ ] Delivery order is guaranteed per consumer per event type.
- [ ] Event replay is supported within the retention window.

## Engineering Examples

### Example 1: Webhook System with HMAC Signature Verification

A producer that signs webhook payloads and a consumer verification library.

Producer-side signing:
```typescript
import crypto from 'node:crypto';

interface WebhookEvent {
  id: string;
  eventType: string;
  createdAt: string;
  payloadVersion: number;
  payload: unknown;
}

function signWebhookPayload(payload: string, secret: string, timestamp: number): string {
  const payloadToSign = `${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
  return `sha256=${signature}`;
}

async function deliverWebhook(event: WebhookEvent, consumer: Consumer): Promise<void> {
  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signWebhookPayload(body, consumer.secret, timestamp);

  const response = await fetch(consumer.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': String(timestamp),
      'User-Agent': 'MyApp-Webhook/1.0',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed: ${response.status}`);
  }
}
```

Consumer-side verification (Node.js library):
```typescript
import crypto from 'node:crypto';

interface VerifiedEvent {
  event: WebhookEvent;
  deliveredAt: Date;
}

function verifyWebhookPayload(
  body: string,
  signatureHeader: string,
  timestampHeader: string,
  secret: string,
  maxAgeSeconds: number = 300
): VerifiedEvent {
  const timestamp = parseInt(timestampHeader, 10);
  const now = Math.floor(Date.now() / 1000);

  if (now - timestamp > maxAgeSeconds) {
    throw new Error('Webhook timestamp is too old (possible replay attack)');
  }

  const payloadToVerify = `${timestamp}.${body}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadToVerify).digest('hex');
  const providedSignature = signatureHeader.replace('sha256=', '');

  if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature))) {
    throw new Error('Webhook signature mismatch (payload may have been tampered)');
  }

  return {
    event: JSON.parse(body) as WebhookEvent,
    deliveredAt: new Date(timestamp * 1000),
  };
}
```

### Example 2: Idempotent Webhook Processing to Handle Duplicate Deliveries

An order processing consumer that safely handles duplicate webhook deliveries.

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function handleOrderCreated(event: WebhookEvent): Promise<void> {
  // Idempotency check: has this event already been processed?
  const existing = await prisma.processedEvent.findUnique({
    where: { eventId: event.id },
  });

  if (existing) {
    // Event was already processed; skip
    console.log(`Skipping duplicate event: ${event.id}`);
    return;
  }

  // Process the event within a transaction
  await prisma.$transaction(async (tx) => {
    const order = event.payload as { orderId: string; customerId: string; total: number };

    // Create the order record
    await tx.order.create({
      data: {
        id: order.orderId,
        customerId: order.customerId,
        total: order.total,
        status: 'confirmed',
      },
    });

    // Record the event as processed
    await tx.processedEvent.create({
      data: {
        eventId: event.id,
        eventType: event.eventType,
        processedAt: new Date(),
      },
    });

    console.log(`Processed order ${order.orderId} from event ${event.id}`);
  });
}
```

### Example 3: Webhook Delivery Monitoring with Dead Webhook Detection

A monitoring system that tracks delivery health and identifies dead webhooks.

```sql
-- Schema for delivery logs
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES consumers(id),
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    http_status INTEGER,
    response_body TEXT,
    duration_ms INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deliveries_consumer_created
    ON webhook_deliveries(consumer_id, created_at DESC);
```

Dead webhook detection query:
```sql
WITH recent_deliveries AS (
    SELECT
        consumer_id,
        COUNT(*) AS total_deliveries,
        COUNT(*) FILTER (WHERE success = true) AS successful_deliveries,
        MAX(created_at) AS last_delivery_at
    FROM webhook_deliveries
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY consumer_id
)
SELECT
    c.id,
    c.name,
    c.url,
    rd.total_deliveries,
    rd.successful_deliveries,
    ROUND(100.0 * rd.successful_deliveries / NULLIF(rd.total_deliveries, 0), 2) AS success_rate,
    rd.last_delivery_at
FROM consumers c
JOIN recent_deliveries rd ON c.id = rd.consumer_id
WHERE rd.total_deliveries > 10
  AND (100.0 * rd.successful_deliveries / NULLIF(rd.total_deliveries, 0)) < 10;
```

Alerting and notification logic:
```typescript
async function detectDeadWebhooks(): Promise<void> {
  const deadWebhooks = await findDeadWebhooks(); // SQL query above

  for (const webhook of deadWebhooks) {
    if (!webhook.deadNotifiedAt) {
      // Send notification to consumer
      await sendEmail(webhook.email, {
        subject: `Your webhook (${webhook.url}) is experiencing delivery failures`,
        body: `Delivery success rate: ${webhook.successRate}% over the last 24 hours. ` +
              `Please check your endpoint or update the URL in the webhook dashboard.`,
      });

      // Mark as notified
      await markDeadWebhookNotified(webhook.id);
    }

    // If endpoint has been failing for 7 days, auto-disable
    const daysFailing = await daysSinceLastSuccess(webhook.id);
    if (daysFailing >= 7 && webhook.isActive) {
      await disableWebhook(webhook.id);
      await sendEmail(webhook.email, {
        subject: `Your webhook (${webhook.url}) has been disabled`,
        body: `Your webhook endpoint has been failing for ${daysFailing} days ` +
              `and has been automatically disabled. Enable it again after fixing the issue.`,
      });
    }
  }
}
```
