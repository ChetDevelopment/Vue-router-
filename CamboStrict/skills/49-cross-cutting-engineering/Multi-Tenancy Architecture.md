# Multi-Tenancy Architecture

## Purpose
Define a repeatable decision framework for designing, implementing, and evolving multi-tenant systems that isolate tenant data correctly, optimize resource usage across tenants, and support tenant lifecycle operations without compromising security or performance.

## Responsibilities
- Select the appropriate tenant isolation model based on data sensitivity, compliance requirements, operational scale, and cost constraints.
- Guarantee that no tenant can read, write, or infer another tenant's data through application logic, caching, or error messages.
- Implement tenant identification that is tamper-proof at every layer (network, application, database, cache, queue).
- Provide tenant-specific configuration (feature flags, branding, rate limits, storage quotas) without code changes.
- Automate tenant provisioning workflows including schema migration, seed data, default configuration, and initial admin account creation.
- Support cross-tenant analytics through a dedicated reporting pipeline that respects tenant boundaries.
- Enable tenant migration between service tiers (free to premium, shared to dedicated) with zero downtime.
- Monitor and alert on tenant-level resource consumption, error rates, and performance degradation.

## Decision Process
1. Classify each data entity by sensitivity level (PII, financial, operational, public) and cross-reference with regulatory requirements (GDPR, HIPAA, SOC 2) to determine the minimum isolation guarantee.
2. Evaluate the tenant count projection and average data volume per tenant. Database-per-tenant is viable up to hundreds of tenants; schema-per-tenant works for thousands; shared-table with tenant ID scales to hundreds of thousands but requires the strongest application-layer safeguards.
3. Assess the operational cost of tenant-level schema migrations. If tenants must run different schema versions during staggered rollouts, prefer database-per-tenant or schema-per-tenant.
4. Determine whether cross-tenant analytics are a product requirement. If yes, choose an isolation model that still allows a centralized reporting pipeline (shared-table with tenant ID or schema-per-tenant with a read-replica aggregation layer).
5. Design the tenant identification strategy: embed the tenant ID in JWT claims for authenticated requests, extract from subdomain or header for API calls, and validate that the ID matches the authenticated user's tenant at every entry point.
6. Choose a caching strategy that includes the tenant ID in every cache key and never merges results from different tenants into the same cached entry.
7. Define the tenant provisioning pipeline: a job queue that creates the database/schema, runs migrations, seeds default configuration, creates the admin user, and emits a provisioning-complete event.
8. Select a tenant tier model (free, pro, enterprise) with per-tier resource limits and feature sets. Map each tier to a configuration profile stored in a tenant settings table.
9. Implement tenant deprovisioning as a multi-step workflow: disable access, schedule data deletion after a retention period, notify the tenant, and archive audit logs before permanent removal.
10. Design the cross-tenant analytics pipeline using an ETL process that extracts data from each tenant store, anonymizes PII, and loads into a dedicated analytics warehouse with a tenant_id column.

## Inputs
- Tenant requirements document specifying data sensitivity, expected volume, compliance needs, and tenant count projections.
- Product feature list that distinguishes per-tenant features (branding, custom domains) from cross-tenant features (admin dashboards, aggregated reporting).
- Compliance and security policies from legal and infosec teams documenting data residency, encryption, and audit requirements.
- Infrastructure cost model that lists the per-database, per-schema, and shared-storage pricing.
- Tenant tier definitions with associated SLAs, storage quotas, API rate limits, and feature toggles.

## Outputs
- Isolation model decision record (database-per-tenant, schema-per-tenant, or shared-table) with rationale and trade-offs documented.
- Tenant context propagation design: middleware, header names, JWT claims structure, and SQL connection parameterization.
- Tenant provisioning automation playbook: scripts, CI/CD jobs, database migration strategy, and configuration templates.
- Tenant monitoring dashboard showing per-tenant request counts, error rates, latency percentiles, storage usage, and rate-limit hits.
- Cross-tenant analytics pipeline architecture: extraction queries, anonymization rules, ETL scheduling, and access controls on the analytics warehouse.

## Rules
- Every database query MUST include a tenant ID filter unless it is a provably cross-tenant administrative query (logged and audited).
- Tenant ID MUST be extracted from the authenticated context (JWT or session), never from user-supplied request parameters. Accepting tenant ID from the client is a security vulnerability.
- Cache keys MUST include the tenant ID as a prefix. A shared cache between tenants MUST be partitioned by tenant ID at the key level.
- Tenant isolation MUST be tested with an automated security suite that attempts cross-tenant data access through every endpoint, WebSocket, and background job.
- Cross-tenant analytics MUST use a separate read-only replica or ETL pipeline. Direct queries against production tenant databases for analytics are forbidden.
- Tenant migration between tiers MUST not require any downtime. The migration process must handle in-flight requests and active connections gracefully.
- Error messages MUST never reveal tenant IDs, tenant-specific data, or schema differences. All errors returned to the client must be tenant-agnostic.
- Tenant deletion MUST follow a soft-delete → retention period → hard-delete sequence with audit logging at each stage.

## Best Practices
- Use connection pooling per tenant or a single pool with tenant-tagged connections to avoid one tenant's slow query starving others.
- Implement per-tenant rate limiting using a sliding window counter stored in Redis with the tenant ID as the key.
- Store tenant configuration in a centralized service (not duplicated per database) and cache it with a short TTL so changes propagate quickly.
- Use database migrations that are tenant-aware: for shared-table models, add new columns with nullable defaults; for per-database models, run migrations in parallel across all tenants.
- Include the tenant ID in structured logs to enable per-tenant debugging and alerting.
- Use a tenant context middleware that populates a thread-local or request-scoped tenant object so all downstream code can access it without manual parameter passing.
- Pre-warm tenant caches during peak hours by scheduling a background job that queries the top-N active tenants for each cache entry.
- Test isolation guarantees by writing integration tests that authenticate as tenant A and attempt to access tenant B's resources through every API endpoint.

## Anti-patterns
- Using the same database user across all tenants in a shared-table model with row-level security relying entirely on application WHERE clauses — a single missing filter leaks all tenant data.
- Building a single monolithic database for all tenants and assuming that indexing on tenant_id is sufficient for performance at scale — shared-tenancy hotspots and noisy-neighbor problems will emerge.
- Allowing tenant ID to be passed as a URL parameter or request body without server-side validation against the authenticated user — a user can manipulate the parameter to access another tenant.
- Creating separate code branches or forks for different tenants — configuration-driven customization must replace code-level branching.
- Hard-coding tenant limits or feature toggles in application code — all tenant-specific behavior must be driven by database-stored configuration or feature flags.
- Running cross-tenant analytics queries directly against production tenant databases — production databases lack the indexing and schema design for analytical queries and cause performance degradation.
- Implementing tenant provisioning as a synchronous request — provisioning involves multiple slow steps (database creation, migration, seeding) and must be asynchronous with status tracking.
- Deleting tenant data immediately upon deprovisioning request — a retention window is required for compliance and accidental-deletion recovery.

## Edge Cases
- A tenant's data volume exceeds the initial storage quota during a traffic spike. The system must allow burst usage while alerting and then enforce limits after the burst window.
- A tenant is migrated from a shared database to a dedicated database but has in-flight long-running queries. The migration must wait for active transactions to complete or use a read-only mode during cutover.
- Two tenants share the same physical database but one tenant's backup-and-restore operation accidentally includes the other tenant's data. Backup isolation must be verified at the tenant level.
- A tenant is deleted but referential integrity constraints in the shared database prevent row deletion. The deletion process must cascade correctly through all related tables or use soft-delete markers.
- A tenant's configuration becomes corrupted or invalid. The tenant configuration service must fall back to default values and alert an administrator without crashing the application.
- A tenant's schema in a schema-per-tenant model gets out of sync due to a failed migration. A reconciliation job must compare each tenant's schema against the canonical version and apply corrective migrations.
- Cross-tenant analytics ETL processes a tenant that has been soft-deleted. The ETL pipeline must exclude soft-deleted tenants unless the query specifically requests historical data with proper authorization.
- A free-tier tenant exceeds the API rate limit but a critical webhook delivery is rejected. Critical webhooks must be exempt from rate limiting or queued for retry within the tenant's quota.

## Validation Checklist
- [ ] A test script authenticates as tenant A and attempts every CRUD operation on tenant B's resources — all requests are rejected with 403 or 404.
- [ ] Cache entries for tenant A and tenant B with the same key (e.g., `user:profile:42`) do not collide — verified by inspecting cache keys in Redis.
- [ ] Database queries for tenant-scoped data include `WHERE tenant_id = @tenantId` in every SELECT, UPDATE, and DELETE statement — verified by query log analysis.
- [ ] Tenant configuration changes (feature flag toggle, rate limit change) take effect within the configured propagation delay without requiring a deployment — verified by end-to-end test.
- [ ] Tenant provisioning workflow completes successfully: database/schema created, migrations run, seed data inserted, admin user created — verified by automated smoke test.
- [ ] Tenant deprovisioning follows the soft-delete → retention → hard-delete sequence with audit events recorded at each step — verified by checking the audit log.
- [ ] Cross-tenant analytics pipeline excludes soft-deleted tenants and PII is anonymized before loading into the warehouse — verified by inspecting ETL output.
- [ ] Error responses never contain tenant IDs, schema names, or cross-tenant data references — verified by fuzzing endpoints as an unauthenticated user.
- [ ] Tenant migration between tiers completes with zero downtime and in-flight requests are not lost — verified by load testing during migration.
- [ ] Rate limits are enforced per tenant using the sliding window algorithm — verified by sending requests at the limit boundary and confirming rejection.

## Engineering Examples

### Example 1: Database-per-tenant isolation for an enterprise healthcare SaaS
A healthcare SaaS platform for hospital records must guarantee that no patient data from one hospital is accessible to another. The team chose a database-per-tenant model because HIPAA requires strict data segregation and each hospital has its own encryption key. The provisioning automation creates a new PostgreSQL database, runs Flyway migrations, seeds ICD-10 codes and provider lists, and creates an admin user — all within a background job that reports status via WebSocket to the provisioning UI. Each database is created on a shared RDS instance until the hospital reaches the enterprise tier, at which point it is migrated to a dedicated RDS instance using logical replication. The tenant ID is embedded in the JWT under the `tid` claim; a middleware extracts it, resolves the corresponding database connection string from a connection registry (cached in Redis with a 60-second TTL), and binds the connection to the request context. Cross-tenant analytics are handled by a nightly ETL that queries each tenant database through a read-replica, anonymizes patient names and IDs, and inserts the data into a centralized Redshift cluster with the hospital ID as a partitioning key.

### Example 2: Shared-database with row-level tenant security for a B2B project management tool
A project management tool used by thousands of small teams opted for a shared PostgreSQL database with a `tenant_id` column on every table to keep operational costs low. The team implemented row-level security (RLS) as a defense-in-depth measure: each table has an RLS policy that checks `current_setting('app.tenant_id')` against the `tenant_id` column. The application sets this session variable immediately after authentication. Every query — even those generated by an ORM — implicitly respects the RLS policy, so a missing WHERE clause is not a data-leak vulnerability. The team also partitioned large tables (tasks, projects) by `tenant_id` using PostgreSQL declarative partitioning to ensure that a query for one tenant only scans the relevant partition. Rate limiting, storage quotas, and feature flags are tenant-driven: the `tenant_settings` table stores `max_seats`, `max_projects`, `features_enabled` as a JSONB column. The caching layer prefixes every key with `{tenant_id}:` and uses a shared Redis cluster. A background job runs weekly to identify tenants approaching their storage quota and sends an in-app notification.

### Example 3: Tenant-aware caching with leak prevention in a multi-tenant CMS
A content management system serves thousands of websites from a shared infrastructure. The team discovered that a cache key collision between two tenants (both having a page with slug "about-us") was serving the wrong content. To fix this, every cache key was prefixed with the tenant's subdomain, and the cache middleware was updated to accept a `tenant_id` parameter at construction time. The team also implemented a tenant-aware warmup: a background job identifies the top 100 most-visited pages for each tenant every hour and pre-populates the CDN and Redis caches. To prevent data leaks through error pages, the CMS catches all exceptions and renders a generic error page that does not include tenant-specific debugging information. A weekly security scan script authenticates as tenant A and systematically requests all known URLs from tenant B, expecting 404 or 403 responses. Any success is flagged as a critical isolation failure and blocks the deployment pipeline.
