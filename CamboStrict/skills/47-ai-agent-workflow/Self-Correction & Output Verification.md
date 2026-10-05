# Self-Correction & Output Verification

## Purpose

Define a systematic methodology for AI agents to verify the correctness, consistency, and completeness of their own outputs before presenting them. This skill prevents errors from reaching users by catching hallucinations, logic errors, missing edge cases, pattern violations, and incorrect assumptions at the point of generation rather than after deployment.

## Responsibilities

- Reviewing generated code for syntactic correctness, logical consistency, and semantic completeness
- Checking generated output against the original requirements and constraints
- Validating assumptions made during generation against known facts about the codebase
- Mentally executing generated code with representative inputs to verify behavior
- Identifying hallucinated APIs, methods, or library features that do not exist
- Verifying that edge cases (null, empty, error states, boundary conditions) are handled
- Cross-referencing generated code with existing code patterns for style and convention consistency
- Checking for resource leaks, race conditions, and security vulnerabilities
- Verifying that generated tests actually test what they claim to test
- Ensuring generated output meets the specified output format and structure
- Documenting self-corrections made and the rationale for future reference

## Decision Process

1. **Pause before presenting** — After generating output, do NOT immediately present it. Take a verification step. Even a 2-second pause catches many obvious errors.
2. **Re-read the original requirements** — Restate the goal and all constraints from memory before checking the output. If you cannot recall all constraints, the output likely misses some.
3. **Check for requirement coverage** — Mentally map each requirement to a corresponding element in the output. Flag any requirement without a corresponding output element.
4. **Trace code execution mentally** — Pick 2-3 representative inputs: normal case, edge case, error case. Walk through the generated code step by step with each input. Note any divergence from expected behavior.
5. **Verify all symbols exist** — Check that every function name, class name, variable name, import, and type reference exists either in the generated code or in the existing codebase. Flag any symbol that cannot be resolved.
6. **Check for hallucinated APIs** — For any API call or library method: confirm it exists in the documented API of that library. If unsure, flag it for verification rather than assuming it exists.
7. **Review error handling paths** — Check every function that can fail (network call, file I/O, parsing, validation). Verify there is an explicit error handling path. Flag functions that assume success.
8. **Verify edge case coverage** — For each function: what happens with null input, empty collection, negative numbers, maximum values, concurrent calls, missing dependencies? Verify each case is handled.
9. **Cross-reference with project patterns** — Compare the generated code against 2-3 existing files that do similar things. Check: export style (named vs default), error handling pattern (throw vs return Result), async pattern (Promise vs callback), naming convention, file structure.
10. **Validate output format** — Check that the output matches the specified format: correct file path, correct function signature, correct import/export statements, correct test framework usage.
11. **Run the generated tests mentally** — For any generated test code, trace through the test logic: is the assertion correct? Does the test setup match the expected state? Does the test actually fail when the behavior is broken?
12. **Check for security and resource issues** — Look for: SQL injection (string concatenation in queries), XSS (unescaped user input in output), memory leaks (unreleased connections/timeouts), race conditions (shared mutable state without synchronization).
13. **Document corrections** — If any issues are found, document: what was wrong, why it was wrong, and what the correction is. If no issues, note "Self-verification passed."
14. **Decide confidence level** — Based on the verification, assign a confidence level: HIGH (all checks passed, fully verified), MEDIUM (minor assumptions made, needs review), LOW (significant assumptions or untested paths, needs thorough review).

## Inputs

- Generated output (code, analysis, plan, documentation)
- Original goal and requirements
- Known constraints and scope boundaries
- Existing codebase files for pattern reference
- Project conventions and style guides
- Error messages or test output (for iterative correction)
- Assumptions log from generation phase

## Outputs

- Self-verified output with correction annotations (if issues found)
- Correction log: original issue → correction → rationale
- Confidence level assessment (HIGH/MEDIUM/LOW)
- List of unverifiable assumptions that need human review
- Requirement coverage matrix (requirement → output element)
- Edge case verification results per function
- Pattern compliance check results

## Rules

1. Verification must be performed before any output is presented to the user. No exceptions for "obviously correct" output.
2. Every generated function must be mentally executed with at least one normal input and one edge case input before being accepted.
3. Requirements coverage is mandatory: every explicit requirement must map to at least one element in the output. If a requirement is not addressed, note it as a gap.
4. Hallucinated API check is mandatory: any library method or API endpoint that the agent generates must be verified against known documentation or existing usage in the codebase.
5. Error handling must be present for every operation that can fail: network requests, file operations, database queries, user input parsing, type conversions.
6. Generated code must match the existing project's patterns within 90% similarity. The remaining 10% requires an explicit justification in the correction log.
7. If the confidence level is LOW, the agent must explicitly state which assumptions need human verification before the output can be used.
8. Self-corrections must be logged with: the original issue, the corrected version, and the reasoning. This log is used for reflection and improvement.
9. When verifying tests, confirm that each test would fail if the corresponding behavior is broken. A test that passes with broken code is a bad test and must be flagged.
10. Resource leaks must be explicitly checked: database connections closed, file handles released, timeouts cleared, event listeners removed.
11. If the verification reveals an issue that requires changing the approach, the agent must not patch it inline but must regenerate from the correct approach.
12. The verification step must not modify the generated output. Corrections should be noted separately, and the output should be regenerated with corrections applied.

## Best Practices

- Create a verification checklist at the start of each task based on the task type: code generation gets the full checklist, while analysis only needs coverage and consistency checks.
- For code generation, always verify the imports: generate a mental import tree and confirm every import resolves. Missing imports are the most common error.
- Use the "rubber duck" method: mentally explain each function's purpose and behavior as if to another developer. Gaps in explanation often reveal bugs.
- For API integrations, verify the exact method signature (parameters, return type, required headers) against the library's documented API or existing usage in the codebase.
- When generating error messages, verify they are user-actionable: they should tell the user what went wrong and what to do about it, not just that something went wrong.
- For refactoring tasks, verify backwards compatibility: does the new code produce the same outputs for the same inputs as the old code? Run this mentally for at least 3 scenarios.
- When generating migrations, verify reversibility: does the `down` migration exactly undo the `up` migration? Test this mentally.
- For generated types and interfaces, verify they are consistent: if an interface defines `name: string`, all usages should pass `string` to that field.
- Check naming consistency: variables, functions, and files should follow the project's naming convention (camelCase, PascalCase, kebab-case, etc.) consistently. If the project uses `createUser` and the generated code uses `makeUser`, flag it.
- After verification, review the correction log for patterns: if you repeatedly miss the same type of issue, add it to your personal checklist for future tasks.

## Anti-patterns

- **Confirmation bias verification** — Skimming the output looking for confirmation that it's correct rather than actively looking for errors. Verification must assume the output is wrong until proven otherwise.
- **Only verifying syntax, not semantics** — Checking that the code compiles/parses but not checking that the logic produces correct results. A function can be syntactically perfect and logically wrong.
- **Skipping mental execution** — Assuming "the code looks right" without tracing through it with actual inputs. Mental execution catches the majority of logic errors.
- **Ignoring edge cases** — Verifying only the happy path. Every function needs explicit edge case consideration: null, empty, overflow, timeout, concurrent access.
- **Verifying only your own code** — When generating multiple files, each piece must be verified individually AND in combination. Integration points between files are where most bugs hide.
- **Patching instead of regenerating** — Finding a bug and making a quick inline fix rather than understanding the root cause and regenerating correctly. Patches introduce new bugs.
- **No confidence assessment** — Presenting output without indicating which parts are verified vs which are assumed. The user cannot know which parts to review carefully.
- **Over-relying on pattern matching** — Assuming that because similar code exists, the generated code is correct. Patterns can be wrong or outdated. Verify independently.

## Edge Cases

- **Generated code compiles but produces wrong results** — Compilation is necessary but not sufficient. Mental execution must verify correctness beyond type checking.
- **Library version mismatch** — The agent generates code using an API that exists in a newer version of the library but not in the version installed in the project. Always check the installed version before generating library-dependent code.
- **Generated code conflicts with existing code** — A new function has the same name as an existing one, or a new route conflicts with an existing route definition. Check for naming and routing conflicts before generating.
- **Generated code is correct for one scenario but not another** — The code handles the described use case but breaks for a closely related scenario not mentioned in requirements. Extend mental testing to include scenarios beyond the explicit requirements.
- **Generated output is too long to verify in one pass** — Long outputs require section-by-section verification with a summary check at the end. Verify each section independently, then verify the integration between sections.
- **Recursive or self-referential logic** — Functions that call themselves or have circular dependencies are notoriously hard to verify mentally. Trace at least 3 levels deep for recursive functions.
- **Generated documentation doesn't match generated code** — The documentation describes behavior A, but the code implements behavior B. Verify documentation against code, not the other way around.

## Validation Checklist

- [ ] Requirements coverage: each explicit requirement maps to an output element.
- [ ] Mental execution: at least one normal input and one edge case traced through each function.
- [ ] Symbol resolution: every function, variable, type, and import resolves to a known definition.
- [ ] Hallucination check: no library methods or APIs that don't exist in the project's installed versions.
- [ ] Error handling: every fallible operation has explicit error handling.
- [ ] Edge case coverage: null, empty, overflow, timeout, concurrent access handled per function.
- [ ] Pattern compliance: generated code matches existing project patterns (export style, error handling, naming, structure).
- [ ] Output format: file paths, signatures, and structure match specification.
- [ ] Test validity: generated tests would fail if the corresponding behavior is broken.
- [ ] Resource safety: no resource leaks (connections, handles, listeners).
- [ ] Security check: no injection vulnerabilities, XSS, CSRF, or hardcoded secrets.
- [ ] Consistency check: naming, types, and interfaces are consistent across all generated files.
- [ ] Integration check: generated files work together correctly.
- [ ] Confidence assessment: HIGH/MEDIUM/LOW with justification.

## Engineering Examples

### Example 1: Catching a Hallucinated API Method

**Scenario:** Generating code to cache API responses using ioredis.

**Initial generation:**
```typescript
import Redis from 'ioredis';

const redis = new Redis();

export async function cacheResponse(key: string, data: unknown, ttl: number): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(data));
}
```

**Self-verification:**
1. Check `redis.setex` — ioredis uses `set(key, value, 'EX', ttl)` not `setex(key, ttl, value)`. The `setex` method exists in redis-node but not in ioredis.
2. Also check: ioredis `set` returns `'OK'`, not `void`.
3. Check: `new Redis()` with defaults connects to `localhost:6379`. Verify this is the project's config — project uses a Redis URL from env variable.

**Corrected output:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function cacheResponse(key: string, data: unknown, ttl: number): Promise<void> {
  await redis.set(key, JSON.stringify(data), 'EX', ttl);
}
```

**Correction log:** `redis.setex` hallucinated — ioredis uses `set(key, value, 'EX', ttl)`. Also added env-based URL instead of default.

### Example 2: Verifying Generated Code Handles Empty States and Errors

**Scenario:** Generating a function to fetch and display user orders.

**Initial generation:**
```typescript
export async function getUserOrders(userId: string): Promise<Order[]> {
  const result = await db.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
  return result.rows;
}
```

**Self-verification:**
1. Requirements say: "Show empty state message when user has no orders." — The generated code returns an empty array but doesn't check for it. Caller needs to distinguish "no orders" from "error fetching."
2. Requirements say: "Handle database timeout gracefully." — No try/catch, no timeout handling.
3. Check: `db.query` — does the db library return `{ rows: Order[] }`? Yes, based on existing usage in `src/models/product.ts`.
4. Check: SQL injection — using parameterized query `$1`, which is correct. Good.
5. Check: What if `userId` is empty string? The query would run but return no results. Should this be a validation error? Requirements do not specify, but likely should return 400 at the API level.

**Corrected output:**
```typescript
export async function getUserOrders(userId: string): Promise<Order[]> {
  if (!userId) {
    throw new ValidationError('userId is required');
  }

  const timeout = 5000;
  const result = await db.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
    { statement_timeout: timeout }
  );

  return result.rows;
}
```

Plus add documentation: "Returns empty array if no orders found. Throws DatabaseError on timeout or connection failure."

### Example 3: Checking That Generated Code Follows Project Patterns

**Scenario:** Generating a new API endpoint in an Express.js project.

**Existing project pattern (from src/routes/products.ts):**
```typescript
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.list(req.query);
  res.json({ data: products });
}));
```

**Generated code (initial):**
```typescript
import express from 'express';
const router = express.Router();

router.post('/orders', async (req, res) => {
  try {
    const order = await createOrder(req.body);
    res.status(201).send(order);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
```

**Self-verification pattern check:**
1. Import style — Project uses `import { Router }` not `import express`. Flag.
2. Async handler — Project uses `asyncHandler` wrapper, not raw try/catch in route. Flag.
3. Response format — Project wraps data in `{ data: ... }`. Flag.
4. Error response — Project uses centralized error handler middleware, not inline 500. Flag.
5. Status code — 201 is correct for creation. OK.

**Corrected output:**
```typescript
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { createOrder } from '../services/orderService';

const router = Router();

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const order = await createOrder(req.body);
  res.status(201).json({ data: order });
}));
```
