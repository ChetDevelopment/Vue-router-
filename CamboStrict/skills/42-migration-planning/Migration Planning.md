# Migration Planning

## Purpose
Migration planning ensures that changes to databases, code, infrastructure, and data formats are executed safely, with minimal downtime, zero data loss, and a clear rollback path. Whether migrating a monolith to microservices, changing a database schema, moving from one cloud provider to another, or upgrading a critical library, a structured migration plan reduces risk by breaking the work into reversible steps, validating each step, and providing a fallback for every stage. The purpose of this document is to establish a repeatable process for planning, executing, and validating migrations of all types.

## Responsibilities
1. **Migration Type Classification** — Identify the migration as schema-only, data-only, code-only, infrastructure-only, or a combination. Each type has different risks, validation strategies, and rollback procedures.
2. **Expand-Contract Pattern Design** — Structure the migration as a series of reversible phases: expand (add the new schema/code/infrastructure alongside the old), migrate (dual-write or transform data), contract (remove the old version).
3. **Rollback Planning** — For each phase, define the exact conditions that trigger a rollback, the rollback procedure, and how to verify the rollback completed successfully. No phase proceeds unless the rollback plan for that phase is documented and tested.
4. **Data Consistency Assurance** — During dual-write phases, ensure that the old and new systems remain consistent. Implement reconciliation jobs that detect and repair drift.
5. **Read-Only Phase Execution** — Before switching writes to a new system, optionally run a read-only phase where the new system receives traffic but does not serve it, allowing validation of its behavior with real traffic.
6. **Cut-Over Strategy Selection** — Choose between gradual cut-over (e.g., redirect 1% of traffic at a time) and instantaneous cut-over (e.g., feature flag flip) based on risk tolerance and system architecture.
7. **Migration Testing** — Test the migration in a production-like environment with production-sized data. Run dry-run migrations that exercise every step and every rollback.
8. **Post-Migration Validation** — After migration, run validation queries, compare row counts, check referential integrity, and verify application behavior before decommissioning the old system.

## Decision Process
1. **Identify the migration scope.** Determine whether the migration affects schema, data, code, infrastructure, or multiple layers. Each layer requires its own plan, timeline, and rollback strategy. A database schema migration may need to be coordinated with a code deployment.
2. **Choose the migration pattern.** For any migration that can be done without downtime, use the expand-contract pattern. For migrations where downtime is acceptable (e.g., low-traffic periods), a simpler lock-and-migrate pattern may be appropriate.
3. **Design the expand phase.** Add the new schema, code path, or infrastructure alongside the existing one. The old system continues to serve traffic. Dual-writes start: every write goes to both old and new systems. A feature flag toggles the dual-write on and off independently of deploy.
4. **Validate the new system in parallel.** Run the new system in read-only or shadow mode: it receives a copy of production traffic but does not serve responses. Compare its outputs with the old system. Fix discrepancies before proceeding.
5. **Plan the cut-over.** Decide on gradual (traffic migration) or instantaneous (feature flag). For gradual, define the increments (e.g., 1%, 5%, 25%, 50%, 100%) and the cooldown period between increments (e.g., 24 hours to monitor for errors).
6. **Design the contract phase.** After the new system is verified as stable, remove the old schema, code path, or infrastructure. This may involve dropping old tables, deleting old code, or decommissioning old servers.
7. **Define rollback triggers.** For each phase, specify measurable conditions that trigger a rollback: error rate increase >1%, latency increase >50%, reconciliation job finds >0.1% drift, critical alert from monitoring. Rollback must be tested.
8. **Schedule the migration.** Choose a time window with minimum traffic and maximum engineering coverage. Announce the migration window to stakeholders. Have the rollback plan ready. Execute the migration step by step, validating after each step.

## Inputs
- **Source system documentation** — Schema, API contracts, infrastructure configuration, and data dictionaries for the system being migrated from.
- **Target system design** — Schema, API contracts, infrastructure as code, and configuration for the system being migrated to.
- **Traffic patterns and metrics** — Peak request rates, write throughput, query latency percentiles, and data growth rates to size the target system and plan cut-over timing.
- **Data inventory** — Row counts, data sizes, and data quality reports for all data being migrated.
- **Compliance requirements** — Data retention policies, audit trail requirements, and regulatory constraints that may affect the migration timeline or procedure.
- **Rollback infrastructure** — Backup snapshots, old deployment artifacts, and the ability to revert DNS, feature flags, or database connections.

## Outputs
- **Migration plan document** — A step-by-step sequence of actions with dependencies, estimated durations, rollback procedures, and validation checks for each step.
- **Expand-contract timeline** — A visual timeline showing the expand phase, the migration phase (dual-writes), the cut-over, and the contract phase with go/no-go gates at each transition.
- **Dual-write implementation** — Code (or configuration) that writes data to both old and new systems, including error handling, retry logic, and reconciliation.
- **Read-only or shadow deployment** — A deployment of the new system that receives production traffic copies but does not serve live responses.
- **Reconciliation scripts** — SQL or application scripts that compare old and new data stores, report differences, and optionally repair drift.
- **Rollback scripts** — For every phase, a tested script that reverts the changes and restores the previous state (e.g., reverse migration SQL, feature flag toggles, DNS changes).
- **Validation report** — After the migration, a report showing row counts match, referential integrity is intact, application health checks pass, and no error rate increase.

## Rules
1. **Every migration must have a tested rollback plan.** No phase may proceed without a documented and tested procedure to revert to the previous state. The rollback must be faster than the forward migration.
2. **Never mix schema and data migration in a single step.** Change the schema first (expand), then migrate the data, then remove the old schema (contract). Mixing them makes rollbacks impossible without data loss.
3. **All dual-write failures must be logged and alerted.** If a write to the new system fails, the old system write must still succeed (old system is source of truth). Alert on every dual-write failure and reconcile periodically.
4. **Run data reconciliation before and after cut-over.** Before cut-over, verify that the new system's data matches the old system's data within the defined tolerance. After cut-over, continue reconciliation until the old system is decommissioned.
5. **Use feature flags to control migration phases.** Every toggle — dual-write enable, read-traffic switch, write-traffic switch, old-system drain — must be a feature flag that can be changed without a deployment.
6. **Do not decommission the old system until the new system has been stable for at least one full business cycle.** The old system must be kept available for rollback for at least one week (or two accounting periods for financial systems) after cut-over.
7. **Migration steps must be idempotent.** Running a migration step twice must produce the same result as running it once (or detect that it was already applied and skip). This allows safe retry on transient failures.
8. **Every migration step must have a validation check.** Before moving to the next step, run an automated check that the current step completed successfully. Do not proceed on manual "looks good" assessments.

## Best Practices
1. **Practice the migration in a staging environment with production-sized data.** Use anonymized production backups. Measure how long each step takes. Account for data growth between the test and the actual migration.
2. **Break the migration into the smallest reversible steps possible.** Instead of migrating 100 tables in one weekend, migrate 10 tables per week. Smaller steps are easier to validate, roll back, and debug.
3. **Schedule the migration during the lowest traffic period.** For B2B SaaS, this may be a weekend. For global consumer apps, this may be 3 AM UTC. Account for timezone differences.
4. **Assign clear ownership for each phase.** Each phase must have a single owner responsible for executing the phase, running the validation checks, and making the go/no-go decision. There must be a designated rollback commander who can override and initiate a rollback.
5. **Communicate the migration plan to all stakeholders.** Developers, product managers, customer support, and (if applicable) customers should know the migration window, expected impact (if any), and how to report issues.
6. **Use shadow reads before switching writes.** Deploy the new system, route a copy of read traffic to it, and compare responses with the old system. Fix discrepancies before enabling dual-writes.
7. **Automate every step that can be automated.** Manual steps are error-prone and non-repeatable. Use migration frameworks (Flyway, Alembic, Liquibase for databases; Terraform for infrastructure) to ensure consistency.
8. **Keep the old system running in read-only mode after cut-over.** Even after writes are switched, keep the old system available for read queries until validation confirms all data is consistent. This provides a safety net.

## Anti-patterns
1. **Big bang migration.** Trying to migrate everything — schema, data, code, and infrastructure — in a single weekend. If anything goes wrong, the entire system is down, and rollback is complex and risky. Use expand-contract instead.
2. **No rollback plan.** "If it fails, we'll figure it out then." Without a tested rollback, a failed migration can take days to recover. Every phase must have a documented, tested rollback.
3. **Migrating during peak traffic.** Running a data-intensive migration while the system is at its busiest. This guarantees performance degradation and increases the risk of failure.
4. **Trusting dual-writes without reconciliation.** Assuming that dual-writes keep old and new systems perfectly in sync without running a reconciliation job. Transient failures, network issues, and code bugs cause drift.
5. **Decommissioning the old system too early.** Removing the old system a few hours after cut-over because "everything looks fine." When a subtle data inconsistency is discovered a week later, there is no fallback.
6. **Manual migration steps without validation.** Running SQL scripts by hand in a production console without first validating them in staging. One typo in a WHERE clause can corrupt millions of rows.
7. **Simultaneous schema and code migration.** Deploying a new database schema and new application code at the same time. If the new code has a bug, rolling back the code leaves a schema incompatible with the old code.
8. **Ignoring data quality issues before migration.** Migrating dirty data (duplicate records, NULL values in required columns, violated constraints) to the new system. The migration is an opportunity to clean data; do it before the migration, not after.

## Edge Cases
1. **Dual-write failure during cut-over.** If the new system is unreachable during the cut-over window, dual-writes may fail. The old system must continue accepting writes, and the failed writes must be queued and replayed to the new system once it recovers.
2. **Data that changes during the migration.** If a row is updated while the migration script is reading it, the script may copy a stale version to the new system. Use snapshot isolation or row-level locking to ensure a consistent snapshot.
3. **Large objects (BLOBs) causing timeouts.** Migrating large binary objects over a network connection may exceed timeouts. Stream large objects or use a dedicated bulk data transfer mechanism (e.g., AWS Snowball, database dump and restore).
4. **Foreign key constraint violations after migration.** If data is migrated table by table, a row inserted into the child table may reference a parent row that has not been migrated yet. Use a consistent snapshot or migrate with constraints deferred.
5. **Clock skew between old and new systems during cut-over.** If timestamps are used to determine which system has the latest write, clock skew can cause data loss. Use logical timestamps (sequence numbers, Lamport clocks) or rely on application-level conflict resolution.
6. **Rollback after partial data migration.** If the migration fails after 80% of the data has been moved, rolling back means restoring the old system from a backup taken before the migration started. The 20% of writes that occurred during the migration window may be lost. Plan for this by having the old system continue accepting writes during the migration (dual-writes) so that rollback is lossless.

## Validation Checklist
- [ ] Migration plan is documented with step-by-step actions and dependencies.
- [ ] Each step has a tested rollback procedure.
- [ ] Expand-contract pattern is used; schema and data migration are separate steps.
- [ ] Dual-writes are implemented with error logging and alerting.
- [ ] Reconciliation scripts exist and have been tested against production-sized data.
- [ ] Feature flags control every phase toggle (no deploy needed to switch).
- [ ] Read-only or shadow mode has been run for at least one full business cycle.
- [ ] Cut-over plan specifies traffic increments and cooldown periods.
- [ ] Old system will remain available for at least one week after cut-over.
- [ ] Migration steps are idempotent.
- [ ] Every step has an automated validation check before proceeding.
- [ ] Staging environment has been used for a full dry-run migration.
- [ ] Rollback commander is assigned and authorized to initiate rollback.
- [ ] Stakeholders have been notified of the migration window and potential impact.

## Engineering Examples

### Example 1: Migrating a Monolith Database to Microservices Using Expand-Contract

A monolithic e-commerce application has a single PostgreSQL database containing users, orders, products, and inventory. The team is extracting the inventory system into a separate microservice with its own database. The monolith currently reads and writes inventory data from the shared database.

**Approach:**
- **Expand phase:** Create a new inventory service with its own PostgreSQL database. Add a new table <code>inventory_new</code> in the monolith's database that mirrors the inventory service's schema. Modify the monolith's inventory code to dual-write: every write goes to both <code>inventory_old</code> (existing table) and <code>inventory_new</code> (new table). Also, have the monolith publish an event to a message queue whenever inventory changes. The inventory service subscribes to these events and updates its own database.
- **Validation phase:** For two weeks, the inventory service runs in shadow mode, processing events and querying but not serving traffic. A reconciliation job runs every 15 minutes, comparing <code>inventory_old</code> in the monolith with the inventory service's database. Any discrepancy is logged and alerted.
- **Cut-over phase:** When reconciliation shows zero drift for 48 consecutive hours, a feature flag switches the monolith's inventory reads from <code>inventory_old</code> to the inventory service's API. Writes are still dual. Another flag switches writes from the monolith's direct database access to the inventory service's API.
- **Contract phase:** After one week with zero errors, the feature flag disables dual-writes to <code>inventory_old</code>. The <code>inventory_old</code> table is dropped in the monolith's database. The old inventory code path is removed from the monolith.

**Result:** The migration is completed with zero downtime. At any point, the team can roll back by flipping the feature flags. The reconciliation job catches two drift incidents during the validation phase, which are fixed before cut-over.

### Example 2: Performing a Zero-Downtime Schema Migration

A SaaS application needs to add a <code>timezone</code> column to the <code>users</code> table. The table has 10 million rows and receives 500 writes per second. The old code does not know about the <code>timezone</code> column.

**Approach:**
- **Expand phase:** Run a migration that adds the <code>timezone</code> column as nullable without a default. The migration is applied while the application is running. The ALTER TABLE in PostgreSQL is instant (no table rewrite) for adding a nullable column. No application changes are needed yet.
- **Backfill phase:** Run a background job that backfills the <code>timezone</code> column in batches of 1,000 rows. Run this job during low traffic, throttling to stay within 10% of the database IOPS budget.
- **Application deploy phase:** Deploy new application code that reads and writes the <code>timezone</code> column. The code treats a NULL timezone as "use the server default." Write a default timezone on user registration. No schema changes are needed in this deploy.
- **Contract phase:** After the backfill completes and the new application code has been running for one week, run a migration to add a NOT NULL constraint on the <code>timezone</code> column. This migration requires a full table scan but is safe because all rows now have a value.

**Result:** The migration is completed over multiple deploys with zero downtime. Each step is reversible: if the new application code has a bug, the old code is redeployed without needing a schema rollback. The backfill job can be paused and resumed.

### Example 3: Migrating from an Old API to a New One with Dual-Writes

A team is replacing a legacy REST API (<code>/v1/orders</code>) with a new GraphQL API. Both APIs manage order data. External mobile apps and internal services use the old REST API. The new GraphQL API has a different data model and different validation rules.

**Approach:**
- **Expand phase:** Deploy the GraphQL API alongside the REST API. The REST API handler is modified to dual-write: when an order is created or updated via REST, it also sends the mutation to the GraphQL API. Dual-writes are controlled by a feature flag. Any error from the GraphQL API is logged but does not fail the REST request.
- **Validation phase:** A reconciliation job runs every 5 minutes, fetching all orders updated in the last 5 minutes from both APIs and comparing the data. Discrepancies are logged with full details. The team fixes the GraphQL mutation logic to match REST behavior.
- **Read-only cut-over:** The mobile app version that supports GraphQL is released. It can read from the GraphQL API but still writes via REST. This validates read queries with production traffic.
- **Full cut-over:** After two weeks of stable read-only operation, a feature flag on the mobile app switches writes to the GraphQL API. The REST API continues to receive old writes from consumers who have not updated.
- **Contract phase:** After 6 months (the mobile app update cycle), the REST API is deprecated with <code>Deprecation</code> headers. After 9 months, it returns 410 Gone for orders endpoints.

**Result:** The migration takes 9 months end-to-end. At every point, the old system is available. Dual-writes ensure no data loss. The reconciliation job catches and fixes 23 data discrepancies between the two APIs during the validation phase.
