# Environment Management

## Purpose

Define a systematic approach to managing application environments — development, staging, production, and ephemeral preview environments — that ensures parity, prevents configuration drift, secures sensitive data, and enables safe, repeatable deployments. This skill covers environment variable management, `.env` file conventions, secrets per environment, environment-specific configuration validation, infrastructure environments, ephemeral environments for pull requests, and environment promotion strategies.

## Responsibilities

- Defining the environment taxonomy (dev, staging, production, preview, CI) and the purpose of each.
- Ensuring configuration parity across environments by minimizing environment-specific code paths and leveraging feature flags instead.
- Managing environment variables and secrets with clear conventions: naming, scope, validation, and access controls.
- Establishing `.env` file conventions (`.env`, `.env.local`, `.env.production`, `.env.example`) with documented precedence rules.
- Designing environment-specific configuration validation that catches misconfiguration at startup, not at runtime.
- Managing infrastructure environments (Terraform workspaces, CloudFormation stacks, Kubernetes namespaces).
- Setting up ephemeral preview environments for pull requests that auto-provision, deploy, and tear down.
- Implementing environment promotion strategies that promote the same artifact without rebuilding.
- Auditing environment configurations for drift detection and enforcing configuration-as-code.
- Documenting the environment matrix: URLs, access methods, database instances, third-party service connections.

## Decision Process

1. **Define the environment taxonomy.** Start with at least: `development` (local machine), `ci` (pipeline execution), `staging` (pre-production validation), `production` (live). Add `preview` for ephemeral environments if the team makes pull requests.
2. **Determine what varies between environments.** Database connection strings, API keys, feature flags, log levels, endpoint URLs. Everything else (business logic, validation rules, error messages) should be identical.
3. **Decide on environment variable storage.** For local development, use `.env` files. For CI, use the CI platform's secret store. For staging and production, use a secrets manager (AWS Secrets Manager, Vault) with automated rotation. Never use a single source for all environments.
4. **Define `.env` file precedence.** Standard convention: `.env` (defaults), `.env.local` (overrides, git-ignored), `.env.development`, `.env.production` (environment-specific, committed). The most specific file wins. Document the merge order.
5. **Implement configuration validation.** At application startup, validate that every required environment variable is present and correctly formatted. Fail fast with a clear error message listing missing or invalid variables. Never default to a magic value.
6. **Set up environment promotion gates.** Staging must be as close to production as possible. Use the same artifact (Docker image, build output) in both. Use the same database topology, same caching layer, same CDN configuration. Differences must be documented and intentional.
7. **Design ephemeral environment lifecycle.** For each PR, provision a preview environment with a unique subdomain, a fresh database (seeded from production snapshot or schema-only), and the PR's build artifact. Auto-tear-down after PR merge or 24 hours of inactivity.
8. **Implement configuration drift detection.** Periodically (daily or on each deployment) compare the running environment configuration against the configuration-as-code definition. Alert on discrepancies. Use Terraform plan or CloudFormation drift detection.
9. **Secure secrets per environment.** Production secrets must be accessible only by production deployments. Use different secret names or paths per environment (e.g., `myapp/prod/DB_PASSWORD` vs `myapp/staging/DB_PASSWORD`). Audit access to production secrets.
10. **Document the environment matrix.** Maintain a README or wiki page listing each environment, its URL, access method, database endpoint, cache endpoint, and which team members have access. Keep this document in version control and updated with each environment change.

## Inputs

- Application configuration requirements (environment variables, secrets, feature flags).
- Infrastructure topology (networks, subnets, database instances, cache clusters, CDN distributions).
- Security and compliance requirements (encryption at rest, encryption in transit, access logging, audit trails).
- Team workflow (number of developers, frequency of PRs, staging release cadence).
- Regulatory constraints (data residency, PCI DSS, HIPAA — environments must handle PHI/PII appropriately).
- Budget for infrastructure (ephemeral environments cost money; define how many can run concurrently).

## Outputs

- `.env.example` and `.env.*` template files committed to each repository.
- Environment variable validation scripts or libraries (e.g., `envalid` for Node.js, `pydantic-settings` for Python).
- Infrastructure-as-Code definitions for each environment (Terraform workspaces, CloudFormation stacks).
- Ephemeral environment provisioning scripts (GitHub Actions workflows, Terraform PR automation).
- Environment promotion checklist and runbook.
- Configuration drift detection reports and alerting configuration.
- Environment matrix documentation.

## Rules

1. **Never commit `.env` files that contain real secrets.** The `.env.example` file should contain placeholder values. Real `.env` files must be in `.gitignore`.
2. **Production environment must use a secrets manager, not `.env` files.** `.env` files are for local development only. Production secrets must be retrieved from a vault, parameter store, or cloud-specific secrets manager.
3. **Every environment must have a unique set of credentials.** Do not reuse database passwords, API keys, or service tokens across environments. If staging is compromised, production must remain safe.
4. **Feature flags are preferred over environment-specific code branches.** Instead of `if (env === 'production')`, use a feature flag system (LaunchDarkly, Unleash, custom) that can be toggled without deployment.
5. **Environment promotion must use the same artifact.** The exact same Docker image or compiled binary that passed tests in staging must be deployed to production. Never rebuild for a different environment.
6. **Configuration must be validated at startup.** The application must fail to start if required configuration is missing, invalid, or malformed. Log the specific missing variables and exit with a non-zero code.
7. **Ephemeral environments must be destroyed automatically.** Set a TTL (e.g., 24 hours) and a cleanup scheduler. Failing to tear down preview environments wastes cloud resources and can cause security issues.
8. **Environment variables must follow a naming convention.** Use `APP_NAME_SCOPE_PURPOSE` format (e.g., `MYAPP_DB_HOST`, `MYAPP_REDIS_PORT`). Group related variables by prefix. Avoid single-letter variable names.
9. **Changes to staging configuration must follow the same change management process as production.** Staging is a production-like environment; treat it accordingly. Changes go through code review and CI.
10. **Environment configuration must be auditable.** Every change to production configuration must be logged with timestamp, actor, before value (masked for secrets), and after value (masked for secrets).

## Best Practices

1. **Use environment-specific Terraform workspaces or CloudFormation stacks.** This ensures that infrastructure configuration is version-controlled and can be reviewed like application code. Each environment is a separate workspace with its own state.
2. **Implement "infrastructure as code" for environment configuration.** Use tools like `dotenv` loaders, Kubernetes ConfigMaps, or AWS AppConfig to manage configuration outside the application binary.
3. **Mask secrets in logs and error messages.** When logging configuration errors, mask secrets (show only first and last character: `DB_PASSWORD: 'my***rd'`). Never print full secrets to stdout.
4. **Use a "local" environment profile for offline development.** `.env.local` should configure the app to run with mock services, SQLite instead of Postgres, or local Docker containers. This enables development without network access.
5. **Generate `.env` files from a template with automation.** Use a `setup.sh` or `make init` script that copies `.env.example` to `.env` and prompts for any required overrides. This ensures all developers start with the same baseline.
6. **Validate configuration in CI with dry-run mode.** Add a `--validate-config` or `config:validate` script that checks all environment variables are set correctly. Run this in CI for every PR.
7. **Use environment aliases for convenience.** Map `dev` → `development`, `prod` → `production`, `stg` → `staging`. This prevents confusion when developers use different abbreviations.
8. **Document each environment variable in `.env.example`.** Add comments explaining the purpose, expected format, and whether the variable is required or optional. Example: `# The database connection string (required, format: postgresql://user:pass@host:port/db)`.
9. **Tag infrastructure resources with environment name.** Every AWS resource, Kubernetes namespace, and cloud resource must have a `Environment: production` tag. This enables cost allocation, access control, and resource lifecycle management.
10. **Limit access to production environments.** Only SRE and on-call engineers should have direct access to production infrastructure. All changes must go through CI/CD, not through SSH or the cloud console.

## Anti-patterns

1. **Using `if (process.env.NODE_ENV === 'production')` for logic branches.** This creates untestable production-only code paths. Use feature flags that can be toggled in any environment.
2. **Committing `.env.production` to the repository with real values.** Even in a private repository, production credentials should never be committed. Use CI secrets or a vault.
3. **Building environment-specific Docker images.** Building `myapp:staging` and `myapp:production` from different Dockerfiles means staging and production run different code. Build one image, deploy it everywhere.
4. **Manually creating infrastructure per environment through the cloud console.** This leads to configuration drift and unreproducible environments. Always use infrastructure-as-code.
5. **Testing only on production.** If there is no staging environment that mirrors production, the team is forced to test in production. Invest in a staging environment that is as close to production as possible.
6. **Not cleaning up ephemeral environments.** Preview environments left running consume cloud resources and can become security risks. Enforce automatic TTL and cleanup.

## Edge Cases

1. **Environment variable name conflicts with system variables.** Some variable names (e.g., `PATH`, `HOME`, `USER`) are reserved by the operating system. The application's variables must use a namespace prefix to avoid conflicts.
2. **Special characters in environment variable values.** Database passwords containing `$`, `#`, `%`, or `}` can cause parsing issues in shell scripts and `.env` files. Use single quotes in `.env` or URL-encode special characters.
3. **Service-to-service communication across environments.** A staging application must not accidentally connect to a production database. Use separate VPCs or network policies for each environment. Validate the environment name at startup against the database.
4. **Environment variable injection timing.** Environment variables set at build time become baked into the artifact. Variables set at runtime are dynamic. Understand the difference: `process.env.API_URL` at build time is permanently embedded; at runtime, it can be changed by restarting the process.
5. **Ephemeral environment resource exhaustion.** If 20 PRs are open simultaneously, each with a preview environment, cloud costs can spike. Set a maximum number of concurrent preview environments. Reject new PR previews if the limit is reached.
6. **Staging environment with insufficient data.** If the staging database is a fresh schema with no data, performance characteristics and query behavior will differ wildly from production. Use anonymized production snapshots for staging databases.

## Validation Checklist

- [ ] Environment taxonomy is defined and documented (dev, staging, production, preview).
- [ ] `.env.example` exists with placeholders and comments for each variable.
- [ ] Real `.env` files are in `.gitignore` and never committed.
- [ ] Production secrets are managed through a secrets manager, not `.env` files.
- [ ] Application validates required configuration at startup and fails with a clear message.
- [ ] Same artifact is promoted across environments without rebuilding.
- [ ] Feature flags are used instead of environment-specific code branches.
- [ ] Infrastructure-as-Code defines each environment (Terraform workspaces or CloudFormation stacks).
- [ ] Ephemeral environments have automatic TTL and cleanup.
- [ ] Staging environment mirrors production (same topology, same data volume, same services).
- [ ] Environment variables follow a naming convention with prefix.
- [ ] Configuration drift detection is in place for production.
- [ ] Access to production environments is limited and audited.
- [ ] Secrets are masked in logs and error messages.
- [ ] Environment matrix is documented in the repository.

## Engineering Examples

### Example 1: Ephemeral Preview Environments for Each PR

Every pull request automatically provisions a preview environment on a unique subdomain.

Implementation:
1. **GitHub Actions workflow** triggered on `pull_request` (opened, synchronized, reopened) and `pull_request_target` (closed for cleanup).
2. **Terraform workspace per PR:** A workspace named `pr-123` is created with the PR number. The workspace provisions:
   - An ECS Fargate service with the Docker image built from the PR branch.
   - An RDS PostgreSQL instance (or a shared database with isolated schema per PR).
   - A Route 53 subdomain: `pr-123.myapp.preview.company.com`.
   - A CloudFront distribution pointing to the ECS service.
3. **Status check:** The workflow posts the preview URL as a PR comment: "Preview environment available at https://pr-123.myapp.preview.company.com."
4. **Cleanup:** On PR close, a workflow runs `terraform destroy` for the `pr-123` workspace. A nightly cron job destroys any preview environments older than 24 hours.

Cost: Each preview environment costs approximately $0.50/hour. With a limit of 10 concurrent previews and auto-cleanup, the monthly cost is under $1000 for a team of 10-15 developers.

### Example 2: Environment Variable Validation System

A Node.js application using `envalid` to catch misconfiguration at startup.

```typescript
import { cleanEnv, str, port, url, bool, num } from 'envalid';
import dotenv from 'dotenv';

dotenv.config(); // Load .env file for local development

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'staging', 'production', 'test'] }),
  PORT: port({ default: 3000 }),
  DB_HOST: str({ desc: 'PostgreSQL hostname' }),
  DB_PORT: port({ desc: 'PostgreSQL port' }),
  DB_USER: str({ desc: 'PostgreSQL username' }),
  DB_PASSWORD: str({ desc: 'PostgreSQL password' }),
  DB_NAME: str({ desc: 'PostgreSQL database name' }),
  REDIS_URL: url({ desc: 'Redis connection URL' }),
  FEATURE_NEW_CHECKOUT: bool({ default: false, desc: 'Enable new checkout flow' }),
  MAX_RETRY_ATTEMPTS: num({ default: 3, desc: 'Maximum retry attempts for external calls' }),
  API_RATE_LIMIT: num({ default: 100, desc: 'Requests per minute per IP' }),
});

// Usage: type-safe, validated configuration
const db = createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});
```

If the application starts without `DB_HOST` set, it immediately throws: "Missing environment variable: DB_HOST (PostgreSQL hostname)". This catches misconfiguration at deployment time, not when the first query fails at 3 AM.

### Example 3: Environment Promotion from Staging to Production

A service deployed to staging, promoted to production after validation.

Pipeline stages:
1. **Deploy to staging:** The CI artifact (Docker image `myapp:abc1234`) is deployed to the staging ECS service. The deployment uses a rolling update.
2. **Automated validation:** A smoke test suite runs against the staging URL: health checks, critical user journeys, database migrations, and integration tests against staging downstream services.
3. **Manual approval:** A Slack notification is sent to the #deployments channel with a link to the staging environment. A lead engineer reviews the staging health dashboard, error rates, and validation results. If approved, the pipeline continues.
4. **Promote artifact:** The same Docker image (`myapp:abc1234`) is deployed to the production ECS service using a blue-green strategy. A new green task set is created with the new image, health checks pass, and traffic shifts incrementally.
5. **Post-deploy validation:** Smoke tests run against the production green fleet. Error rates are monitored for 10 minutes. If error rates exceed the threshold, the pipeline automatically rolls back to the previous blue fleet.
6. **Rollback:** The rollback pipeline redeploys `myapp:prevSHA` (the previous known-good image) to both blue and green fleets. The process takes under 5 minutes.
