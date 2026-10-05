# Build Systems & Tooling

## Purpose

Establish a disciplined strategy for selecting, configuring, and optimizing build tools and bundlers for frontend and full-stack applications. This skill covers the decision process for choosing between Webpack, Vite, esbuild, Turbopack, and other build systems, along with techniques for tree shaking, code splitting, bundle analysis, incremental builds, caching, TypeScript compilation strategies, and monorepo build orchestration with Turborepo or Nx.

## Responsibilities

- Selecting the appropriate build tool for the project's scale, language requirements, and performance needs.
- Configuring module bundlers to optimize output size through tree shaking, dead code elimination, and code splitting.
- Setting up bundle analysis visualizations (webpack-bundle-analyzer, vite-bundle-visualizer) to identify oversized dependencies and duplication.
- Implementing incremental builds and persistent caching to reduce development iteration time.
- Configuring TypeScript compilation strategy (isolatedModules, project references, incremental mode, path aliases).
- Managing monorepo build orchestration with dependency graph awareness, caching, and parallel task execution.
- Configuring source maps for debugging in development and error tracking in production.
- Ensuring build reproducibility by locking tool versions and using lockfiles.
- Maintaining build configuration files that are readable, commented (where necessary), and easy to modify.

## Decision Process

1. **Assess project requirements.** Single-page application? Multi-page? Library? Monorepo? The answer determines whether a bundler is needed at all (libraries may only require TypeScript compilation) and which bundler is appropriate.
2. **Choose the primary build tool.** For new projects, default to Vite (esbuild for dev, Rollup for production) for web apps. Use Webpack only when deep customization is needed (custom loaders, specific plugin ecosystem). Use esbuild directly for simple bundling or library builds with minimal configuration.
3. **Evaluate dev server needs.** Vite's native ESM-based dev server provides sub-second HMR for most projects. If the application has >1000 modules and HMR is slow, investigate the cause (unnecessary re-exports, missing `optimizeDeps` entries) before switching tools.
4. **Design code splitting strategy.** Identify routes and components that can be lazy-loaded. Configure dynamic imports with `React.lazy`, Vue's `defineAsyncComponent`, or manual dynamic `import()`. Set chunk naming conventions for debuggability.
5. **Configure tree shaking.** Ensure all imports are static (not dynamic `require()`). Use `sideEffects: false` in package.json for library packages. Avoid barrel files (`index.ts` that re-export everything) which defeat tree shaking.
6. **Set up bundle analysis.** Run bundle analysis in CI as part of the build step. Set thresholds for total bundle size and per-chunk size. Fail the build if thresholds are exceeded.
7. **Configure TypeScript compilation.** Use `isolatedModules: true` so each file can be transpiled independently (required by esbuild and Babel). Enable `incremental: true` and `tsBuildInfoFile` to speed up subsequent `tsc --noEmit` type checks.
8. **Set up monorepo build orchestration.** If using a monorepo, choose Turborepo for task orchestration or Nx for full project management. Configure dependency graph, caching rules, and remote caching for distributed teams.
9. **Optimize CI build performance.** Use persistent build caches (local `.turbo`, `node_modules/.cache/webpack`, `.vite/cache`) that are saved and restored across CI runs. Use remote caching for monorepo builds.
10. **Configure source maps for each environment.** Use `eval-source-map` or `inline-source-map` in development for fast rebuilds. Use `hidden-source-map` in production to avoid exposing source in browser dev tools while enabling error monitoring.

## Inputs

- Project language and framework (React, Vue, Angular, Svelte, Node.js library).
- Application architecture (SPA, MPA, micro-frontend, monorepo).
- Performance budget (total bundle size, time-to-interactive, chunk size limits).
- Existing build configuration if migrating from an older tool.
- CI/CD platform capabilities (cache persistence, runner storage, concurrent job limits).
- Team size and development workflow (number of developers, branch frequency).

## Outputs

- Build configuration files (vite.config.ts, webpack.config.ts, tsconfig.json, .eslintrc).
- Code splitting documentation with route and component boundaries.
- Bundle analysis reports and size budgets with enforcement in CI.
- Caching configuration for local development and CI.
- TypeScript compilation configuration with project references and incremental mode.
- Monorepo task orchestration configuration (turbo.json, nx.json).
- Build and release scripts (package.json scripts, CI pipeline build steps).

## Rules

1. **Never use `require()` for code that should be tree-shaken.** Tree shaking only works with ES module static imports (`import { x } from 'y'`). CommonJS `require()` imports are included in full.
2. **Avoid barrel files (`index.ts` that re-export all modules).** Barrel files prevent tree shaking because the bundler cannot determine which exports are actually used. Import directly from the module file.
3. **All runtime dependencies must be explicit in `package.json`.** Do not rely on transitive dependencies. If a library is imported directly in source code, it must be a direct dependency.
4. **The production build must produce optimized output.** Development-specific code (console.logs, debugger statements, development-only imports) must be stripped. Use `process.env.NODE_ENV` replacement and dead code elimination.
5. **Source maps must not expose internal source code in production.** Use `hidden-source-map` which generates source maps for error monitoring but does not serve them to browsers. Alternatively, upload source maps to the error monitoring service and delete them from the server.
6. **Build output must be deterministic.** Two builds from the same source at the same version must produce identical output. This ensures reproducible builds and enables content-hash-based caching.
7. **Keep configuration files simple and explicit.** Avoid complex webpack plugins that are poorly maintained. Prefer first-party features of Vite or esbuild over third-party plugins.
8. **Lock Node.js and npm/pnpm/yarn versions.** Use `.nvmrc` or `engines` in package.json to pin the Node.js version. Use lockfiles for package managers.
9. **Use environment variables for build-time configuration only.** Runtime configuration should be injected at page load, not at build time. Build-time env vars are baked into the bundle.
10. **Report bundle size changes in PRs.** Use tools like `bundlesize`, `size-limit`, or `compressed-size-action` to post bundle size diffs on pull requests.

## Best Practices

1. **Use `optimizeDeps` in Vite to pre-bundle dependencies that are slow to process.** This converts CommonJS dependencies to ESM and pre-bundles them, improving cold dev server startup time.
2. **Configure chunk splitting with `splitChunks` for cache optimization.** Separate vendor chunks (node_modules), shared UI components, and route chunks so that changes to application code don't invalidate vendor caches.
3. **Use `import.meta.glob` or `require.context` sparingly.** These load all matching modules eagerly unless paired with lazy-loading patterns. Prefer explicit imports.
4. **Run `tsc --noEmit` as part of the build validation.** While esbuild/Vite handle transpilation, type checking requires `tsc`. Run it in a separate step or use `vue-tsc` for Vue projects.
5. **Use persistent caching with `turbo` or `nx` for monorepo development.** These tools cache task outputs based on file content hashes, skipping tasks whose inputs have not changed.
6. **Profile bundle with `vite-bundle-visualizer` or `webpack-bundle-analyzer` before each release.** Identify dependencies that account for >5% of the bundle and evaluate if they can be replaced or externally loaded.
7. **Use dynamic imports with prefetch hints for critical lazy-loaded routes.** `import(/* webpackPrefetch: true */ './HeavyComponent')` tells the browser to fetch the chunk during idle time.
8. **Set up `speed-measurement-webpack-plugin` or Vite's built-in `--profile` to identify slow plugins or loaders.** If one plugin dominates build time, look for alternatives or disable it for development.
9. **Configure content-based file hashing.** Use `[contenthash]` for output filenames so that unchanged files keep their cache-busting hash. This enables long-term caching by CDNs and browsers.
10. **Test production builds locally before deploying.** Run `vite build && vite preview` or `webpack --mode production && serve dist` to verify that the production build behaves correctly.

## Anti-patterns

1. **Single massive bundle with no code splitting.** Shipping a 3 MB JavaScript bundle increases time-to-interactive by seconds on mobile networks. Split by route and by visibility (above/below the fold).
2. **Using a bundler when only TypeScript compilation is needed.** For a Node.js library, the Node.js runtime handles ESM natively. Using Webpack to bundle a library adds needless complexity and breaks tree-shaking for consumers.
3. **Barrel files everywhere.** Re-exporting entire modules from an `index.ts` barrel file defeats tree shaking. Every import from a barrel pulls in all re-exports, even if only one is used.
4. **Checking `dist/` into version control.** The build output should be generated by CI/CD or by the consumer's build system. Checking it in causes merge conflicts, wasted repository size, and confusion about the source of truth.
5. **Overriding Vite's default Rollup configuration unnecessarily.** Vite's defaults are well-tuned for most projects. Adding complex Rollup plugins to achieve the same effect as a Vite plugin or a simple configuration change adds maintenance burden.
6. **Using `require.context` or `import.meta.glob` for all imports.** These features are convenient but load all modules in the directory, defeating incremental loading and tree shaking.
7. **Skipping bundle analysis before production releases.** Without bundle analysis, a newly added dependency can silently increase the bundle by 200 KB without anyone noticing until the Lighthouse report drops.

## Edge Cases

1. **Dynamic imports with variables.** `import(pathVariable)` works but prevents the bundler from predicting the chunk contents, potentially generating hundreds of tiny chunks. Map known dynamic paths to explicit imports.
2. **Circular dependencies.** ES modules allow circular imports at runtime, but they can cause unexpected `undefined` values. Use tools like `dpdm` or `circular-dependency-plugin` to detect and break circular dependencies.
3. **Environment variable injection at build time.** If `process.env.API_URL` is replaced at build time, the same build cannot be deployed to multiple environments with different API URLs. Use runtime injection or a config endpoint.
4. **Monorepo package dependencies across build systems.** If `packages/shared` uses esbuild and `apps/web` uses Vite, the build artifacts must be compatible. Ensure consistent module format (ESM) across the monorepo.
5. **Large vendor bundles from a single dependency.** A dependency like `moment` or `lodash` can add 500 KB to the bundle. Replace with modern alternatives (native date APIs, individual lodash functions) or externalize it via CDN.
6. **CSS extraction in production.** Vite extracts CSS to separate files by default, but Webpack requires `MiniCssExtractPlugin`. Ensure CSS is not included in JavaScript bundles to avoid flash of unstyled content (FOUC).

## Validation Checklist

- [ ] Build tool is appropriately chosen for the project's needs (Vite for web apps, esbuild for libraries, Webpack only if necessary).
- [ ] Code splitting is configured at route boundaries.
- [ ] Dynamic imports are used for lazy-loaded components.
- [ ] Barrel files (`index.ts` re-exports) are not used in application code.
- [ ] Bundle analysis runs in CI and has size thresholds.
- [ ] Source maps are configured correctly per environment.
- [ ] Tree shaking is verified: unused exports are not included in the production bundle.
- [ ] Chunk splitting separates vendor, shared, and application code.
- [ ] Build caches are configured for both local development and CI.
- [ ] `isolatedModules: true` is set in tsconfig for compatibility with esbuild/Vite.
- [ ] Build is deterministic: same input produces same output.
- [ ] Production build does not include development-only code.
- [ ] Bundle size is reported on PRs.
- [ ] Persistent caching is configured for monorepo builds (Turborepo/Nx).
- [ ] Build completes within the CI pipeline's time budget.

## Engineering Examples

### Example 1: Code Splitting for a Large React Application

A React application with 40 routes, a shared UI component library, and several heavy visualization libraries (D3, Chart.js).

Strategy:
1. **Route-based splitting:** Each route is a dynamic import:
   ```typescript
   const Dashboard = lazy(() => import('./routes/Dashboard'));
   const Reports = lazy(() => import('./routes/Reports'));
   const Analytics = lazy(() => import('./routes/Analytics'));
   ```
2. **Library extraction:** D3 and Chart.js are extracted into a separate `vendor-visualization` chunk because they change rarely and are only used on three routes.
3. **Shared component chunk:** The UI library (buttons, modals, forms) is split into a `shared-ui` chunk, loaded on first route that requires any shared component, then cached for all subsequent routes.
4. **Vite configuration:**
   ```typescript
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'vendor-viz': ['d3', 'chart.js'],
           'vendor-react': ['react', 'react-dom', 'react-router-dom'],
           'shared-ui': ['@company/ui'],
         },
       },
     },
   }
   ```

Result: Initial load is 120 KB (down from 1.2 MB). Subsequent route changes load 30-80 KB chunks. Lighthouse performance score improved from 45 to 87.

### Example 2: Optimizing Build Times with Incremental Builds and Caching

A monorepo with 20 packages, totaling 1000+ TypeScript files, where full builds took 12 minutes.

Optimizations applied:
1. **TypeScript incremental mode:** `incremental: true` and `tsBuildInfoFile: ".tsbuildinfo"` in root tsconfig.json. This reduces `tsc --noEmit` time from 90s to 15s on subsequent runs.
2. **Vite's persistent cache:** `.vite/cache` is persisted across CI runs using GitHub Actions caching. Cold Vite build: 120s. Cached Vite build: 35s.
3. **Turborepo task orchestration:** Each package has `dependsOn` defined in `turbo.json`:
   ```json
   {
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "inputs": ["src/**", "tsconfig.json", "package.json"],
         "outputs": ["dist/**"]
       },
       "test": {
         "dependsOn": ["build"],
         "inputs": ["src/**", "test/**"]
       }
     }
   }
   ```
4. **Remote caching:** Turborepo remote cache in S3 shares build outputs across team members and CI runners.

Result: Full CI pipeline from 12 minutes to 2.5 minutes. Most PRs take under 90 seconds if few packages changed.

### Example 3: Monorepo Build System with Turborepo and Nx

A monorepo containing 3 applications (admin portal, customer portal, public API) and 15 shared packages.

Architecture:
- **Turborepo** handles task scheduling, caching, and parallelization.
- **Build for each package:** Vite for web apps, esbuild for Node.js packages, tsc for type declaration generation.
- **Dependency graph:** Turborepo automatically determines build order. If `@company/shared-types` changes, it rebuilds `@company/shared-types` first, then all applications that depend on it.
- **Parallel execution:** With 8 CPU cores, Turborepo runs up to 8 independent tasks in parallel.
- **Cache hits on CI:** 70% of tasks skip execution because their inputs haven't changed. Average CI build time is 3 minutes even though there are 30 packages to potentially build.
