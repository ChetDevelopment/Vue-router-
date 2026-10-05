# Deployment

## Purpose

The Deployment skill defines a repeatable, auditable, and risk-minimizing process for delivering software changes to production environments. It ensures that every release is predictable, reversible, and observable, regardless of whether the change is a hotfix, a feature flag toggle, or a major version upgrade. The purpose is to eliminate manual steps, reduce deployment-induced incidents, and enable teams to ship frequently with confidence.

## Responsibilities

- Define and maintain deployment strategies (blue-green, canary, rolling, feature flag–based) appropriate to service criticality and traffic patterns.
- Own the CI/CD pipeline configuration, including build, test, artifact promotion, and deployment stages.
- Manage environment promotion gates between dev, staging, and production, enforcing approval workflows where required.
- Design and document rollback procedures for every deployable unit, including database rollbacks and stateful service recovery.
- Ensure zero-downtime deployment capability for user-facing services through connection draining, health checks, and graceful shutdowns.
- Coordinate database migration ordering with application deployment to prevent schema mismatch errors.
- Maintain infrastructure as code (IaC) definitions for all deployment environments, treating provisioning as part of the release pipeline.
- Manage artifact repositories, versioning conventions, and retention policies for all deployable artifacts.
- Monitor deployment progress, detect failures, and trigger automated rollbacks when conditions are violated.
- Post-incident, conduct deployment retrospectives to improve future release processes and tooling.

## Decision Process

1. **Classify the change.** Determine whether the change is a patch (bug fix, no schema change), minor feature (backward compatible, additive), major change (breaking, schema migration required), or hotfix (expedited security or outage fix). The classification dictates which deployment strategies are eligible.

2. **Select the deployment strategy.** For patches and minor features, prefer rolling or blue-green. For major changes with schema migrations, require blue-green or feature-flagged rollout. For hotfixes, use direct-to-prod with expedited approval but always with a rollback plan. Feature-flagged changes can be deployed dark and enabled later.

3. **Validate the pipeline.** Ensure the CI/CD pipeline passes all stages for the target environment: lint, unit tests, integration tests, security scans, and container image builds. Block promotion if any stage fails. For production, require staging pipeline green.

4. **Review the rollback plan.** Every deployment must have a documented rollback procedure. For stateless services, rollback means redeploying the previous artifact. For stateful changes, verify that any database migrations are reversible and that the rollback script exists and is tested.

5. **Execute database migrations first (if any).** Apply backward-compatible schema changes before deploying new application code. Never deploy code that expects a new column before the column exists. Use expand-migrate-contract pattern: add new schema (expand), deploy code, remove old schema (contract) in a later release.

6. **Deploy to the target environment.** Push the artifact through the pipeline. For blue-green, switch the router after the new environment passes health checks. For canary, gradually shift traffic (e.g., 1% → 5% → 20% → 100%) while monitoring error budgets. For rolling, update instances in batches with cooldown periods.

7. **Monitor deployment health.** Track key SLIs during and after deployment: error rate (5xx responses), latency (p50, p95, p99), throughput, resource utilization, and business metrics (e.g., conversion rate). Compare against pre-deployment baselines. If any SLI breaches the threshold, halt the deployment.

8. **Complete or roll back.** If all health checks pass and the observation window expires without incident, mark the deployment as complete. If an incident is detected, execute the rollback procedure immediately. Do not attempt to fix forward during a deployment; roll back first, fix later.

9. **Post-deployment verification.** Run smoke tests against production to confirm end-to-end functionality. Verify that monitoring alerts are firing correctly and dashboards reflect the current state. Confirm that any feature flags are set to the intended values.

10. **Document and communicate.** Record the deployment outcome in the change log. Notify stakeholders of successful deployments or incidents. If rollback occurred, trigger an incident review to identify root cause and preventive measures.

## Inputs

- Source code changes committed to the target branch (e.g., `main`, `release/x.y`).
- CI/CD pipeline configuration (YAML, HCL, or DSL files).
- Container images or compiled artifacts stored in a registry with immutable tags.
- Database migration scripts (forward and rollback).
- Deployment manifests (Kubernetes YAML, Terraform plans, Helm charts, CloudFormation templates).
- Environment configuration (secrets, environment variables, feature flag definitions).
- Health check definitions and SLI/SLO thresholds for deployment gating.
- Rollback scripts and procedures for stateful changes.
- Approval records from change management systems if required.

## Outputs

- A deployed and verified service version running in the target environment.
- Updated deployment status in the CI/CD system (success, failed, rolled back).
- Promoted artifacts tagged with environment and version metadata.
- Updated monitoring dashboards and alerts reflecting the new deployment.
- A post-deployment verification report (smoke test results, SLI comparison).
- Rollback scripts that were validated as part of the deployment process.
- Updated change log and deployment history for auditability.

## Rules

1. Never deploy directly to production from a developer workstation. All deployments must go through the CI/CD pipeline.
2. Every deployment must be fully automated. If a manual step is required, the pipeline must be updated to eliminate it before the next release.
3. Artifact tags must be immutable and include the commit SHA. Never overwrite an existing tag; always create a new one.
4. Database migrations must be backward-compatible with the current running application version. This enables safe rollback without data loss.
5. Feature flags must be used for any change that cannot be immediately rolled back (e.g., schema changes, large refactors). The flag must have a kill switch.
6. Health checks must be comprehensive: readiness probes (is the service ready for traffic?), liveness probes (is the service alive?), and dependency probes (can it reach its database / cache?).
7. Rollback must be faster than the time to diagnose a production issue. If rollback takes more than 10 minutes, the deployment process is broken and must be redesigned.
8. Production deployments must be scheduled during low-traffic windows unless the change is a critical hotfix. Define low-traffic windows per service based on historical traffic patterns.
9. Deployments must include a cooldown observation period (minimum 15 minutes) before marking as complete. This catches latent failures like memory leaks.
10. Every failed deployment must trigger an automated incident ticket and a postmortem. No deployment failure is ignored or dismissed as "flaky infra."

## Best Practices

- Implement deployment gates with progressive exposure. Start with a single instance or a low-traffic region before full rollout. This limits blast radius.
- Use a feature flag platform (e.g., LaunchDarkly, Unleash, Flagsmith) to separate deployment from release. Deploy code dark, then release features with a toggle.
- Maintain a runbook for every service that includes deployment steps, rollback procedures, and common failure scenarios. Review and update the runbook quarterly.
- Automate smoke tests as part of the deployment pipeline. These should exercise critical user journeys in the target environment.
- Use deployment windows with automatic rollback on failure. Set a timer; if the deployment is not healthy within the window, roll back automatically.
- Implement circuit breakers for deployment orchestration. If the error rate in the new environment exceeds a threshold, stop the deployment and roll back.
- Version database schemas alongside application code. Use tools like Flyway, Alembic, or Prisma Migrate to ensure schema versions match code versions.
- Practice deployment drills in staging. Regularly schedule "game day" exercises where teams practice blue-green cutovers and rollback scenarios.
- Pin base images and dependencies to specific versions to ensure reproducible builds and eliminate surprise changes in production.
- Monitor deployment frequency, lead time, change failure rate, and mean time to recovery (MTTR). Use these DORA metrics to guide process improvements.

## Anti-patterns

- **Deploying on a Friday afternoon.** Emergency deployments on Friday increase on-call burden and incident risk. Schedule releases early in the week during business hours.
- **Manual database migrations.** Executing SQL by hand against production databases bypasses review, auditing, and rollback capability. Always use versioned migration scripts.
- **Rebuilding artifacts per environment.** Building a separate binary for each environment introduces variance. Build once, promote the same artifact through dev → staging → prod.
- **Big-bang releases.** Accumulating weeks of changes and deploying them all at once maximizes risk. Deploy small, incremental changes frequently.
- **Ignoring rollback scripts.** Writing a migration without writing the rollback is a gamble. If the rollback script does not exist, it will not work when needed.
- **Redeploying the same artifact tag.** If a deployment fails, do not redeploy the same tag with a fix. Build a new artifact with a new tag and a clear change log.
- **Silently bypassing deployment gates.** Skipping health checks or approval gates because "it's a small change" erodes trust in the pipeline and leads to production incidents.

## Edge Cases

- **Schema migration fails halfway.** The migration script fails after applying half the changes. The application is now in an inconsistent state. The deployment must halt, and the rollback script must be executed immediately. Long-running migrations should be broken into smaller, reversible steps.
- **Blue-green cutover fails health checks.** The new environment fails readiness probes (e.g., cannot connect to the cache). The deployment pipeline must automatically abort the cutover and keep the old environment serving traffic. The failed environment should be preserved for debugging.
- **Canary deployment detects elevated error rates at low traffic.** At 1% traffic, the error rate spikes. The deployment should automatically roll back before more users are impacted. The canary analysis must use statistical significance, not raw counts.
- **Feature flag kill switch fails.** The feature flag system is down or the kill switch does not take effect because the flag was not checked at the right code path. Every feature flag must be tested with the kill switch enabled in staging before production use.
- **Rolling deployment hits an unhealthy node.** A node in the cluster fails during the rolling update, leaving some instances on the old version and some on the new version. The deployment should pause, and the orchestrator should replace the failed node before continuing.
- **Environment-specific configuration drift.** Over time, staging and production configurations diverge (different feature flags, different secret versions, different instance sizes). This causes staging to pass but production to fail. Use IaC and config management to enforce parity.
- **Zero-downtime deployment leaks connections.** The old environment shuts down while some requests are still in flight, causing 502 errors. Implement connection draining with a configurable grace period (e.g., 30 seconds) before shutdown.

## Validation Checklist

- [ ] Deployment strategy is documented and matches the change classification (patch, minor, major, hotfix).
- [ ] Rollback procedure is documented and tested for every deployable component.
- [ ] Database migration scripts include both forward and rollback SQL that have been reviewed and tested.
- [ ] Artifact is built once and promoted through environments; tags are immutable and include the commit SHA.
- [ ] Health checks (readiness, liveness, dependency) are defined and pass in the target environment.
- [ ] CI/CD pipeline passes all stages (lint, test, security scan, build) before deployment begins.
- [ ] Feature flags have kill switches tested in staging.
- [ ] Deployment is scheduled outside peak traffic hours (unless hotfix).
- [ ] Monitoring dashboards and alerts are configured for deployment verification SLIs.
- [ ] Stakeholders are notified of deployment start, success, or rollback.
- [ ] Post-deployment smoke tests pass for critical user journeys.
- [ ] Deployment runbook is up to date and accessible to the on-call engineer.

## Engineering Examples

### Example 1: Setting up a Blue-Green Deployment for a Web Service

A team operates a REST API serving 50,000 requests per minute. They adopt blue-green deployment to eliminate downtime and enable instant rollback. The setup uses AWS Application Load Balancer targeting two Auto Scaling Groups: blue (current) and green (new). The CI/CD pipeline (GitHub Actions) builds a Docker image, tags it with the commit SHA, and pushes it to ECR. Terraform provisions the target groups and listener rules.

The deployment process:
1. The pipeline triggers on merge to `main`.
2. It runs unit tests, integration tests, and container image scanning.
3. The green ASG is launched with the new image. It registers with a health check endpoint (`GET /health`) that validates database connectivity, cache connectivity, and internal service dependencies.
4. The pipeline waits for all green instances to pass health checks (minimum 2 instances healthy for 60 seconds).
5. The ALB listener rule is updated to route 100% of traffic to the green target group.
6. The pipeline enters a 30-minute cooldown observation window. The team monitors the `green_errors` dashboard. If the 5xx rate exceeds 0.1% or p99 latency exceeds 500ms, the pipeline automatically reverts the listener rule back to blue.
7. After the cooldown, the blue ASG is scaled down to zero and the deployment is marked complete.

Key metrics: deployment time (7 minutes elapsed from commit to live traffic), zero downtime observed, rollback activated once during a staging drill (p95 latency spiked to 2s due to a misconfigured cache connection pool).

### Example 2: Implementing Database Migrations in Zero-Downtime Deployments

An e-commerce platform needs to add a `loyalty_points` column to the `users` table and a new `rewards` table. The application reads and writes to this new schema. The team uses the expand-migrate-contract pattern to avoid downtime.

Phase 1 (expand): In release N-1, add the new column as nullable and the new table. The application code at N-1 ignores them. Migration: `ALTER TABLE users ADD COLUMN loyalty_points INTEGER DEFAULT 0; CREATE TABLE rewards (...);`. This runs as a background job with a timeout; if it takes more than 5 minutes, it alerts but does not block the deployment.

Phase 2 (migrate): In release N, deploy the application code that writes to `loyalty_points` and reads from `rewards`. The code writes to both old and new paths temporarily to ensure correctness. A data backfill script populates `loyalty_points` for existing users using historical order data.

Phase 3 (contract): In release N+1, remove the old code paths that accessed the deprecated schema. Drop any old columns that are no longer needed. Migration: `ALTER TABLE users DROP COLUMN old_points;`. This is safe because no running code references the column.

During each release, the deployment order is: apply migration → deploy application → verify → cooldown. The rollback plan for Phase 2 includes a script to stop writing to the new column and revert reads to the old schema.

### Example 3: Using Feature Flags for Safe Rollouts

A team is adding a new checkout flow to a SaaS product. The new flow touches 12 microservices and significantly changes the frontend. Instead of a single deployment, they use feature flags to gradually expose the feature.

Steps:
1. The backend team deploys the new checkout API endpoints (behind the flag `new-checkout` set to `false` in production). The old endpoints remain unchanged.
2. The frontend team deploys the new React checkout component, wrapped in a feature flag check. When `new-checkout` is `false`, the old component renders.
3. In staging, the team sets `new-checkout` to `true` for internal QA and runs integration tests against both old and new flows.
4. In production, the team enables the flag for 1% of users (by user ID hash). They monitor error rates, conversion rates, and support ticket volume for the flagged cohort.
5. After 24 hours with no regression, they increase to 10%, then 25%, then 50%, then 100%. Each step has a minimum observation window.
4. A bug in the new flow causes a 2% drop in conversion at the 25% stage. The team sets `new-checkout` to `false` globally without any code rollback. They fix the bug, run tests, and restart the ramp-up.
6. Once at 100% for 72 hours with stable metrics, the team removes the flag check code from both frontend and backend, cleaning up the dead branches.

The feature flag approach allowed the team to ship the new checkout incrementally and roll back in seconds without any deployment, avoiding a full incident.
