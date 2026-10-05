# Error Handling

## Purpose

The Error Handling skill defines a comprehensive strategy for detecting, classifying, propagating, and responding to errors throughout the entire system. It distinguishes between expected and unexpected errors, recoverable and fatal failures, and establishes consistent patterns for error propagation, user-facing messages, debug logging, retry logic, and system recovery. The goal is to ensure that the system behaves predictably under all failure conditions, preserves data integrity, provides meaningful feedback to users and operators, and avoids cascading failures through controlled error boundaries and backpressure.

## Responsibilities

- Classify every possible error condition in the system as expected (validation, not found, conflict, rate limited) or unexpected (null pointer, network timeout, disk full, out of memory) and as recoverable (can retry) or fatal (cannot proceed).
- Implement consistent error propagation patterns: use return values for expected errors, use exceptions or panics only for unexpected errors, and never use exceptions for control flow.
- Define and enforce error boundaries at frontend component boundaries to prevent a JavaScript error in one component from crashing the entire page.
- Implement middleware-based error handling in backend services to catch unhandled errors, log them with full context, and return a consistent structured error response.
- Design structured error responses that include a machine-readable error code, a human-readable message (safe for end users), a debug identifier (trace ID), and HTTP status code. Never include stack traces or internal details in responses to clients.
- Separate user-facing error messages (safe, translated, actionable) from debug information (stack trace, internal state, database query) that is logged or returned in development/staging environments only.
- Implement panic recovery at every goroutine/task boundary in Go and similar languages to prevent a single panic from crashing the entire process. Log the panic with stack trace and re-raise if necessary.
- Design and implement retry logic with exponential backoff and jitter for transient failures, with clear limits on total retry duration and number of attempts.
- Ensure idempotency for all operations that can be retried, so that executing the same request multiple times produces the same result as executing it once.
- Continuously monitor error rates, error types, and error distribution to detect emerging issues before they become incidents.

## Decision Process

1. **Identify the error type.** When an error condition arises, classify it: expected (user input validation, resource not found, duplicate entry, rate limit exceeded) or unexpected (network timeout, database connection refused, null reference exception, out-of-memory error). Expected errors are part of normal system operation; unexpected errors indicate bugs or infrastructure issues.

2. **Determine recoverability.** Is this error likely transient (network blip, database restart, temporary rate limit) or permanent (invalid input, missing record, malformed data)? Transient errors can be retried; permanent errors must be returned to the caller. Be conservative: if unsure, treat the error as permanent and do not retry.

3. **Choose the propagation mechanism.** For expected errors, use return values (Result, Either, or custom error objects). For unexpected errors in languages with exceptions, throw typed exceptions. In Go, use error return values for everything. In Rust, use Result for recoverable errors and panic! only for unrecoverable invariants. Never use exceptions or errors for control flow.

4. **Design the error response.** Define a structured format for errors returned to callers. Include: `error.code` (machine-readable, e.g., `ORDER_NOT_FOUND`), `error.message` (human-readable, safe for end users), `error.trace_id` (UUID for correlating logs), and `error.details` (optional, additional structured info like validation errors). The HTTP status code must match the error semantics (400 for validation, 401 for auth, 403 for forbidden, 404 for not found, 409 for conflict, 429 for rate limit, 500 for internal errors).

5. **Log error context.** Every error that reaches the error handling middleware must be logged with full context: the trace ID, the request method and path, the user (if authenticated), the error message and type, the stack trace (for unexpected errors), and any relevant internal state (but never secrets or PII). Use structured logging (JSON) so logs can be queried programmatically.

6. **Implement error boundaries.** In frontend applications, wrap each component or page section in an error boundary. When a component throws an error during rendering, the boundary catches it, logs the error to the monitoring service, and renders a fallback UI. This prevents one broken component from crashing the entire application.

7. **Set retry parameters.** For transient errors, configure retry: initial backoff of 100ms, exponential multiplier of 2, maximum backoff of 10 seconds, maximum retry count of 3, and total retry duration limit of 30 seconds. Add jitter (±25%) to prevent thundering herd. Never retry on 4xx errors (client mistakes) or on operations that are not idempotent.

8. **Ensure idempotency.** Every operation that can be retried must be idempotent. Use idempotency keys: the client generates a unique key (UUID v4) and sends it with the request. The server checks if the key has been processed before: if yes, return the cached result; if no, process and cache the result. This ensures that retries do not create duplicate resources or cause side effects.

9. **Implement graceful degradation.** When a non-critical dependency fails (recommendation engine, analytics, personalization), do not propagate the error to the client. Instead, log the error and fall back to default behavior. Only propagate errors from critical dependencies (database, auth, payment processing).

10. **Monitor and alert.** Track error counts by type, endpoint, and service. Set alerts for unexpected error rate exceeding a threshold (e.g., >1% of requests over 5 minutes). Monitor retry rates: if retries are frequent, the dependency may be unstable. Monitor error boundary triggers: if error boundaries fire frequently, there is a systemic issue.

## Inputs

- Service architecture and dependency graph (which services call which dependencies, what is critical vs. non-critical).
- API contract definitions (OpenAPI, GraphQL schema, gRPC proto files) that specify possible error codes for each endpoint.
- Frontend component tree and routing structure for determining error boundary placement.
- Monitoring platform configuration (Datadog, Grafana, Sentry, CloudWatch) for error tracking and alerting.
- SLO definitions for error rate thresholds.
- Retry and timeout configuration for HTTP clients, message queue consumers, and database clients.
- Existing error handling patterns in the codebase (custom error classes, middleware, error response format).

## Outputs

- A consistent error handling middleware that catches all unhandled errors, logs them with full context, and returns a structured error response.
- Typed error classes or error types for every category of expected error (ValidationError, NotFoundError, ConflictError, RateLimitError, UnauthorizedError, ForbiddenError, InternalError).
- Error boundary components in the frontend that catch rendering errors and display fallback UI.
- Structured error response format documented in the API specification with example responses for each error code.
- Retry policy implementation with exponential backoff, jitter, and configurable limits.
- Idempotency key middleware that ensures safe retries for mutating endpoints.
- Graceful degradation logic for non-critical dependencies with documented fallback behavior.
- Error monitoring dashboards and alerts with error rate, error type, and trace-based correlation.

## Rules

1. Never return raw exception messages or stack traces to the client. Always map exceptions to a structured error response with a safe user-facing message and a debug trace ID.
2. Never use exceptions or panics for normal control flow. Exceptions are for exceptional (unexpected) conditions. Expected conditions like validation failures must use return values.
3. Every backend service must have an error handling middleware that catches unhandled errors, logs them with a trace ID, and returns a consistent JSON error response.
4. Every frontend component must be wrapped in an error boundary (or equivalent) unless it is a leaf component that cannot fail. Root-level components must always have an error boundary.
5. Retries must only be attempted for transient failures (timeout, 503, 429, connection refused). Never retry for 4xx client errors (400, 401, 403, 404, 422) or for operations that mutate state without idempotency guarantees.
6. Idempotency is required for all mutating API endpoints that the client may retry (POST, PUT, PATCH, DELETE). The idempotency key must be provided by the client. The server must deduplicate requests on the server side.
7. All errors must be logged with a unique trace ID that correlates the error with the request context. The trace ID must be returned to the client in the error response and included in all downstream calls.
8. Panics in goroutines, threads, or async tasks must be caught and logged. An unhandled panic in a single goroutine must not crash the entire process. Use a recovery mechanism at the top of every goroutine.
9. Error messages must not contain sensitive information: no passwords, API keys, personal data, database connection strings, or internal IP addresses.
10. Error rates must be monitored with alerts. If any endpoint's unexpected error rate exceeds 1% over 5 minutes, an alert must fire. If the error rate exceeds 5% over 5 minutes, the on-call engineer must be paged.

## Best Practices

- Use a custom error class hierarchy that extends a base `AppError` with `statusCode`, `errorCode`, `message`, and `isOperational` flag. Operational errors (expected) can be handled gracefully; programmer errors (unexpected) should crash the process or trigger an alert.
- Return errors as structured objects from the API layer, never as plain strings or untyped objects. Use a consistent schema: `{ error: { code: string, message: string, trace_id: string, details?: any } }`.
- Implement error correlation using a context object that carries trace ID, user ID, request path, and other metadata. Pass the context through all layers (middleware → controller → service → repository) and include it in every log line and error response.
- Use a centralized error code registry with documentation for each code. The registry helps developers and client integrators understand what each error means and how to handle it. Example: `ORDER_NOT_FOUND` (404), `ORDER_ALREADY_CANCELLED` (409), `RATE_LIMIT_EXCEEDED` (429).
- Log the full error chain (cause → error → wrapping context) at the point where the error is handled, not at every intermediate layer. Logging at every layer creates noise. Log once at the error handling boundary.
- Test error handling paths explicitly. Write unit tests that simulate every error type (database failure, network timeout, validation error, auth failure) and verify that the system responds appropriately (correct status code, error code, message, and trace ID).
- Implement "error hiding" for non-critical dependencies: if the recommendation engine returns a 500, do not fail the request. Log the error, return a default response, and show the user a non-personalized experience.
- Use structured error details for validation errors. Instead of a generic "Validation failed" message, include an array of field-level errors: `{ code: "VALIDATION_ERROR", details: [{ field: "email", message: "must be a valid email address" }] }`.
- For gRPC services, use the standard gRPC error codes (INVALID_ARGUMENT, NOT_FOUND, ALREADY_EXISTS, PERMISSION_DENIED, UNAUTHENTICATED, RESOURCE_EXHAUSTED, FAILED_PRECONDITION, ABORTED, OUT_OF_RANGE, UNIMPLEMENTED, INTERNAL, UNAVAILABLE, DATA_LOSS) and include a structured error body in the status details.
- Implement a "last resort" error handler at the process level (e.g., `process.on('uncaughtException')` in Node.js, `recover()` in Go's `main`) that logs the error with full stack trace, attempts to gracefully shut down (close database connections, drain in-flight requests), and exits with a non-zero status code.

## Anti-patterns

- **Swallowing errors with empty catch blocks.** `try { ... } catch (e) {}` hides errors and makes debugging impossible. Every catch block must either handle the error (log it, return a fallback) or re-throw it.
- **Returning 500 for all errors.** A validation error and a database connection failure should not both return 500. Use the appropriate HTTP status code for each error category.
- **Leaking internal details in error messages.** Returning "Cannot read property 'x' of undefined" or "ORA-00942: table or view does not exist" gives attackers information about the internal system. Always map to safe messages.
- **Retrying without idempotency.** Retrying a payment charge endpoint without idempotency guarantees can charge the customer multiple times. Always use idempotency keys for operations that have side effects.
- **Catching generic exceptions.** `catch (Exception e)` catches everything, including critical system exceptions (OutOfMemoryError, StackOverflowError) that should not be caught. Catch specific exception types.
- **Over-engineering error handling.** Creating 50 custom error classes for every possible error condition, when 10 would suffice. Too many error types increase cognitive load without clear benefit. Keep the hierarchy shallow.
- **Inconsistent error response format.** Some endpoints return `{ error: "not found" }`, others return `{ message: "Not Found", code: 404 }`, and others return HTML. Standardize on a single format across all endpoints.
- **Relying on timeouts as the only error handling.** If a dependency is slow, waiting for the timeout before failing wastes resources. Use circuit breakers to fail fast when a dependency is known to be unhealthy.

## Edge Cases

- **Error during error handling.** The error handling middleware itself throws an exception (e.g., logging service is down, serialization fails). There must be a "last resort" error handler that returns a minimal 500 response without any dependencies.
- **Network timeout in a distributed system.** A downstream service times out. The upstream service must set a reasonable timeout (e.g., 5 seconds) and handle the timeout error gracefully. The error must be logged with the full context, and the client must receive a 503 with a Retry-After header.
- **Context cancellation propagation.** When a client disconnects (cancels the request), the context is canceled. The server must detect context cancellation and stop processing. The error handler must check for context cancellation specifically and not log it as a server error.
- **Multiple validation errors in a single request.** A batch creation request may have multiple items, each with different validation errors. The response must include all validation errors, not just the first one. Use `details` array to list all field-level errors.
- **Idempotency key collision (duplicate key).** Two different clients generate the same UUID (astronomically unlikely but possible). The server must detect that the existing result belongs to a different request (different request body) and return a 409 Conflict with an appropriate error code.
- **Error in non-critical background job.** An async worker processing a non-critical task (e.g., sending a welcome email) fails. The error should be logged and the message should be sent to a dead-letter queue for later inspection. The worker must not crash and must continue processing other messages.
- **Partial failure in batch operations.** A batch endpoint processes 100 items, but 3 items fail validation. The response should indicate which items succeeded and which failed, with individual error details for each failed item.

## Validation Checklist

- [ ] Every error path in the codebase returns a structured error response with `code`, `message`, and `trace_id`.
- [ ] HTTP status codes match error semantics: 4xx for client errors, 5xx for server errors. No 500 responses for validation errors.
- [ ] Error handling middleware is implemented and catches all unhandled errors. The middleware logs the error and returns a structured response.
- [ ] Error boundaries are implemented in the frontend for all major components. A rendering error in one component does not crash the page.
- [ ] Retry logic is configured with exponential backoff, jitter, and maximum retry count. Retries are only applied to transient failures.
- [ ] Idempotency is implemented for all mutating endpoints. Idempotency keys are validated and deduplicated on the server side.
- [ ] No error message contains sensitive information (secrets, PII, internal IPs, stack traces are safe for the client).
- [ ] Logging captures full context for every error (trace ID, request path, user, error type, stack trace for unexpected errors).
- [ ] Panic recovery is implemented at every goroutine/task boundary. An unhandled panic does not crash the entire process.
- [ ] Error monitoring dashboards are configured. Alerts fire when unexpected error rate exceeds the defined threshold.
- [ ] Batch operations handle partial failures gracefully, returning individual error details for each failed item.
- [ ] Context cancellation is handled: canceled requests stop processing and are not logged as server errors.

## Engineering Examples

### Example 1: Building a Consistent Error Handling Middleware (Node.js/Express)

A Node.js Express application needs consistent error handling across all routes. The team implements a layered error handling system:

**Step 1: Custom error classes**

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: any,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, `${resource.toUpperCase()}_NOT_FOUND`, `${resource} with id ${id} not found`);
  }
}

class ValidationError extends AppError {
  constructor(details: Array<{ field: string; message: string }>) {
    super(422, 'VALIDATION_ERROR', 'Validation failed', details);
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', { retryAfter });
  }
}
```

**Step 2: Error handling middleware**

```typescript
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const traceId = req.traceId;

  if (err instanceof AppError) {
    // Operational error: expected, handle gracefully
    logger.warn({ traceId, errorCode: err.errorCode, message: err.message, details: err.details });
    res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        trace_id: traceId,
        details: err.details || undefined,
      },
    });
  } else {
    // Programmer error: unexpected, log full stack trace, alert
    logger.error({ traceId, err, message: 'Unhandled error', stack: err.stack });
    // Notify monitoring service (e.g., Sentry)
    monitoring.captureException(err, { extra: { traceId, path: req.path, method: req.method } });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Our team has been notified.',
        trace_id: traceId,
      },
    });
  }
}
```

**Step 3: Route usage**

```typescript
router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await orderService.findById(req.params.id, req.traceId);
    if (!order) throw new NotFoundError('Order', req.params.id);
    res.json(order);
  } catch (err) {
    next(err); // Pass to error handler middleware
  }
});
```

This middleware pattern ensures that every route automatically gets consistent error handling. The team adds integration tests that verify each error type returns the correct status code, code, and trace ID format.

### Example 2: Implementing Error Boundaries in React

A React-based SaaS application has a complex dashboard with widgets from multiple internal teams. A bug in one widget (e.g., the recommendation widget throws `Cannot read property 'length' of undefined`) crashes the entire page. The team implements error boundaries to isolate failures.

**Step 1: Create a generic error boundary component**

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ fallback?: React.ReactNode; name: string }, ErrorBoundaryState> {
  constructor(props: { fallback?: React.ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to monitoring service with component name and error info
    logger.error({
      message: `Error boundary caught error in ${this.props.name}`,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    monitoring.captureException(error, { extra: { componentName: this.props.name } });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultFallback />;
    }
    return this.props.children;
  }
}
```

**Step 2: Wrap components with error boundaries**

```typescript
function DashboardPage() {
  return (
    <div className="dashboard">
      <ErrorBoundary name="SalesChart" fallback={<ChartErrorFallback />}>
        <SalesChart />
      </ErrorBoundary>
      <ErrorBoundary name="RecommendationWidget" fallback={<RecommendationFallback />}>
        <RecommendationWidget />
      </ErrorBoundary>
      <ErrorBoundary name="RecentOrders">
        <RecentOrdersTable />
      </ErrorBoundary>
    </div>
  );
}
```

**Step 3: Create meaningful fallback UIs**

```typescript
function RecommendationFallback() {
  return (
    <div className="widget widget--degraded">
      <h3>Recommended Products</h3>
      <p>Recommendations are currently unavailable. Check back later.</p>
    </div>
  );
}
```

**Result:** When the recommendation widget crashes, only that section of the dashboard shows the fallback. The sales chart and recent orders continue to work. The error is logged with full context for debugging. The team monitors error boundary triggers as a metric: if any boundary fires more than 5 times per day, it triggers an investigation.

### Example 3: Designing Idempotent Endpoints for Safe Retries

A payment service exposes `POST /api/charges` that creates a charge in the payment processor. Network issues can cause the client to receive a timeout even though the charge was successfully created. Without idempotency, the client retries and creates duplicate charges.

**Step 1: Require idempotency key on mutating endpoints**

```typescript
interface ChargeRequest {
  idempotency_key: string; // UUID v4, generated by client
  amount: number;
  currency: string;
  source: string; // payment method ID
  description?: string;
}

interface ChargeResponse {
  id: string;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
  currency: string;
}
```

**Step 2: Implement idempotency middleware**

```typescript
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['idempotency-key'];
  if (!key) {
    throw new ValidationError([{ field: 'idempotency-key', message: 'Idempotency key is required' }]);
  }

  const existing = await idempotencyCache.get(key);
  if (existing) {
    // Duplicate request: return cached response
    if (existing.requestHash !== hashRequest(req.body)) {
      // Same key, different body: conflict
      throw new AppError(409, 'IDEMPOTENCY_KEY_CONFLICT', 'Idempotency key already used for a different request');
    }
    return res.status(existing.statusCode).json(existing.response);
  }

  // Store the pending state so concurrent requests with the same key are handled
  await idempotencyCache.set(key, { status: 'pending' }, 60 * 1000); // 1 minute lock

  // Allow the request to proceed
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 500) {
      await idempotencyCache.set(key, {
        statusCode: res.statusCode,
        response: res.body,
        requestHash: hashRequest(req.body),
      }, IDEMPOTENCY_TTL);
    } else {
      await idempotencyCache.del(key); // Remove pending lock on server error
    }
  });

  next();
}
```

**Step 3: Client-side usage**

```typescript
async function createCharge(amount: number): Promise<ChargeResponse> {
  const idempotencyKey = uuidv4();
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const response = await axios.post('/api/charges', {
        idempotency_key: idempotencyKey,
        amount,
        currency: 'usd',
        source: 'tok_visa',
      });
      return response.data;
    } catch (err) {
      if (err.response?.status === 429 || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        retries++;
        await sleep(100 * Math.pow(2, retries) + Math.random() * 100); // Exponential backoff + jitter
        continue;
      }
      throw err; // Non-retryable error
    }
  }
  throw new Error('Failed to create charge after 3 retries');
}
```

The idempotency key ensures that even if the client retries because of a network timeout, the server returns the same response without creating a duplicate charge. The 24-hour TTL on the cached response ensures that retries within that window are safe.
