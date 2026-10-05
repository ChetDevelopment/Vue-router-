# CI/CD Pipeline Design

## Purpose

Define and enforce a rigorous approach to designing continuous integration and continuous delivery pipelines that are fast, reliable, secure, and auditable. This skill covers the full lifecycle from code commit to production deployment, including linting, testing, building, artifact management, environment promotion, approval gates, secret injection, caching strategies, and rollback procedures. The goal is to produce pipelines that catch defects early, deploy with confidence, and recover quickly from failures.

## Responsibilities

- Defining pipeline stages with clear entry and exit criteria for each stage (lint, test, build, deploy).
- Implementing parallelization strategies that minimize total pipeline duration without sacrificing reliability.
- Managing build artifacts (binaries, Docker images, npm packages) with versioning, retention policies, and promotion between environments.
- Configuring environment promotion workflows with approval gates, change management integration, and audit logging.
- Injecting secrets securely into pipelines using secrets managers (AWS Secrets Manager, HashiCorp Vault, GitHub Actions Secrets) without exposing them in logs.
- Optimizing pipeline speed through dependency caching, incremental builds, and selective test execution.
- Designing test suites that run at the appropriate stage: lint at commit, unit tests in parallel, integration tests with service dependencies, end-to-end tests post-deploy.
- Implementing rollback pipelines that can revert a deployment in a known-good state within minutes.
- Practicing pipeline as code by defining all pipeline configuration in version-controlled files alongside the application code.
- Monitoring pipeline health: success rate, duration trends, flaky test detection, and queue wait times.

## Decision Process

1. **Map pipeline stages to deployment risk.** Low-risk changes (documentation, config, test-only) can skip costly stages. Use path filters or change-type detection to conditionally execute stages.
2. **Choose the parallelization strategy based on test characteristics.** Partition unit tests by file glob (e.g., `src/**/__tests__/*.test.ts`) across parallel jobs. Keep integration tests in a separate sequential stage that shares a service container.
3. **Select a caching strategy for dependencies.** Cache `node_modules`, `.m2/repository`, `vendor/bundle`, or `~/.cache/pip` using a content-hash key of the lock file. Set up cache restoration at the start and cache saving at the end of the pipeline.
4. **Determine artifact management.** For Docker images, push to a registry with the Git SHA and branch tag. For compiled binaries, upload to a artifact store (S3, Artifactory) with retention of at least 30 days for all builds and indefinite for releases.
5. **Design environment promotion with a branching strategy.** Use trunk-based development (short-lived feature branches, direct commits to main) for CI. Promote through environments by moving the same artifact, not rebuilding.
6. **Configure approval gates at environment boundaries.** Require manual approval for production deployments. Require automated approval (all tests pass, security scan passes, no critical vulnerabilities) for staging.
7. **Design the rollback pipeline.** The rollback pipeline must redeploy the previous known-good artifact (identified by its immutable version) to the affected environment. Must not involve rebuilding code.
8. **Implement secret injection using the CI platform's secrets abstraction.** Never pass secrets as plaintext variables. Use `secrets` context in GitHub Actions, parameter store references in AWS CodePipeline, or vault agent annotations.
9. **Set up pipeline monitoring and alerting.** Track pipeline duration, success rate, and queue time. Alert if success rate drops below 95% or if the pipeline duration exceeds the SLO by 50%.
10. **Define flaky test management.** Track tests that fail intermittently. Quarantine flaky tests automatically by requiring N consecutive passes before they can rejoin the pipeline.

## Inputs

- Source code repository with a CI/CD configuration file (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`).
- Application build specification (Dockerfile, build scripts, dependency manifests).
- Environment definitions (dev, staging, production) with connection strings, endpoints, and configuration.
- Test suite configuration and test execution requirements (databases, services, fixtures).
- Compliance and audit requirements: who can approve, what must be logged, retention periods.
- Deployment topology: single service, microservices, blue-green, canary, or rolling update strategy.

## Outputs

- A pipeline configuration file defining all stages, jobs, steps, and triggers.
- Caching configuration scripts and policies for dependencies and build outputs.
- Approval gate definitions with approver lists, notification channels, and timeout policies.
- Artifact management scripts for upload, download, promotion, and cleanup.
- Rollback runbooks and automated rollback pipeline definitions.
- Pipeline health dashboards showing key metrics (duration, success rate, flaky test count).
- Deployment records with artifact version, environment, timestamp, and approver.

## Rules

1. **The same artifact that passes tests must be the same one deployed to production.** Build once, promote everywhere. Never rebuild for a different environment.
2. **Every pipeline must include a security scanning stage.** Run SAST (Semgrep, CodeQL), dependency scanning (Dependabot, Snyk), and container scanning (Trivy). Fail on critical findings.
3. **Secrets must never appear in pipeline logs, console output, or build artifacts.** Use secret-masking features of the CI platform and audit logs for access.
4. **All pipeline configuration must be version-controlled in the repository.** No manual pipeline configuration in the CI platform's UI.
5. **Pipelines must have a timeout and a max runtime.** Set a global pipeline timeout to prevent runaway jobs from consuming resources. Kill jobs that exceed the timeout.
6. **Every deploy to production must be preceded by an integration test against production-like infrastructure.** Staging must mirror production in configuration, data volume, and service topology.
7. **Rollback must be a first-class pipeline, not an afterthought.** The rollback pipeline must be tested regularly (at least once per quarter) and must complete in under 10 minutes.
8. **Caching must not lead to stale dependencies.** Cache keys must include the lock file hash. Cache must be invalidated when `package-lock.json`, `requirements.txt`, or `go.sum` changes.
9. **Parallel job execution must not exceed the CI platform's concurrency limits.** Configure job matrixes and parallelism to stay within limits and avoid queue wait times.
10. **Pipeline failures must be actionable.** Error messages must include the failing step, the expected behavior, the actual result, and a link to relevant logs.

## Best Practices

1. **Use a pipeline matrix for multi-version or multi-platform testing.** Test on Node.js 18, 20, 21 and on ubuntu-latest and windows-latest using a matrix strategy. Fail only if all platform-version combinations fail.
2. **Implement CI pipeline stage dependencies to maximize feedback speed.** Run linting and unit tests in parallel first (fast feedback), then integration tests (medium feedback), then e2e tests and security scan (slow feedback, but they run while developers move to other work).
3. **Use GitHub Actions composite actions or reusable workflows for shared pipeline logic.** Avoid duplicating the same setup steps (checkout, install dependencies, cache) across 50 workflow files.
4. **Configure deployment strategies per environment.** Dev uses direct replacement; staging uses rolling update; production uses blue-green or canary with traffic shifting. Each strategy has different pipeline requirements.
5. **Deploy database migrations separately from application code.** Run migrations as a pre-deploy step that can be independently verified and rolled back. Never bundle migrations with application deployment.
6. **Use deployment rings for production rollouts.** Start with 1% of traffic, then 10%, then 50%, then 100%. Each ring has a cooldown period and automated smoke tests before proceeding.
7. **Implement approval timeouts.** If an approval is not provided within the configured window (e.g., 4 hours), the pipeline should either auto-reject or escalate to the next level.
8. **Monitor and alert on deployment frequency and change failure rate.** These DORA metrics measure pipeline effectiveness. A low deployment frequency indicates that the pipeline is too slow or too risky.
9. **Use deployment freeze windows automatically.** Configure the pipeline to reject production deployments during freeze periods (end of quarter, major holidays, blackout dates).
10. **Store build cache in a durable, cross-region location.** For Docker builds, use a registry cache (`--cache-from`); for dependency caches, use S3 or a dedicated cache service.

## Anti-patterns

1. **Rebuilding the application for each environment.** If the artifact is rebuilt for staging and rebuilt again for production, the staging-tested artifact is not the same one deployed to production. Defects can slip through.
2. **Hard-coding secrets in pipeline configuration files.** Committing an API key or database password in a YAML file, even in a private repository, is unacceptable. Use the CI platform's secret store.
3. **Running all tests in a single sequential job.** A two-hour pipeline drives developers to skip the pipeline entirely or merge without waiting for results. Parallelize aggressively.
4. **Manual deployment processes that bypass the pipeline.** Allowing developers to SSH into production and manually deploy subverts the entire CI/CD system. Every deployment must go through the pipeline.
5. **Not testing the rollback.** The first time you test rollback should not be during a production incident. Schedule quarterly rollback drills.
6. **Ignoring flaky tests in the pipeline.** A pipeline that fails randomly due to flaky tests erodes developer trust. Track and quarantine flaky tests. Do not let them block deployments.

## Edge Cases

1. **Pipeline failure mid-deployment.** If the pipeline fails after the deploy step starts but before it completes, the environment is in an unknown state. Implement idempotent deployment steps that can be retried. Use deployment orchestration that tracks progress (e.g., CloudFormation stack sets, Helm releases).
2. **Credentials rotation during pipeline execution.** If the pipeline retrieves credentials at the start and they are rotated mid-execution, subsequent steps will fail. Use short-lived credentials or re-authenticate before each credential-using step.
3. **Large monorepo with path-dependent pipeline execution.** A change to `backend/` does not need to run the `frontend/` test suite. Use path filters to execute only relevant pipeline stages. Test the path filter logic with a matrix of change scenarios.
4. **Dependency caching corruption.** A corrupted cache can cause confusing build failures. Implement cache validation: verify the integrity of cached files before using them. If validation fails, fall back to a clean install.
5. **Concurrent deployments to the same environment.** If two production deployments run simultaneously, they can conflict. Implement environment locks: only one deployment pipeline can run against an environment at a time. Queue subsequent deployments.
6. **Pipeline queuing delays during peak hours.** If all developers push at end-of-sprint, pipelines queue for minutes. Use concurrency groups to manage queue depth. Consider adding more CI runners during peak periods.

## Validation Checklist

- [ ] Pipeline configuration is fully defined in version-controlled files, not in the CI platform UI.
- [ ] The same build artifact is used across all environments without rebuilding.
- [ ] Secrets are injected from a secrets manager, not hard-coded in config files.
- [ ] A security scanning stage (SAST, dependency scan, container scan) is included.
- [ ] Caching is configured with cache keys based on lock file hashes.
- [ ] Unit tests run in parallel across multiple jobs.
- [ ] Integration tests run against production-like infrastructure.
- [ ] Environment promotion includes automated verification gates.
- [ ] Production deployment requires manual approval.
- [ ] Rollback pipeline exists and has been tested within the last quarter.
- [ ] Pipeline has a global timeout and per-job timeouts.
- [ ] Deployment strategy (blue-green, rolling, canary) is documented and automated.
- [ ] Database migrations are handled separately from application deployments.
- [ ] Pipeline health metrics (duration, success rate) are monitored and alerted on.
- [ ] Flaky tests are tracked and quarantined, not blocking the pipeline.

## Engineering Examples

### Example 1: CI Pipeline with Parallel Test Execution and Caching

A Node.js TypeScript monorepo with 15 packages, using GitHub Actions.

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - uses: actions/cache@v4
        with:
          path: "**/node_modules"
          key: node-modules-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npm run lint

  unit-tests:
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        package: [core, api, worker, shared]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - uses: actions/cache@v4
        with:
          path: "**/node_modules"
          key: node-modules-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npm run test --workspace=${{ matrix.package }}

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:integration

  build:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

This pipeline completes in under 8 minutes thanks to parallel unit tests across packages, service containers for integration tests, and npm cache that persists across all jobs.

### Example 2: CD Pipeline with Blue-Green Deployment and Rollback

A deployment pipeline using AWS CodeDeploy with blue-green strategy.

Pipeline stages:
1. **Deploy to staging:** Use the artifact from CI to deploy to a staging environment using CodeDeploy with a blue-green strategy.
2. **Automated smoke tests:** Run a series of HTTP health checks, critical path tests, and database connectivity checks against the staging endpoint.
3. **Manual approval:** A Slack notification with a link to the staging environment is sent to the approvers list. The pipeline waits for approval with a 4-hour timeout.
4. **Deploy to production (blue-green):** CodeDeploy creates a new green fleet (same size as the blue fleet), installs the artifact, runs the CodeDeploy validation hooks, and shifts traffic gradually:
   - Route 10% of traffic to green for 5 minutes.
   - If no errors, shift to 50% for 5 minutes.
   - If no errors, shift to 100%.
   - If errors at any point, automatically roll back to blue.
5. **Smoke tests on production:** Run smoke tests against the production green fleet. If smoke tests fail, trigger automatic rollback.
6. **Rollback pipeline:** The rollback pipeline redeploys the previous known-good artifact (e.g., `v1.2.3` instead of `v1.3.0`) to both blue and green fleets, shifts 100% traffic back to the original fleet.

### Example 3: Multi-Environment Promotion Pipeline with Approval Gates

A pipeline promoting a service through four environments: dev → staging → pre-prod → production.

- **Dev:** Automatic on merge to main. Deploys immediately, runs full test suite. If tests fail, alerts the team but does not block the merge.
- **Staging:** Automatic if dev deployment succeeds. Deploys to staging environment, runs integration tests against the full staging service mesh. If tests fail, the pipeline blocks and sends a failure notification.
- **Pre-prod:** Requires manual approval from a lead engineer. Deploys to pre-prod, runs load tests and chaos engineering experiments (e.g., kill a random pod, introduce network latency). Must pass all experiments within SLOs.
- **Production:** Requires manual approval from both a lead engineer and a product manager. Deploys via blue-green with automatic rollback on health check failure. Notifies the on-call engineer 10 minutes before deployment via PagerDuty.
