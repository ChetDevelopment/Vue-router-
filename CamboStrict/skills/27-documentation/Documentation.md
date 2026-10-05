# Documentation

## Purpose

Create and maintain documentation that enables engineers to understand, use, and operate the system effectively. Good documentation reduces onboarding time, prevents operational incidents, preserves architectural decisions, and serves as the single source of truth for how the system works. Documentation is code: it should be versioned, reviewed, and tested.

## Responsibilities

- Maintain README files that provide an accurate, concise entry point for every repository.
- Write architecture decision records (ADRs) for all significant architectural choices.
- Document APIs with OpenAPI/Swagger specifications that are kept in sync with implementation.
- Create and maintain operational runbooks for incident response, deployments, and recovery procedures.
- Keep inline comments focused on "why" not "what"—the code itself documents what it does.
- Ensure documentation is reviewed as part of the code review process (docs-as-code).
- Deprecate and remove documentation that is no longer accurate. Stale documentation is worse than no documentation.

## Decision Process

1. Determine the audience for the documentation. Is it a new team member (onboarding), an API consumer (reference), an operator (runbook), or an architect (decision record)? Each audience needs different content and tone.
2. Choose the documentation type based on audience and purpose:
   - API consumer → OpenAPI specification with examples.
   - Operator → Runbook with step-by-step commands.
   - Architect or future team → ADR with context, options, decision, and consequences.
   - New developer → README with quickstart, project structure, and how to run tests.
3. Write the documentation in the same repository as the code (docs-as-code). Keep documentation close to the source so it stays in sync. Use a `docs/` directory for multi-page documentation.
4. Use the project's standard markup language (Markdown, AsciiDoc). Do not use proprietary formats (Google Docs, Notion) for documentation that needs to be versioned and reviewed alongside code.
5. Include runnable examples. Code snippets in documentation must be tested. Use a documentation testing framework (doctest, Markdown code block runners) to verify that examples compile and produce the expected output.
6. Review documentation in the same PR as the code change. If a PR adds a new API endpoint, the PR must include the OpenAPI spec update. If a PR changes a deployment step, the runbook must be updated.
7. For ADRs: capture the context, the options considered (with pros and cons), the decision, and the consequences. ADRs are immutable once merged—add a new ADR to supersede an old one rather than editing an existing ADR.
8. For README: follow the standard structure: project name, description, quickstart, prerequisites, configuration, how to run tests, how to deploy, how to contribute, license.
9. Set up a documentation health check in CI. Lint for broken links, missing images, and formatting errors. Flag stale documentation based on last modification date.
10. Archive documentation that is no longer relevant. Delete or move to an `archive/` directory. Do not leave outdated documentation alongside current documentation.

## Inputs

- Code changes that introduce new APIs, endpoints, or configuration options
- Architecture discussions and team decisions that affect system design
- Incident post-mortems that identify gaps in operational documentation
- Onboarding feedback from new team members about documentation gaps
- API changes that need consumer communication
- Deployment and infrastructure changes that affect operational procedures

## Outputs

- README.md in each repository with quickstart, build instructions, and contribution guide
- Architecture decision records in `docs/adr/` numbered sequentially with status (proposed, accepted, deprecated, superseded)
- OpenAPI 3.x specification files in `docs/api/` or alongside the API implementation
- Operational runbooks in `docs/runbooks/` covering deployment, incident response, backup/restore, and common troubleshooting
- Changelog entries following Keep a Changelog format
- Inline comments that explain non-obvious design decisions, trade-offs, and rationale

## Rules

1. Do not document what the code already expresses. A function named `calculateTotalPrice` does not need a comment saying "calculates the total price." Comments should explain why the code exists, not what it does.
2. Do not let documentation become stale. If you change behaviour and do not update the docs, the docs are now actively harmful. The PR that changes behaviour must also update the docs.
3. Do not use vague language in documentation. Avoid "soon," "eventually," "probably," "should work." Be precise: "This endpoint returns HTTP 429 when the rate limit of 100 requests per minute is exceeded."
4. Do not duplicate documentation. If the same information appears in the README, the wiki, and a Slack message, it will diverge. Pick one canonical location and link to it everywhere else.
5. Do not write documentation for code that may be deleted next month. If a feature is experimental or deprecated, mark it clearly in the documentation and consider omitting detailed docs until the feature stabilises.
6. Do not include credentials, tokens, or secrets in documentation. Use placeholders like `YOUR_API_KEY` or environment variable references.
7. Do not use screenshots of code or terminal output. Screenshots cannot be searched, diffed, or copied. Use code blocks and text-based output.
8. Do not require authentication to read documentation. All documentation in a repository should be readable by anyone with access to the repository. Operational runbooks for production systems are the exception.
9. Do not leave TODO items or placeholders in documentation. If the documentation is incomplete, mark the section as "Coming soon" with a link to the tracking issue.
10. Documentation should be reviewed with the same rigour as code. A reviewer should check for factual accuracy, clarity, completeness, and consistency.

## Best Practices

1. Keep the README short (<500 words for the main section) and link to detailed documentation for specifics. A long README is a sign that documentation should be split into multiple files.
2. Use a documentation linter (markdownlint, vale) to enforce style consistency. Standardise heading hierarchy, list formatting, and link syntax.
3. Write documentation from the reader's perspective. Ask: "What does the reader need to know to accomplish their goal?" Structure documentation around tasks, not features.
4. Use diagrams sparingly and store them as source files (Mermaid, PlantUML) rather than images. Source-controlled diagrams can be diffed and updated accurately.
5. Include a "Prerequisites" section in every runbook and quickstart. List exact versions of tools, environments, and dependencies needed. A missing prerequisite is the most common cause of failed runbook execution.
6. Write changelogs for human readers. Group changes by type (Added, Changed, Deprecated, Removed, Fixed, Security). Link to relevant issues and PRs. Do not include every commit message—curate the changelog.
7. Create a documentation style guide for the team. Standardise terminology (e.g., "start" not "spin up," "remove" not "delete"), formatting, and tone. Consistency across documentation builds trust.
8. Test documentation with fresh eyes. Have a new team member follow the quickstart without help. Record where they get stuck and fix those sections.
9. Use ADRs for decisions that have long-lasting impact: technology choices, architectural patterns, deployment strategies. Do not write ADRs for trivial decisions like variable naming conventions.
10. Keep a "docs sprint" every quarter where the team dedicates time to review and update documentation. Treat documentation debt like technical debt—track it, prioritise it, and allocate time to fix it.

## Anti-patterns

1. **Wall of text**: A single page of dense prose with no headings, code examples, or lists. Readers scan, not read. Use headings, bullet points, tables, and code blocks to break up content.
2. **Documentation graveyard**: A `/docs` directory where every file is years old and no one knows which are still accurate. Remove or archive stale documentation regularly. If a file scares people, it is worse than not existing.
3. **Manual copy-paste documentation**: Documentation that says "to add a new endpoint, copy `user.py` and rename it" instead of providing an automated code generator or template. Copy-paste guidance leads to inconsistencies and errors.
4. **Design-by-documentation**: Writing extensive documentation for a poorly designed system instead of fixing the design. Clean, intuitive code needs less documentation. Prioritise simplicity over documentation volume.
5. **README as the only documentation**: A single README that tries to cover architecture, API, operations, and contribution guidelines. It becomes overwhelming and outdated. Split into focused documents linked from the README.
6. **Outdated screenshots**: UI screenshots that show a previous version of the interface. They confuse readers more than they help. If UI changes frequently, use text descriptions or animated GIFs that are easier to regenerate.

## Edge Cases

1. **Generated code**: Do not manually document generated code (protobuf stubs, OpenAPI clients). Document the generator configuration and the source schema instead. Generated code documentation is the generator's responsibility.
2. **Internal vs external documentation**: Internal documentation (runbooks, ADRs) lives in the repository. External documentation (user guides, public API docs) may live in a separate system. Cross-link them but maintain a clear separation of audiences.
3. **Deprecated features in API docs**: Do not remove deprecated endpoints from the OpenAPI spec immediately. Mark them with `deprecated: true` and include a `description` pointing to the replacement. Remove deprecated endpoints only after the migration window closes.
4. **Security-sensitive documentation**: Runbooks that contain production access details (VPN endpoints, database hostnames) must be protected. Use environment variable placeholders or a secrets management system. Do not commit sensitive operational details to the repository.
5. **Multi-language documentation**: If the team is bilingual, decide on a primary language for documentation. Secondary language documentation is acceptable but must clearly indicate it is a translation and may be out of date.
6. **Documentation for deprecated repositories**: When archiving a repository, add a note at the top of the README indicating the repository is archived and linking to the replacement. Remove references to the archived repo from active documentation.

## Validation Checklist

- [ ] README includes project name, description, quickstart, prerequisites, test instructions, and contribution guide.
- [ ] Every public API endpoint has an OpenAPI spec entry with request/response examples.
- [ ] API examples in documentation are tested and produce the documented output.
- [ ] ADRs have clear context, options considered, decision, and consequences.
- [ ] All links in documentation resolve to valid targets.
- [ ] No placeholder text, TODOs, or "coming soon" sections without linked issues.
- [ ] Runbooks include exact commands with expected output for each step.
- [ ] No hardcoded secrets, credentials, or internal hostnames in documentation.
- [ ] Changelog is up-to-date with the latest release.
- [ ] Documentation for deleted or deprecated features is marked accordingly or removed.
- [ ] The documentation linter passes with zero warnings.
- [ ] A new team member can set up the project and run tests using only the README.

## Engineering Examples

### Example 1: Writing an architecture decision record

The team needs to decide between REST and GraphQL for a new customer-facing API. The ADR is written as:

```markdown
# ADR-001: Use REST for the Customer API

## Status
Accepted

## Context
The customer API will serve data to web and mobile clients. The team has experience with both REST and GraphQL. Key requirements: simple caching at the CDN layer, broad client compatibility, and a well-known ecosystem of tooling.

## Options Considered

### Option 1: REST
- **Pros**: Native HTTP caching (ETag, Cache-Control), ubiquitous tooling, easy to version, every HTTP client can consume it.
- **Cons**: Over-fetching or under-fetching on some endpoints, requires multiple round trips for complex views.

### Option 2: GraphQL
- **Pros**: Client specifies exact data requirements, single endpoint, strong typing with schema introspection.
- **Cons**: Caching is complex (requires persisted queries or CDN-level configuration), client library dependency, steeper learning curve for new team members.

## Decision
Use REST with JSON:API-compliant responses. The caching requirements are critical for the anticipated traffic patterns, and the team can address over-fetching with sparse fieldsets and compound documents.

## Consequences
- CDN caching will work out of the box.
- Mobile clients may need to make multiple requests for dashboard views. Mitigate with a BFF layer if this becomes a problem.
- Future consideration: evaluate GraphQL for the internal admin API where caching is less critical.
```

The ADR is committed to `docs/adr/001-use-rest-for-customer-api.md`. It is immutable—any future change would be a new ADR superseding this one.

### Example 2: Documenting a complex API endpoint

A payment processing API has an endpoint for creating refunds. The OpenAPI spec includes detailed documentation:

```yaml
/refunds:
  post:
    summary: Create a partial or full refund
    description: >
      Initiates a refund for a completed payment. Refunds are asynchronous—the
      endpoint returns a refund ID immediately, but the refund may take up to
      5 business days to appear in the customer's account.

      **Idempotency**: This endpoint is idempotent. Send the same
      `Idempotency-Key` header to safely retry without creating duplicate
      refunds. The idempotency window is 24 hours.

      **Partial refunds**: You can refund a portion of the original payment
      amount. Partial refunds are allowed as long as the total refunded amount
      does not exceed the original payment amount. You can issue multiple
      partial refunds up to the original amount.

      **Errors**: If the payment is already fully refunded, the endpoint
      returns HTTP 409 with error code `already_refunded`. If the payment is
      in a failed state, returns HTTP 422 with error code `invalid_payment_state`.
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              payment_id:
                type: string
                format: uuid
                description: The ID of the payment to refund.
              amount:
                type: integer
                description: Refund amount in cents. Must be > 0 and <= remaining refundable amount.
              reason:
                type: string
                enum: [requested_by_customer, duplicate, fraud]
                description: The reason for the refund. Affects internal reporting.
          example:
            payment_id: "pay_123abc"
            amount: 5000
            reason: "requested_by_customer"
    responses:
      '201':
        description: Refund created successfully.
        content:
          application/json:
            schema:
              type: object
              properties:
                refund_id:
                  type: string
                  format: uuid
                status:
                  type: string
                  enum: [pending, completed, failed]
```

The spec is reviewed in the same PR as the endpoint implementation. The examples are tested by the integration test suite to ensure they produce the documented responses.

### Example 3: Creating a runbook for incident response

A runbook for handling a database connection pool exhaustion incident:

```markdown
# Runbook: Database Connection Pool Exhaustion

## Symptoms
- API returns HTTP 503 with error "timeout: could not acquire connection from pool"
- Database CPU and memory are normal (ruling out a DB performance issue)
- Application logs show `ConnectionPoolTimeoutException`

## Severity
Critical (P0) – all requests that require database access fail.

## Immediate Response

### Step 1: Verify the alert
1. Open Grafana dashboard "DB Connections".
2. Check the "Active Connections" graph. If it is at the pool maximum (default: 50), proceed.
3. Check for slow queries: `SELECT * FROM pg_stat_activity WHERE state = 'active' ORDER BY query_start;`
4. If there are long-running queries (>30s), identify the application source.

### Step 2: Increase the connection pool
1. Edit the application ConfigMap: `kubectl edit configmap app-config`
2. Increase `DB_POOL_MAX` from `50` to `100`.
3. Roll the deployment: `kubectl rollout restart deployment/api`
4. Monitor the "Active Connections" graph. Connections should stabilise.

### Step 3: Identify the root cause
1. Search recent deployments for code changes that opened more concurrent connections.
2. Check for a traffic spike: compare current RPS to the same time last week.
3. Check for a deadlock: `SELECT * FROM pg_locks WHERE granted = false;`

### Step 4: Long-term fix
1. If the root cause is a code change, revert or fix the connection leak.
2. If the root cause is traffic growth, increase the pool permanently and consider read replicas.
3. Add an alert for `connection_pool_utilization > 80%` with a 5-minute window.

## Rollback Plan
1. Revert the ConfigMap change: `kubectl rollout undo deployment/api`
2. Verify connections return to the previous pool size.
3. If the revert does not resolve the issue, restart the database: `kubectl rollout restart statefulset/postgres`

## Post-Incident
1. Update this runbook if any step was inaccurate or missing.
2. File a ticket to add connection pooling metrics to the standard dashboard.
3. Schedule a post-mortem within 48 hours.
```

This runbook is tested quarterly in a chaos engineering exercise where the team deliberately exhausts the pool in a staging environment and follows the runbook to recover.
