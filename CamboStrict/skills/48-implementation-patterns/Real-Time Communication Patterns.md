# Real-Time Communication Patterns

## Purpose

Establish a comprehensive approach for building real-time features into web and mobile applications — including live chat, collaborative editing, live cursors, real-time notifications, and live data streams. This skill covers the full lifecycle of real-time connections: establishing, maintaining, reconnecting, scaling horizontally, and gracefully degrading when real-time transport is unavailable. The goal is applications where users experience instant updates without polling overhead, with robust reconnection resilience and message integrity guarantees.

## Responsibilities

- Managing the WebSocket lifecycle: connection establishment (with authentication), heartbeat/ping-pong for connection health monitoring, graceful close, and resource cleanup on both client and server.
- Implementing reconnection strategies with exponential backoff and jitter — automatically reconnecting when connections drop, with configurable max retries and backoff cap.
- Defining a consistent message format for all real-time communication, including message types, payload schemas, error codes, and acknowledgment protocol.
- Managing channels/rooms: allowing clients to subscribe to specific channels (e.g., `chat:room:123`, `user:456:notifications`) and unsubscribing when no longer needed.
- Implementing presence detection: tracking which users are online, which rooms they are in, and broadcasting presence changes (user connected, user disconnected, user away) to authorized subscribers.
- Broadcasting events efficiently: using pub/sub systems (Redis Pub/Sub, RabbitMQ exchanges) to distribute messages across multiple server instances so WebSocket connections on different instances can all receive the same events.
- Choosing between WebSocket and Server-Sent Events (SSE) based on use case — WebSocket for bi-directional communication (chat, collaborative editing), SSE for server-to-client streaming (notifications, feed updates, stock tickers).
- Implementing fallback mechanisms: when WebSocket connection fails or is blocked (corporate firewalls, proxies), fall back to SSE, then to long-polling as a last resort.
- Handling message ordering and delivery guarantees: ensuring messages are delivered in order within a channel, with at-least-once semantics for critical messages and at-most-once for non-critical updates.

## Decision Process

1. Identify real-time requirements: is communication bi-directional (client sends messages, server pushes messages) or uni-directional (server pushes only)? Determine latency requirements (<10ms for collaborative editing, <100ms for chat, <1s for notifications).
2. Choose transport protocol: WebSocket for bi-directional low-latency applications where client sends data (chat, collaborative editing, live cursors). SSE for uni-directional server-to-client streaming (notifications, live feeds, status updates, stock tickers). Fallback to long-polling only when WebSocket/SSE are unavailable (older browsers, restrictive proxies).
3. Design message format: define a JSON-based envelope `{ type: string, channel: string, payload: object, id: string (uuid), timestamp: number, ack?: boolean }`. Every message has a unique ID for deduplication and acknowledgment tracking.
4. Implement channel/room management: clients send `{ type: "subscribe", channel: "chat:room:42" }` and `{ type: "unsubscribe", channel: "chat:room:42" }`. Server tracks subscriptions per connection in a `Map<WebSocket, Set<string>>` and validates authorization before allowing subscription.
5. Design presence system: on connect, the client sends a `presence` message with userId and status. Server broadcasts `{ type: "presence", channel: "room:42", userId: 123, status: "online" }` to all other room subscribers. On disconnect, broadcast `status: "offline"`. Implement heartbeat (ping every 30s) to detect zombie connections and update presence accordingly.
6. Implement reconnection strategy: on disconnect, client waits 1s before first reconnect attempt, then doubles with jitter (random 0-1000ms added) up to max 30s between attempts. Cap total attempts at 20. If 20 attempts fail, show a "Connection lost" UI and offer a manual reconnect button. On successful reconnect, restore subscriptions (server stores last-known subscriptions per userId) and fetch missed messages via a REST catch-up endpoint.
7. Choose scaling approach: use a pub/sub system (Redis Pub/Sub, RabbitMQ fanout exchange, or a managed service like Pusher/Ably) to broadcast messages across all server instances. Each WebSocket server instance subscribes to the channels its connected clients care about. When a message is published to a channel, all instances receive it and forward to their subscribed clients.
8. Design authorization: validate authentication token on WebSocket connection (token in URL query param or sent as first message). For channel subscriptions, verify user has permission to access the channel (e.g., is member of the chat room). Re-verify authorization periodically (every 15 minutes) or on every subscription change.
9. Implement message acknowledgment: for critical messages (chat messages, payment confirmations), use an ack/retry pattern. Client sends message with `id`, server responds with `{ type: "ack", id: "<original_id>" }`. If client doesn't receive ack within 5s, retry with same id. Server deduplicates by `id`.
10. Plan fallback and degradation: detect WebSocket failure on first connection by timeout (5s). Fall back to SSE for server-to-streaming. If SSE also fails after 3 retries, fall back to polling (every 5s for non-critical, every 2s for critical). Inform the user with a subtle indicator that they are on a "slower connection".

## Inputs

- Real-time feature requirements: detailed description of what real-time features are needed (chat, live cursors, notifications, collaborative editing, live data streams) with latency and reliability expectations.
- Data models: the domain objects that will be transmitted in real-time (messages, cursor positions, document changes, notification payloads) with their schemas and size estimates.
- Authentication system: token format (JWT, session cookie), validation mechanism, and how real-time connections authenticate (token in query param, first-message authentication, cookie-based).
- Scaling requirements: expected number of concurrent connections (100 vs 100,000), expected message throughput per second, number of server instances, and deployment environment (bare metal, Kubernetes, serverless).
- Existing infrastructure: message queue/broker availability (Redis, RabbitMQ, Kafka), load balancer configuration (sticky sessions support), and monitoring infrastructure for connection metrics.
- Client platform: browser (WebSocket API), mobile (native WebSocket or library), or both — different platforms have different reconnection behaviors and background connection handling.

## Outputs

- WebSocket server: a WebSocket server implementation (ws library on Node.js, WebSocket handler in Go, ActionCable in Rails, or a managed service like Socket.IO, Colyseus, or Pusher) that handles connection lifecycle, authentication, channel subscription, and message routing.
- Client-side connection manager: a singleton class or hook (`useWebSocket`, `useRealtime`) that manages the connection lifecycle, reconnection with backoff, subscription tracking, message deduplication, and fallback transport selection.
- Channel subscription system: server-side channel/room registry with authorization checks, per-connection subscription tracking, and automatic cleanup on disconnect.
- Presence service: a pub/sub-backed presence tracker that maintains online/offline/away status per user per channel, with configurable timeout for zombie detection.
- Message router: a pub/sub integration that distributes incoming messages to all server instances subscribed to the target channel.
- Reconnection resilience layer: client-side reconnection logic with exponential backoff + jitter, subscription restoration, missed-message catch-up via REST API, and connection state observability.
- Fallback transport layer: a transport abstraction that automatically downgrades from WebSocket → SSE → long-polling based on connection success/failure, with a common interface hiding the transport choice from application code.
- Heartbeat/ping-pong system: server-side ping interval (30s), client-side pong response (within 10s), automatic disconnection of unresponsive clients, and presence status update on timeout.

## Rules

1. Never trust client-provided channel names for authorization — always verify on the server that the connected user has permission to subscribe to the channel they are requesting, even if the client previously subscribed to it.
2. Always implement heartbeat (ping/pong) — without heartbeats, zombie connections accumulate, presence becomes inaccurate, and server resources are wasted on dead connections.
3. Never send raw WebSocket frames without a message envelope — always wrap messages in a structured format with `type`, `id`, `channel`, and `payload` fields for consistent routing and deduplication.
4. Always use a unique message ID for every message — IDs enable deduplication on the receiver when the same message arrives via multiple paths (e.g., retry after missed ack).
5. Never expose internal server information in error messages sent over WebSocket — return generic error codes (`AUTH_FAILED`, `INVALID_MESSAGE`, `RATE_LIMITED`) without stack traces or server details.
6. Always handle the case where a client subscribes to a channel they are already subscribed to — deduplicate subscriptions to avoid double-message delivery and unnecessary memory use.
7. Never hardcode reconnection intervals — use exponential backoff with a configurable base (1s), multiplier (2x), max interval (30s), and max retries (20) to avoid reconnect storms.
8. Always clean up all subscriptions and timers when a client disconnects — failure to do so causes memory leaks and phantom presence entries.
9. Never block the event loop for message broadcasting — use asynchronous pub/sub and message queuing to avoid slowing down connection handling for other clients.
10. Always provide a way to manually reconnect — expose a `reconnect()` method or button so users can recover from persistent connection failures without reloading the page.

## Best Practices

1. Use a managed real-time platform (Pusher, Ably, Supabase Realtime, Firebase) for applications under 10,000 concurrent connections — managing WebSocket scaling, pub/sub, and presence at scale is operationally complex and better left to specialized providers.
2. Implement message compression for high-throughput scenarios — use PerMessage-Deflate (WebSocket compression extension) or compress message payloads (zlib, brotli) before sending for chat applications with large messages.
3. Store the last N messages per channel in an in-memory ring buffer (Redis sorted set with timestamp score) — when a client reconnects and requests missed messages, serve them from the buffer rather than the database.
4. Use a shared-memory data store (Redis) for presence state across server instances — store `userId → { status, lastSeen, serverInstance }` with TTL equal to heartbeat interval × 3, so all instances can query presence without direct communication.
5. Implement backpressure handling: if a client's receive buffer is full (slow consumer), drop non-critical messages or disconnect the client with a `RATE_LIMITED` close code and let reconnection logic handle recovery.
6. Use binary encoding for high-frequency messages (game state, cursor positions) — Protocol Buffers or MessagePack over WebSocket is 10-50x smaller than JSON for structured real-time data.
7. Implement message throttling per connection: limit a single client to 100 messages/second — excessive messages may indicate a bug or malicious behavior; throttle and disconnect if limit is exceeded repeatedly.
8. Use sticky sessions (session affinity) in load balancers for WebSocket connections — since WebSocket is a persistent long-lived connection, routing all requests from a client to the same server avoids reconnection on every request.
9. Monitor real-time connection metrics: total connections, messages per second, reconnection rate, average connection duration, and handshake failures — set alerts for reconnection rate spikes (>10% of total connections).
10. Implement graceful server shutdown: when a server instance is shutting down (deploy, scale-in), close all WebSocket connections with a 1001 (Going Away) close code and a `reconnect: true` flag in the close reason — clients immediately reconnect to another instance.

## Anti-patterns

1. Polling for real-time updates when WebSocket or SSE would be more appropriate — polling at 5-second intervals creates 20× more HTTP requests than a persistent connection, wasting bandwidth and server resources.
2. Implementing custom WebSocket reconnection logic from scratch — hand-rolled reconnection often misses edge cases (backoff jitter, subscription restoration, deduplication) that libraries like Socket.IO or `reconnecting-websocket` handle.
3. Broadcasting a message to all connected clients without channel scoping — this leaks data to unauthorized users and saturates bandwidth; always scope broadcasts to specific channels with authorization.
4. Sending binary data without length validation — a malicious client could send a multi-megabyte binary frame that exhausts server memory; enforce maximum message size (e.g., 256KB per message) at the transport level.
5. Blocking the main thread with synchronous pub/sub operations — publishing to Redis or RabbitMQ should be asynchronous so the WebSocket handler can continue processing other messages.
6. Ignoring WebSocket close codes — close codes (1000 normal, 1001 going away, 1008 policy violation, 1011 internal error) provide important signals for reconnection behavior; a client should not reconnect on policy violations but should on server restarts.
7. Storing the WebSocket connection object in a global in-memory map in a multi-instance deployment — when the message must reach a user connected to a different instance, the message is lost; always use pub/sub to distribute messages across instances.
8. Not validating message size at the protocol level — if no limit is enforced, a client can send a 100MB JSON payload that takes 10 seconds to parse, blocking the event loop and starving other connections.

## Edge Cases

1. Browser tab backgrounded: browsers throttle WebSocket traffic for background tabs (especially on mobile) — the heartbeat may be delayed, potentially triggering false disconnections. Set heartbeat timeout to 60s (2× the expected interval) to accommodate throttling.
2. Corporate proxy blocking WebSocket: some corporate firewalls block WebSocket upgrade requests. The connection manager must detect the upgrade failure (catch the error event) and fall back to SSE or long-polling transparently.
3. Server rolling deployment: during a rolling deploy, connections are drained. The server must send close code 1001 with `reconnect: true` so clients immediately reconnect to a different instance without user-visible interruption.
4. Client clock skew: if message timestamps are used for ordering and the client's clock is skewed by hours, messages may appear out of order or be rejected. Use server-assigned sequence numbers or Lamport clocks for ordering, not client timestamps.
5. Multiple tabs: a user may have the same application open in multiple browser tabs. Each tab gets its own WebSocket connection. The client should deduplicate notifications received in multiple tabs using BroadcastChannel API and show notifications only once.
6. Rapid subscribe/unsubscribe: a user navigating through chat rooms rapidly may send hundreds of subscribe/unsubscribe messages in seconds. Batch subscription changes and process them in a microtask (requestAnimationFrame or setImmediate) to avoid overwhelming the server.
7. Large channel fan-out: a channel with 50,000 subscribers (e.g., a live event broadcast) — broadcasting to each individual WebSocket connection is slow. Use multicast or binary message frames with shared buffer to optimize fan-out.
8. Message larger than max frame size: WebSocket has a max frame size (typically 1MB for browsers). Messages larger than this must be split into multiple frames with sequence numbers and reassembled on the client.

## Validation Checklist

- [ ] WebSocket connection lifecycle is managed: connect, authenticate, heartbeat, graceful close, and cleanup on all paths.
- [ ] Reconnection uses exponential backoff with jitter, capped at 30s, with max 20 retries before showing a manual reconnect UI.
- [ ] Channel subscriptions are authorized server-side — a user cannot subscribe to a channel they do not have permission to access.
- [ ] All messages use a standard envelope with `type`, `id`, `channel`, and `payload` — verified by inspecting sent messages.
- [ ] Heartbeat/ping-pong is active (server ping every 30s, client pong within 10s) — zombie connections are detected and cleaned up.
- [ ] Presence tracking is accurate: user connects → status "online" is broadcast; user disconnects → status "offline" is broadcast within heartbeat timeout.
- [ ] Multi-instance pub/sub is configured: a message published on one instance reaches clients connected to other instances.
- [ ] Message size limit is enforced at the transport level (max 256KB per message) — larger messages are rejected or split.
- [ ] Fallback transport works: when WebSocket is blocked, the client falls back to SSE, then to polling, with a seamless user experience.
- [ ] Connection state is observable: the application can react to `connected`, `disconnected`, `reconnecting`, and `error` states to update the UI.

## Engineering Examples

### Example 1: Implementing a Real-Time Chat System with WebSockets

A customer support chat application uses WebSocket for real-time messaging. The server (Node.js with `ws` library) handles 10,000 concurrent connections across 4 server instances. Redis Pub/Sub distributes messages across instances. Each chat room has a `chat:room:{id}` channel. When a support agent messages a customer, the server publishes `{ type: "message", channel: "chat:room:42", payload: { senderId: 123, text: "How can I help?", timestamp: Date.now() }, id: uuid }` to Redis. All server instances receive the message and forward it to clients subscribed to `chat:room:42`. The client uses `reconnecting-websocket` library with 1s initial reconnect, 2x multiplier, 30s max. Heartbeat: server sends ping every 30s, client responds with pong. If no pong in 10s, the server closes the connection and broadcasts presence "offline". Messages are persisted to PostgreSQL in batches (every 5 seconds). The client shows optimistic message delivery: the message appears immediately in the chat with a "sending" indicator, and when the ack arrives, it changes to "sent". If no ack after 5s (3 retries), the message is marked "failed" with a resend button. Presence shows typing indicators: when a user types, the client sends `{ type: "typing", channel: "chat:room:42", payload: { userId: 123 } }` every 2 seconds while typing, and the server broadcasts to other room members who show "... is typing".

### Example 2: Building a Live Cursor Presence Feature

A collaborative whiteboard application shows the cursor positions of all connected users in real-time. Each user's cursor position is sent as a binary MessagePack message (32 bytes: userId, x, y, timestamp) at 30fps while the mouse is moving. The server throttles messages: a client can send at most 30 cursor updates/second. The updates are published to Redis channel `board:{boardId}:cursors`. Each client receives cursor updates from all other connected users and renders them as colored dots with the user's name. Presence: on connect, the client sends `{ type: "presence", board: "board:42", status: "online" }`. Other users see a new cursor appear. On disconnect (or 30s heartbeat timeout), the cursor fades out. Cursor positions are not persisted — they are ephemeral and only matter while users are connected. The system uses a binary protocol for cursor updates (MessagePack) to minimize bandwidth at 30fps. For a board with 50 concurrent users, each user receives 49 × 30 = 1,470 cursor updates/second, each 32 bytes = ~47 KB/s — manageable bandwidth. Throttling is enforced by token bucket per connection (30 tokens/second).

### Example 3: Designing a Real-Time Notification Stream with Reconnection Resilience

A project management app streams notifications to users in real-time. The server uses SSE (not WebSocket) since the stream is uni-directional: server pushes notifications to clients, and clients never send messages over the stream (notifications are marked as read via REST API). The SSE endpoint is `GET /api/notifications/stream?token=jwt`. The server sets `Content-Type: text/event-stream` and streams events in SSE format: `event: notification\ndata: {"type":"task_assigned","taskId":456}\n\n`. A heartbeat comment (`: heartbeat`) is sent every 15s to keep the connection alive and detect disconnection. On the client, the `EventSource` API is used. When `EventSource` disconnects (fires `onerror`), the client waits 2s and reconnects with the same JWT token. The server tracks the last event ID per user and sends missed events on reconnect using `Last-Event-ID` header. If SSE fails after 3 attempts (or if the browser doesn't support EventSource), the client falls back to polling `GET /api/notifications?since={lastEventId}` every 10 seconds. The fallback is transparent: the notification UI component abstracts the transport and just subscribes to a `onNotification` callback. Reconnection resilience is critical here — users should not miss notifications even if their network drops for 5 minutes. The SSE endpoint is served by a different subdomain (stream.app.com) to avoid blocking per-connection limits (browsers limit 6-8 connections per domain).
