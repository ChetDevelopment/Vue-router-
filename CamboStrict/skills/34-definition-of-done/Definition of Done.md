# Definition of Done

## Purpose

The Definition of Done (DoD) is the shared, enforceable checklist that every work item must satisfy before it can be considered complete and deployed to production. It provides a consistent quality bar across all team members, prevents incomplete or untested work from accumulating, and ensures that every change is business-verified, functionally correct, code-reviewed, tested, secure, performant, documented, monitored, and production-ready. The DoD is not a suggestion or a guideline; it is a contract that every team member, from intern to tech lead, must follow for every change.

## Responsibilities

- Ensure that every user story, bug fix, technical task, or configuration change satisfies every DoD criterion before it is marked as done.
- Verify that business requirements are met: the implemented feature behaves as described in the acceptance criteria and has been demonstrated or signed off by the product owner or stakeholder.
- Confirm that functional requirements are met: the implementation covers all specified behavior, including edge cases, error states, and boundary conditions.
- Conduct or participate in code review for every change, ensuring that the code is maintainable, follows team conventions, and does not introduce regressions.
- Write and execute tests at appropriate levels: unit tests for individual functions, integration tests for module interactions, and end-to-end tests for critical user journeys.
- Perform security analysis: threat model the change, verify that no secrets are exposed, check for common vulnerabilities (injection, XSS, CSRF, insecure deserialization), and run automated security scans.
- Validate that the change meets performance SLIs: response times, throughput, resource utilization, and database query performance are within acceptable thresholds.
- Ensure the change is maintainable: code is documented, naming is consistent, architecture decisions are recorded, and any new debt is tracked.
- Deploy through the CI/CD pipeline and verify that all stages pass: lint, test, build, security scan, deploy to staging, smoke tests in staging.
- Configure monitoring for the change: alerts are set for error rate, latency, and business metrics; dashboards are updated to include new metrics; runbooks are updated if operational procedures change.
- Confirm production readiness: rollback plan exists, feature flags are in place for risky changes, dependency health checks are configured, and the on-call team is notified of the change.

## Decision Process

1. **Review the acceptance criteria.** Start with the user story or ticket. Does the implemented code satisfy every bullet point in the acceptance criteria? Are there any acceptance criteria that were not covered? If the acceptance criteria are vague, clarify with the product owner before marking the change as done.

2. **Verify business requirements.** Demonstrate the feature to the product owner or stakeholder. Does it work as expected from a business perspective? Are there any edge cases in the business logic that were missed? The product owner must explicitly sign off (via ticket comment, approval in a review tool, or a dedicated demo session).

3. **Self-review the code.** Before opening a pull request, review your own code. Is every change necessary? Are there debugging statements, commented-out code, or dead code? Does the code follow team conventions (naming, formatting, error handling, logging)? Is the change as small as it can be while still being correct?

4. **Open a pull request and request review.** Open the PR with a clear description of what the change does, why it was done, and how it was tested. Request reviews from at least two team members (or one, depending on team policy). The PR must have at least one approval before merging, and all reviewer comments must be addressed.

5. **Run tests at all levels.** Ensure that unit tests cover all new logic (including error paths and edge cases), integration tests cover module interactions, and end-to-end tests cover critical user journeys that the change affects. The test suite must pass locally and in CI. Test coverage for the changed code must be at least 80%.

6. **Perform a security review.** For the change, consider: does it handle user input? If yes, validate and sanitize it. Does it touch authentication or authorization? If yes, verify that access controls are correct. Does it introduce new dependencies? If yes, scan them for known vulnerabilities. Does it log or expose any sensitive data? If yes, redact or remove it. Run SAST, DAST, or dependency scanners as applicable.

7. **Validate performance SLIs.** Benchmark the changed code. For API endpoints, measure p50, p95, and p99 latency under expected load. For database changes, run `EXPLAIN ANALYZE` on new queries and ensure they use indexes and do not scan more than 10,000 rows. For frontend changes, measure Lighthouse scores and bundle size impact. Compare against SLO thresholds.

8. **Check maintainability.** Is the code self-documenting? Are there any non-obvious decisions that need an ADR or a comment? Does the change introduce new technical debt? If so, record it in the tech debt register. Does the change require updates to onboarding docs, API docs, or runbooks? Update them.

9. **Deploy through CI/CD.** Push the change to the CI/CD pipeline. All stages must pass: lint (no warnings), type check (no errors), unit test (100% pass), integration test (100% pass), security scan (no high or critical findings), build (artifact created), deploy to staging (health checks pass), smoke test in staging (critical journeys pass).

10. **Configure monitoring.** After production deployment, verify that alerting is configured: error rate alerts, latency alerts, and business metric alerts (e.g., conversion rate, signup rate). Verify that dashboards show the new metrics. Verify that the on-call runbook covers the new functionality, including failure scenarios and rollback steps.

## Inputs

- User story or ticket with acceptance criteria defined by the product owner.
- Business requirements document or specification with explicit sign-off criteria.
- Codebase and version control system with pull request workflow.
- Test suite configuration (unit test framework, integration test config, end-to-end test framework).
- Security scanning tools (SAST, DAST, dependency scanner, secret scanner).
- Performance testing tools (k6, Locust, Lighthouse, WebPageTest).
- CI/CD pipeline configuration with defined stages and quality gates.
- Monitoring platform (Datadog, Grafana, CloudWatch, New Relic) with alerting and dashboard capabilities.
- Runbooks and operations documentation for the service.

## Outputs

- A fully implemented and verified feature or fix that meets business, functional, and quality criteria.
- A pull request that has been reviewed and approved, with all reviewer comments resolved.
- A passing CI/CD pipeline from lint through production deployment, with all quality gates green.
- Automated tests that cover the changed code at unit, integration, and end-to-end levels.
- Security scan results with no high or critical findings for the changed code.
- Performance benchmarks showing the change meets SLIs.
- Updated documentation: ADRs, API docs, runbooks, onboarding guides as needed.
- Monitoring configuration: alerts configured, dashboards updated, runbooks updated.
- Rollback plan documented and tested.
- Tech debt register updated if the change introduces intentional debt.

## Rules

1. The DoD applies to every change, including bug fixes, hotfixes, configuration changes, dependency updates, and documentation changes. No change is too small to skip the DoD.
2. A work item is not done until every DoD criterion is satisfied. Partial fulfillment is not done. "Done enough" is not done.
3. The product owner must explicitly sign off on business requirements. Implicit sign-off ("I showed them, and they didn't object") is not sign-off.
4. Code review must have at least one approval from a team member who did not author the change. The author must respond to all review comments, even if the response is "I disagree, here is why."
5. Tests must be automated and run in CI. Manual testing is not a substitute for automated tests. A change that was only tested manually is not done.
6. Security scans must not produce any high or critical findings for the changed code. If a finding is a false positive, document it and suppress it with a reviewable exception.
7. Performance must be validated against SLIs. If the change degrades p99 latency by more than 10% compared to the baseline, it must be optimized before it is done.
8. Documentation must be updated as part of the change. If the change introduces new API endpoints, the API docs are updated. If the change changes deployment procedures, the runbook is updated.
9. Monitoring must be configured before the change is deployed to production. Alerts must be tested to ensure they fire correctly.
10. A rollback plan must exist and be tested. The plan must specify the trigger conditions, the rollback procedure, and the verification steps after rollback.

## Best Practices

- Make the DoD visible to the entire team. Post it in the team chat, add it as a PR checklist template, and include it in onboarding materials. Every team member should have it memorized within their first sprint.
- Review the DoD as a team every quarter. Does it still make sense? Are there criteria that are no longer relevant? Are there new criteria that should be added (e.g., accessibility checks, GDPR compliance)? Update it collectively.
- Automate as many DoD criteria as possible. Linting, formatting, test execution, security scanning, and performance benchmarking should be automated in CI. Only automate code review and product owner sign-off cannot be automated.
- Use PR templates with checkboxes for the DoD. This ensures that every PR author explicitly considers each criterion. The reviewer should verify that each checked box is genuinely satisfied.
- Distinguish between "done" and "deployed." A feature can be deployed (in production, behind a feature flag) but not done (not all DoD criteria met). Feature flags should only be used for incomplete features if the DoD criteria for safety (testing, monitoring, rollback) are met.
- Apply the DoD progressively: some criteria are checked at feature level (business requirements, acceptance criteria), some at sprint level (documentation updates, dashboard updates), and some at release level (performance benchmarks, security scans).
- Hold a "DoD review" as part of the sprint review. Walk through each completed item and confirm that the DoD was followed. This reinforces the importance of the DoD and catches any items that were marked done prematurely.
- Use the DoD as a coaching tool for new team members. Instead of saying "your code is not ready," say "let's walk through the DoD and see which criteria need more work."
- Track DoD compliance over time. If certain criteria are consistently missed (e.g., monitoring not configured, performance not validated), address the root cause: lack of tooling, lack of knowledge, or lack of time.
- When the DoD is violated (a change goes to production without meeting all criteria), conduct a blameless review. Why was the DoD skipped? Was it an emergency? Was the DoD too onerous? Fix the process, not the person.

## Anti-patterns

- **"We'll fix it in production."** Deploying a change that does not meet the DoD with the intention of fixing it later. This accumulates debt and erodes quality standards. If it is not ready, do not deploy.
- **Treating the DoD as a suggestion.** Skipping criteria because "this is a small change" or "we are in a hurry." Small changes can have large impacts (a one-line config change can bring down the entire site). The DoD applies to every change.
- **Rubber-stamping code reviews.** Approving a PR without actually reviewing the code, or checking the DoD boxes without verification. This defeats the purpose of the DoD. Reviews must be thorough.
- **Product owner sign-off after deployment.** Asking the product owner to verify the feature after it is already in production. The sign-off must happen before deployment. If the feature does not meet business requirements, it should not be deployed.
- **Checking "tested" without automated tests.** Manual testing by the developer is not sufficient. Tests must be automated and run in CI. If the tests are not automated, they will not be run consistently.
- **Skipping monitoring configuration.** Deploying a change without alerts or dashboards, and discovering issues only when customers complain. Every change must have monitoring in place before it goes live.
- **Rollback plan as an afterthought.** Assuming that "we can just revert the commit." A git revert may not be sufficient if the change includes database migrations, config changes, or data transformations. A proper rollback plan must be documented.

## Edge Cases

- **Hotfixes and emergency changes.** When a P0 incident requires an immediate fix, the DoD may be relaxed. However, every skipped criterion must be recorded and fulfilled within 24 hours after the fix. The hotfix must still be code-reviewed (even if post-hoc), deployed through CI/CD, and monitored. A blameless postmortem must follow.
- **Configuration-only changes.** Changing a feature flag, a rate limit, or a database connection string still requires code review, CI/CD deployment, and monitoring. Even a simple config change can have cascading effects. Document the expected impact and the rollback plan.
- **Dependency upgrades.** Upgrading a library from version 1.0 to 2.0 is not just a version bump. Code review must check for breaking changes. Tests must verify that the upgrade does not break functionality. Security scans must confirm the new version does not introduce vulnerabilities. Performance benchmarks must verify no regression.
- **Data migrations.** A migration that backfills data or transforms existing data needs extra DoD criteria: a dry-run in staging, a verified rollback script, a data integrity check after migration, and a throttle mechanism to prevent database overload.
- **Third-party API integration changes.** If the change modifies how the system integrates with an external API, the DoD must include: contract testing (verify the API response format matches expectations), error handling for API failures (circuit breaker, fallback), and monitoring for API error rates and latencies.
- **Experimental features behind feature flags.** A feature behind a flag does not need to meet all DoD criteria for business completeness (it can be partially implemented), but it must meet safety criteria: code review, testing, security scanning, monitoring, and rollback plan. The feature flag itself must have a kill switch.

## Validation Checklist

- [ ] Business requirements met: acceptance criteria are satisfied, product owner has signed off (explicitly, in writing).
- [ ] Functional requirements met: all specified behavior is implemented, including edge cases and error states.
- [ ] Code reviewed: PR is approved by at least one reviewer who did not author the change, all comments are resolved.
- [ ] Unit tests: all new logic is covered by unit tests (>=80% coverage of changed code), all tests pass in CI.
- [ ] Integration tests: module interactions are covered, integration tests pass in CI.
- [ ] End-to-end tests: critical user journeys that include the change are tested (either existing tests pass or new tests are added).
- [ ] Security scanned: SAST, DAST, and dependency scanners pass with no high or critical findings. Secrets are not exposed.
- [ ] Performance validated: p50/p95/p99 latency, throughput, and resource utilization are within SLOs. No regression >10%.
- [ ] Maintainability: code is self-documenting, naming is consistent, ADRs exist for non-obvious decisions, tech debt is tracked.
- [ ] CI/CD pipeline: all stages pass (lint, type check, test, security scan, build, deploy to staging, smoke test in staging).
- [ ] Monitoring: alerts are configured for error rate, latency, and business metrics. Dashboards are updated. Alerts are tested.
- [ ] Rollback plan: documented procedure exists, rollback has been tested (at least in staging), expected RTO is known.
- [ ] Documentation: API docs, runbooks, onboarding guides are updated to reflect the change.
- [ ] Communication: stakeholders (on-call team, product owner, customer support) are notified of the deployment.

## Engineering Examples

### Example 1: Applying DoD to a New API Endpoint

A team implements a new API endpoint `POST /api/v2/orders` that supports the new checkout flow. The DoD is applied as follows:

1. **Business requirements:** The endpoint allows placing an order with items, a shipping address, and a payment method. Discount codes are applied. The product owner places a test order in staging and confirms it works correctly. Sign-off is recorded in the ticket.

2. **Functional requirements:** The endpoint handles: successful order creation, duplicate order prevention (idempotency key), invalid item IDs (400 error), out-of-stock items (409 error), invalid discount codes (422 error), missing required fields (400 error), and unauthorized access (401 error). All cases are covered.

3. **Code review:** The PR is opened with 12 files changed. Two reviewers are assigned. Both approve after one round of comments about naming consistency and error response format.

4. **Unit tests:** The service layer (order creation logic) has unit tests covering all business rule variations: discount calculation, tax calculation, inventory deduction, payment processing. Coverage: 92%.

5. **Integration tests:** The endpoint is tested against a test database and a test payment gateway. Tests verify that orders are persisted correctly, inventory is deducted, and payment is processed.

6. **End-to-end tests:** An E2E test covers the full checkout flow: browse items → add to cart → place order → receive confirmation. This test runs against the staging environment.

7. **Security scan:** A SAST scan finds no injection vulnerabilities. A dependency scan finds no known vulnerabilities in new dependencies. The endpoint authenticates via JWT, and authorization is verified using the existing RBAC middleware.

8. **Performance validation:** Load testing with k6 shows the endpoint handles 500 req/s with p99 latency of 150ms (SLO: 300ms). Database queries are indexed and verified with EXPLAIN ANALYZE (all queries scan fewer than 100 rows).

9. **Maintainability:** The code follows the team's controller → service → repository pattern. Naming follows conventions. An ADR is written for the idempotency key strategy (client-generated UUID v4). No new tech debt is introduced.

10. **CI/CD pipeline:** All stages pass. The pipeline builds the Docker image, runs tests, scans for vulnerabilities, deploys to staging, runs smoke tests, and promotes to production with a canary deployment.

11. **Monitoring:** A Datadog dashboard is created showing order creation rate, error rate by HTTP status code, p50/p95/p99 latency, and idempotency key collision rate. Alerts are set for error rate >1% and p99 latency >300ms over 5 minutes. Alerts are tested by triggering a failure in staging.

12. **Rollback plan:** Rollback is a simple redeploy of the previous artifact. No database migration is associated with this change (new endpoint uses existing tables). The rollback plan is documented in the runbook.

### Example 2: Applying DoD to a Frontend Feature

A team implements a new "order history" page in a React single-page application. The page allows users to view their past orders, filter by date and status, and click through to order details.

1. **Business requirements:** The product owner reviews the staging deployment. The page loads, filters work, and clicking an order navigates to the detail page. Responsive design is verified on mobile and desktop viewports. Sign-off is recorded.

2. **Functional requirements:** The page handles: empty state (no orders), loading state (skeleton loading), error state (API failure, retry button), filtering by date range, filtering by status (all, pending, shipped, delivered), pagination, and order cancellation from the history page.

3. **Code review:** The PR includes the new page component, a reusable filter component, an updated API client, and unit tests. Two frontend developers review and approve.

4. **Unit tests:** Jest + React Testing Library tests cover: component renders in all states (loading, empty, error, data), filter interactions, pagination clicks, and event tracking calls.

5. **Integration tests:** Cypress integration test covers the full user flow: login → navigate to order history → apply filter → click order → verify detail page loads.

6. **End-to-end tests:** The E2E test suite is updated to include a test that creates an order and then verifies it appears in the order history page.

7. **Security scan:** The frontend does not introduce new API endpoints, so SAST focuses on XSS checks. User input (order IDs, statuses) is rendered safely using React's default escaping. No secrets are exposed in client-side code.

8. **Performance validation:** Lighthouse scores are measured: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90. Bundle size impact is +15KB (acceptable). The page lazy-loads the order list component to minimize initial bundle size.

9. **Maintainability:** The new page uses the existing component library and follows established patterns. A new shared `FilterBar` component is abstracted for reuse. The code is self-documenting.

10. **CI/CD pipeline:** The frontend pipeline runs lint, type check, unit tests, build, and deploy to staging. The E2E tests run against the staging backend. Production deployment is through a feature flag initially.

11. **Monitoring:** Frontend error tracking (Sentry) is configured to catch any JavaScript errors on the new page. Latency for the order history API call is monitored via the backend dashboard. Business metrics (order history page views, cancellation rate) are tracked via the analytics platform.

12. **Rollback plan:** If the feature causes issues, the feature flag is toggled off, and the old order history page (basic version) is shown. The rollback plan is tested in staging.

### Example 3: Applying DoD to a Database Migration

A team needs to add a `preferred_shipping_tier` column to the `users` table and backfill data for existing users based on their order history.

1. **Business requirements:** The product owner confirms that the preferred shipping tier should be calculated as: "standard" for users with < 5 orders in the past year, "expedited" for 5-20 orders, and "premium" for 20+ orders.

2. **Functional requirements:** The migration must: add the column as nullable, backfill data for all existing users (10 million rows), set the default for new users to "standard," and update the tier when a user's order count crosses thresholds (handled by a separate scheduled job, not the migration).

3. **Code review:** The migration script (Alembic/Flyway) and the backfill script are reviewed. The review focuses on: is the migration backward-compatible? (Yes, nullable column). Is the backfill script throttled? (Yes, processes in batches of 1,000 with a 100ms delay between batches). Is there a rollback script? (Yes, `ALTER TABLE users DROP COLUMN preferred_shipping_tier`).

4. **Unit tests:** Tests validate the backfill logic: correct tier assignment for a user with 0 orders, 4 orders, 5 orders, 20 orders, and 100 orders. Tests also validate that the migration can be rolled back and re-applied without data loss.

5. **Integration tests:** An integration test applies the migration to a test database, runs the backfill on 10,000 seeded users, and verifies correctness. The test also rolls back and verifies the column no longer exists.

6. **End-to-end tests:** An E2E test verifies that a new user signing up gets "standard" as default, and that the user profile API returns the `preferred_shipping_tier` field.

7. **Security scan:** No new vulnerabilities. The migration does not introduce any new secrets or credentials.

8. **Performance validation:** The backfill is tested against a staging database with 1 million rows. It completes in 45 minutes without blocking reads or writes (using `ROW` locking and batch processing). Production impact is estimated at <5% CPU increase during backfill.

9. **Maintainability:** The migration script is documented with comments explaining the batch size choice and the locking strategy. An ADR records the decision to use batch processing instead of a single `UPDATE` statement.

10. **CI/CD pipeline:** The migration is applied in staging first. After verification, it is applied to production as part of a blue-green deployment. The new application code (which reads and writes the new column) is deployed after the migration.

11. **Monitoring:** Database replication lag is monitored during migration to ensure replicas do not fall behind. Database CPU, connection count, and lock wait times are monitored. Alerts fire if replication lag exceeds 10 seconds.

12. **Rollback plan:** The rollback procedure is: (1) deploy the old application code, (2) run the rollback script to drop the column, (3) verify that no application code references the column. The rollback is tested in staging and estimated to take 5 minutes in production.
