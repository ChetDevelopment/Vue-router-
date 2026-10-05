# API Design

## Purpose

Provide a definitive guide for designing RESTful APIs that are consistent, predictable, developer-friendly, and aligned with HTTP semantics and industry best practices. This skill equips engineers to design APIs that minimize client complexity, support evolution without breaking consumers, and handle error conditions with clear, actionable responses.

## Responsibilities

- Design RESTful resource hierarchies with consistent, intuitive URL naming that reflects the domain model
- Select appropriate HTTP methods and status codes for each operation, following HTTP semantics precisely
- Define request and response formats using standard media types (JSON:API, HAL, or custom but consistent schemas)
- Design error response structures that enable clients to programmatically handle failures with actionable information
- Implement pagination, filtering, sorting, and partial responses that scale from small datasets to millions of records
- Apply HATEOAS principles where appropriate to guide API consumers through discoverable workflows
- Ensure idempotency for mutating operations so clients can safely retry on network failures
- Design API gateway integration patterns for authentication, rate limiting, versioning, and request transformation

## Decision Process

1. Identify the resources in the domain that need to be exposed through the API. Resources are nouns from the domain model: users, orders, products, invoices. Each resource maps to a URI path. Avoid verbs in URLs; verbs belong in HTTP methods.

2. Define the resource hierarchy establishing parent-child and reference relationships. A flat URL structure is preferred when resources can be accessed directly. Nesting should be limited to two levels deep; deeper nesting indicates a design smell.

3. Assign HTTP methods to each resource operation following CRUD semantics. Use GET for retrieval (safe, idempotent), POST for creation (non-idempotent), PUT for full replacement (idempotent), PATCH for partial updates (idempotent if using merge-patch), and DELETE for removal (idempotent).

4. Design the response format for each endpoint. Define the JSON structure precisely, including field names, types, optional/required indicators, and examples. Every endpoint must have a documented response schema that can be validated programmatically.

5. Determine pagination strategy. For list endpoints, define the default page size, maximum page size, and how clients specify page/offset and limit. Include pagination metadata in every list response: total count, page number, page size, and links to next/previous/first/last pages.

6. Define filtering, sorting, and search capabilities. Filter parameters should use consistent query parameter naming (e.g., `?status=active`). Sorting should use a `sort` parameter with field names and direction indicators (e.g., `?sort=-created_at` for descending). Complex search should use dedicated endpoints or query languages.

7. Design error response structures with a consistent envelope. Every error response must include: an error code (machine-readable), a message (human-readable), a detail or description, and a correlation ID for traceability. Include validation errors as structured arrays pointing to the specific field that failed.

8. Implement idempotency for POST operations that may create resources. Require an `Idempotency-Key` header for POST endpoints. When a client retries with the same key, return the original response without creating a duplicate resource. Store idempotency keys for a minimum of 24 hours.

9. Design the versioning strategy. Use URL-based versioning (e.g., `/v1/orders`) or header-based versioning (e.g., `Accept: application/vnd.api+json;version=1`). URL-based versioning is simpler for clients but creates URL proliferation. Header-based versioning is cleaner but requires client cooperation.

10. Review the API for consistency against existing endpoints. Every endpoint should follow the same conventions for naming (snake_case or camelCase, consistent), error format, pagination, authentication, and rate limiting headers. Inconsistencies in API design force clients to implement special cases for each endpoint.

## Inputs

- Domain model identifying core entities, relationships, and operations
- Client requirements including frontend, mobile, and third-party consumer needs
- Performance constraints including expected request volume, latency SLAs, and payload sizes
- Security requirements for authentication, authorization, rate limiting, and data privacy
- Existing API inventory if integrating into a portfolio of APIs
- API governance standards from the organization (naming conventions, versioning policy, deprecation procedures)
- Third-party API contracts that the system must integrate with

## Outputs

- OpenAPI/Swagger specification defining all endpoints, request schemas, response schemas, and error types
- API reference documentation with examples for every endpoint and error scenario
- Resource model diagrams showing resource relationships, fields, and data types
- Authentication and authorization specification (OAuth2 flows, scopes, token formats)
- Error catalog with HTTP status codes, error codes, and resolution guidance for each error type
- Pagination, filtering, sorting, and partial response specification
- Rate limiting specification with limits, headers, and retry-after behavior

## Rules

1. Resources are nouns, not verbs. URL paths represent resources (`/orders`, `/users`), not actions (`/getOrders`, `/createUser`). Actions that do not map to CRUD operations should use POST to a verb-named sub-resource (e.g., `POST /orders/123/cancel`).
2. HTTP methods must be used according to their defined semantics. GET must not produce side effects. PUT must replace the entire resource. DELETE must be idempotent: deleting a resource that doesn't exist returns 404, not an error.
3. Every response must include a consistent envelope structure for errors at minimum. Success responses should use consistent structure within the same API. Avoid changing response structure between endpoints.
4. All list endpoints must support pagination with a default page size. Responses must include pagination metadata (count, page, total pages) and self/next/prev/first/last links. Clients must not assume unlimited result sets.
5. Error responses must include a machine-readable error code, a human-readable message, a unique error ID for tracing, and where applicable, field-level validation errors in a structured format. HTTP status codes alone are insufficient.
6. Sensitive data must never appear in URLs, query parameters, or response bodies. Use headers for authentication tokens. Mask sensitive fields in responses (e.g., `****1234` for credit card numbers). URLs appear in server logs, browser history, and referrer headers.
7. APIs must enforce idempotency for POST operations that create resources. Clients must be able to retry requests safely when they receive network errors. The API must detect duplicates using idempotency keys and return the original 201 response.
8. Deprecation of API endpoints must follow a documented lifecycle: deprecation announcement, sunset header in responses, minimum 6-month migration period, and a replacement endpoint available before the old one is removed.
9. API responses must include standard headers: `Content-Type`, `Cache-Control` (for GET), `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `X-Request-Id` (correlation ID).
10. Backward-compatible changes (adding optional fields, adding new endpoints) must never break existing clients. Breaking changes require a new API version. Field removal, type changes, and required field additions are breaking changes.

## Best Practices

1. Use consistent naming conventions throughout the API. If you use snake_case for JSON field names, use it everywhere. If camelCase, use it everywhere. Do not mix conventions across endpoints.
2. Return standard HTTP status codes: 200 for success, 201 for creation, 204 for deletion (no content), 400 for bad request, 401 for unauthorized, 403 for forbidden, 404 for not found, 409 for conflict, 422 for validation error, 429 for rate limited, 500 for server error.
3. Use query parameters for filtering (`?status=active`), sorting (`?sort=-created_at`), and field selection (`?fields=id,name,email`). Avoid putting these in the URL path or request body for GET requests.
4. Support ETags and conditional requests for caching. Return `ETag` headers on GET responses. Support `If-None-Match` for conditional GETs and `If-Match` for optimistic concurrency on PUT/PATCH.
5. Design bulk operations as dedicated endpoints (`POST /batch/orders`) rather than allowing clients to send multiple individual requests. Batch endpoints should document transaction semantics (all-or-nothing vs partial success).
6. Use a consistent date-time format throughout the API. Prefer ISO 8601 with timezone offset (e.g., `2024-01-15T14:30:00Z`). Avoid locale-specific formats. Document the precision of time fields (date only, datetime with seconds, datetime with milliseconds).
7. Include a `self` link in every resource response that points to the canonical URL of that resource. This enables HATEOAS discovery and makes API responses self-documenting.
8. Use `Problem Details` (RFC 7807) for error responses. This standard provides a structured format with `type`, `title`, `status`, `detail`, and `instance` fields that is machine-readable and extensible.
9. Design for API evolution from the start. Version your API from day one, even if there is only one consumer. Adding versioning later requires coordination across all consumers and breaks established URLs.
10. Publish an API changelog that documents every addition, change, deprecation, and removal. Include the date, affected endpoints, and migration instructions. A changelog builds trust with API consumers.

## Anti-patterns

1. **Verb in URL**: Using `/getAllUsers` or `/createOrder` instead of `GET /users` and `POST /orders`. Verbs in URLs ignore HTTP methods and create inconsistent, non-RESTful designs.
2. **Inconsistent error format**: Returning different error structures from different endpoints. Some return `{"error": "message"}`, others return `{"errors": [{"code": "..."}]}`, others return HTML. Every consumer must implement special-case error handling.
3. **Missing pagination**: Returning all results from a list endpoint without pagination. This crashes clients with large datasets, consumes excessive server resources, and cannot be fixed without a breaking API change.
4. **Exposing internal IDs**: Using database auto-increment IDs or internal UUIDs as resource identifiers in URLs and responses. This leaks system information, enables harvesting attacks, and couples clients to internal identifiers.
5. **Overloading query parameters**: Using the same query parameter for filtering, sorting, and pagination (e.g., `?page=1&sort=name&status=active` is fine but `?options=page1_sortname_statusactive` is not). Each concern deserves its own parameter.
6. **Breaking changes without versioning**: Removing fields, changing types, or making optional fields required without a version bump or migration period. This breaks all existing clients and erodes trust in the API.

## Edge Cases

1. **Partial success in batch operations**: A batch endpoint processes 100 items where 95 succeed and 5 fail. The response must clearly indicate which items succeeded and which failed, with error details for each failure. Use HTTP 207 Multi-Status or return a response that separates successes and errors in the body.
2. **Empty resource collections**: A list endpoint returns an empty array `[]` with pagination metadata showing total count of 0. Do not return 404 for empty collections. An empty collection is a valid response, not an error condition.
3. **Concurrent modification conflicts**: Two clients update the same resource simultaneously. Use `If-Match` headers with ETags for optimistic concurrency. Return HTTP 409 Conflict when the ETag does not match, with the current resource state so the client can reconcile.
4. **Large payloads**: A client sends a request body exceeding size limits. Return 413 Payload Too Large with the maximum allowed size and guidance on how to proceed (e.g., chunked upload, compression).
5. **Unicode and internationalization**: Names, addresses, and descriptions may contain Unicode characters. JSON supports Unicode natively, but sorting and filtering on international strings may not work as expected. Document locale handling for string comparisons.
6. **API gateway transformations**: An API gateway may add, remove, or transform headers, alter request/response bodies, or change status codes. Document which transformations the gateway performs so API consumers and backend services are not surprised.

## Validation Checklist

- [ ] All endpoints use nouns for resources and HTTP methods for actions
- [ ] Every endpoint has a documented OpenAPI specification
- [ ] Consistent naming convention is used across all endpoints (snake_case or camelCase)
- [ ] All list endpoints support pagination with metadata and navigation links
- [ ] Error responses use a consistent format with code, message, detail, and correlation ID
- [ ] POST endpoints support idempotency via `Idempotency-Key` header
- [ ] Sensitive data is not present in URLs, query parameters, or unmasked in responses
- [ ] Standard HTTP status codes are used appropriately (200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500)
- [ ] Rate limiting headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) are present in all responses
- [ ] ETag and conditional request support is implemented for cacheable resources
- [ ] Versioning strategy is documented and applied to all endpoints
- [ ] Deprecation policy is documented with sunset headers in responses

## Engineering Examples

### Example 1: Designing a REST API for a Booking System

A hotel booking system API was designed with the following resource hierarchy:

```
GET    /v1/hotels                    # List hotels with pagination, filtering by city/rating
GET    /v1/hotels/{hotelId}          # Get hotel details with rooms and amenities
GET    /v1/hotels/{hotelId}/rooms    # List rooms for a specific hotel
GET    /v1/hotels/{hotelId}/rooms/{roomId}  # Get room details and availability
POST   /v1/bookings                  # Create a booking
GET    /v1/bookings/{bookingId}      # Get booking details
POST   /v1/bookings/{bookingId}/cancel # Cancel a booking
GET    /v1/customers/{customerId}/bookings # List customer's bookings
```

Pagination was implemented on list endpoints:
```
GET /v1/hotels?page=2&per_page=20
{
  "data": [...],
  "meta": {
    "current_page": 2,
    "per_page": 20,
    "total": 156,
    "total_pages": 8
  },
  "links": {
    "self": "/v1/hotels?page=2&per_page=20",
    "first": "/v1/hotels?page=1&per_page=20",
    "prev": "/v1/hotels?page=1&per_page=20",
    "next": "/v1/hotels?page=3&per_page=20",
    "last": "/v1/hotels?page=8&per_page=20"
  }
}
```

Booking creation used idempotency:
```
POST /v1/bookings
Idempotency-Key: 7c4a8d09-2c3d-4e1f-9b5a-1e2f3a4b5c6d
{
  "hotel_id": "h_12345",
  "room_id": "r_67890",
  "check_in": "2024-06-15",
  "check_out": "2024-06-18",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

If the client retried with the same idempotency key (e.g., after a network timeout), the API returned the original 201 response with the same booking ID rather than creating a duplicate booking. The idempotency key was stored for 48 hours.

### Example 2: Handling Partial Success in Batch Operations

A logistics API needed to support bulk shipment status updates. The batch endpoint was designed as:

```
POST /v1/batch/shipments/status
Idempotency-Key: batch-key-001
{
  "updates": [
    { "shipment_id": "s_001", "status": "delivered", "timestamp": "2024-03-15T10:00:00Z" },
    { "shipment_id": "s_002", "status": "delivered", "timestamp": "2024-03-15T10:00:00Z" },
    { "shipment_id": "s_003", "status": "delivered", "timestamp": "2024-03-15T10:00:00Z" },
    { "shipment_id": "s_004", "status": "delivered", "timestamp": "2024-03-15T10:00:00Z" },
    { "shipment_id": "s_005", "status": "delivered", "timestamp": "2024-03-15T10:00:00Z" }
  ]
}
```

Response (partial success):
```
HTTP 207 Multi-Status
{
  "idempotency_key": "batch-key-001",
  "processed": 5,
  "succeeded": 3,
  "failed": 2,
  "results": [
    { "shipment_id": "s_001", "status": "updated", "error": null },
    { "shipment_id": "s_002", "status": "updated", "error": null },
    { "shipment_id": "s_003", "status": "updated", "error": null },
    {
      "shipment_id": "s_004",
      "status": "failed",
      "error": {
        "code": "SHIPMENT_ALREADY_DELIVERED",
        "message": "Shipment s_004 was already marked as delivered on 2024-03-14T09:30:00Z"
      }
    },
    {
      "shipment_id": "s_005",
      "status": "failed",
      "error": {
        "code": "SHIPMENT_NOT_FOUND",
        "message": "Shipment s_005 does not exist in the system"
      }
    }
  ],
  "rollback": false
}
```

The batch endpoint was atomic within each update (each shipment was independently processed) but not atomic across the batch. This design allowed clients to handle individual failures without losing the successful updates. The response clearly stated which operations succeeded and which failed, with specific error codes for each failure.

### Example 3: Designing Consistent Error Responses

A payment API used RFC 7807 Problem Details for all error responses. Every error response followed this structure:

```
HTTP 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "https://api.payments.example/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "The request payload contains invalid fields",
  "instance": "/v1/payments",
  "trace_id": "req_abc123def456",
  "errors": [
    {
      "field": "amount",
      "code": "INVALID_FORMAT",
      "message": "Amount must be a positive number with up to 2 decimal places",
      "value": "-50.00"
    },
    {
      "field": "currency",
      "code": "UNSUPPORTED_CURRENCY",
      "message": "Currency 'XYZ' is not supported. Supported currencies: USD, EUR, GBP, JPY",
      "value": "XYZ",
      "allowed_values": ["USD", "EUR", "GBP", "JPY"]
    },
    {
      "field": "payment_method.type",
      "code": "REQUIRED",
      "message": "Payment method type is required",
      "value": null
    }
  ]
}
```

Rate limiting errors followed the same structure:
```
HTTP 429 Too Many Requests
Content-Type: application/problem+json
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1700000000
Retry-After: 30

{
  "type": "https://api.payments.example/errors/rate-limited",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "API rate limit of 100 requests per minute exceeded. Retry after 30 seconds.",
  "instance": "/v1/payments",
  "trace_id": "req_xyz789abc012",
  "limit": 100,
  "reset_at": "2024-03-15T10:01:00Z"
}
```

The consistent error format across all endpoints enabled clients to implement a single error handler that could process any error response programmatically. The `trace_id` field enabled correlating error responses with server-side logs for debugging without exposing internal stack traces.
