# API Versioning

## Purpose
API versioning provides a mechanism for introducing breaking changes to an API without disrupting existing consumers. As an API evolves, endpoints are renamed, request/response schemas change, and behaviors are modified. Without a versioning strategy, every change risks breaking integrators — mobile apps that cannot be updated immediately, third-party integrations, and internal services. The purpose of this document is to define how to choose, implement, and communicate API versions so that consumers can migrate at their own pace and providers can iterate without fear.

## Responsibilities
1. **Version Strategy Selection** — Choose a versioning approach (URI path, header, query parameter, or content negotiation) that aligns with the API's maturity, consumer base, and deployment model.
2. **Breaking Change Identification** — Define what constitutes a breaking change for the API: removing a field, changing a field type, adding a required field, changing endpoint semantics, or changing error codes. Document these criteria and enforce them in code review.
3. **Backward Compatibility Enforcement** — Ensure that within a major version, all changes are backward-compatible. Use additive changes only: new optional fields, new endpoints, new HTTP methods. Never remove or rename within a version.
4. **Deprecation Policy Execution** — When a version is superseded, announce deprecation with a clear timeline, mark responses with deprecation headers, and eventually sunset the version with proper notice.
5. **Consumer Migration Assistance** — Provide migration guides, changelogs, and side-by-side documentation to help consumers move from one version to the next. Offer a migration window large enough to accommodate mobile app store review cycles.
6. **Documentation Versioning** — Maintain versioned API documentation so that a consumer on v1 sees exactly the v1 spec and nothing from v2. Use OpenAPI/Swagger with version-specific specs.
7. **Internal vs. Public Versioning Strategy** — Differentiate between internal APIs (same team, same deploy cycle) where versioning may be handled by contract testing, and public APIs where long version support lifetimes are required.
8. **Sunset Header Implementation** — When a version reaches end-of-life, return <code>Sunset</code> and <code>Deprecation</code> HTTP headers on every response from that version, with a link to the migration guide.

## Decision Process
1. **Classify the API as internal or public.** Internal APIs consumed by services within the same deployment boundary may not need explicit versioning; they can rely on consumer-driven contracts and simultaneous deployment. Public APIs consumed by external partners or mobile apps require explicit versioning with multi-month deprecation windows.
2. **Choose the version location.** For public APIs with long-lived versions, prefer URI path versioning (<code>/v1/products</code>). It is explicit, cachable, and easy to test. For internal APIs, header versioning (<code>Accept: application/vnd.myapp.v2+json</code>) avoids polluting URLs but makes caching and debugging harder.
3. **Define the breaking change policy.** Document a precise list of what constitutes a breaking change: removing a field, changing a field's type, adding a new required field, changing the semantics of an existing field, changing error codes, changing authentication requirements, or removing an endpoint. Any change that would cause a consumer to fail if they upgraded without code changes is breaking.
4. **Establish the version lifecycle.** Define the stages: (a) current version — fully supported, (b) deprecated — still functional but marked with deprecation headers, (c) sunset — receiving only critical security patches, (d) retired — returns 410 Gone. Set concrete timeframes: e.g., 12 months of support after a new version is released, 6 months of deprecation notice.
5. **Implement the version router.** Build a middleware or gateway that routes requests to the correct version handler based on the version identifier. Each version handler is a separate code module that should be removable when the version is retired.
6. **Add deprecation headers to responses.** Every response from a deprecated version must include <code>Deprecation: true</code> and <code>Sunset: Sat, 31 Dec 2025 23:59:59 GMT</code>. These headers allow automated tooling to track consumer migration.
7. **Create version migration guides.** For each breaking change, write a guide showing the old vs. new request/response, the reason for the change, and the migration steps. Include code examples in multiple languages.
8. **Monitor consumer version usage.** Track the number of requests per API version. Set an alert when deprecated version traffic drops below a threshold that indicates it is safe to retire. Never retire a version with active consumers without direct communication.

## Inputs
- **Current API specification** — The OpenAPI/Swagger document for the existing API.
- **Consumer list** — A registry of known consumers (mobile apps, partner integrations, internal services) with contact information.
- **Breaking change log** — A list of planned changes that cannot be made backward-compatibly.
- **Deprecation policy** — Organizational policy defining minimum support periods for API versions.
- **Changelog** — A record of all changes made to the API since the last version.
- **Usage analytics** — Request counts per endpoint, per consumer, and per version from the API gateway or monitoring system.

## Outputs
- **Versioned API specification** — Separate OpenAPI documents for each active major version, each independently deployable and testable.
- **Version routing middleware** — Code or gateway configuration that dispatches requests to the correct version handler.
- **Deprecation timeline** — A published schedule showing when each version will enter deprecation, sunset, and retirement.
- **Migration guides** — One guide per breaking change, with before/after examples and a recommended migration path.
- **Consumer migration report** — A dashboard or report showing which consumers are still on deprecated versions and their last activity date.
- **Sunset header implementation** — HTTP middleware that automatically adds <code>Deprecation</code> and <code>Sunset</code> headers to responses from deprecated versions.

## Rules
1. **Never remove or rename a field within a major version.** The only allowed changes within a version are additive: new optional fields, new endpoints, new HTTP methods. Removing, renaming, or making an optional field required is a breaking change that requires a new major version.
2. **Version must be explicit in every request.** Whether via URI path, header, or query parameter, the version must be unambiguous. Implicit versioning (e.g., "latest") leads to accidental breaking changes.
3. **Each version must be independently deployable.** The v2 code module must not share request handlers with v1 in a way that prevents v1 from being maintained independently. Version-specific bugs must be fixed in the version they affect.
4. **Deprecated versions must be clearly marked.** Every response from a deprecated version must carry both <code>Deprecation</code> and <code>Sunset</code> headers. Every error response should include a link to the migration guide.
5. **Breaking changes must be documented in a changelog with migration instructions.** A consumer should be able to read the changelog and understand exactly what changed, why, and how to update their code.
6. **Do not version by date or "latest" in production.** Version identifiers must be stable over the lifetime of the version. <code>/v1</code> always means the same thing. "Latest" is ambiguous when multiple versions exist in production.
7. **Internal services should prefer backward compatibility over versioning.** If an internal API can evolve without breaking consumers (additive changes only), do not create a new version. Use consumer-driven contracts and notify consumers of changes via changelogs.
8. **A retired version must return 410 Gone.** Returning 404 (Not Found) for a retired endpoint is ambiguous. 410 (Gone) explicitly communicates that the resource existed but is no longer available. Include a link to the current version in the response body.

## Best Practices
1. **Use URI path versioning for public APIs.** <code>/v1/products</code> is the most widely understood, easiest to test, and simplest to implement. It also makes caching straightforward, as different versions have different URLs.
2. **Include the version in the OpenAPI spec path.** Serve versioned OpenAPI docs at <code>/v1/openapi.json</code> and <code>/v2/openapi.json</code> so consumers can always fetch the spec for their version.
3. **Provide a migration endpoint or adapter.** For high-value breaking changes, offer a temporary adapter endpoint that translates between the old format and the new format, giving consumers more time to migrate.
4. **Communicate deprecation through multiple channels.** In addition to HTTP headers, send emails to known consumer contacts, post on a status page, and include notices in the API dashboard. Mobile apps may take months to update.
5. **Test version coexistence.** Write integration tests that call the same endpoint in v1 and v2 and verify that the responses differ only in the documented breaking changes. Ensure that a v1 bug fix does not break v2 behavior.
6. **Version everything about the API: schemas, errors, rate limits, and documentation.** If v2 introduces a new rate limit structure, document it separately. Consumers on v1 should see v1 rate limit documentation.
7. **Provide a version changelog endpoint.** Expose <code>/versions</code> that returns a list of active versions, their status (current, deprecated, sunset), and links to their documentation and migration guides.
8. **Automate the deprecation header addition.** Use API gateway middleware or response interceptors to automatically add <code>Deprecation</code> and <code>Sunset</code> headers to all deprecated version responses. Do not rely on developers remembering to add them.

## Anti-patterns
1. **No versioning at all.** Making backward-incompatible changes to a public API without any version identifier. Every deploy potentially breaks every consumer. This is acceptable only for internal APIs with a single consumer that is deployed simultaneously.
2. **Versioning by date only.** Using <code>/2023-01-01/products</code> without also having a stable identifier. Consumers must keep track of which dates are active and which are retired, leading to confusion. Use semantic versioning for the human-readable label and date only as metadata.
3. **Using query parameter versioning for state-changing requests.** <code>/products?version=2</code> with a POST request. Caching proxies may ignore query parameters, and web frameworks may not route correctly. Prefer URI path or header for all methods.
4. **Supporting too many versions simultaneously.** Maintaining v1 through v5 concurrently multiplies testing effort and code complexity. Stick to 2–3 active versions and enforce a deprecation timeline.
5. **Making a breaking change without a migration guide.** Deploying v2 with changed response structure and expecting consumers to figure out the difference through trial and error. Every breaking change must have a documented migration path.
6. **Changing the error format between versions without documentation.** If v1 returns errors as <code>{"error": "message"}</code> and v2 returns <code>{"errors": [{"code": "X", "detail": "message"}]}</code>, consumers will fail to parse errors. Include error format changes in migration guides.
7. **Accepting multiple versions in the same handler with if/else logic.** Having a single controller that checks the version and conditionally returns different shapes. This leads to spaghetti code and makes it impossible to remove a version cleanly.

## Edge Cases
1. **Mobile app that cannot update.** A mobile app with a long release cycle (e.g., 6 months for enterprise app store approval) must continue working. The deprecation timeline must account for the longest possible consumer update cycle, not the average.
2. **Breaking change in error responses.** Consumers may depend on parsing specific error messages or codes. Changing the error format or error codes is a breaking change that requires a new version.
3. **Security patch applied to a deprecated version.** If a vulnerability is found in a deprecated version, the security fix must be backported. Have a process for backporting critical fixes to supported deprecated versions.
4. **Consumer that ignores deprecation headers.** Some consumers may ignore <code>Deprecation</code> and <code>Sunset</code> headers and continue using the old version. After the sunset date, return 410 and monitor for consumer complaints. Have a communication plan for these consumers.
5. **Version negotiation in WebSocket connections.** WebSocket connections are long-lived and cannot be versioned per message. Establish the version at connection time and reject connections that do not specify a supported version.
6. **Caching across versions.** If a CDN or reverse proxy caches responses from <code>/v1/products</code> and <code>/v2/products</code>, they must be cached under separate keys. Verify that the cache configuration respects the version prefix.

## Validation Checklist
- [ ] Breaking changes are clearly defined and documented.
- [ ] Every endpoint includes a version identifier in the request.
- [ ] Deprecated versions return <code>Deprecation</code> and <code>Sunset</code> headers.
- [ ] A migration guide exists for every breaking change.
- [ ] Versioned OpenAPI specs are served for each active version.
- [ ] Usage analytics track requests per version and per consumer.
- [ ] Integration tests verify that v1 and v2 coexist without interference.
- [ ] A public <code>/versions</code> endpoint lists all supported versions and their status.
- [ ] No handler uses if/else on version; each version has its own module.
- [ ] Retired versions return 410 Gone with a link to the current version.
- [ ] The deprecation timeline accounts for the longest consumer update cycle.
- [ ] Security patches can be backported to supported deprecated versions.

## Engineering Examples

### Example 1: Migrating API Consumers from v1 to v2 Without Downtime

A payment processing API has 500 active consumers on v1. The team needs to introduce v2 with a redesigned webhook payload format. The webhook structure changes from <code>{"event": "charge.succeeded", "data": {"id": "ch_123"}}</code> to <code>{"type": "charge.succeeded", "object": {"id": "ch_123", "amount": 2000, "currency": "usd"}}</code>.

**Approach:** Release v2 endpoints under <code>/v2/</code> while keeping v1 fully operational. Announce v2 via email, blog post, and API dashboard notice with a 12-month deprecation window for v1. For the first 6 months, offer a webhook adapter: consumers can opt in to receive v2 webhooks in a <code>/v1-compat</code> format (the adapter translates the new webhook shape back to the old shape at the edge). Publish a side-by-side migration guide showing the old and new webhook payloads. Track v1 usage monthly and send targeted emails to consumers who have not migrated after 9 months. After 12 months, mark v1 as deprecated with <code>Deprecation</code> and <code>Sunset</code> headers. After 18 months, retire v1, returning 410 on all v1 endpoints.

**Result:** Consumers migrate at their own pace. 80% migrate within 6 months using the migration guide. The webhook adapter handles 15% more who need extra time. The final 5% receive direct outreach. No consumer experiences downtime during the transition.

### Example 2: Deprecating an Endpoint with Proper Notice

A weather API has an endpoint <code>/v1/forecast?zip=12345</code> that returns temperature in Fahrenheit. The team adds a new endpoint <code>/v2/forecast?lat=40.7&lon=-74.0</code> that returns temperature in Celsius and includes humidity and wind speed. The old endpoint must be deprecated.

**Approach:** The team adds <code>Deprecation: true</code> and <code>Sunset: Sun, 30 Jun 2026 23:59:59 GMT</code> headers to all <code>/v1/forecast</code> responses immediately. They publish a migration guide showing how to convert zip codes to lat/lon using a geocoding API, and how to convert Celsius to Fahrenheit. They update the v1 OpenAPI spec with a <code>deprecated: true</code> annotation and a link to the migration guide. The API dashboard shows a banner: "v1 forecast will be removed on June 30, 2026." After the sunset date, the endpoint returns 410 Gone with a JSON body: <code>{"error": "gone", "message": "v1/forecast has been retired. Use /v2/forecast. See https://docs.example.com/migration-v1-to-v2"}</code>.

**Result:** Consumers receive 18 months of notice through multiple channels. Automated scanners pick up the HTTP headers and notify developers. The 410 response routes them to documentation rather than a dead end.

### Example 3: Choosing a Versioning Strategy for a Public API

A company is launching a new public API for a ride-sharing platform. They expect third-party developers, mobile apps, and internal tools to consume it. They need to decide on a versioning strategy.

**Approach:** Choose URI path versioning (<code>/v1/rides</code>) for the following reasons: (1) it is the most widely understood convention, (2) it allows easy caching — each version has a distinct URL space, (3) it is trivially testable in any HTTP client, (4) it works with every HTTP method without additional configuration, (5) CDNs and API gateways can route based on URL prefix without inspecting headers. The team commits to supporting each major version for at least 2 years. They use semantic versioning for the human-readable label (v1, v2) but date-stamp each release internally (2025-01-v1) for debugging. They publish versioned OpenAPI specs at <code>/v1/openapi.json</code> and <code>/v2/openapi.json</code>. They expose a <code>/versions</code> endpoint that lists all active versions with their status and deprecation dates.

**Result:** Third-party developers immediately understand the versioning model. No confusion about which version they are calling. The 2-year support window gives them confidence to invest in integration. The API team can evolve the API without fear of breaking existing integrations.
