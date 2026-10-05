# Code Generation Patterns

## Purpose

Establish a deterministic, repeatable system for generating production-grade source code that is consistent with existing codebases, follows team conventions, produces minimal surface area for bugs, and reduces cognitive load on developers. This skill ensures generated code is indistinguishable from hand-written code in style, structure, and quality, and that it covers all operational states (loading, empty, error, success, edge cases) rather than only the happy path.

## Responsibilities

- Reading and analyzing existing code in a repository to infer style conventions, naming patterns, import styles, error handling patterns, and testing approaches before generating any new code.
- Generating type definitions and interfaces first, then function signatures, then implementations, and finally tests — a strict dependency-driven order that prevents cascading type errors.
- Producing stubs for all functions, methods, and components before filling in logic, ensuring the full API surface is visible and agreed upon before implementation begins.
- Generating test cases alongside production code, using the same patterns and frameworks already present in the codebase (Jest, Vitest, Playwright, etc.).
- Creating error handling code for every operation that can fail, including network requests, file I/O, database queries, and user input validation — not deferring error handling.
- Generating all UI states for components: loading (skeleton/spinner), empty (no data message), error (retry/fallback), and success (data display).
- Detecting and preventing code duplication by scanning adjacent files and existing patterns before writing new code.
- Applying code formatting and linting rules automatically after generation to ensure consistency.

## Decision Process

1. Scan the workspace to identify the primary language, framework, and build tools (check `package.json`, `tsconfig.json`, `composer.json`, `Gemfile`, etc.) to determine the technology stack.
2. Read at least three existing source files in the same module or adjacent module to establish coding conventions: import ordering, named vs default exports, semicolons, quote style, indentation, and error handling idioms.
3. Identify existing patterns for the specific concern being addressed — if generating an API endpoint, examine existing controllers/route handlers; if generating a React component, examine existing component files for hook usage patterns and styling approach.
4. Define the data types and interfaces first. Write types in a dedicated types file or adjacent type block before any function signatures, ensuring all domain concepts are captured as explicit types.
5. Generate stub signatures for all functions, classes, or components that need to exist, organized by dependency order (leaf nodes first, consumers last). Write these stubs as exports with JSDoc/TSDoc comments describing expected behavior.
6. Implement the primary happy path logic for each stub, running after all types and stubs are written so the compiler can verify type consistency across the entire module.
7. Add error handling for every operation that can fail: network calls get try/catch with typed error responses, database operations get transaction rollback, user input gets schema validation with message per field.
8. Generate all UI states for each visual component: a loading skeleton, an empty state component, an error boundary or error display, and the main success render. Each state must have a corresponding story or test.
9. Write unit tests for pure functions and integration tests for side-effectful operations, using the same test runner and patterns from existing tests in the codebase.
10. Run the formatter and linter (Prettier, ESLint, ruff, etc.) on the generated output and fix any violations before considering the generation complete.

## Inputs

- User intent description: free-form description of what code needs to be generated, expressed as user goals or feature requirements.
- Existing codebase files: minimum of three representative files from the target module to learn conventions from.
- Schema definitions: database schema, API contract (OpenAPI/GraphQL schema), or type definition file when generating data-access or API layers.
- Existing test files: at least one test file in the same module to match testing style, mock patterns, and assertion style.
- Coding style guide (optional): team-specific `.editorconfig`, `.prettierrc`, `.eslintrc`, or `tsconfig.json` with strictness settings.
- Component library documentation: if generating UI components, the set of available primitives (Button, Input, Modal, etc.) and their props.

## Outputs

- Source code files organized in the same directory structure as the existing codebase, following the same file naming conventions (kebab-case, PascalCase, etc.).
- Type definition files (.d.ts, .graphql, etc.) that export all new types, interfaces, and enums introduced by the generation.
- Test files (.test.ts, .spec.tsx, etc.) with at least one test per public function and one integration test per user-facing feature.
- Stub files (optional intermediate step) showing the full API surface before implementation, suitable for review and agreement.
- Error handling code for every fallible operation, including retry logic, fallback values, and user-facing error messages.
- UI state components: loading skeleton, empty state, error fallback, and success view for each generated component.

## Rules

1. Never generate code without first reading at least three existing files from the same module to learn conventions — generated code must match existing code in style, not be identifiably generated.
2. Always define types and interfaces before any implementation code — never write a function without first typing its parameters and return value.
3. Always generate a stub for every public API surface before filling in any implementation logic — never write implementation for a function that hasn't been declared as a stub.
4. Always generate error handling for every IO operation, user input handler, and external service call — never leave a try/catch or error boundary as a TODO.
5. Always generate all four UI states (loading, empty, error, success) for every user-facing component — never skip states because they seem unlikely.
6. Never duplicate existing code: before generating a utility function, search the codebase for an equivalent function or library that could be reused or extended.
7. Always generate tests that mirror the pattern, structure, and coverage targets of existing tests in the same module — never introduce a new testing style or framework.
8. Always run the linter and formatter on generated code and fix all violations before presenting the output — never deliver code that violates team lint rules.
9. Never generate dead code: every generated export must have at least one consumer within the same feature, either a test or another generated module.
10. Always generate explicit return types for exported functions — never rely on type inference for public API surfaces.

## Best Practices

1. Read `tsconfig.json` strictness settings before generating TypeScript: match the `strict`, `strictNullChecks`, and `noUncheckedIndexedAccess` settings in generated code to avoid cascading type errors.
2. Use the existing dependency injection pattern: if the codebase uses constructor injection, generate with constructor injection; if it uses a service locator, match that pattern.
3. Generate small, focused files (one component per file, one hook per file, one test suite per file) that match the existing file granularity in the project.
4. Generate import paths using the same alias resolution as the existing codebase (`@/components/...`, `~/lib/...`, etc.) rather than relative paths if that is the convention.
5. Generate immutable data patterns: prefer `const`, `readonly`, `ReadonlyArray`, and immutable update patterns (spread, Immer) consistent with existing code.
6. Generate logging statements using the same logger abstraction already in the project (winston, pino, debug, console), at appropriate log levels (info for normal ops, warn for recoverable errors, error for failures).
7. Generate consistent error types: if the project uses a custom `AppError` class or `Result<T,E>` type, use that same type in all generated error handling.
8. Generate page/route components with the same data loading pattern (React Router loaders, Next.js getServerSideProps, Nuxt asyncData) already used in the project.
9. Generate optimistic UI updates alongside rollback logic when the operation involves user-facing mutations that should feel instant.
10. Generate idempotent operations for any mutation endpoint: include request IDs, idempotency keys, or upsert logic to prevent duplicate side effects.

## Anti-patterns

1. Generating an entire file from scratch without reading existing code, resulting in inconsistent style (different quote style, semicolon usage, import ordering) that stands out as machine-generated.
2. Generating only the happy path and leaving TODO comments for error handling, loading states, or edge cases — this creates technical debt and incomplete features.
3. Generating large monolithic files (500+ lines) with multiple components, types, and utilities when the codebase consistently splits into one-file-per-concept.
4. Generating code that relies on libraries not present in the project (e.g., generating Zod validation in a project that uses Joi, or generating Axios calls in a project that uses fetch).
5. Generating duplicate utility functions that already exist elsewhere in the codebase (e.g., generating a `formatDate` function when `date-fns` or a shared `formatDate` utility already exists).
6. Generating code that mutates module-level state (singletons, mutable module variables) when the codebase uses stateless functions and dependency injection.
7. Generating tests that only test the happy path and never test error conditions, empty states, or edge cases — resulting in brittle test coverage.
8. Generating overly defensive code (null checks everywhere when the type system already guarantees non-null) that adds noise without value.

## Edge Cases

1. Empty input sets: when generating a list component, handle the case where the data array is empty by rendering an empty state with a call-to-action, not a blank page.
2. Network failure during code generation: if reading existing files from disk fails, fail the generation with a clear error message rather than generating with guessed conventions.
3. Mixed-language projects: in a monorepo with TypeScript and Python services, detect which language is appropriate for the generated code based on the target directory.
4. Version conflicts: when generating code that depends on a library, check the installed version in `package.json` or `requirements.txt` and generate API-compatible code.
5. Circular dependencies: scan for circular imports when generating interdependent types and functions — split files or use forward declarations to break cycles.
6. Partial generation recovery: if generation fails halfway (e.g., disk full), clean up all files created in the partial generation so the workspace is not left in a broken state.
7. Framework mismatch: when a new file is being added to a directory that mixes two frameworks (e.g., some pages use React Router, some use TanStack Router), detect the convention from the nearest sibling file.
8. Unicode and special characters: when generating code that includes user-provided identifiers (column names, field names), escape or sanitize to prevent syntax errors or injection.

## Validation Checklist

- [ ] Generated code compiles without type errors (check with `tsc --noEmit` or equivalent).
- [ ] Generated code passes all lint rules (run linter with `--fix` and verify zero remaining violations).
- [ ] Generated tests pass (run `npx vitest run --related` or equivalent and confirm green).
- [ ] Code style matches at least three adjacent files (indentation, quotes, semicolons, import order, naming conventions).
- [ ] All exported functions, types, and components have at least one consumer in a test or another generated file.
- [ ] Every IO operation (fetch, DB query, file read, external API call) is wrapped in error handling with a typed error response.
- [ ] Every UI component renders all four states: loading, empty, error, success — each with a corresponding test or story.
- [ ] No duplicate code exists: `grep` for key function names and utility patterns to confirm they don't already exist elsewhere in the codebase.
- [ ] Import paths use the same alias resolution scheme (`@/`, `~/`, `@app/`) as the existing codebase, not relative paths if aliases are standard.
- [ ] Generated file names and directory structure match the project's existing conventions (kebab-case filenames, index.ts barrel exports, etc.).

## Engineering Examples

### Example 1: Generating a CRUD Module from a Database Schema

Given a PostgreSQL `products` table schema, an engineer uses this skill to generate the full CRUD module. First, they read three existing service files (`services/users.ts`, `services/orders.ts`) and learn the codebase uses Prisma, Zod for validation, and a custom `Result<T,E>` type for error handling. They generate types first: `ProductSchema` (Zod), `CreateProductInput`, `UpdateProductInput`, `ProductResponse`. Stubs are generated for `listProducts`, `getProductById`, `createProduct`, `updateProduct`, and `deleteProduct` in `services/products.ts`. Each stub returns `Promise<Result<ProductResponse, AppError>>`. Happy-path implementation follows: Prisma queries with includes for relations. Error handling wraps each query: Prisma `NotFoundError` maps to a 404 `AppError`, unique constraint violations map to 409, and network timeouts are retried once. Tests are generated using the existing test factory pattern (`buildProduct()` factory, mocked Prisma client). The result is a complete, production-ready CRUD module with zero lint errors and full test coverage — generated in under two minutes.

### Example 2: Generating a React Component with All UI States

An engineer needs a `UserProfileCard` component. They read three existing components (`UserAvatar.tsx`, `UserStats.tsx`, `UserBio.tsx`) and learn the project uses Tailwind CSS, React Query, and a shared `Skeleton` primitive. Types are generated first: `UserProfile`, `UserProfileCardProps`. Stubs are created for the component and its sub-components (`ProfileAvatar`, `ProfileInfo`, `ProfileActions`). The happy path renders the user's name, avatar, bio, and action buttons. Loading state: three `Skeleton` elements matching the layout dimensions. Empty state: a "User not found" message with an illustration. Error state: an error message with a "Retry" button that calls `refetch()`. The component uses `useQuery` to fetch data, with error handling through React Query's `isError` and `error` properties. Tests are generated using `@testing-library/react` with mocked query client, covering: successful render, loading skeleton display, error state with retry, and empty/null user data. The component is production-ready with all four states covered.

### Example 3: Generating an API Endpoint with Full Validation and Error Handling

An engineer generates a `POST /api/invitations` endpoint. They read existing route files and find the codebase uses Express with `express-validator` and a centralized error handler middleware. Types are generated first: `InvitationCreatePayload`, `InvitationResponse`. Stubs: `validateInvitation`, `createInvitation`, `sendInvitationEmail`. The validation middleware checks email format, required fields, and a custom validator ensuring the invited user doesn't already belong to the organization. The happy path creates an invitation record, sends an email via the existing mailer service, and returns the invitation. Error handling: validation errors return 400 with field-level messages, duplicate invitation returns 409, email send failure logs a warning but does not roll back the invitation (the email is retried by a background job). A rate limit of 5 invitations per minute per user is enforced using the existing rate limiter middleware. Tests cover: valid creation, missing fields (400), duplicate email (409), invalid email format (400), email service failure (still returns 201 but queues retry). The endpoint is complete with input validation, business logic, error handling, and rate limiting.
