# API Client Design

## Purpose

Establish authoritative patterns for designing, building, and maintaining API clients that are resilient, type-safe, observable, and easy to integrate. This skill covers the decision between SDKs and generated clients, client architecture (service layer, interceptors, error handling), retry and circuit-breaking patterns, request/response transformation, authentication integration, type generation from OpenAPI specifications, client-side caching, offline support, and rate-limit handling. The goal is to produce API clients that handle network failures gracefully, respect upstream limits, and provide a clean interface to application code.

## Responsibilities

- Deciding between hand-written SDKs, auto-generated clients (OpenAPI Generator, Kiota), or lightweight HTTP wrappers based on project needs.
- Structuring the client with layered architecture: transport (HTTP, WebSocket), interceptors (auth, logging, retry), service methods (typed API operations), and error handling.
- Implementing retry logic with exponential backoff and jitter for transient failures, and circuit breaker patterns for sustained failures.
- Transforming requests (adding headers, serializing payloads) and responses (deserializing, normalizing error shapes) consistently.
- Integrating authentication flows: API keys, OAuth2 client credentials, token refresh with automatic retry on 401.
- Generating TypeScript/Java/Kotlin types from OpenAPI specs to ensure compile-time type safety between client and server.
- Implementing client-side caching strategies (in-memory, HTTP cache headers, stale-while-revalidate) to reduce latency and network calls.
- Supporting offline scenarios with request queuing and retry when connectivity resumes.
- Handling rate limits by parsing `Retry-After` headers, implementing token-bucket algorithms, and queueing requests.
- Instrumenting the client with metrics (request duration, error rate, cache hit rate) and structured logging for observability.

## Decision Process

1. **Choose between SDK, generated client, or raw HTTP.** If the API is internal and changes frequently, use a generated client from an OpenAPI spec. If the API is stable and well-documented, a thin SDK wrapper may suffice. For a single endpoint, raw HTTP with a typed function may be enough.
2. **Define the client's error model.** Map HTTP status codes to typed exceptions: `4xx` → `ClientError` (with subclasses for 400, 401, 403, 404, 429), `5xx` → `ServerError`. Include the response body and request ID in the error object.
3. **Design the interceptor pipeline.** Interceptors run in order: auth (inject token), logging (log request), retry (wrap in retry logic), rate-limit (throttle if needed), timeouts (enforce deadline), circuit-breaker (check health). Response interceptors process in reverse order.
4. **Implement retry strategy.** Retry on 429 (rate limited), 502, 503, 504, and network errors (ECONNRESET, ETIMEDOUT). Use exponential backoff with jitter. Set a maximum retry count (3) and a maximum total retry duration (30 seconds). Do not retry on 400, 401, 403, 404, 409, or 422.
5. **Configure circuit breaker.** Track failure rate over a sliding window (e.g., 60 seconds). If failure rate exceeds a threshold (50%), open the circuit and fail fast for a cooldown period (30 seconds). After cooldown, allow a single trial request. If it succeeds, close the circuit. If it fails, reopen.
6. **Integrate authentication.** For OAuth2, acquire tokens using the client credentials flow (for service-to-service) or authorization code flow (for user-facing). Implement automatic token refresh: intercept 401 responses, refresh the token, and retry the original request once.
7. **Generate types from OpenAPI.** Set up the OpenAPI Generator or Kiota as a build step. Generate the client, models, and API interfaces. Pin the generator version. Commit the generated code or generate it during CI.
8. **Design caching strategy.** For read endpoints, implement in-memory caching with TTL. Use `Cache-Control` headers from the response to set TTLs. Implement stale-while-revalidate for frequently accessed data. Invalidate cache on successful write operations for the same resource.
9. **Implement rate-limit handling.** Parse `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers from responses. Before sending a request, check if the rate limit is exhausted. If so, queue the request until the reset time. Use a token-bucket algorithm for client-side rate limiting.
10. **Instrument the client.** Emit metrics for: request duration (histogram), request count (counter), error count by status code (counter), cache hits/misses (counter), circuit breaker state (gauge), and rate limit remaining (gauge). Log every request at DEBUG level with method, path, duration, and status.

## Inputs

- OpenAPI specification (OpenAPI 3.0 or 3.1) defining the API contracts.
- Authentication requirements: API key, OAuth2 (Client Credentials, Authorization Code), mutual TLS.
- Performance requirements: acceptable latency P99, throughput, cache hit ratio.
- Uptime and reliability requirements: retry budget, circuit breaker thresholds, offline support needs.
- Existing API client code that may need migration.
- Rate limit policies from the API provider (requests per minute, burst limits, reset behavior).

## Outputs

- A typed API client library with service methods corresponding to API endpoints.
- Interceptor configuration (auth, retry, logging, circuit breaker, rate limiter).
- Generated types and models matching the OpenAPI specification.
- Client-side caching layer with configurable TTL and invalidation.
- Metrics and logging setup for observability.
- Integration tests that verify retry, error handling, and auth refresh behavior.
- Documentation covering client initialization, error handling patterns, and common usage examples.

## Rules

1. **Never expose raw HTTP response objects to application code.** The client must return typed domain objects or throw typed exceptions. Application code must not parse raw JSON or inspect HTTP status codes.
2. **Every client method must be asynchronous.** Blocking network calls in UI threads or event loops cause application freezes. Use async/await, Promises, or reactive streams for all client operations.
3. **Authentication tokens must never be logged.** Mask tokens in logs. If a request is logged, replace the `Authorization` header value with `[REDACTED]`.
4. **Retry logic must include jitter.** Without jitter, retries from multiple clients synchronize and cause thundering herd problems. Add random jitter of ±50% of the backoff interval.
5. **Circuit breaker must be per-host or per-endpoint, not global.** A failing endpoint should not affect a healthy endpoint on the same API. Implement separate circuit breakers for different service endpoints.
6. **Timeouts must be configurable per request and as a default.** No request should hang indefinitely. Set a default timeout of 30 seconds for most APIs. Allow callers to override per-request.
7. **Generated code must never be manually edited.** If the generated client has issues, fix the OpenAPI spec or customize the code generator template, not the output. Manual edits are lost on regeneration.
8. **Client should emit structured logs with correlation IDs.** Each request gets a unique request ID. Log the request ID at every step (send, retry, success, failure) to enable tracing.
9. **Caching must respect `Cache-Control` directives from the server.** If the server sends `no-cache` or `max-age=0`, do not cache the response. If the server sends `private`, cache only in memory, not in shared caches.
10. **Rate limiting must handle clock skew.** If the server sends `Retry-After` as a Unix timestamp, use the client's local clock, not the server's clock. If the server's `X-RateLimit-Reset` is in the past, use a minimum 1-second delay.

## Best Practices

1. **Use interceptors/middleware for cross-cutting concerns.** Authentication, logging, retry, and rate limiting should be interceptors, not duplicated across every service method. This keeps service methods clean and enables reordering of middleware.
2. **Implement a health check endpoint on the client.** The client should expose a `health()` method that makes a lightweight request to the API's health endpoint. Use this for startup probes and dependency health checks.
3. **Use connection pooling for HTTP clients.** Configure keep-alive, max connections per host, and idle timeout. Connection pooling significantly improves throughput for APIs with many requests.
4. **Implement graceful degradation.** If the circuit breaker is open or the rate limit is exhausted, return a cached response (even if stale) rather than throwing an error. Document when this happens via logs and metrics.
5. **Test retry and circuit breaker behavior with integration tests.** Use a mock HTTP server that returns specific status codes or times out. Verify that the client retries the correct number of times, applies backoff, opens the circuit, and recovers.
6. **Version the client library using semver.** The client's major version should track the API's major version. Breaking changes in the API require a new major version of the client.
7. **Provide a factory or builder pattern for client construction.** The builder should accept configuration (base URL, timeout, retry count, circuit breaker settings, auth provider). This makes testing easier and configuration explicit.
8. **Use a testing stub or mock for the client in application tests.** The generated client interfaces should be mockable. Application code testing against the client should use a mock, not a real HTTP server.
9. **Monitor client-side metrics in production.** Track request duration, error rate by status code, circuit breaker state changes, and rate limit exhaustion. Alert on high error rates or open circuits.
10. **Support request cancellation.** Allow callers to pass a cancellation token (C#), `AbortSignal` (JavaScript), or context (Go). Long-running requests should be cancellable to free resources.

## Anti-patterns

1. **Writing a custom HTTP client for every API integration.** This duplicates retry logic, error handling, and authentication across the codebase. Create a single base client class or use an interceptor-based HTTP library.
2. **Ignoring rate limit headers and expecting the server to enforce limits.** The client should back off when rate limits are approaching, not wait for 429 responses. This reduces server load and prevents request failures.
3. **Caching responses indefinitely without invalidation.** This serves stale data after the resource has been updated. Always set TTLs and invalidate on writes. Use `stale-while-revalidate` to balance freshness and latency.
4. **Blocking the main thread with synchronous HTTP calls.** In Node.js, Java Servlets, or Android, blocking the event loop or UI thread causes the entire application to freeze. Always use async APIs.
5. **Hard-coding base URLs or authentication tokens in the client.** Make these configurable through the client constructor or a configuration object. Hard-coding prevents using the client in different environments.
6. **Not differentiating between retryable and non-retryable errors.** Retrying a 400 Bad Request or 401 Unauthorized is wasted effort. Map error types correctly and only retry transient errors.
7. **Writing raw HTTP request/response handling in application code.** If the application code constructs URLs, serializes JSON, parses responses, and handles errors for each API call, the code is tightly coupled to the API implementation details.

## Edge Cases

1. **DNS resolution failures that are transient.** Sometimes a DNS lookup fails due to network issues but succeeds on retry. Ensure the retry logic covers DNS failures (ECONNRESET, ENOTFOUND).
2. **Rate limit resets that are consistently wrong.** Some APIs return inaccurate `Retry-After` values. Implement a minimum delay of 1 second and a maximum delay of 60 seconds, regardless of the header value.
3. **Concurrent requests hitting the rate limit simultaneously.** If 20 requests are in-flight and the rate limit is exhausted, all 20 will receive 429. The client should batch the retry or queue requests before sending.
4. **Token refresh race conditions.** If 10 requests are in-flight and all receive 401, they all trigger a token refresh simultaneously. Use a mutex to ensure only one refresh request is in-flight, and all other requests wait for the new token.
5. **Partial response from a streaming API.** If the server sends a partial response and then the connection drops, the client should not return corrupted data. Validate response completeness (e.g., JSON parsing) before returning.
6. **Mutual TLS certificate rotation.** If the server rotates its TLS certificate, existing connections with the old certificate will fail. Ensure the HTTP client uses the latest CA certificate bundle and retries on TLS errors.

## Validation Checklist

- [ ] Client uses typed service methods, not raw HTTP calls.
- [ ] Error mapping from HTTP status codes to typed exceptions is implemented.
- [ ] Interceptor pipeline is configured with auth, logging, retry, and rate limiting.
- [ ] Retry logic uses exponential backoff with jitter and covers transient failures only.
- [ ] Circuit breaker is configured with per-host granularity.
- [ ] Authentication uses automatic token refresh with race condition protection.
- [ ] Types are generated from OpenAPI spec (or hand-written with identical schema).
- [ ] Client-side caching is implemented with TTL and invalidation on writes.
- [ ] Rate limit headers are parsed and honored client-side.
- [ ] All client methods are asynchronous.
- [ ] Timeouts are configurable with a sensible default.
- [ ] Metrics and structured logging are instrumented.
- [ ] Integration tests cover retry, circuit breaker, auth refresh, and error handling.
- [ ] Cancellation tokens are supported.
- [ ] Client is configurable (base URL, timeouts, retry settings).

## Engineering Examples

### Example 1: Resilient API Client with Retry and Circuit Breaker

A TypeScript API client for a payment gateway with retry and circuit breaker patterns.

```typescript
import { Client, CircuitBreaker, RetryInterceptor, AuthInterceptor, RateLimitInterceptor } from '@company/http-client';

class PaymentClient {
  private readonly client: Client;

  constructor(config: PaymentClientConfig) {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,       // Open after 5 failures in window
      successThreshold: 2,       // Close after 2 consecutive successes
      windowDurationMs: 60_000,  // Sliding window of 60 seconds
      cooldownMs: 30_000,        // Wait 30 seconds before trying again
    });

    const retryInterceptor = new RetryInterceptor({
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10_000,
      jitter: true,
      retryableStatuses: [429, 502, 503, 504],
      retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
    });

    const authInterceptor = new AuthInterceptor({
      tokenUrl: config.tokenUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      scopes: ['payments:write'],
    });

    const rateLimitInterceptor = new RateLimitInterceptor({
      maxRequestsPerMinute: 1000,
    });

    this.client = new Client({
      baseUrl: config.baseUrl,
      timeout: 30_000,
      interceptors: [
        authInterceptor,        // 1. Add auth header
        rateLimitInterceptor,   // 2. Check rate limit
        retryInterceptor,       // 3. Wrap in retry
        circuitBreaker,         // 4. Check circuit breaker
      ],
    });
  }

  async createPayment(amount: number, currency: string, sourceId: string): Promise<Payment> {
    return this.client.post('/v1/payments', { amount, currency, source: sourceId });
  }

  async getPayment(paymentId: string): Promise<Payment> {
    return this.client.get(`/v1/payments/${paymentId}`);
  }
}
```

### Example 2: Generating Typed API Clients from OpenAPI Specs

A build pipeline that generates a fully-typed client from an OpenAPI specification.

```yaml
# CI step: Generate client from OpenAPI spec
- name: Generate API Client
  run: |
    npx @openapitools/openapi-generator-cli generate \
      -i spec/openapi.yaml \
      -g typescript-fetch \
      -o packages/api-client/src/generated \
      --additional-properties=supportsES6=true,withInterfaces=true,useSingleRequestParameter=true

- name: Build type-checked client
  run: |
    cd packages/api-client
    npm run build
    npm run test
```

Generated client usage:
```typescript
import { Configuration, PaymentsApi, type CreatePaymentRequest } from '@company/api-client';

const config = new Configuration({ basePath: 'https://api.example.com', accessToken: token });
const paymentsApi = new PaymentsApi(config);

const request: CreatePaymentRequest = {
  createPaymentBody: { amount: 1000, currency: 'USD', source: 'tok_visa' },
};

const payment = await paymentsApi.createPayment(request);
// payment has full TypeScript type information:
//   payment.id: string
//   payment.status: 'succeeded' | 'failed' | 'pending'
//   payment.amount: number
```

### Example 3: API Client with Automatic Token Refresh

An OAuth2 client credentials flow with automatic token refresh and mutex protection.

```typescript
class OAuth2Provider {
  private token: string | null = null;
  private expiresAt: number = 0;
  private refreshPromise: Promise<string> | null = null;

  constructor(private readonly config: OAuth2Config) {}

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt - 60_000) {
      return this.token; // Token still valid (with 60s buffer)
    }

    // Mutex: only one refresh at a time
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshToken();
    }

    return this.refreshPromise;
  }

  private async refreshToken(): Promise<string> {
    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: this.config.scopes.join(' '),
        }),
      });

      const data = await response.json() as { access_token: string; expires_in: number };
      this.token = data.access_token;
      this.expiresAt = Date.now() + data.expires_in * 1000;
      return this.token!;
    } finally {
      this.refreshPromise = null;
    }
  }
}
```

Token refresh interceptor:
```typescript
class AuthInterceptor {
  constructor(private readonly authProvider: OAuth2Provider) {}

  async onRequest(request: Request): Promise<Request> {
    const token = await this.authProvider.getToken();
    request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  }

  async onResponseError(response: Response, request: Request): Promise<Response> {
    if (response.status === 401) {
      // Force refresh: invalidate cached token
      this.authProvider.invalidate();
      // Retry with fresh token
      const token = await this.authProvider.getToken();
      request.headers.set('Authorization', `Bearer ${token}`);
      return fetch(request); // Retry the original request once
    }
    throw new ApiError(response.status, await response.text());
  }
}
```
