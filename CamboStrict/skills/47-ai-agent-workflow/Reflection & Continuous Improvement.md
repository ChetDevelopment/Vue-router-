# Reflection & Continuous Improvement

## Purpose

Define a structured methodology for AI agents to systematically reflect on completed work, analyze successes and failures, and incorporate lessons learned into future behavior. This skill ensures that the agent improves over time by identifying recurring error patterns, refining internal guidelines, building a knowledge base of project-specific conventions, and avoiding repeated mistakes.

## Responsibilities

- Conducting structured retrospectives after each significant task or at regular intervals
- Identifying specific actions that worked well and should be repeated
- Analyzing mistakes to determine root causes, not just symptoms
- Updating internal guidelines and checklists based on lessons learned
- Recognizing recurring patterns in errors across multiple tasks
- Building and maintaining a personal knowledge base of project-specific conventions
- Documenting assumptions that were incorrect and adjusting future assumption-making
- Tracking which prompt structures produce the best outputs and refining accordingly
- Sharing lessons learned with other agents (in multi-agent contexts)
- Measuring improvement over time by tracking recurrence of previously identified issues

## Decision Process

1. **Trigger a retrospective** — Reflect after: completing a feature, fixing a bug, receiving a code review with changes requested, or after every 5 conversation turns on a complex task.
2. **State the outcome** — Write one sentence describing what happened: what was produced, what feedback was received, what went wrong (if anything).
3. **Identify what went well** — List 2-3 specific things that contributed to a good outcome. Be concrete: "Using the `asyncHandler` wrapper pattern from auth.ts in the new orders route."
4. **Identify what went wrong** — List 2-3 specific things that caused issues. Again, concrete: "Assumed `redis.setex` exists in ioredis when it's actually a redis-node API."
5. **Analyze root cause** — For each issue, ask "why" 3 times to get to the root cause. Example: "Why did I use setex? → I assumed it was a standard Redis API. → Why did I assume? → I didn't check the ioredis docs. → Why didn't I check? → I didn't have a verification step for library APIs."
6. **Categorize the issue** — Assign each issue to a category: Knowledge Gap (didn't know something), Process Gap (didn't follow a process), Assumption Error (made wrong assumption), Context Gap (missing information), Pattern Error (didn't follow existing patterns).
7. **Design a corrective action** — For each root cause, define a specific action to prevent recurrence. Not "be more careful" but "add 'Verify library API exists' to the self-correction checklist."
8. **Update personal knowledge base** — If the issue revealed a project-specific convention or pattern, add it to the project conventions knowledge base with a concrete example.
9. **Verify the corrective action works** — Mentally simulate the next similar task using the updated checklist. Confirm the new action would catch the previous error.
10. **Track recurrence** — When starting a new task, check if any previously identified issues apply. If the same issue recurs, the corrective action needs to be stronger or more specific.
11. **Identify positive patterns** — If a certain prompt structure or approach consistently produces good results, capture it as a "repeatable practice" and make it a standard part of the workflow.
12. **Review the retrospective log** — Periodically (every 10 retrospectives), review the log for meta-patterns: are most errors in the same category? Is there a systematic weakness?

## Inputs

- Completed work output (code, analysis, plan)
- Feedback from code reviews, tests, or user acceptance
- Error messages, bugs found in generated code
- Self-verification correction logs
- Peer agent feedback (in multi-agent systems)
- Time and effort estimates vs actuals
- Prompt structures used and their outcomes

## Outputs

- Retrospective entry with: outcome, what went well, what went wrong, root cause analysis, corrective actions
- Updated personal checklist entries (additions or refinements)
- Project conventions knowledge base entries (new patterns learned)
- Updated prompt templates based on what worked
- Recurrence tracking log (issue → times recurred → status)
- Improvement metrics over time (error rate per task type)
- Shared lessons document (for multi-agent environments)

## Rules

1. A retrospective must be conducted after every task that resulted in a user-visible error or bug. This is mandatory, not optional.
2. Root cause analysis must go at least 3 levels deep ("5 Whys" minimum). Surface-level causes like "I made a mistake" are not acceptable.
3. Corrective actions must be specific and verifiable. Not "be more careful" but "add X to the checklist" or "always verify Y before generating."
4. Each corrective action must be applied to a specific artifact (checklist, knowledge base, prompt template) within the same session.
5. Recurrence tracking is mandatory: if the same issue appears more than once, the corrective action is insufficient and must be escalated or redesigned.
6. Positive patterns must be captured with the same rigor as negative ones. If something worked well, document why and how to repeat it.
7. The project knowledge base must be updated within 24 hours of discovering a new convention or pattern. Stale knowledge is dangerous.
8. Retrospectives must be written in a structured format (see Outputs section) to enable trend analysis over time.
9. When multiple issues are identified, they must be prioritized by impact: fix the most impactful error pattern first.
10. Personal improvement must be measurable: track at least one metric (e.g., "hallucinated APIs per 100 lines") over time.
11. Lessons learned must be shared if they affect common patterns used by other agents or team members.
12. If a corrective action is not applied within 3 subsequent tasks, it must be reviewed for relevance and either removed or re-committed to.

## Best Practices

- Keep the retrospective short and structured. A good retrospective is 5-10 bullet points, not a long essay. Spend time on root cause, not on description.
- Use the "5 Whys" rigorously. The first "why" is usually a symptom. The third or fourth "why" reveals the actual process or knowledge gap.
- Maintain a "mistakes journal" as a running document. Review it before starting a new task to prime yourself to avoid past errors.
- When updating checklists, place the new item in the most logical section (e.g., imports check, error handling check) rather than appending to the end. This keeps checklists organized and usable.
- For positive patterns, include a concrete example and a counter-example: "Do this: `export function` (named export as project convention). Don't do this: `export default function`."
- When a corrective action involves adding a verification step, place it at the natural point in the workflow where the error occurs, not at the end.
- Review the project conventions knowledge base before every significant task. This primes the agent to use the right patterns.
- If a code review reveals issues, incorporate the reviewer's comments into the retrospective even if you disagree with some. The reviewer's perspective reveals gaps in your understanding.
- After a successful task, note what made it successful: was it the prompt structure, the context provided, the decomposition approach? Abstract the pattern for reuse.
- Track confidence calibration: if your HIGH confidence outputs frequently have issues, you need stricter verification. If your LOW confidence outputs are always fine, you can reduce verification overhead.

## Anti-patterns

- **Blame-focused reflection** — Framing retrospectives as "what went wrong" without equally analyzing "what went well." Leads to defensive thinking and missed positive patterns.
- **Surface-level root causes** — Stopping at "I made an assumption" without examining why the assumption was made, what information was missing, or what process would have prevented it.
- **No corrective action** — Identifying an issue but not defining a specific action to prevent recurrence. Reflection without action is just rumination.
- **One-time fixes** — Patching a specific instance of an error but not updating the general process. The same error type will recur in a different context.
- **Ignoring positive patterns** — Focusing only on mistakes and failing to capture what works. This misses opportunities to systematize effective approaches.
- **Retrospective without review** — Writing retrospectives but never reviewing them before starting new work. The lessons stay in the document, not in the behavior.
- **Disconnected corrective actions** — Adding checklist items that are unrelated to the actual root cause. Each corrective action must directly address the root cause identified by the 5 Whys.
- **No measurement** — Not tracking whether errors are decreasing over time. Without measurement, improvement is anecdotal and unreliable.

## Edge Cases

- **Task was successful but tedious** — Even when the output is correct, if the process was inefficient, reflect on how to make it more efficient. Did the prompt require too many turns? Was too much context needed?
- **User provides conflicting feedback** — One user says "too verbose" and another says "not enough detail." The agent should document both preferences and note that style may need to adapt per user.
- **No feedback available** — When a task completes without any error or review, the agent should still do a lightweight reflection: "What would I do differently if I did this again?"
- **Root cause is external** — A bug is caused by incorrect documentation or a framework bug, not the agent's error. Still reflect on how to detect such situations earlier. Can the agent add a verification step for documented behavior?
- **Multiple issues with the same root cause** — If 3 different errors all stem from "not verifying library APIs," they count as one root cause. Fixing that root cause fixes all 3 issues.
- **Previously correct pattern becomes incorrect** — A framework update changes a convention. The agent must detect the staleness of its knowledge base and update it. This should trigger a "knowledge refresh" action.

## Validation Checklist

- [ ] Retrospective was conducted after each significant task.
- [ ] Root cause analysis goes at least 3 levels deep (5 Whys method).
- [ ] Corrective actions are specific and verifiable, not generic.
- [ ] Each corrective action is tied to a specific artifact update (checklist, KB, template).
- [ ] Positive patterns are documented with concrete examples.
- [ ] Recurrence of previously identified issues is checked before new tasks.
- [ ] Project conventions knowledge base is updated with new discoveries.
- [ ] Improvement metric is tracked over time.
- [ ] Retrospective log is reviewed periodically for meta-patterns.
- [ ] Lessons are shared with relevant agents or team members.
- [ ] Corrective actions from the last 3 retrospectives are reviewed for adherence.
- [ ] Confidence calibration is checked: HIGH-confidence errors vs LOW-confidence passes.

## Engineering Examples

### Example 1: Reflecting on a Bug Introduced by Incorrect Framework Assumption

**Scenario:** Generated code using `useEffect` cleanup incorrectly in React, causing memory leaks. The cleanup function was calling `setState` after unmount.

**Retrospective Entry:**

**Outcome:** Generated React component with `useEffect` that calls `setState` in cleanup after unmount, causing "Can't perform a React state update on an unmounted component" warning.

**What Went Well:**
- Component structure followed existing patterns in the codebase.
- State management with useReducer was appropriate for the complexity.
- TypeScript types were correct and consistent.

**What Went Wrong:**
- Cleanup function in `useEffect` was calling `setLoading(false)` which runs after unmount if the component is removed during async operation.
- The `isMounted` ref pattern was not used, which is standard for preventing this exact issue.

**Root Cause Analysis:**
1. Why did the component call setState after unmount? → The cleanup function didn't check if component was mounted.
2. Why wasn't the check included? → I assumed the cleanup only runs when dependencies change, not on unmount.
3. Why did I assume that? → I confused cleanup semantics: cleanup runs on both dependency change AND unmount.
4. Why did I not verify this? → My verification checklist doesn't include "Check useEffect cleanup for unmount safety."

**Corrective Actions:**
1. Add to verification checklist: "For all `useEffect` with cleanup, verify cleanup is safe to run after unmount (use `isMounted` ref or abort controller)."
2. Add to project conventions KB: "Project uses `isMounted` ref pattern in all async effects. See `src/hooks/useDataFetching.ts` for example."
3. Update prompt template for React components: include "Handle unmount safety in all effects with async operations" as a constraint.

### Example 2: Learning from a Security Review Finding

**Scenario:** Generated authentication middleware that logged user passwords in error messages. Security review flagged it as a P1 finding.

**Retrospective Entry:**

**Outcome:** Password included in error log when authentication fails: `Invalid password for user ${email}: ${password}`.

**What Went Well:**
- Authentication flow was functionally correct (validated credentials, returned proper HTTP status codes).
- Rate limiting was added correctly.

**What Went Wrong:**
- Password was included in the error log message verbatim.
- Error was logged before sanitizing sensitive fields.

**Root Cause Analysis:**
1. Why was the password in the error log? → I used the raw request body directly in the log message.
2. Why didn't I sanitize it? → I didn't consider that log messages should not contain sensitive data.
3. Why didn't I consider it? → My self-correction checklist doesn't include "Check for sensitive data in logs."
4. Why was it not in the checklist? → The checklist was focused on functional correctness, not security hardening.

**Corrective Actions:**
1. Add to verification checklist: "Check all log statements: no passwords, tokens, PII, or secrets in log output."
2. Add to project conventions KB: "Project uses `sanitizeForLog(obj)` utility from `src/utils/logSanitizer.ts` for all log messages that include request data."
3. Add to code generation prompts: Include "Sanitize sensitive fields from all log and error messages" as a standard constraint.
4. Add to context window: Include reference to the project's logging utility.

### Example 3: Cataloging Project-Specific Patterns for Consistent Application

**Scenario:** Over 10 tasks, the agent has learned several project-specific conventions. A retrospective review identifies that some patterns are applied inconsistently.

**Knowledge Base Entry — Project Conventions:**

```
# API Layer
- Router pattern: import { Router } from 'express'; const router = Router(); export default router;
- Response format: Always wrap in { data: ... } for single resources, { data: [...], meta: { page, total } } for collections.
- Error handling: Use asyncHandler wrapper (src/middleware/asyncHandler.ts). Do NOT use try/catch in route handlers.
- Status codes: 201 for creation, 204 for deletion, 400 for validation errors, 403 for auth errors, 404 for not found.

# Data Layer
- Repository pattern: Class-based with static methods. Each model has a corresponding Repository class.
- Query style: Parameterized queries with $1, $2 syntax. Never string interpolation.
- Transactions: Use db.transaction() wrapper from src/db/transaction.ts.
- Migrations: Each migration has up() and down(). Down must exactly reverse up.

# Testing
- Test framework: Vitest, not Jest.
- Test naming: describe('ModuleName') → it('should [expected behavior] when [condition]').
- Mocking: Use vi.mock() at module level. Mock repository methods, not database queries.
- Fixtures: Factory functions in src/test/factories/, not static JSON files.

# Error Handling
- Custom errors: Extend AppError class. Use NotFoundError, ValidationError, AuthError subclasses.
- Error response: { error: { code: string, message: string, details?: unknown } }.
- Logging: Use logger.info/warn/error from src/utils/logger.ts. Never console.log.
```

**Retrospective Finding:** Before this KB was formalized, the agent used `try/catch` in a route handler (violating the asyncHandler convention) in 2 out of 10 tasks.

**Corrective Action:** Before generating any API code, check the KB for "API Layer" patterns. Include the relevant KB section as context in the prompt.

**Recurrence Check After Action:** After adding this check, subsequent 5 API tasks all used asyncHandler correctly.
