# Notification Systems

## Purpose

Define a robust, multi-channel notification system that reliably delivers timely, personalized messages to users across email, push notifications, SMS, and in-app channels. This skill covers the complete lifecycle: notification creation, template rendering, channel delivery with retry logic, user preference management, rate limiting, and delivery analytics. The system must handle high throughput, provide at-least-once delivery guarantees, and respect user preferences at all times.

## Responsibilities

- Managing multiple notification channels (email, push, SMS, in-app) with a unified abstraction so that sending a notification is channel-agnostic at the application level.
- Providing at-least-once delivery guarantees with idempotent delivery tracking — a notification must be delivered at least once, but never delivered more than once to the same user on the same channel for the same event.
- Implementing template-based notification rendering with support for variables, conditional blocks, and channel-specific template variants (HTML email, plain text SMS, rich push payload).
- Managing user notification preferences at a granular level: per-channel opt-in/opt-out, per-notification-type preferences (e.g., receive email for weekly digest but not for every comment reply), and quiet hours.
- Enforcing rate limits to prevent notification abuse: per-user (max 50 notifications/day), per-channel (max 5 SMS/hour), and per-type (max 10 push notifications/minute).
- Batching notifications into digests: grouping multiple notifications (e.g., 15 comment replies in one hour) into a single summary email or push with a configurable batch window.
- Handling unsubscription with compliance: provide one-click unsubscribe links in emails (with List-Unsubscribe header), push notification opt-out via OS settings, and SMS STOP keyword handling.
- Maintaining notification history: store a complete log of all sent notifications with status (queued, sent, delivered, failed, bounced, opened) for user-facing history views and analytics.
- Supporting real-time delivery (in-app via WebSocket) for urgent notifications while using polling fallback for non-urgent or offline users.

## Decision Process

1. Define notification types: list every event that generates a notification (comment reply, follow, like, mention, system alert, payment receipt, password change, weekly digest) and categorize by urgency (real-time, near-real-time, daily digest).
2. Determine channel suitability per notification type: high-urgency (password change → email + push + SMS), medium-urgency (comment reply → in-app + push, optional email), low-urgency (weekly summary → email only).
3. Design the notification data model: `Notification` (id, userId, type, title, body, data JSON, channel, status, createdAt, readAt), `NotificationPreference` (userId, channel, type, enabled, quietHoursStart, quietHoursEnd, batchPreference).
4. Choose delivery infrastructure: a job queue (Bull, Sidekiq, SQS, RabbitMQ) for async delivery with retries, a template engine (Handlebars, MJML, Liquid) for rendering, and a push notification service (Firebase Cloud Messaging, APNs via a service).
5. Implement template system: create an HTML email template with MJML, a plain text fallback, an SMS template (160-character limit with truncation), and a push notification payload template (title, body, data, badge, sound).
6. Integrate user preferences: on every notification send, check the user's preferences for (channel × type) — if disabled, skip; if batched, queue for the next digest; if within quiet hours, hold until quiet hours end.
7. Implement rate limiting: use a sliding window counter (Redis sorted set) keyed by `{userId}:{channel}` with configurable limits. If the limit is exceeded, queue the notification for the next window.
8. Build batch/digest system: for notifications with `batch: true`, group by user and notification type within a configurable window (1 hour for social notifications, 24 hours for weekly digest). When the window closes, render a single digest notification with all items.
9. Handle unsubscribe: for emails, generate a cryptographically signed token in the `List-Unsubscribe` header and in a footer link pointing to a one-click unsubscribe endpoint. For SMS, detect STOP/STOPALL replies. For push, respect OS-level opt-out.
10. Implement delivery tracking: record each delivery attempt with status, channel, timestamp, and error message. Track opens via tracking pixel in emails, push notification interactions via client-side events, and SMS delivery receipts via provider webhooks.

## Inputs

- Notification requirements: list of notification types, their triggers (application events, cron jobs, webhooks), expected volume per type, and delivery urgency classification.
- User model: user contact information (email, phone number, push device tokens), user locale/language for template localization, and timezone for respecting quiet hours.
- Template designs: email layout mockups, push notification format specs, SMS message format guidelines, and in-app notification UI component designs.
- Compliance requirements: CAN-SPAM Act, GDPR (right to delete notification history), CASL (Canadian anti-spam), and any industry-specific regulations regarding notification frequency.
- Infrastructure constraints: existing email service provider (SendGrid, SES, Mailgun), push notification service (FCM, APNs), SMS provider (Twilio, Vonage), and message queue infrastructure.
- Analytics requirements: delivery rate, open rate, click-through rate, unsubscribe rate, and per-channel engagement metrics.

## Outputs

- Notification service: a unified `NotificationService` or `notify()` function that accepts a `NotificationEvent` (type, user, data, channels) and handles delivery across all channels according to user preferences.
- Template system: template files for each notification type per channel, rendered by a template engine with variable injection, conditional blocks, and localization support.
- Preference management API: CRUD endpoints and UI for users to manage their notification preferences per type and channel, with defaults configured per notification type.
- Rate limiter: middleware or service that enforces per-user and per-channel rate limits with sliding windows, returning a `rate_limited: true` response when limits are exceeded.
- Batch/digest engine: cron job or scheduled job that closes batch windows, renders digest notifications, and sends them as single combined notifications.
- Unsubscribe handler: one-click unsubscribe endpoints, email header support, SMS keyword detection, and sync with the preference management system.
- Notification history API: paginated API endpoints for users to view their notification history, mark notifications as read, and bulk-archive notifications.
- Delivery analytics dashboard: views for delivery rate, open rate, click rate, unsubscribe rate, and per-channel breakdowns, with time-series charts.

## Rules

1. Never send a notification on a channel the user has explicitly disabled — always check user preferences before every delivery attempt, not just at notification creation time.
2. Always include an unsubscribe mechanism in every automated message — transactional emails must have a one-click unsubscribe link, SMS must support STOP responses, and push notifications must respect OS-level notification settings.
3. Always rate-limit notifications per user — never send more than 50 notifications per day to a single user across all channels, or 5 SMS per hour, to prevent abuse and user fatigue.
4. Never send sensitive information (passwords, full credit card numbers, security codes) via push notification or SMS — push notifications appear on lock screens and SMS is not encrypted; use in-app or email with a masked display.
5. Always log skipped notifications (user disabled, rate limited, quiet hours) with the reason — skipped notifications are not failures but are still important for analytics and debugging.
6. Never block the main application thread for notification delivery — always use a background job queue with async processing so notification sending does not affect API response times.
7. Always use transactional email sending for account-related notifications (password reset, payment receipt, security alerts) — never use marketing email APIs that may route through bulk senders with lower delivery priority.
8. Always test notification templates with actual data before deploying — rendered templates with missing variables produce ugly `{{undefined}}` placeholders that break user trust.
9. Never store plaintext push notification tokens or phone numbers in application logs — these are sensitive identifiers that should be logged with masking or excluded entirely.
10. Always handle delivery failures gracefully with retry logic (at least 3 retries with exponential backoff) before marking a notification as permanently failed.

## Best Practices

1. Use a message queue (Bull/SQS/RabbitMQ) for all notification deliveries — queuing allows batching, retry with backoff, rate limiting, and graceful shutdown without losing notifications.
2. Implement at-least-once delivery with idempotency keys — assign a unique `notification_id` (UUID v4) to each notification and use it as an idempotency key when calling email/SMS/push APIs to prevent duplicates on retry.
3. Store notification templates in a database or template service rather than hardcoding them — templating enables A/B testing, per-language localization, and dynamic content without code deploys.
4. Use MJML for responsive email templates — MJML compiles to responsive HTML emails that render correctly across Outlook, Gmail, and Apple Mail without manual CSS hacks.
5. Implement quiet hours at the user level (e.g., 10 PM to 8 AM in the user's timezone) — queue notifications during quiet hours and deliver them when quiet hours end, checked against the user's stored timezone.
6. Send webhook events for notification status changes (delivered, opened, clicked, bounced) — webhooks allow other services (analytics, CRM, support) to react to notification delivery without polling.
7. Implement A/B testing for notification copy: try two subject lines for email or two bodies for push, measure open rate, and auto-select the winner for future sends.
8. Use deep linking in push notifications: include a `url` or `screen` parameter in the push payload data so that tapping the notification navigates the user to the relevant screen in the app.
9. Batch email sends by provider connection — instead of sending 1000 emails one by one (each with TCP handshake), use SendGrid's bulk API or SES's `SendBulkTemplatedEmail` for batch sending with connection reuse.
10. Monitor notification delivery health with metrics: delivery rate (target >99%), open rate (benchmark by industry), unsubscribe rate (alert if >0.5% in a day), and spam complaint rate (alert if >0.1%).

## Anti-patterns

1. Sending all notification types immediately without regard for user preference or rate limits — this leads to notification fatigue, high unsubscribe rates, and app uninstalls.
2. Sending notifications synchronously in the request-response cycle — if the email provider is slow or down, the API request times out and the user sees a 500 error for a non-critical operation.
3. Treating all notification channels as interchangeable — sending a 500-word email as an SMS splits across 4 messages and costs the user money, while sending a critical security alert only as an in-app notification (no push/email) may be missed.
4. Hardcoding notification templates with inline HTML — changes require a code deploy, A/B testing is impossible, and non-technical team members cannot update copy.
5. Not differentiating between transactional and marketing notifications — marketing emails have different opt-in requirements, sending frequency expectations, and unsubscribe handling compared to transactional notifications.
6. Ignoring email bounces and spam complaints — continued sending to invalid addresses damages domain reputation and can get the entire domain blacklisted by email providers.
7. Using the same from-address for all notification types — password resets from "noreply@company.com" and marketing newsletters from the same address mix transactional and promotional email classifications, affecting deliverability.
8. Not storing notification history — when users ask "I didn't get the password reset email" or "What notification did I miss?", there is no historical record to investigate.

## Edge Cases

1. User with no verified contact info for a channel: if a user has no verified email but a notification is sent via the email channel, the system must skip the email and notify via an alternative channel or fall back to in-app.
2. Rate-limited notification escalation: if all channels for a user are rate-limited, the notification must be queued and retried when the rate limit window resets — never silently drop the notification.
3. Multiple device tokens: a user may have push tokens for iPhone, iPad, and Android — send the push to all devices and deduplicate read receipts by notification ID.
4. Quiet hours with urgent notifications: security alerts (password changed, login from new device) must override quiet hours — classify urgent notification types that bypass quiet hour restrictions.
5. Email provider outage: if the primary email provider (SendGrid) is down, fail over to the secondary provider (AWS SES) within 30 seconds — health check the primary provider every 10 seconds.
6. Notification template rendering error: if a template has a syntax error or a missing variable, render a plain-text fallback (no styling, no images) that still conveys the essential information.
7. Timezone changes: if a user changes their timezone while notifications are queued (quiet hours), the queued notifications must re-evaluate quiet hours against the new timezone before delivery.
8. User deletion or deactivation: when a user is deleted, all pending notifications for that user must be cancelled and their device tokens must be invalidated immediately.

## Validation Checklist

- [ ] Every notification type has a defined set of allowed channels and respects user preferences per channel and type.
- [ ] All email sends include `List-Unsubscribe` header and a one-click unsubscribe link in the body.
- [ ] SMS messages include STOP instructions and honor STOP/STOPALL/UNSTOP responses.
- [ ] Push notifications respect OS-level notification settings and handle token invalidation on app reinstall.
- [ ] Rate limits are enforced per user per channel with sliding windows — no user receives more than 5 SMS per hour.
- [ ] Quiet hours are respected: notifications during quiet hours are queued and delivered after quiet hours end.
- [ ] At-least-once delivery with idempotency: duplicate delivery attempts do not result in duplicate messages.
- [ ] Notification delivery uses a background job queue — no synchronous delivery in request-response cycle.
- [ ] Notification history is persisted with status tracking for all delivery attempts (queued, sent, delivered, failed, bounced, opened).
- [ ] Bounce and complaint handling is integrated: hard bounces automatically disable the email channel for that user.

## Engineering Examples

### Example 1: Designing a Notification System with Email and Push Channels

A social media platform sends notifications for likes, comments, follows, and mentions. When User A comments on User B's post, the system creates a `NotificationEvent` with type `comment`, target user B, data `{ commenterName: "A", postId: 123, commentPreview: "Great post!" }`. The `NotificationService` checks User B's preferences: `push: { comment: true }`, `email: { comment: "digest" }`, `sms: { comment: false }`. A push notification is sent immediately via FCM: `{ title: "New comment from A", body: "Great post!", data: { screen: "post", postId: 123 } }`. The email is queued for the hourly digest — after 1 hour, all comment notifications for User B are batched: "You have 3 new comments from A, C, and D on your posts." The digest email is rendered using an MJML template and sent via SendGrid with a List-Unsubscribe header. Delivery tracking: push sent status is logged, email delivery event is captured via SendGrid webhook, and open tracking uses a 1×1 tracking pixel. If FCM returns an InvalidToken error, the token is removed from the user's device list and the notification is logged as failed with reason "invalid push token".

### Example 2: Implementing User Notification Preferences with Granular Controls

A project management app lets users configure notification preferences at three levels: channel (email on/off, push on/off, in-app on/off), notification type (task assigned, comment added, due date changed, status update), and project-specific overrides. The preferences API: `PATCH /api/preferences` accepts `{ channel: "email", type: "task_assigned", enabled: true }`. The UI shows a matrix: rows = notification types, columns = channels, cells = toggle switches. The preference service caches the user's preferences in Redis with a 5-minute TTL. Before delivering any notification, the service checks: 1) is the channel enabled for the user? 2) is the notification type enabled for that channel? 3) does a project-specific override exist? If all pass, the notification is sent. If not, it's skipped and logged with reason "disabled by preference". Default preferences for new users: email enabled for weekly digest only, push enabled for all types, in-app enabled for all types. The preference page also configures quiet hours (10 PM - 8 AM) and daily digest time.

### Example 3: Building a Batched Daily Digest Email System

An e-learning platform sends daily digest emails to users summarizing activity from the previous day. A cron job runs at 6 AM daily in the user's timezone (users' timezone is stored in their profile). The job queries: for each user, all notifications from the previous day where `batch: true` and `type` is in [new_course, course_update, forum_reply, achievement]. Notifications are grouped by type and rendered into a digest email template: "Your Daily Summary — 3 new courses in your track, 2 replies to your forum posts, 1 new achievement." The email is generated by selecting the appropriate MJML template, injecting the batched data, and compiling to HTML. The email is sent via SES with a unique Message-ID and List-Unsubscribe header. If a user has no notifications for the day, no email is sent (users can opt in to "even if nothing new" via preference). Open tracking: a 1×1 pixel is included, and opens are logged with timestamp and user ID. Unsubscribes from the digest email only disable the digest type (not all emails), so transactional notifications (password reset, payment receipts) still get through. The batch job is idempotent — if it fails midway and reruns, the `delivery_status = 'sent'` flag prevents duplicate sends.
