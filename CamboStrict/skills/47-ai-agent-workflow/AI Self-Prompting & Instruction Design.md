# AI Self-Prompting & Instruction Design

## Purpose

Define a systematic methodology for AI agents to craft effective self-prompts and instructions that produce correct, complete, and well-structured outputs across diverse software engineering tasks. This skill ensures that every prompt an agent writes for itself—whether for code generation, analysis, planning, or debugging—is optimized for precision, scope control, and output quality.

## Responsibilities

- Constructing self-prompts that unambiguously specify the task, context, constraints, and expected output format
- Adapting prompt structure to the type of work (generation vs analysis vs planning vs debugging)
- Including sufficient context without overloading the prompt window
- Specifying output format requirements (language, framework, file structure, naming conventions)
- Constraining scope explicitly to prevent over-generation or off-target work
- Designing clarification loops to resolve ambiguity before execution
- Applying chain-of-thought prompting for multi-step reasoning tasks
- Separating planning prompts from execution prompts to reduce cognitive load
- Validating self-prompts against known project conventions before execution
- Iteratively refining prompts based on output quality feedback

## Decision Process

1. **Classify the task type** — Determine whether the task is generation (write code), analysis (explain/find bugs), planning (design/outline), or debugging (fix issues). Each type requires a different prompt structure.
2. **Identify all implicit assumptions** — List assumptions about the codebase, frameworks, APIs, and conventions. Convert each implicit assumption into an explicit prompt instruction.
3. **Select output format** — Define the exact output format: file path, language, framework, imports, exports, test structure, documentation format. Specify if output should be a single block, multiple files, or a diff.
4. **Define scope boundaries** — State what the prompt should NOT do: avoid modifying unrelated files, skip tests unless requested, exclude configuration changes, etc.
5. **Extract essential context** — Identify the minimum context needed: relevant file paths, function signatures, type definitions, existing patterns. Exclude tangentially related code.
6. **Set constraint priorities** — Rank constraints by importance: correctness > performance > readability > consistency. Communicate trade-offs explicitly in the prompt.
7. **Determine reasoning depth** — For simple tasks (single function), use direct instruction. For complex tasks (multi-file feature), use chain-of-thought with step-by-step reasoning. For analysis, request explanation before conclusion.
8. **Design clarification triggers** — Define conditions under which the agent should ask for clarification: ambiguous requirements, missing dependencies, conflicting constraints, unclear error messages.
9. **Separate planning from execution** — First write a planning prompt that produces a structured plan. Then write an execution prompt that references the plan. Never combine planning and execution in a single prompt for complex tasks.
10. **Add verification criteria** — Include self-check instructions in the prompt: verify imports exist, check for null safety, confirm error handling, validate against project patterns.
11. **Specify tone and detail level** — For code generation, specify concise output. For analysis, specify thorough explanation. For debugging, specify root cause + fix format.
12. **Include context pruning rules** — Tell the agent to discard irrelevant context: if a file is provided for reference, specify which parts are relevant and which can be ignored.
13. **Test the prompt mentally** — Before executing, trace through the prompt to verify it would produce the expected output. Rewrite if ambiguities exist.

## Inputs

- Task description from user or upstream agent (free-form natural language)
- Relevant code snippets, file paths, or repository structure
- Known project conventions, patterns, and style guides
- Error messages, stack traces, or bug reports (for debugging prompts)
- Requirements documents, tickets, or feature specifications
- Previously generated plans (for execution prompts)
- Context window constraints (token limits, available context)

## Outputs

- Structured self-prompt with explicit sections: goal, context, constraints, output format, verification
- Optional planning prompt and separate execution prompt (for complex tasks)
- Clarification requests when prompt is underspecified
- Final generated output (code, analysis, plan, fix) that matches the prompt specification
- Post-execution validation results confirming output meets prompt requirements

## Rules

1. Every self-prompt must include exactly one primary goal statement. If multiple goals exist, split into separate prompts or explicitly prioritize them.
2. Output format must be specified in machine-verifiable terms: "Generate a TypeScript function at `src/utils/validate.ts` with signature `export function validate(input: unknown): ValidationResult`."
3. Scope constraints must use negative language when restricting: "Do NOT modify any file outside `src/features/`. Do NOT add new dependencies."
4. Context must include only files directly relevant to the task. Include file paths and a brief summary of each file's relevance.
5. When referencing existing code patterns, include 1-2 concrete examples rather than describing the pattern abstractly.
6. Chain-of-thought prompts must separate reasoning steps with numbered sections and require explicit output at each step before proceeding.
7. Clarification loops must be triggered by specific, named conditions (e.g., "If the error message mentions Webpack, ask for webpack.config.js before proceeding").
8. Planning and execution must be separate prompts for any task requiring more than 50 lines of new code or affecting more than 3 files.
9. Self-prompts must include a verification step that checks output against the goal statement before presenting results.
10. When context is limited, the prompt must prioritize: function signatures > type definitions > implementation details > comments.
11. Prompt language must be imperative and unambiguous: "Create a file at..." not "You could create a file at...".
12. For multi-turn interactions, each subsequent prompt must summarize the previous output before requesting changes.

## Best Practices

- Start every prompt with a one-line goal summary in bold: "**Goal:** Implement user authentication middleware."
- Use section headers (Goal, Context, Constraints, Output, Verification) consistently for all prompts.
- For code generation, always specify error handling behavior: "All functions must handle null/undefined inputs and return `Result` types instead of throwing."
- Include negative examples when possible: "Use `forEach` not `for...of` loops (project convention)."
- For analysis prompts, request the conclusion first, then evidence: "State the root cause in one sentence, then provide supporting evidence."
- For debugging prompts, always include the exact error message, reproduction steps, and expected vs actual behavior.
- Reference specific line numbers when including code snippets: "See `src/auth.ts:42-55` for the existing login pattern."
- When generating multiple files, specify creation order and dependencies between files.
- For refactoring prompts, always specify "before" and "after" states for each file.
- Include a "Stop if" condition: "Stop if the solution requires changing the database schema. Ask for approval first."
- Use consistent terminology matching the project's domain language (e.g., "order" vs "purchase", "user" vs "account").
- For prompts that will be reused, parameterize variable parts with `{{placeholders}}`.
- After prompt execution, log which parts of the prompt worked well and which caused issues for future refinement.

## Anti-patterns

- **Mixing planning and execution** — Writing a single prompt that both decides the approach and generates code. This leads to incoherent output. Always separate plan from execute for complex tasks.
- **Over-specifying implementation details** — Dictating exact line-by-line implementation when the agent could choose a better approach. Specify constraints and requirements, not specific implementation unless necessary.
- **Under-specifying context** — Assuming the agent knows the codebase structure, existing APIs, or conventions without providing evidence. Always include at least file paths and relevant signatures.
- **Using vague output formats** — "Write a function that does X" without specifying file location, signature, error handling, or return type. Leads to unusable output that requires multiple revision rounds.
- **Ignoring context limits** — Pasting entire files when only a function signature is needed. This wastes context window and dilutes focus. Extract only relevant portions.
- **Requesting analysis without format** — "Find the bug in this code" without specifying output format. Should be: "List each bug with: (1) line number, (2) root cause, (3) fix, (4) test to add."
- **One-shot complex tasks** — Asking for a complete feature in one prompt without iterative refinement. Complex features should be decomposed into sub-prompts.

## Edge Cases

- **Ambiguous or contradictory requirements** — When the task description contains conflicting instructions, the prompt should explicitly note the conflict and request clarification rather than guessing.
- **Missing prerequisite context** — If a required type, function, or module is referenced but not provided, the prompt must specify the assumption and note it as a risk.
- **Context window overflow** — When the prompt plus expected output exceeds context limits, the prompt should specify that output be split across multiple rounds with continuation markers.
- **Framework version mismatches** — The prompt must include the specific framework version and note any version-specific behaviors to avoid generating code for the wrong version.
- **Generated code needs human approval** — The prompt should include a "human review required" flag for changes that modify shared interfaces, database schemas, or security-critical code.
- **Multi-language or multi-framework files** — The prompt must be explicit about which language/framework applies to which section of the output.

## Validation Checklist

- [ ] The prompt includes exactly one primary goal statement.
- [ ] Output format is specified with file path, signature, and expected structure.
- [ ] Scope constraints are stated as explicit "Do NOT" rules.
- [ ] Context provided is minimal and directly relevant.
- [ ] Existing patterns are referenced with concrete examples, not abstract descriptions.
- [ ] For complex tasks, planning and execution prompts are separated.
- [ ] Clarification triggers are named conditions, not generic "ask if unclear."
- [ ] A verification step is included to check output against the goal.
- [ ] Error handling requirements are specified for code generation tasks.
- [ ] The prompt uses imperative language throughout.
- [ ] For multi-turn prompts, each turn summarizes previous output.
- [ ] "Stop if" conditions are defined for risky changes.

## Engineering Examples

### Example 1: Self-Prompt for Implementing OAuth2 Login End-to-End

**Context:** Adding GitHub OAuth2 login to an Express.js API with Passport.js.

**Planning Prompt:**
```
**Goal:** Plan the implementation of GitHub OAuth2 login.

**Context:** Express.js app at `src/server.ts`, existing Passport.js setup at `src/auth/passport.ts`, User model at `src/models/User.ts` with fields: `id`, `email`, `displayName`, `githubId`, `avatarUrl`.

**Constraints:**
- Must use `passport-github2` strategy.
- Do NOT modify the User model schema.
- Session management is already handled; only add OAuth flow.
- Existing routes are in `src/routes/auth.ts`.

**Output Format:**
1. List of files to create/modify with summary of changes per file.
2. Order of implementation.
3. Test strategy: which tests to add and what to mock.

**Stop if:** Adding OAuth requires changes to the session middleware or database migrations.
```

**Execution Prompt:**
```
**Goal:** Implement GitHub OAuth2 login per the approved plan.

**Plan Reference:** [plan from previous prompt]

**Context Files:**
- `src/auth/passport.ts` — existing Passport config, serialize/deserialize
- `src/routes/auth.ts` — existing auth routes (login, logout, signup)
- `src/models/User.ts` — User model with `findOrCreate` static method
- `src/config/index.ts` — env vars including `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

**Constraints:**
- Follow the exact patterns in `src/auth/passport.ts` for strategy registration.
- Use `DoneCallback` type from `@types/passport` for verify callbacks.
- Callback URL must be `/api/auth/github/callback`.
- On first login, create User with `githubId` and redirect to `/welcome`. On subsequent login, update `avatarUrl` and redirect to `/dashboard`.

**Output Format:**
- For each file: the complete updated file content with changes clearly indicated by comments.
- If a file doesn't need changes, state "No changes needed."
- Include the `.env` variables that need to be added (without values).

**Verification:**
- Verify `passport-github2` is imported and registered.
- Verify the callback route exists and matches GitHub app configuration.
- Verify `User.findOrCreate` is called correctly per existing usage.
- Verify error handling: redirect to `/login?error=github_auth_failed` on failure.
```

### Example 2: Self-Prompt for Analyzing a Security Vulnerability

```
**Goal:** Analyze reported XSS vulnerability in search results rendering.

**Input:** Bug report: "Search results page reflects unescaped user input in `<h2>` title tags when search term contains `<script>` tags."

**Context:**
- View file: `src/views/search.ejs` — renders search results
- Controller: `src/controllers/search.ts` — handles query and passes results to view
- Sanitizer utility: `src/utils/sanitize.ts` — exports `escapeHtml(str): string`
- Template engine: EJS with `-` (unescaped) and `=` (escaped) output tags

**Output Format:**
1. **Root Cause** (one sentence): The exact line and mechanism causing the vulnerability.
2. **Code Path** (numbered steps): Trace the input from HTTP request to rendered HTML.
3. **Fix** (exact code change): The specific lines to modify with before/after.
4. **Related Issues** (list): Other places in the same view that might have similar vulnerabilities.
5. **Prevention** (list): Coding standard changes to prevent recurrence.

**Reasoning Steps:**
1. First, trace the data flow from the search query parameter to the render call.
2. Identify where the data is last escaped before reaching the template.
3. Check if the template uses `<%=` (escaped) or `<%-` (unescaped) for the vulnerable field.
4. Verify the sanitizer utility is used consistently across all user-input display points.
5. Provide the fix.

**Constraints:**
- Do NOT propose switching from EJS to another template engine.
- The fix must use the existing `escapeHtml` utility.
- Output each step before proceeding to the next.
```

### Example 3: Multi-Turn Debugging Prompt for Production Issue

**Turn 1 — Problem Characterization:**
```
**Goal:** Characterize production query timeout issue.

**Symptom:** API endpoint `GET /api/orders/recent` times out after 30s with 100+ concurrent users. Works fine at low concurrency.

**Context:**
- Endpoint handler: `src/controllers/orders.ts:45-78`
- Database query: `SELECT * FROM orders WHERE user_id = ? AND status != 'cancelled' ORDER BY created_at DESC`
- Database: PostgreSQL 14, 50k orders, indexed on `user_id` and `created_at`
- ORM: Knex.js
- Deployed on: 2x EC2 t3.medium, 50 connections pool per instance

**Output Format:**
List 3 most likely root causes ranked by probability, with evidence I should gather to confirm each.
```

**Turn 2 — Fix Implementation:**
```
**Goal:** Implement fix based on confirmed root cause.

**Root Cause Confirmed:** The query performs a sequential scan because the composite index on (user_id, created_at) is not being used due to `status != 'cancelled'` making the index less effective. The `user_id` index is selective enough but the sort causes a filesort.

**Fix Plan:** 
1. Create a partial index on `(user_id, created_at) WHERE status != 'cancelled'`
2. Add query timeout middleware at 5s with proper error response

**Constraints:**
- Migration must be reversible (add `exports.down`).
- The timeout middleware must return 503 with `{error: "service_unavailable", retry_ms: 1000}`.
- No changes to application logic, only database and middleware.

**Output:** Migration file and middleware changes as separate code blocks.
```
