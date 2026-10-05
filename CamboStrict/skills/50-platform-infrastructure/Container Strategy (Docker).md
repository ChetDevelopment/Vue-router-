# Container Strategy (Docker)

## Purpose

Define and enforce a repeatable, secure, and performant approach to building, packaging, distributing, and running containerized applications using Docker. This skill ensures that every container produced by the team is minimal in size, free of vulnerabilities, properly configured for its runtime environment, and follows a consistent pattern that scales across local development, CI pipelines, and production orchestration platforms (Kubernetes, ECS, Nomad).

## Responsibilities

- Selecting and maintaining base image policies (Alpine, distroless, slim variants) for each language runtime and service type.
- Designing multi-stage Dockerfiles that separate build-time dependencies from runtime artifacts.
- Enforcing `.dockerignore` hygiene to prevent cache invalidation and secret leakage.
- Defining health check endpoints and corresponding `HEALTHCHECK` instructions.
- Establishing container restart policies, resource limits (CPU/memory), and graceful shutdown handling.
- Mandating non-root user execution inside containers and eliminating privilege escalation.
- Managing secrets consumption at runtime (mounts, environment variables, secret stores) without baking them into images.
- Implementing image tagging strategies (semver, git SHA, environment) and registry lifecycle policies.
- Standardizing Docker Compose configurations for development parity and production-like local testing.
- Auditing container layers for unnecessary tools, cached package managers, and leftover build artifacts.

## Decision Process

1. **Determine runtime base image tier.** For compiled languages (Go, Rust), prefer `scratch` or `distroless`; for interpreted runtimes (Node.js, Python), prefer `alpine` or `slim` variants. Never default to `full` or `latest` without documented justification.
2. **Evaluate build-time vs. runtime dependencies.** Partition the Dockerfile into at least two stages: a build stage with the full SDK and a runtime stage that copies only the compiled artifact or production dependencies.
3. **Select a specific base image tag.** Pin to a minor version (e.g., `node:20-alpine`) rather than `node:alpine` or `node:latest`. Use automated Dependabot/Renovate to update base images via PRs.
4. **Order Dockerfile instructions for maximum layer caching.** Place rarely-changing instructions (system packages, global tools) first, then dependency manifests (e.g., `package.json`), then source code, then build steps. Each instruction becomes a cacheable layer.
5. **Configure `.dockerignore`.** Exclude `node_modules`, `.git`, `dist`, `*.log`, `*.md`, CI configs, secrets files, and any local environment files. Test the ignore set with `docker build --no-cache` to confirm.
6. **Define resource constraints.** In Docker Compose or orchestrator manifests, set CPU limits, memory limits, and memory reservations. Configure `--memory-reservation` to guide scheduler decisions.
7. **Set the user to non-root.** Add a dedicated system user (e.g., `node`, `appuser`) in the runtime stage and switch via `USER` directive. Ensure the user owns the application directory and any writable paths.
8. **Implement health checks.** Add a `HEALTHCHECK` instruction with an appropriate interval, timeout, retries, and start period. Use an endpoint that exercises application readiness, not a bare ping.
9. **Configure graceful shutdown.** Ensure the application handles `SIGTERM` and `SIGINT` signals. Set `STOPSIGNAL` if the process expects a non-default signal. Provide a `stop_grace_period` in Compose.
10. **Define image tagging and registry rules.** Use a combination of semantic version for releases, short Git SHA for CI artifacts, and environment tags (`staging`, `production`) for deployable images. Implement lifecycle rules to prune tags older than N days.

## Inputs

- Application source code and dependency manifests.
- Base image registry policies from the security team.
- Resource requirements (CPU, memory, disk) from load testing or capacity planning.
- Orchestration platform constraints (Kubernetes pod specs, ECS task definitions).
- Compliance requirements around image scanning, minimal surfaces, and privileged access.
- CI/CD pipeline configuration that triggers image builds and pushes.

## Outputs

- A standardized `Dockerfile` template per language or service archetype.
- A `.dockerignore` file committed to each repository.
- A `docker-compose.yml` file that mirrors production configuration for local development.
- Published container images in a registry with consistent tagging and metadata labels.
- A container audit checklist used during code review and security scanning gates.
- Runtime configuration guides (environment variables, volume mounts, secrets) for operators.

## Rules

1. **Never run containers as root.** Every Dockerfile must include a `USER` directive that switches to a non-privileged user before the `CMD` or `ENTRYPOINT`.
2. **Pin base image tags to a specific version.** Avoid floating tags like `latest`, `alpine`, or `slim` — resolve to `node:20.11.0-alpine3.19`.
3. **Multi-stage builds are mandatory for compiled languages.** The build stage and runtime stage must be distinct, with only runtime artifacts copied to the final stage.
4. **Every image must include a `HEALTHCHECK` instruction.** The health check command must test real application readiness, returning exit code 0 for healthy.
5. **`.dockerignore` must be present in every repository with a Dockerfile.** The file must exclude at minimum `.git`, `node_modules`, `.env`, and CI directories.
6. **Do not install build tools, package managers, or SDKs in the runtime stage.** Use a distroless or scratch base for compiled binaries; for interpreted runtimes, use `npm install --production` or equivalent.
7. **Secrets must never be baked into images.** Use Docker BuildKit `--secret` for build-time secrets and runtime secret mounts or environment variables for production.
8. **Every image must have at least three labels:** `maintainer`, `source` (Git repository URL), and `version` (image version or commit SHA).
9. **Limit layers by combining related `RUN` instructions with `&&` and cleaning up in the same layer.** Each `RUN`, `COPY`, and `ADD` instruction creates a layer.
10. **Container logs must go to stdout/stderr, never to files.** Configure the application logger to write to these streams so the container runtime can collect them.

## Best Practices

1. **Use `COPY --link` for faster builds.** When copying files in a multi-stage build, `COPY --link` copies files without needing the previous layer, improving cache reuse across build invocations.
2. **Leverage Docker BuildKit.** Set `DOCKER_BUILDKIT=1` and use `--cache-from` to pull cached layers from the registry, dramatically speeding up CI builds.
3. **Minimize the number of layers.** Combine `RUN` commands that install system packages into a single instruction, and clean package manager caches in the same layer (`rm -rf /var/cache/apk/*`).
4. **Use `docker-slim` or similar tools for final image minification in security-critical contexts.** These tools automatically strip unnecessary files from the image without modifying the Dockerfile.
5. **Run container image vulnerability scanning.** Integrate tools like Trivy, Grype, or Snyk into the CI pipeline and fail the build on critical or high-severity vulnerabilities.
6. **Implement a consistent entrypoint pattern.** Use a shell entrypoint script only if dynamic initialization is required; otherwise, use the exec form of `ENTRYPOINT`/`CMD` to ensure proper signal handling.
7. **Test the Dockerfile in CI with a `docker build` step that also runs `docker scout` or `docker sbom`.** Verify that no unexpected files or permissions exist in the final image.
8. **Set `--no-cache-dir` for pip and `--no-cache` for apt/apk to keep layers small.** For Alpine, use `apk add --no-cache` to skip the package manager cache entirely.
9. **Use Docker Compose profiles to group related services.** Define `profiles` for optional dependencies (e.g., `monitoring`, `workers`) so they don't start by default in development.
10. **Validate Compose files with `docker compose config` in CI.** This catches YAML errors, missing environment variables, and invalid volume mounts before deployment.

## Anti-patterns

1. **Using a single-stage Dockerfile that includes the full SDK.** This doubles or triples the image size and increases the attack surface by including compilers, headers, and development tools in production.
2. **Running `npm install` without `--production` in the runtime stage.** This installs devDependencies like test frameworks and TypeScript types that are never used at runtime, increasing both size and vulnerability count.
3. **Copying the entire `.git` directory into the image.** This leaks commit history, CI configuration, and potentially secrets. Always add `.git` to `.dockerignore`.
4. **Mounting the Docker socket (`/var/run/docker.sock`) inside a container.** This grants the container unrestricted access to the host Docker daemon and is a significant security risk. Use Docker-in-Docker or a dedicated API endpoint if Docker operations are required.
5. **Hard-coding environment-specific values in the Dockerfile.** Configuration like database URLs, API keys, or feature flags should be injected at runtime through environment variables, never baked in.
6. **Setting `memory: unlimited` or omitting resource limits entirely in production deployments.** This can lead to noisy-neighbor problems, OOM kills, and unpredictable scheduler behavior in orchestrated environments.
7. **Using `ADD` instead of `COPY` when not needed.** The `ADD` instruction has built-in features (tar extraction, URL fetching) that add complexity and potential surprises. Prefer `COPY` for local files.
8. **Running the container as root and installing `sudo`.** This is a double violation: root execution combined with privilege escalation tools. Switch to a non-root user and use capabilities if elevated permissions are needed.

## Edge Cases

1. **Platform-specific base images (ARM vs AMD64).** When building on an Apple Silicon Mac, the image may be built for `linux/arm64` by default, which won't run on `linux/amd64` production clusters. Use `docker build --platform linux/amd64` or set up multi-architecture builds with `docker buildx build --platform linux/amd64,linux/arm64`.
2. **Build-time secrets like private npm tokens.** Using `ARG` for tokens embeds them in the image history unless BuildKit secrets are used. Always use `--secret id=npmrc,src=.npmrc` and mount at build time.
3. **PID 1 and zombie reaping.** When running a non-init process as PID 1, the container won't reap zombie processes. Use `tini` (built into Docker) with `--init` flag or a dedicated init process for services that spawn child processes.
4. **`node_modules` with native bindings.** Native modules compiled for one platform may fail on another. Either compile them inside the build stage with matching architecture flags or use prebuilt binaries via `--platform` matching.
5. **Graceful shutdown timing.** If the application takes longer than the default `stop_grace_period` (10s), the container will be force-killed. Increase the grace period or optimize shutdown logic to complete within the window.
6. **Base image supply chain attacks.** A compromised base image can affect all downstream containers. Pin to specific SHA digests (`alpine@sha256:...`) for production builds and regularly rotate bases.
7. **Overlay filesystem and file permissions.** On some Linux distributions, `COPY` may not preserve file permissions as expected. Explicitly set ownership in the Dockerfile with `COPY --chown=appuser:appuser`.

## Validation Checklist

- [ ] Dockerfile has at least two stages (build and runtime) or a documented exception.
- [ ] Base image tag is pinned to a specific version, not a floating tag.
- [ ] A `USER` directive switches to a non-root user before `CMD`/`ENTRYPOINT`.
- [ ] A `HEALTHCHECK` instruction is present with meaningful check command.
- [ ] `.dockerignore` exists and excludes `.git`, `node_modules`, `.env`, and CI artifacts.
- [ ] `RUN` instructions are combined with `&&` to minimize layers.
- [ ] Package manager caches are cleaned in the same layer they are created.
- [ ] No secrets, tokens, or environment-specific values are hard-coded.
- [ ] Labels (`maintainer`, `source`, `version`) are present in the final stage.
- [ ] Image passes vulnerability scan with no critical or high findings.
- [ ] Resource limits (CPU, memory) are defined in Compose or orchestrator manifests.
- [ ] Application handles `SIGTERM` and shuts down within the grace period.
- [ ] Docker Compose matches production configuration for exposed ports, volumes, and environment variables.
- [ ] Image build succeeds with `docker build --no-cache` on CI.
- [ ] `COPY --link` or equivalent build optimizations are used where applicable.

## Engineering Examples

### Example 1: Multi-stage Dockerfile That Minimizes Production Image Size

A Node.js Express API with TypeScript compilation, native module compilation, and production dependency pruning.

```dockerfile
# Stage 1: Install dependencies including devDependencies for build
FROM node:20.11.0-alpine3.19 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build TypeScript and compile native modules
FROM node:20.11.0-alpine3.19 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --production

# Stage 3: Runtime with only production artifacts
FROM node:20.11.0-alpine3.19 AS runtime
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

This Dockerfile produces a final image of approximately 180 MB (vs. 1.2 GB for a full Node image with dev dependencies). By separating deps and build stages, source code and dev tools are never present in the runtime image.

### Example 2: Optimizing Docker Layer Caching for Faster CI Builds

A Python FastAPI service where layer ordering is tuned to maximize cache reuse across CI runs.

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app

# Layer 1: System dependencies (rarely changes)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Layer 2: Python dependency manifest (changes only on dependency updates)
COPY requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Layer 3: Application source code (changes most frequently)
COPY . .
RUN pip install --no-cache-dir --user .

FROM python:3.12-slim AS runtime
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app
ENV PATH=/root/.local/bin:$PATH
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

In CI, dependency manifests (Layer 2) change far less frequently than source code (Layer 3). Docker's layer caching ensures that layers 1 and 2 are reused from the cache across most builds, reducing average build time from 4 minutes to under 90 seconds.

### Example 3: Container Strategy with Resource Limits and Health Checks

A production Docker Compose configuration for a Go service with proper resource governance.

```yaml
version: "3.9"
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: "512M"
        reservations:
          cpus: "0.25"
          memory: "128M"
    restart: unless-stopped
    stop_grace_period: 30s
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/v1/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

This configuration ensures the service has guaranteed resources (128 MB reserved), a hard limit (512 MB) to prevent OOM on the host, automatic restart on failure, and a health check that integrates with the orchestrator's service discovery. Logging is constrained to prevent disk exhaustion.
