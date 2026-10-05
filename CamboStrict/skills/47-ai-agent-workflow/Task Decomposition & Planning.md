# Task Decomposition & Planning

## Purpose

Define a structured methodology for AI agents to decompose complex software engineering tasks into manageable, ordered sub-tasks with clear dependencies, milestones, and completion criteria. This skill ensures that large, ambiguous requests are broken down into executable steps that can be planned, tracked, verified, and adjusted as new information emerges.

## Responsibilities

- Decomposing high-level goals into concrete, verifiable sub-tasks
- Identifying and documenting dependencies between sub-tasks
- Distinguishing parallel work from sequential work and scheduling accordingly
- Defining milestones with measurable completion criteria
- Estimating effort and scope for each sub-task
- Identifying prerequisites that must be satisfied before work can begin
- Handling blocked tasks: documenting the blocker, escalating, or re-planning
- Re-planning when new information changes assumptions or priorities
- Producing a dependency graph (implicit or explicit) for the entire plan
- Validating the decomposition against time, resource, and context constraints

## Decision Process

1. **Write the final goal in one sentence** — If the goal cannot be stated in one sentence, refine it until it can. This forces clarity on what "done" means.
2. **Identify the output artifact** — Determine what concrete artifact(s) the plan will produce: files, configuration, documentation, tests, migration scripts, etc.
3. **List all prerequisites** — What must exist or be true before work starts? (e.g., database access, API keys, merged PRs, approved designs)
4. **Brainstorm all sub-tasks without ordering** — Generate an exhaustive list of things that need to happen. Do not worry about order yet.
5. **Group sub-tasks into phases** — Group related work: "data layer changes," "API endpoint changes," "UI changes," "integration tests," "deployment configuration."
6. **Identify dependencies between sub-tasks** — Draw explicit dependencies: task B requires task A's output. Use `A → B` notation.
7. **Identify parallelizable work** — Sub-tasks with no dependency path between them can run in parallel. Mark as `[PARALLEL]`.
8. **Order sub-tasks into a sequence** — Produce a numbered list. Tasks with no dependencies go first. Parallel groups are listed together with a shared number.
9. **Define milestone checkpoints** — Every 2-4 sub-tasks, define a milestone with a concrete verification criteria (e.g., "All unit tests pass for data layer," "API returns correct 200/4xx responses").
10. **Estimate scope for each sub-task** — Add expected lines of code, files affected, or time estimate. Flag sub-tasks that exceed 100 lines or 3 files as candidates for further decomposition.
11. **Identify and tag risks** — Tag sub-tasks that involve: external API calls, concurrency, security, database migrations, or third-party integrations as `[RISK]`.
12. **Document assumptions** — For each sub-task, note what assumptions it makes about the environment, data, or other sub-tasks. Flag assumptions that are unverified.
13. **Add "Stop and Verify" gates** — After milestone sub-tasks, add a verification gate that requires checking the output before proceeding. The gate must specify exact verification steps.
14. **Review for missing tasks** — Walk through the plan as if executing it. Identify gaps: error handling, edge cases, rollback procedures, documentation, deployment steps.

## Inputs

- High-level goal or feature request (free-form)
- Existing codebase structure and conventions
- Known constraints (time, resources, dependencies on other teams)
- Previous plans or decomposition attempts
- Risk assessment for the domain (database, security, concurrency)
- External dependencies (APIs, services, libraries)

## Outputs

- Structured decomposition with phases, numbered sub-tasks, dependencies, and parallel tags
- Dependency graph (list of `A → B` pairs)
- Milestones with verification criteria
- Risk register for flagged sub-tasks
- Assumptions log
- Re-plan triggers (conditions that invalidate the current plan)
- Post-execution retrospective notes for future planning

## Rules

1. Every plan must have exactly one top-level goal written as a single sentence.
2. Sub-tasks must be independently verifiable: each must have a "done when" condition that can be checked with a script, test, or visual inspection.
3. No sub-task should exceed 100 lines of new code or affect more than 3 files. Sub-tasks exceeding these limits must be decomposed further.
4. Dependencies must be explicitly listed as `[task#] → [task#]`. Implicit dependencies are not allowed.
5. Milestones must be placed at natural integration points where multiple sub-tasks converge (e.g., after all data layer changes, before API layer).
6. Work tagged `[PARALLEL]` must have zero transitive dependencies on each other.
7. Work tagged `[RISK]` must include a fallback plan or rollback procedure.
8. Re-planning is mandatory when: a verified assumption is proven false, a dependency becomes unavailable, or a milestone verification fails.
9. Every plan must include a "Prerequisites" section checked before execution begins. If prerequisites are not met, the plan must not start.
10. Plans must include a "Done" definition: what does the system look like when all sub-tasks are complete? This must include non-functional requirements (tests passing, lint clean, no regressions).
11. When re-planning, the original plan must be preserved and the new plan must include a diff: what changed and why.
12. Plans must be self-contained: all context needed to execute the plan must be included in the plan document.

## Best Practices

- Decompose breadth-first: list all major phases first, then decompose each phase into sub-tasks. Avoid going deep into one phase while others remain vague.
- Use dependency chains to determine ordering: find the critical path (longest chain of sequential dependencies) and prioritize unblocking it.
- For database tasks, always include: schema migration (up/down), data backfill script, rollback verification, and read-replica compatibility check.
- For API tasks, always include: request validation, response serialization, error response format, rate limit consideration, and idempotency for mutating endpoints.
- For UI tasks, always include: loading state, empty state, error state, edge case display (long text, missing data, mobile viewport).
- Use the "bus factor" heuristic: if one sub-task failing blocks more than 3 other sub-tasks, it needs a fallback plan.
- Tag sub-tasks with their category: `[DATA]`, `[API]`, `[UI]`, `[TEST]`, `[DOC]`, `[DEVOPS]` for easy scanning.
- When decomposing bug fixes, include: reproduce bug in test → identify root cause → implement fix → verify fix passes test → verify no regression in related tests.
- After writing the plan, simulate execution mentally: trace through each sub-task and confirm the outputs would feed correctly into dependent sub-tasks.
- Keep the plan visible during execution. Update task status (pending, in-progress, blocked, done) as work proceeds.

## Anti-patterns

- **Waterfall-only decomposition** — Breaking everything into strict sequential steps when parallel work is possible. Always check for independent sub-tasks and parallelize them.
- **Missing verification gates** — Planning all work without checkpoints. Always add gates at integration points to verify correctness before building on top of potentially broken foundations.
- **Single-level decomposition** — Stopping at "implement feature X" without breaking it into data/API/UI/test/documentation. Every feature needs at least these five layers.
- **Ignoring prerequisites** — Starting execution without verifying that required tools, permissions, API keys, or merged code exist. This leads to blocked tasks and wasted effort.
- **Over-optimistic dependency assumptions** — Assuming a dependency will be ready on time without a fallback. Always plan for delayed dependencies.
- **No rollback plan** — Planning forward-only changes without considering how to revert. Every database migration and API change needs a rollback path.
- **Ignoring non-functional requirements** — Planning only functional sub-tasks (features) and omitting tests, performance considerations, security review, and documentation.

## Edge Cases

- **Task becomes blocked mid-execution** — When a sub-task is blocked, the agent should: document the blocker, determine if dependent sub-tasks can proceed on their own, and either re-order the plan or escalate. Never leave a blocked task without re-planning dependent work.
- **New information invalidates assumptions** — When a previously verified assumption turns out false (e.g., an API behaves differently than documented), stop execution, update the assumptions log, and re-plan affected sub-tasks from that point forward.
- **Milestone verification fails** — When a gate check fails, do not proceed to dependent sub-tasks. Return to the failed sub-task, fix the issue, re-verify, then proceed. Document the failure for future planning.
- **Dependency graph has cycles** — A → B → A is invalid. If discovered, the decomposition is wrong. Re-analyze: one of the tasks likely needs to be merged or split differently.
- **Scope creep during decomposition** — A sub-task keeps growing as you analyze it. This indicates the phase is too large. Add a decomposition step specifically for that sub-task.
- **Missing prerequisite discovered mid-execution** — Stop work, document the missing prerequisite, and either add a new initial sub-task to fulfill it or block dependent work until the prerequisite is available.

## Validation Checklist

- [ ] Top-level goal is a single, unambiguous sentence.
- [ ] Each sub-task has a "done when" condition that is testable.
- [ ] No sub-task exceeds 100 lines or 3 files. If so, further decomposed.
- [ ] Dependencies are explicitly listed for every sub-task that has them.
- [ ] Parallel work is identified and tagged `[PARALLEL]`.
- [ ] Milestones are placed at natural integration points with verification criteria.
- [ ] Each `[RISK]` tagged sub-task has a fallback or rollback plan.
- [ ] Prerequisites section is complete and verifiable.
- [ ] "Done" definition includes non-functional requirements.
- [ ] The critical path is identified (longest dependency chain).
- [ ] Every phase has at least one verification gate.
- [ ] The plan has been mentally simulated and no gaps found.

## Engineering Examples

### Example 1: Decomposing "Implement User Management" Feature

**Top-Level Goal:** Implement admin user management UI with CRUD operations, role assignment, and audit logging.

**Phases and Sub-Tasks:**

**Phase 1: Data Layer** `[PARALLEL within phase]`
1. `[DATA]` Create `users` migration: add `role` (enum: admin/editor/viewer), `status` (active/disabled), `last_login_at` columns. Done when: migration runs up/down cleanly.
2. `[DATA]` Create `audit_logs` migration: `id`, `actor_id`, `action`, `target_type`, `target_id`, `details (jsonb)`, `created_at`. Done when: migration runs cleanly.
3. `[DATA]` Create UserRepository with methods: `findAll(filter, pagination)`, `findById`, `create`, `update`, `disable`. Done when: all repository methods have passing unit tests with in-memory database.
4. `[DATA]` Create AuditLogRepository with method `log(actor_id, action, target_type, target_id, details)`. Done when: test verifies log entry is persisted.

**Phase 2: API Layer** `[DEPENDS: Phase 1]`
5. `[API]` `GET /api/admin/users` — paginated list with filtering by role/status/search. `[DEPENDS: 3]` Done when: returns correct 200 with paginated results, 400 for invalid filters.
6. `[API]` `POST /api/admin/users` — create user with role assignment. `[DEPENDS: 3]` Done when: creates user in DB, returns 201, triggers audit log.
7. `[API]` `PUT /api/admin/users/:id` — update user fields. `[DEPENDS: 3]` Done when: updates user, returns 200, triggers audit log with before/after diff.
8. `[API]` `DELETE /api/admin/users/:id` — disable user (soft delete). `[DEPENDS: 4]` Done when: sets status=disabled, returns 200, triggers audit log.

**Phase 3: UI Layer** `[DEPENDS: Phase 2]`
9. `[UI]` User list page: table with columns, pagination controls, search input, role/status filter dropdowns. Done when: all filter combinations work, pagination shows correct counts, loading spinner appears during fetch.
10. `[UI]` Create user form: fields for name/email/role, validation for email format and required fields. Done when: valid submission creates user, invalid shows inline errors, duplicate email shows API error.
11. `[UI]` Edit user form: pre-filled fields, role change confirmation dialog. Done when: save updates user, cancel reverts changes, role change audit is logged.
12. `[UI]` Disable user button with confirmation dialog. Done when: disabled user shows "disabled" badge, re-enable option available.

**Phase 4: Authorization & Audit** `[DEPENDS: Phase 2, 3]`
13. `[API]` Add admin role middleware: `requireRole('admin')` to all user management routes. `[DEPENDS: 3]` Done when: non-admin users receive 403, admin users pass through.
14. `[API]` `GET /api/admin/audit-logs` — paginated audit log viewer. `[DEPENDS: 4]` Done when: returns logs with actor name, timestamp, action summary.

**Milestone Gates:**
- After Phase 1: `npm run test:data` passes, both migrations run in CI.
- After Phase 2: API integration tests pass for all endpoints (200/400/403/404 responses).
- After Phase 3: E2E tests for user CRUD flow pass in headless browser.
- After Phase 4: Security audit confirms role enforcement on all routes.

### Example 2: Database Migration in Safe Incremental Steps

**Goal:** Migrate `orders.status` from VARCHAR to ENUM type without downtime.

**Sub-tasks:**
1. `[DATA]` Create new ENUM type: `CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')`. Done when: type exists in database.
2. `[DATA][RISK]` Add `status_new` column with ENUM type, nullable initially. Done when: column exists, all existing rows have NULL.
3. `[DATA]` Create application-level dual-write: write to both `status` and `status_new` columns. Done when: app writes to both columns for all order mutations.
4. `[DATA]` Backfill script: convert all existing VARCHAR values to ENUM in `status_new`. Done when: script completes, no NULLs remain in `status_new`, values match between columns.
5. `[DATA]` Verify dual-write consistency for 24h: monitoring check that `status` and `status_new` never diverge. Done when: zero divergence alerts.
6. `[DATA][RISK]` Switch reads to `status_new`: update all queries to read from `status_new` instead of `status`. Done when: all read paths verified in staging.
7. `[DATA]` Drop `status` column. Done when: column removed, no application code references `status`.
8. `[DATA]` Rename `status_new` to `status`. Done when: column renamed, all app code reads from `status`.

**Fallback points:** Step 6: if reads fail, switch back to reading from `status`. Step 7: if rollback needed before dropping, keep both columns.

### Example 3: Planning a Refactoring Project with Testing Gates

**Goal:** Refactor monolithic `src/services/checkout.ts` (800 lines) into smaller single-responsibility modules.

**Phases:**

**Phase 1: Characterization and Tests**
1. `[TEST]` Write characterization tests for the entire checkout service: document current behavior with integration tests that cover all code paths. Done when: test coverage >90% on checkout.ts.
2. `[DOC]` Map current dependencies: list every import and external call made by checkout.ts. Done when: dependency map documented in `docs/checkout-dependencies.md`.

**Gate: Characterization tests must pass at 100% before proceeding.**

**Phase 2: Module Extraction** `[PARALLEL]`
3. `[REFACTOR]` Extract `CartCalculator` — pricing, discounts, tax calculation. Done when: tests pass, checkout.ts is 100 fewer lines, no behavior change.
4. `[REFACTOR]` Extract `InventoryValidator` — stock checking, reservation. Done when: tests pass, extracted module has its own test suite.
5. `[REFACTOR]` Extract `PaymentProcessor` — payment gateway integration, refund logic. Done when: extracted, payment gateway calls are mockable in tests.

**Gate: All existing tests pass after each extraction. No test changes allowed (safety net).**

**Phase 3: Integration**
6. `[REFACTOR]` Rewrite `checkout.ts` to compose extracted modules. Done when: checkout.ts is <100 lines, delegates to modules.
7. `[TEST]` Add integration tests for the new checkout orchestration. Done when: new tests cover orchestration edge cases (partial failures, timeout handling).

**Gate: Code review required. Verify no public API changes.**

**Phase 4: Cleanup**
8. `[REFACTOR]` Remove any dead code exposed by extraction. Done when: unused exports removed, lint passes with no warnings.
9. `[DOC]` Update module documentation with new structure. Done when: README updated, each new module has doc comment.
