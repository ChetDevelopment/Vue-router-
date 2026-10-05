# Context Window Management

## Purpose

Define strategies and techniques for AI agents to maximize the effectiveness of limited context windows. This skill ensures that the most critical information—goals, constraints, relevant code, and decisions—is always available while less relevant details are pruned, summarized, or externalized. Proper context management prevents errors caused by missing information, reduces hallucinations, and maintains coherence across long interactions.

## Responsibilities

- Prioritizing which information occupies the limited context window
- Distinguishing between information that must be verbatim vs information that can be summarized
- Structuring context into logical sections for efficient retrieval
- Pruning irrelevant or outdated information as the conversation progresses
- Rotating context to keep high-priority information visible and deprioritize settled decisions
- Maintaining a decision history that records why choices were made
- Referencing external files for stable reference material instead of inlining them
- Detecting when context is approaching limits and taking corrective action
- Reconstructing essential context after a context reset or truncation
- Tagging context items with priority levels for quick triage when pruning is needed

## Decision Process

1. **Inventory all available context** — List everything that could be relevant: user request, code files, error messages, test output, project conventions, previous conversation turns.
2. **Classify each item by retention value** — Assign each item to one of three categories: `MUST_HAVE` (goals, constraints, current task), `GOOD_TO_HAVE` (reference code, pattern examples), `DISCARDABLE` (past successes, verbose output, tangential details).
3. **Determine verbatim vs summary for each item** — Verbatim: goals, constraints, error messages, function signatures, test output. Summary: internal logic details, implementation history, discussion tangents.
4. **Structure context by priority** — Order context items in the window: goals first, then constraints, then current code, then decisions, then reference material. Lower priority items at the end are pruned first.
5. **Identify stable vs dynamic context** — Stable context (unchanging reference material: project conventions, API specs) should be externalized to files. Dynamic context (current task state, decisions) must stay in the window.
6. **Prune settled decisions** — Once a decision is made and executed, summarize it in one line and move details to a decision log. The active window should only contain unresolved decisions.
7. **Detect context pressure** — Monitor for signs of context saturation: the agent starts forgetting details from earlier turns, repeats information, or produces inconsistent output.
8. **Rotate context under pressure** — When context is full: remove verbose output, remove fully processed code blocks, summarize intermediate results, move stable references to file summaries.
9. **Rebuild after context loss** — If context is reset or truncated, reconstruct: restate the top-level goal, list completed work as bullet points with key decisions, present the next immediate task.
10. **Tag context items for pruning order** — Use priority tags: `[P0]` never remove, `[P1]` remove last, `[P2]` remove under pressure, `[P3]` remove proactively.
11. **Use compression techniques** — Replace long identifiers with short aliases, use acronyms for repeated phrases, convert verbose explanations to structured lists.
12. **Verify critical context is present** — Before generating output, check that all P0 items are still in context. If any are missing, pause and restore them before proceeding.

## Inputs

- Current goal and task description
- Relevant source files and code snippets
- Error messages, stack traces, test output
- Project conventions, style guides, and pattern documentation
- Previous conversation turns and decisions made
- External references (API docs, library documentation)
- Context window capacity (token limit, available space)

## Outputs

- Structured context with clearly labeled sections and priority tags
- Decision history log (compact, one-line per decision with rationale)
- External file references instead of inlined content (for stable references)
- Pruned context with removal log (what was removed and why)
- Context rotation plan when window is approaching capacity
- Reconstructed context after truncation or reset
- Summary of compressed items for efficient retention

## Rules

1. The top-level goal must always be in the first 10% of the context window. If the goal is not visible there, pause and restate it before proceeding.
2. Constraints must be kept verbatim, never summarized. A rephrased constraint is a lost constraint.
3. Code files referenced for patterns must be summarized (file path, purpose, key exports) rather than inlined. Only inline the specific function/section being modified.
4. Error messages must be kept verbatim until resolved. After resolution, they can be replaced by a one-line summary of the fix.
5. No more than 20% of the context window should contain reference material that has not changed in the last 3 turns.
6. Decision history entries must be one line max: "Decision: chose X over Y because Z." If more detail is needed, reference a decision log file.
7. When context pressure is detected, remove all code that has been successfully generated and verified, keeping only code that still needs changes.
8. Conversation turns that ended with "done" or "confirmed" should be compressed to a single summary line.
9. Priority tags must be reviewed every 5 turns: what was P0 may become P2 as it is resolved, and new information may deserve P0.
10. Any file path referenced more than twice in the conversation should be externalized to a file reference rather than inlined.
11. When reconstructing context after loss, the first message must contain: goal, completed tasks (one line each), and next task. Do not attempt to restore all details.
12. Context must include a "fits in window" check: before writing a long response, estimate the output size and verify it fits alongside current context.

## Best Practices

- Use section headers with emoji or ASCII markers for quick visual scanning: `[GOAL]`, `[CONSTRAINTS]`, `[CODE]`, `[DECISIONS]`.
- Maintain a "context budget" for each section: Goal (5%), Constraints (10%), Current Code (40%), Decisions (15%), Reference (20%), Meta (10%).
- When inlining a file, only include the relevant function or block, not the entire file. Add a comment header: `// File: src/auth.ts — login() function only`.
- Use `git diff` output instead of full file content when describing changes. Diffs are more compact and show exactly what changed.
- Summarize successful operations: "Updated 3 files: added validation middleware, modified user route, added tests." instead of showing all the code.
- When a decision is made, immediately record it in the decisions section with the rationale. Delaying risks forgetting why the decision was made.
- For long-running tasks, periodically take a "context snapshot": a compact summary of the current state that can be used to restart if context is lost.
- Use numbered lists instead of paragraphs for complex information. Lists are easier to scan and take fewer tokens.
- When referencing an external API, include only the relevant method signature and a link to full docs, not the entire API reference.
- Prune aggressively after each turn: if a turn produced output that was accepted, the input that led to that output can be summarized.

## Anti-patterns

- **Inline everything** — Copying entire files into context when only a function signature is needed. This fills the window with irrelevant detail and drowns out critical information.
- **No priority system** — Treating all context as equally important. Without priorities, pruning is arbitrary and critical constraints may be lost first.
- **Keeping verbose error output after fixing** — Error messages take significant space. Once a bug is fixed, replace the error with a one-line summary of the root cause and fix.
- **Repeating the same context every turn** — Restating the full task description and constraints in every message. Once established, refer to context sections instead of repeating them.
- **Ignoring context pressure signs** — Waiting until the model starts hallucinating or forgetting details before addressing context saturation. Should be managed proactively.
- **No externalization strategy** — Keeping stable reference material (conventions, API docs) in the window instead of in files. These should be referenced by path, not inlined.
- **Decision amnesia** — Making decisions but not recording them, leading to repeated debates or inconsistent follow-through.
- **Reconstructing from scratch after context loss** — Trying to rebuild all previous context verbatim instead of starting with a high-level summary and rebuilding details as needed.

## Edge Cases

- **Context window is too small for even the goal and constraints** — If the goal + constraints exceed available context, the task is too large. Must be decomposed into sub-goals, each with its own context window.
- **User provides extremely verbose input** — A ticket or bug report that is 2000 words. The agent must extract and summarize: goal (one line), constraints (bulleted), error (verbatim block), expected behavior (one line).
- **Multiple concurrent goals** — The user gives a compound request with multiple independent tasks. Separate into single-goal contexts. Do not attempt to track multiple goals in one window.
- **Context reset during output generation** — The agent's output is truncated because the window filled. Mitigation: generate output in smaller chunks and stream state summaries between chunks.
- **Conflicting constraints from different sources** — Two constraints contradict each other. Both must be kept verbatim until resolved. Mark as `[CONFLICT]` and prioritize based on the primary goal.
- **Stable reference becomes unstable** — A file or API referenced as stable changes mid-task. The agent must detect the staleness (e.g., from reading the file again) and update the context accordingly.

## Validation Checklist

- [ ] Top-level goal is within the first 10% of the context window.
- [ ] All constraints are present verbatim, not summarized.
- [ ] Code files are summarized with file path and purpose; only relevant functions are inlined.
- [ ] Error messages are verbatim until resolved.
- [ ] No more than 20% of context is stable reference material.
- [ ] Decision history is one line per decision with rationale.
- [ ] All P0 items are clearly tagged and present.
- [ ] Resolved items are pruned or summarized.
- [ ] File paths referenced more than twice are externalized.
- [ ] Context budget is respected (Goal: 5%, Constraints: 10%, Current Code: 40%, Decisions: 15%, Reference: 20%, Meta: 10%).
- [ ] Priority tags have been reviewed in the last 5 turns.
- [ ] A context snapshot exists for restart capability.

## Engineering Examples

### Example 1: Structuring Context for a Large Feature Implementation

**Scenario:** Implementing a Redis-backed rate limiter middleware across 4 files.

**Compact Context Structure:**
```
[GOAL] Add configurable Redis rate limiter middleware to all API routes.

[CONSTRAINTS]
- Use ioredis (already in package.json v5.3)
- Config via env: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS
- Must not break existing /health endpoint
- Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- 429 response body: { error: "rate_limit_exceeded", retryAfterMs: number }

[CODE — src/middleware/rateLimiter.ts]
Current file (empty). New file. Expected pattern (reference to existing auth middleware at src/middleware/auth.ts):
  export function authMiddleware(req, res, next) { ... }
  // Same export pattern for rateLimiter

[DECISIONS]
- Pending: Should burst requests be allowed? (Sliding window vs fixed window)
- Pending: Should config be per-route or global?

[REFERENCE — ioredis usage in project]
src/redis/client.ts exports: createRedisClient() → Redis instance
Used in: src/cache/sessionCache.ts (get/set/del patterns)
```

**Why this works:** The goal and constraints are verbatim and first. Code section only references the file needing creation plus one pattern file. External reference points to existing redis usage without inlining it. Decisions that are still open are highlighted.

### Example 2: Managing Context Across a Multi-File Refactoring Session

**Scenario:** Splitting 800-line checkout.ts into 4 modules over multiple conversation turns.

**Turn 1 Context:**
```
[GOAL] Extract CartCalculator from checkout.ts

[CONSTRAINTS]
- Keep public API of checkout.ts unchanged
- No behavior changes, only extraction
- All existing tests must pass without modification

[CODE — checkout.ts]
Lines 1-200 (pricing logic) — inline lines 1-200 only
Show patterns: function calculateSubtotal(items) → ...
```

**Turn 3 Context (after CartCalculator and InventoryValidator extracted):**
```
[GOAL] Extract PaymentProcessor from checkout.ts

[COMPLETED]
- CartCalculator extracted to src/services/cart/calculator.ts ✓
- InventoryValidator extracted to src/services/inventory/validator.ts ✓
- Decision: Both use `Dependency` pattern (class with injected dependencies)
- Decision: checkout.ts now imports both modules (see imports at top)

[CONSTRAINTS] (same as above, summarized)

[CODE — checkout.ts remaining]
Lines 401-650 (payment logic) — inline only these lines
```

**Why this works:** Completed work is summarized to one line each. Decisions are captured. Only the relevant portion of the remaining file is shown. The constraints are summarized since they haven't changed.

### Example 3: Deciding What to Discard vs Retain When Context is Full

**Scenario:** Context is at 95% capacity after 8 turns of debugging a Webpack configuration issue.

**Pruning decision table:**

| Item | Size | Priority | Action |
|------|------|----------|--------|
| Goal: "Fix Webpack HMR not working" | 2% | P0 | RETAIN |
| Constraint: "Must keep existing loaders" | 3% | P0 | RETAIN |
| Full webpack.config.js (300 lines) | 40% | P2 (was P0) | SUMMARIZE to: "config has 4 loaders (ts, css, svg, file), 3 plugins (HtmlWebpack, MiniCssExtract, Define), entry at src/index.tsx" |
| Error log from Turn 3 (80 lines) | 10% | P3 | DISCARD (bug is fixed) |
| Attempted fix from Turn 5 (50 lines) | 6% | P3 | DISCARD (fixed differently) |
| Working fix from Turn 7 (15 lines) | 2% | P1 | RETAIN |
| Package.json versions (30 lines) | 4% | P2 | SUMMARIZE to: "webpack 5.88, webpack-dev-server 4.15" |
| Decision log (8 entries) | 8% | P1 | RETAIN but compress: "Tried A→failed, tried B→partial, tried C→fixed. Key: HMR needs publicPath in devServer" |

**After pruning:** Space freed: ~40%, new available space for next attempt.
