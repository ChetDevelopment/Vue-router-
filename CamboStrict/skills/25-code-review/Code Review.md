# Code Review

## Purpose

Establish a consistent, high-quality code review process that catches defects, improves code maintainability, transfers knowledge across the team, and upholds the project's architectural standards. Code reviews are the primary quality gate before code reaches production and serve as a continuous learning mechanism for every team member.

## Responsibilities

- Authors: prepare reviewable changesets, self-review before requesting review, respond to feedback constructively.
- Reviewers: evaluate changes for correctness, security, performance, maintainability, and style; provide actionable feedback; approve only when confident.
- Team leads: ensure reviews are completed within agreed SLAs (typically <24 hours), mediate disagreements, and enforce review standards.
- All parties: maintain a respectful, collaborative tone; assume good intent; focus on the code, not the person.

## Decision Process

1. Author runs pre-review checklist (see Inputs) and ensures CI passes before assigning reviewers.
2. Author selects reviewers based on expertise: at least one domain expert and one generalist. For cross-cutting changes, include an architect or platform team member.
3. Reviewer opens the diff and assesses scope. If the PR exceeds 400 lines, request the author to split it into smaller logical changes. A 400-line cap applies to the diff, not the total file size.
4. Reviewer performs a first-pass scan for correctness: does the code do what the description says? Look for logic errors, off-by-one mistakes, race conditions, and missing null checks. This is the most important pass—do not get distracted by formatting.
5. Reviewer performs a security pass: check for injection vulnerabilities (SQL, XSS, command injection), hardcoded secrets, insufficient authorization checks, and unsafe deserialization. If any security issue is found, the review stops and the author is notified immediately.
6. Reviewer performs a maintainability pass: assess naming, function length, comment quality, duplication, and adherence to project patterns. Suggest improvements but distinguish between "must fix" and "nice to have."
7. Reviewer performs a test pass: verify that new code has appropriate tests, that existing tests still pass, and that tests follow the project's testing conventions (Arrange-Act-Assert, no shared state, meaningful assertions).
8. Reviewer submits feedback organised by severity: blocking (prevents merge), major (should fix before merge), minor (consider improving), nitpick (personal preference, author's call).
9. Author responds to each comment: accept with fix, explain why not, or ask for clarification. If a comment is resolved, it must include a brief note on the resolution.
10. After all blocking and major comments are addressed, the reviewer approves or requests additional changes. Approval means the reviewer is confident the change is correct and safe to merge.

## Inputs

- Pull request or merge request with description, linked issue, and changelog entry
- Diff view showing changed files with line-level annotations
- CI pipeline results (lint, typecheck, unit tests, integration tests, security scan)
- Project coding standards document (linters, formatters, naming conventions)
- Architecture decision records relevant to the change
- Test coverage report highlighting uncovered lines

## Outputs

- Reviewed and approved (or rejected) changeset ready for merge
- Review comments with severity labels, actionable suggestions, and resolved discussions
- Knowledge-sharing artifacts: review comments that become documentation updates or team learnings
- Metrics for team improvement: review turnaround time, PR size trends, defect escape rate

## Rules

1. Do not approve a PR that fails CI. The only exception is a known flaky test that is quarantined and tracked separately.
2. Do not review a PR that is larger than 400 lines of diff. Request the author to split it. Large PRs hide defects and overwhelm reviewers.
3. Do not leave vague comments. "This could be better" is not actionable. Instead say: "Extract lines 45-60 into a `validateOrder` method to reduce nesting and improve testability."
4. Do not rewrite the author's code in comments. Suggest the approach and let the author implement it. Rewriting is disrespectful and robs the author of ownership.
5. Do not approve a PR that introduces dead code, commented-out code, or TODO items without a linked issue. Dead code becomes maintenance debt.
6. Do not add reviewers who are not relevant to the change. Every reviewer's time is valuable. Only request review from people who can meaningfully evaluate the diff.
7. Do not merge your own PR without a review. Every change must be reviewed by at least one other person, including urgent hotfixes (post-hoc review if necessary).
8. Do not use code review to enforce personal preferences that are not in the style guide. If a linter allows it, it is acceptable.
9. Do not leave feedback on untested code paths. If a method or branch is not tested, the first comment should ask for tests, not for a refactor.
10. Do not leave "LGTM" as the only comment on a security-sensitive change. Security changes require explicit sign-off from a security reviewer.

## Best Practices

1. Review in short, focused sessions. Spend no more than 60 minutes per session. After 60 minutes, defect detection drops significantly. For large changes, review in multiple sessions.
2. Start with the most important files: API contracts, data models, security-related code, and core business logic. Leave documentation and test changes for last.
3. Read the diff before reading the description. Form your own understanding of the change, then check the description to see if your understanding matches. This catches mismatches between intent and implementation.
4. Use the "rubber duck" technique: explain the change back to the author in your own words as a comment. If you cannot explain it concisely, the code likely needs clarification.
5. Prefer asking questions over making statements. "What happens when `userId` is null?" invites discussion. "You forgot to handle null" shuts it down.
6. Link to documentation or style guides when referencing a standard. This educates the author and reinforces the standard without repeating yourself.
7. Celebrate good code. Leave a positive comment when you see excellent design, clever use of patterns, or thorough tests. Positive reinforcement encourages quality.
8. Be explicit about severity. Prefix comments with [BLOCKING], [MAJOR], [MINOR], or [NIT] so the author knows which ones must be addressed before merge.
9. Respond to review comments within 24 hours during the work week. Stale reviews block the author and create merge conflicts.
10. After the review, reflect on patterns. If multiple reviews find the same class of issue (e.g., missing error handling), consider a team-wide discussion or a linter rule.

## Anti-patterns

1. **Bikeshedding**: Spending disproportionate time on trivial issues (indentation, variable names) while ignoring significant design problems. Prioritise correctness and security over style.
2. **Rubber-stamping**: Approving without meaningful review. This defeats the purpose of code review and creates false confidence. If you do not have time to review properly, decline the request.
3. **Design-by-committee**: Prolonged debate on subjective preferences (tab width, brace style) that have no measurable impact. Defer to the style guide and move on.
4. **Scope creep**: Suggesting unrelated changes during review that turn a focused PR into a refactoring project. If an improvement is outside the PR scope, file a separate issue.
5. **Drive-by reviewing**: Leaving a single comment on a trivial issue and approving without reviewing the rest of the diff. A review must be thorough or not done at all.
6. **Personality-focused feedback**: Comments like "you should know better" or "this is sloppy." Feedback must be about the code, not the person. Focus on what the code does and why it matters.
7. **Approval with unresolved blocking issues**: Clicking "approve" while leaving blocking comments unresolved. Approval signals confidence; if you are not confident, request changes.
8. **Reviewing from memory**: Assuming you understand the context without reading the diff carefully. Always check the actual lines changed.

## Edge Cases

1. **Security hotfix**: A security fix must be reviewed urgently. The process: author flags the PR as security-critical, reviewer drops everything to review, and a post-hoc review is scheduled if a full review cannot be completed immediately. The reviewer must verify the fix covers the vulnerability completely.
2. **Generated code**: Files that are machine-generated (protobuf stubs, OpenAPI clients, graphql types) should not be reviewed line by line. Trust the generator. Only review the generation configuration and any hand-written wrappers.
3. **Deadline pressure**: When a release deadline approaches, reviewers may feel pressure to approve quickly. Resist. A defect in production costs more than a delayed release. If the code is not ready, it is not ready.
4. **New team member**: For junior engineers or new hires, reviews are a teaching opportunity. Take extra time to explain rationale, link to documentation, and encourage questions. Lower the bar for acceptance to avoid discouraging the contributor.
5. **Conflicting reviewer feedback**: When two reviewers give contradictory feedback, the author should call it out explicitly. The reviewers then need to resolve the conflict before the PR can be approved. A third reviewer or team lead may arbitrate.
6. **Legacy code changes**: Changes to legacy code that does not follow current standards should be reviewed with relaxed style expectations. Improving legacy code is good; requiring a full rewrite to match modern conventions is counterproductive. Focus on correctness and incremental improvement.

## Validation Checklist

- [ ] Author self-reviewed the diff before requesting review.
- [ ] PR description clearly states what the change does and why.
- [ ] CI is green (lint, typecheck, unit tests, integration tests, security scan).
- [ ] PR size is under 400 lines of diff; if not, author has provided a justification.
- [ ] All blocking comments have been addressed or explicitly declined with justification.
- [ ] No hardcoded secrets, credentials, or tokens in the diff.
- [ ] New code includes appropriate tests (unit, integration, or e2e as appropriate).
- [ ] No dead code, commented-out code, or TODOs without linked issues.
- [ ] Security-sensitive changes have explicit security reviewer approval.
- [ ] Changes to API contracts (OpenAPI, GraphQL, protobuf) are backwards-compatible or have a documented migration plan.
- [ ] Database migrations are reversible or have a rollback plan.
- [ ] Changelog entry is present if the change is user-facing or operationally significant.

## Engineering Examples

### Example 1: Reviewing a security-sensitive change

A developer submits a PR adding a CSV export endpoint. The diff shows:

```python
@app.post("/export/csv")
def export_csv(request: Request):
    query = request.json()["query"]
    results = db.execute(f"SELECT * FROM orders WHERE {query}")
    return Response(results.to_csv(), media_type="text/csv")
```

The reviewer immediately flags this as blocking: raw string interpolation in SQL is a SQL injection vulnerability. The comment reads:

"[BLOCKING] SQL injection: `query` is interpolated directly into the SQL string. An attacker can pass `1=1; DROP TABLE orders` as the query parameter. Use parameterised queries or a query builder that escapes inputs."

The reviewer also flags a major issue: the endpoint has no authentication check. The comment reads:

"[MAJOR] Missing authentication: this endpoint exposes all order data without verifying the user's identity or permissions."

The reviewer stops the security pass and notifies the author. The author fixes both issues and requests re-review. The reviewer verifies the fix uses parameterised queries and adds an auth decorator, then approves. Two blocking issues caught before deployment.

### Example 2: Providing constructive feedback on architecture

A PR introduces a new billing module with a single `BillingService` class that handles plan selection, invoice generation, payment processing, and email notifications—roughly 800 lines. The reviewer recognises this as a god class and provides architectural feedback:

"[MAJOR] `BillingService` mixes four distinct responsibilities: plan management, invoicing, payment processing, and notification. This makes testing difficult (any change to email formatting requires running payment tests) and violates the Single Responsibility Principle. Propose splitting into `PlanManager`, `InvoiceGenerator`, `PaymentProcessor`, and `NotificationService`. Each class would be ~200 lines with focused test suites."

The reviewer links to the project's architecture guidelines and offers to pair on the extraction. The author agrees, splits the class, and the resulting PR is cleaner. The reviewer approves after verifying each new class has dedicated tests and the wiring (dependency injection) is correct.

### Example 3: Reviewing a large PR by focusing on the right things

A 1200-line PR adds a real-time collaboration feature with WebSocket support, conflict resolution, and presence indicators. The normal 400-line rule would apply, but the author argues that splitting would break the feature's coherence. The reviewer agrees but applies a focused review strategy:

1. First pass (30 minutes): review only the WebSocket message protocol and the conflict resolution algorithm. These are the most complex and riskiest parts. Find a subtle bug in the merge logic where concurrent edits to the same document position cause data loss. Flag as blocking.
2. Second pass (30 minutes): review the presence indicator UI and the test suite. The presence code is straightforward and well-tested. No issues.
3. Third pass (30 minutes): review the database schema changes for collaboration metadata. Find a missing index that would cause a full table scan on every document open for large workspaces. Flag as major.
4. Final review: after the author fixes the merge bug and adds the index, the reviewer checks the fixes and approves. The reviewer notes that the focused approach—protocol, then algorithm, then schema—caught the two highest-severity issues without getting lost in the PR's size.
