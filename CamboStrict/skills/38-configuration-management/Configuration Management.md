# Configuration Management

## Purpose
Configuration management ensures that all application behavior that varies across environments (development, staging, production) or over time (feature flags, service URLs) is externalized from code into a managed configuration layer. This separation prevents accidental credential leaks, enables safe deployments across environments without code changes, and provides auditability for how an application was configured at any point in time. A well-designed configuration system eliminates the need for environment-specific branches, reduces deployment risk, and makes incidents reproducible by capturing the full configuration state.

## Responsibilities
1. **Environment Separation** — Guarantee that the same build artifact can run in development, staging, and production by wiring in environment-specific configuration at startup.
2. **Secrets Protection** — Ensure database passwords, API keys, and tokens are never stored in source control, never logged, and are accessed via a secure secrets store (e.g., Vault, AWS Secrets Manager, environment variables with restricted access).
3. **Schema Validation** — Validate every configuration value against a defined schema at process startup, failing fast if required keys are missing or types are incorrect.
4. **Hierarchical Overrides** — Implement a layered config model where defaults are overridden by environment files, which are overridden by runtime environment variables, which are overridden by command-line flags or feature-flag toggles.
5. **Feature Flag Execution** — Provide a runtime API for feature flags that supports gradual rollout, targeted audiences (by user ID, region, plan tier), and kill-switch capabilities without requiring a deployment.
6. **Dynamic Reloading** — Support hot-reload of non-secret configuration values (e.g., rate limits, feature flags) without restarting the process, using file watches or external config service polling.
7. **Audit & Immutability** — Once loaded and validated, treat the resolved configuration as immutable for the lifetime of a request. Log any configuration changes (including dynamic reloads) for audit trails.
8. **Default Provisioning** — Ship sensible defaults for development so that a new engineer can run the application with zero configuration beyond what is documented, while production requires explicit overrides.

## Decision Process
1. **Identify the configuration category.** Classify each value as: (a) secret, (b) environment-specific (e.g., database host), (c) runtime tunable (e.g., rate limit), or (d) code constant. Only (a)–(c) belong in configuration; code constants stay in source.
2. **Choose the source for each category.** Secrets go to a secrets manager (Vault, AWS SSM Parameter Store with SecureString). Environment-specific values go to environment variables. Runtime tunables go to a feature-flag service or a config file that supports reloading.
3. **Define a schema.** Use a typed schema definition (JSON Schema, Zod, Pydantic) that declares required keys, allowed types, default values, and validation rules (e.g., port must be 1024–65535, URL must be valid, timeout must be positive).
4. **Establish the override hierarchy.** Document and implement a layered resolution: defaults < environment file (<code>.env</code>) < environment variables < command-line flags < runtime overrides. Each layer partially overrides the previous; lists and maps merge by key.
5. **Implement startup validation.** On application boot, load configuration from all sources, merge according to hierarchy, then validate the merged result against the schema. If validation fails, log the specific missing/incorrect keys and exit with a non-zero code. Do not start with invalid config.
6. **Select a reload strategy.** For dynamic values, choose polling (e.g., every 30 seconds read a file or query a config service) or push (e.g., listen for SIGHUP or a config service webhook). Document the staleness window (e.g., "Rate limits may lag by up to 30 seconds").
7. **Design the access pattern.** Expose config as a typed, frozen object or dependency-injected service. Forbid imports of raw environment variables outside a single config loader module. Every consumer receives already-validated config.
8. **Implement the kill switch.** For every feature flag, ensure there is a hard off-switch (flag set to false overrides any percentage rollout) that can be toggled without a deploy. This must be tested in staging before production use.

## Inputs
- **Application source code** that defines the config schema, default values, and loading logic.
- **Environment files** (<code>.env.development</code>, <code>.env.production</code>) containing non-secret environment-specific overrides. These files may be checked into source control for non-production environments.
- **Environment variables** set by the deployment platform (Kubernetes secrets, Heroku config vars, CI/CD pipeline variables).
- **Secrets manager** keys (Vault paths, AWS SSM parameter names) that the config loader fetches at startup.
- **Feature flag configuration** from a remote service (LaunchDarkly, Unleash) or local toggles file.
- **Command-line arguments** passed at process invocation.

## Outputs
- **Immutable configuration object** — A validated, frozen dictionary/struct accessible throughout the application. Every field is typed; accessing a missing key throws at config-load time, not at runtime.
- **Startup validation report** — Logs that indicate either "Configuration validated successfully" or enumerate every schema violation with the expected type and actual value (masking secrets).
- **Dynamic reload event** — When a runtime value changes, a typed event is emitted so that subscribers (e.g., HTTP middleware checking a rate limit) can update their behavior without restart.
- **Audit log entries** — Each configuration reload is logged with timestamp, the keys that changed (values not logged for secrets), and the initiator (file watch, API call, or signal).
- **Documentation reference** — A generated or maintained table of every configuration key, its type, default, environment variable name, and whether it supports dynamic reload.

## Rules
1. **Never hardcode environment-specific values.** Database hosts, ports, API URLs, and credentials must never appear in source code. The sole exception is localhost defaults for development.
2. **Fail fast at startup, not at runtime.** Validate all configuration before the first HTTP request is accepted. A misconfigured application must refuse to start, not produce silent data corruption.
3. **Mask secrets in all output.** Configuration logging, error messages, and health-check endpoints must redact secret values. Log "DB_PASSWORD=****" not the actual password.
4. **Every configuration key must have a documented default.** A developer must be able to run the application with no configuration beyond what ships in the repository. Production overrides are explicit additions, not required substitutions.
5. **Configuration is read-only after loading.** No application code may write to the configuration object or modify its values. Dynamic reloads create a new immutable snapshot; old references continue to see the previous values.
6. **Feature flags must have a 100% rollback path.** Every flag must support an immediate hard override to "false" that takes effect within the configured reload window. Partial rollouts must be reversible without a deploy.
7. **One config loader per service.** All configuration loading, merging, and validation must be centralized in a single module. Any other module that reads environment variables directly is a bug.
8. **Secrets must never be committed to version control.** Use <code>.gitignore</code> for all <code>.env</code> files that contain secrets. Scan repositories with tools like git-secrets or truffleHog to prevent accidental commits.

## Best Practices
1. **Use typed schemas with semantic validation.** Define not just that a value is a string, but that it is a valid URL, a reachable hostname, or a positive integer. This catches misconfiguration immediately.
2. **Ship separate default files for each environment.** Maintain <code>config/default.ts</code>, <code>config/production.ts</code>, and <code>config/staging.ts</code>. The production file may set higher logging levels or stricter timeouts.
3. **Prefix environment variables with the service name.** Use <code>MYAPP_DB_HOST</code> instead of <code>DB_HOST</code> to avoid collisions when multiple services run in the same process or orchestration namespace.
4. **Support configuration composition.** Allow config files to reference or include other config files. For example, <code>config/staging.ts</code> extends <code>config/default.ts</code> and overrides only the keys that differ.
5. **Define a "config health" endpoint.** Expose <code>GET //-/config</code> that returns the current active configuration (with secrets masked). This is invaluable for debugging production incidents.
6. **Version your configuration schema.** When you add, remove, or rename a config key, treat it as a breaking change and communicate it in changelogs. Provide a migration path for old keys with deprecation warnings.
7. **Test configuration loading in CI.** Write a test that loads the production configuration schema against a mock environment and asserts that validation either passes or produces comprehensible errors. This catches schema bugs before deploy.
8. **Limit dynamic reload sources.** Prefer a single source of truth for runtime config (e.g., a feature-flag service). Multiple competing dynamic sources (file watcher + env var override on restart) lead to confusion about which value is active.

## Anti-patterns
1. **Config as constants file.** Defining <code>config.ts</code> that exports literal values (<code>export const DB_HOST = 'localhost'</code>) and then changing it per environment by editing the file. This guarantees environment-specific branches or accidental commits of staging config to production.
2. **Magic environment variable access.** Calling <code>process.env.DB_PASSWORD</code> directly in a database connection factory. This bypasses validation, defaulting, and masking. If the variable is missing, the error surfaces only when a connection fails, not at startup.
3. **Silent fallbacks.** Using <code>process.env.FEATURE_X || true</code> so that a missing env var silently enables a feature. Every missing required key must produce a startup error, not an implicit default that may be wrong.
4. **Merge-by-replacement for complex values.** When overriding a list or map, replacing the entire value instead of merging by key. For example, an environment variable that sets <code>ALLOWED_ORIGINS=["https://app.com"]</code> should merge with, not replace, the default list of origins for localhost.
5. **Storing secrets in environment files committed to git.** Checking in <code>.env.production</code> with real credentials, even if the repository is private. Secrets must be injected by the deployment platform, not stored in version control.
6. **Using the same config key for multiple purposes.** A single key like <code>API_TIMEOUT</code> that controls both HTTP client timeout and database query timeout. These are semantically different and must have separate keys with separate validation ranges.
7. **Dynamic reload without atomicity.** Swapping configuration values one field at a time without a lock or snapshot, so that a request sees a partially updated config. Always publish a complete new snapshot atomically.

## Edge Cases
1. **Special characters in environment variable values.** Database passwords containing <code>$</code>, <code>&</code>, <code>#</code>, or whitespace must be properly escaped or base64-encoded. The config loader must handle decoding transparently.
2. **Configuration that changes between load and use.** If a dynamic reload occurs after a request reads config value A but before it reads value B, the request may see an inconsistent pair. Use per-request snapshots or copy-on-read for related values.
3. **Empty strings vs. unset values.** An env var set to <code>""</code> is semantically different from an unset env var. The schema must differentiate between "not provided" and "explicitly empty" — especially for feature-flag toggles and allowed-origins lists.
4. **Circular references in config composition.** If <code>config/staging.ts</code> imports <code>config/production.ts</code> which imports <code>config/staging.ts</code>, the loader must detect and reject the cycle with a clear error message.
5. **File encoding mismatches.** Config files saved as UTF-8 with BOM or UTF-16 may cause parsing failures. Specify and enforce UTF-8 without BOM for all configuration files.
6. **Secrets rotation while the application is running.** If a database password is rotated in Vault, the config loader must either support dynamic secret refresh or the application must be gracefully restarted. A mid-rotation state where old connections work but new connections fail must be handled transparently.
7. **Configuration keys with dots or special characters.** Environment variable names often cannot contain dots (e.g., <code>myapp.database.host</code>). Provide a mapping convention (double-underscore: <code>MYAPP__DATABASE__HOST</code> maps to <code>myapp.database.host</code>).

## Validation Checklist
- [ ] Every configuration key has a typed schema definition with a default value.
- [ ] No secrets exist in any file committed to version control.
- [ ] Application fails to start (exit code != 0) when any required config key is missing.
- [ ] Error messages for missing configuration specify the exact key name and expected type, without revealing secrets.
- [ ] Feature flags have a documented hard off-switch that works without a code deploy.
- [ ] Dynamic reload produces an audit log entry with changed keys and timestamp.
- [ ] Configuration object is frozen/immutable after loading; any code attempting mutation throws.
- [ ] A single config loader module exists; no other module reads environment variables directly.
- [ ] Secrets are masked in all logs, health endpoints, and error reports.
- [ ] All environment variable names are prefixed with the service name to avoid collisions.
- [ ] Tests exist that validate config loading against a known-good environment and against a deliberately broken environment.
- [ ] Documentation exists listing every configuration key with its type, default, environment variable name, and reloadability.

## Engineering Examples

### Example 1: Designing a Configuration System with Environment Overrides

A Node.js payment-processing service needs to connect to a database, a third-party payment gateway, and a message queue. The team deploys to development (localhost), staging (shared cluster), and production (multi-region Kubernetes).

**Approach:** Define a schema using Zod in <code>src/config/schema.ts</code> with typed defaults for every key. Create three environment-specific files: <code>config/development.ts</code>, <code>config/staging.ts</code>, <code>config/production.ts</code> that each export partial overrides. The loader in <code>src/config/loader.ts</code> resolves the environment from <code>NODE_ENV</code>, loads the corresponding file, merges it with the defaults, then reads environment variables with prefix <code>PAYMENT_</code> — any env var that matches a schema key overrides the file value. Finally, the merged config is validated against the schema. On validation failure, the loader prints each error with the key path and exits.

**Result:** A developer runs the service locally with zero configuration — the development defaults point to localhost. CI/CD sets <code>NODE_ENV=staging</code> or <code>NODE_ENV=production</code> and injects secrets as environment variables. The same Docker image runs in all three environments. No code changes are needed between deploys.

### Example 2: Securely Managing Database Credentials Across Environments

A Django application uses PostgreSQL with different credentials per environment. The team previously stored credentials in a shared <code>.env</code> file committed to a private repository.

**Approach:** Replace the committed <code>.env</code> file with a startup hook that reads from HashiCorp Vault. The application's service account (Kubernetes pod identity) authenticates to Vault. On startup, the config loader retrieves <code>secret/data/payment-db/{environment}</code> which contains <code>username</code>, <code>password</code>, <code>host</code>, and <code>port</code>. These values are injected into the config object and used to build the Django database connection string. The secrets are never written to disk. Logging is configured to redact the <code>password</code> and <code>username</code> fields from the connection string if it is ever logged.

**Result:** Database credentials are never stored in the repository. Rotation is handled by updating the Vault secret; the application picks up the new credentials on restart (or via a SIGHUP-triggered reload). If Vault is unreachable at startup, the application fails with a clear error: "Unable to fetch database credentials from Vault."

### Example 3: Implementing Feature Flags with Dynamic Config

A SaaS application wants to gradually roll out a redesigned checkout flow. The rollout must be controllable by user ID percentage, region, and subscription tier. The team also needs a kill switch that disables the feature for all users within 30 seconds.

**Approach:** Integrate LaunchDarkly as the feature-flag service. The config loader initializes a LaunchDarkly client at startup with an environment-specific SDK key (from Vault). The checkout controller checks the flag via the LaunchDarkly client: <code>client.variation("new-checkout", userContext, false)</code>. The user context includes <code>userId</code>, <code>region</code>, and <code>plan</code>. LaunchDarkly's UI allows the product manager to set percentage rollouts, add targeting rules by region, and — critically — set a hard off-switch that overrides all rules. The application subscribes to flag change events to log when the flag toggles.

**Result:** The team can start with a 1% rollout to internal testers (targeted by email domain), ramp to 10% of free-tier users in US, then 50%, then 100%. When a bug is discovered in the new checkout, the kill switch is flipped in LaunchDarkly and within 30 seconds all traffic reverts to the old checkout. No deployment, no config change PR, no restart.
