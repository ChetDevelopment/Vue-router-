# Technical Debt Management

## Purpose

The Technical Debt Management skill provides a systematic framework for identifying, tracking, prioritizing, and repaying technical debt while balancing feature delivery velocity. It treats technical debt as a financial concept: debt incurred (deliberately or inadvertently) must be tracked with its principal (effort to fix) and interest (ongoing cost of not fixing). The goal is not to eliminate all debt (some debt is strategic), but to ensure that debt is visible, intentional, and managed, so that it does not accumulate to the point where it blocks feature delivery, increases defect rates, or makes the system unmaintainable.

## Responsibilities

- Classify technical debt by type (code debt, architecture debt, infrastructure debt, testing debt, documentation debt) and by origin (deliberate vs. inadvertent).
- Establish a technical debt register that captures each debt item with description, location, estimated principal (person-days), estimated interest (recurring cost per sprint), and owner.
- Prioritize debt repayment based on the ratio of interest cost to principal, focusing on high-interest items that actively slow down development or increase defect rates.
- Define and apply refactoring strategies appropriate to each debt type: incremental refactoring for code debt, strangler fig pattern for architecture debt, infrastructure-as-code updates for infrastructure debt.
- Repay debt incrementally as part of regular feature work, rather than requiring dedicated "refactoring sprints" which conflict with feature delivery goals.
- Prevent new debt through code review standards, architectural guidelines, and automated quality gates in CI/CD pipelines.
- Communicate technical debt to stakeholders (product managers, engineering leadership) in terms of business impact: delayed features, increased bug rates, slower onboarding, higher operational cost.
- Monitor debt trends over time: is the total principal increasing or decreasing? Is interest per sprint going up or down? Use this data to make investment decisions.
- Advocate for "pay as you go" culture: leave code cleaner than you found it, address debt when you touch the code, and do not let new debt exceed approved limits.

## Decision Process

1. **Identify the debt item.** Detect technical debt through code review comments, bug patterns, slow test suites, high cyclomatic complexity, duplicate code, or manual deployment steps. Every team member is responsible for surfacing debt. Use static analysis tools (SonarQube, CodeClimate, ESLint complexity rules, FindBugs) to automatically detect candidates.

2. **Classify the debt type and origin.** Is it code debt (messy code, dead code, copy-paste), architecture debt (circular dependencies, god classes, no separation of concerns), infrastructure debt (manual provisioning, no IaC, outdated dependencies), testing debt (missing tests, flaky tests, slow test suite), or documentation debt (stale or missing docs)? Is it deliberate (accepted to meet a deadline) or inadvertent (accumulated without awareness)?

3. **Estimate the principal.** The principal is the effort required to fix the debt properly. Use person-days or story points. Be honest but not overly precise: a range (2-4 days) is fine. If the debt is large (>10 person-days), consider breaking it into smaller, independently repayable items.

4. **Estimate the recurring interest.** The interest is the ongoing cost of keeping the debt. Examples: 30 minutes per feature change spent working around the debt, 2 hours per sprint on deployment workarounds, 1 bug per sprint caused by the debt, 3 days onboarding delay for new developers. Quantify in person-hours per sprint or per month. If the interest is zero, the debt might be acceptable indefinitely.

5. **Calculate the interest-to-principal ratio.** Divide monthly interest by principal. Example: principal = 5 days, interest = 2 days/month → ratio = 0.4. A ratio > 0.2 means the debt repays itself within 5 months. Prioritize items with the highest interest-to-principal ratio.

6. **Assess the context.** Consider other factors: the debt is in code that rarely changes (low interest now, but high risk if the code needs to change in the future), the debt blocks a specific feature (immediate business impact), or the debt affects the entire team (higher priority than debt affecting one developer).

7. **Decide to repay, defer, or accept.** If the interest-to-principal ratio is high (>0.2) and the context warrants it, schedule repayment. If the ratio is low (<0.05) and the debt is stable, accept it and add to the register for periodic review. If the ratio is moderate, defer with a review date. Never ignore debt; always record it.

8. **Plan the repayment.** Integrate repayment into regular feature work. The "boy scout rule": leave the code cleaner than you found it. When touching a debt-laden file, refactor 10-20% more than the feature requires. Use the "strangler fig" pattern for architectural debt: gradually route functionality to new implementations while keeping the old system running.

9. **Validate the fix.** After repaying the debt, measure the impact: did the test suite get faster? Did the bug count in that area decrease? Did feature velocity improve? Share these metrics with the team to reinforce the value of debt management.

10. **Prevent recurrence.** Update coding standards, add linter rules, or improve architecture guidelines to prevent similar debt from accumulating. If the debt was inadvertent, determine the process gap that allowed it and close it.

## Inputs

- Static analysis reports from SonarQube, CodeClimate, ESLint, or similar tools.
- Code review comments that identify maintainability concerns.
- Bug tracker data: bugs clustered in specific modules or areas of the codebase.
- Test suite performance data: test execution times, flaky test frequency.
- Deployment pipeline metrics: manual steps, failure rates, time to deploy.
- Developer surveys: "Which part of the codebase is hardest to work with?"
- Onboarding feedback: "What was hardest to learn about the system?"
- Architecture review findings and ADR records that document known tradeoffs.
- Dependency vulnerability scans that require updates.

## Outputs

- Technical debt register with all identified items, their classification, principal, interest, and priority.
- Prioritized repayment plan for the next quarter, integrated into the feature roadmap.
- Refactoring changelist: an inventory of completed debt repayment with before/after metrics.
- Updated coding standards and linter rules that prevent specific categories of new debt.
- Stakeholder-friendly report that explains debt in business terms: "We are spending 30% of our sprint capacity working around legacy code."
- Quarterly debt trend report: is total principal increasing or decreasing? What is the average interest per sprint?
- Architecture migration plan (strangler fig or incremental) for major architectural debt.

## Rules

1. Every technical debt item must be recorded in the register before any repayment effort is estimated. Unrecorded debt is invisible and cannot be managed.
2. Deliberate debt must be documented at the time it is incurred, including the reason, the expected lifespan, and the plan for repayment. A code comment with `// TECHDEBT: reason, tracked in issue #123` is required.
3. Interest must be quantified in business terms. "This makes the code messy" is not a valid interest statement. "This adds 15 minutes to every code review" is.
4. Debt repayment must never exceed 20% of sprint capacity without explicit stakeholder agreement. Feature work cannot be held hostage by refactoring.
5. A debt item must be repaid before the accumulated interest exceeds the principal. If a 5-day debt costs 2 days per month in interest, it must be repaid within 3 months.
6. New features must not make existing debt worse. If a feature touches a debt-laden area, the developer must refactor at least enough to prevent the debt from expanding.
7. Every team member is responsible for identifying and reporting debt. It is not the sole responsibility of the tech lead or architect.
8. The debt register must be reviewed at least once per quarter. Items that are no longer relevant (code was deleted, architecture was replaced) must be removed.
9. No "refactoring sprints" unless the debt is blocking all feature work. Prefer incremental repayment as part of regular sprints. A dedicated refactoring sprint signals that debt management has failed.
10. Technical debt that results in production incidents (P0 or P1) triggers an automatic review of the debt item, re-evaluation of its priority, and a plan for repayment within the next sprint.

## Best Practices

- Track debt items in the same system as features and bugs (JIRA, Linear, GitHub Issues). Tag them with a `tech-debt` label. This makes debt visible alongside feature work during sprint planning.
- Use the "boy scout rule" as a team norm: every time you touch a file, leave it slightly better. This compounds over time and prevents debt from growing in areas that are actively maintained.
- Apply the "threshold rule" for static analysis: set quality gates that reject new code exceeding complexity or duplication thresholds. This prevents new debt from entering the codebase.
- Conduct a 30-minute "debt walk" every sprint. The team walks through the codebase (virtually, using a shared screen) and spends 30 minutes fixing small debt items. This builds the habit of incremental improvement.
- Use the "strangler fig pattern" for replacing legacy modules: build the new module alongside the old one, route new features to the new module, and incrementally migrate existing functionality. Never rewrite from scratch.
- Pair the best developer on the team with the least experienced developer to refactor debt-laden code. This transfers knowledge about the codebase and prevents the same debt from recurring.
- Measure the "time to implement a standard feature" in different parts of the codebase. If feature development takes 2× longer in module A than module B, module A has high-interest debt.
- Limit work in progress (WIP): when the team has 3+ active features in flight, debt repayment is deprioritized. Reduce WIP to 1-2 features to create space for debt management.
- Automate debt detection in CI/CD. Add a CI step that runs complexity checkers, duplication detectors, and dependency analyzers. Break the build if new code exceeds thresholds.
- Celebrate debt repayment publicly. When a significant debt item is repaid, share it in the team channel with before/after metrics. This reinforces the value of debt management.

## Anti-patterns

- **The "big rewrite" trap.** Deciding to rewrite the entire system from scratch to eliminate debt. This ignores the business value of the existing system and introduces massive risk. Always use incremental migration strategies.
- **Ignoring interest.** Tracking debt without considering interest leads to all debt being treated equally, making it impossible to prioritize. Without interest data, the team cannot defend debt repayment to stakeholders.
- **Shaming deliberate debt.** Deliberate debt is a valid strategy for meeting deadlines. It should be tracked and managed, not criticized. What matters is that it is intentional and has a repayment plan.
- **Refactoring for its own sake.** Refactoring code that never changes and will never change is wasted effort. Focus on debt in high-churn areas where the interest is highest.
- **Treating all debt as equal.** A 1-day debt in a critical path with daily interest is more important than a 10-day debt in an unused module with zero interest. Prioritize by interest, not by principal.
- **Guilt-driven development.** Developers refactor because they feel guilty about messy code, not because the refactoring is justified by business value. Objectively calculate interest to avoid emotional decision-making.
- **One-time "cleanup" sprints.** The team spends one sprint cleaning up debt, then returns to old habits. Debt accumulated again within 2 months. The only sustainable approach is incremental repayment integrated into regular work.

## Edge Cases

- **Legacy system with no tests and high debt.** The principal to fix all debt is estimated at 200 person-days. The interest is 10 person-days per sprint (50%). The team cannot stop feature work for 10 sprints. They must use the strangler fig approach: build new features in a new clean module and incrementally migrate functionality, starting with the highest-interest areas.
- **Debt that is cheaper to keep than to fix.** A piece of code generates 30 minutes of interest per month and would take 5 days to fix. The interest-to-principal ratio is 0.005. Over 5 years, the cumulative interest is 30 hours, which is less than the 40-hour principal. This debt is better left alone and only fixed if the code needs substantial changes.
- **Debt in code that is being replaced.** A deprecated module has high debt, but the team plans to replace it within 2 months. Should they refactor? No. The debt will be replaced. Do not invest in code that is being deprecated.
- **Debt introduced by a third-party library.** A library upgrade introduces breaking changes that require 20 days of work to migrate. This is dependency debt. The interest includes security vulnerabilities and inability to use new features. Track it, assess the urgency (is the old library still supported?), and plan the upgrade.
- **Debt that causes production incidents.** A debt item has caused 3 incidents in the past quarter, each requiring 2 hours of on-call time. The interest includes not just engineering time but also customer impact and trust. This debt should be immediately escalated and prioritized.
- **Entropy debt in a growing team.** As the team grows, code quality naturally decreases because different developers have different standards and the codebase expands faster than it can be cleaned. This is normal. The team must invest more in automated quality enforcement as it grows.

## Validation Checklist

- [ ] A technical debt register exists and is accessible to the entire engineering team.
- [ ] Every item in the register has a description, classification, principal estimate, interest estimate, and owner.
- [ ] Debt items are prioritized by interest-to-principal ratio, not by subjective "messiness."
- [ ] The team repays debt incrementally: at least one debt item is partially or fully repaid per sprint.
- [ ] No feature work increases the principal of existing debt items.
- [ ] Deliberate debt has a documented reason and a plan for repayment in the register.
- [ ] Static analysis quality gates break the build when new code exceeds debt thresholds.
- [ ] The debt register is reviewed quarterly and items are updated or removed as needed.
- [ ] Stakeholders have visibility into debt: they know the top 3 debt items and their business impact.
- [ ] The team tracks debt trends (total principal, total interest per sprint) over time.
- [ ] Production incidents caused by debt trigger an automatic review and repayment plan.

## Engineering Examples

### Example 1: Prioritizing Tech Debt Repayment Based on Interest Cost

A team maintains a payment processing module with three debt items:

**Item A: Duplicate payment validation logic.** Validation logic is copied across 5 different services. When a validation rule changes, all 5 copies must be updated. Every sprint, the team spends 4 hours updating these copies (interest). Principal to extract into a shared library: 3 days (24 hours). Interest-to-principal ratio: 0.17/month.

**Item B: Monolithic test suite.** All 500 tests run in a single file, taking 45 minutes. Developers run tests less frequently, leading to bugs caught late. Every sprint, the team collectively wastes 8 hours waiting for tests (interest). Principal to split tests into parallel suites: 5 days (40 hours). Interest-to-principal ratio: 0.20/month.

**Item C: Manually provisioned Redis cluster.** Adding a new cache requires 2 hours of manual work per change. The team averages one cache add per sprint (2 hours interest per sprint). Principal to automate with Terraform: 2 days (16 hours). Interest-to-principal ratio: 0.125/month.

The team prioritizes Item B (highest ratio at 0.20), then Item A (0.17), then Item C (0.125). Items B and A together cost 12 hours per sprint. After repayment, the team would save 12 hours per sprint. At a ratio of 0.17 and 0.20, these items pay for themselves in approximately 5 to 6 sprints.

The team schedules Item B in the next sprint (2 developers, 2.5 days each), Item A in the following sprint (1 developer, 3 days), and Item C in the backlog for the next quarter.

### Example 2: Creating a Tech Debt Register

A team with 6 developers creates a lightweight tech debt register using a shared spreadsheet (later migrated to GitHub Issues with a `tech-debt` label).

The register columns:
| ID | Description | Location | Type | Origin | Principal (days) | Interest (hours/sprint) | Ratio | Priority | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| TD-001 | Duplicate validation logic | `services/*/validation.js` | Code | Deliberate | 3 | 4 | 0.17 | High | Alice | In progress |
| TD-002 | Monolithic test suite | `tests/unit.js` | Testing | Inadvertent | 5 | 8 | 0.20 | High | Bob | Planned (sprint 12) |
| TD-003 | Manual cache provisioning | `infra/redis/*` | Infra | Deliberate | 2 | 2 | 0.125 | Med | Carol | Backlog |
| TD-004 | No error handling in old billing code | `services/billing/legacy.js` | Code | Inadvertent | 4 | 0 (no change) | 0 | Low | – | Accept |
| TD-005 | Stale architecture docs | `docs/architecture.md` | Docs | Inadvertent | 1 | 0.5 | 0.0625 | Low | – | Deferred |

The register is reviewed every 2 weeks during the retrospective. New items are added based on code review comments, developer feedback, and static analysis reports. When an item is repaid, the before/after metrics are recorded in the register.

After 3 months, the team reviews trends: total principal decreased from 15 days to 11 days, interest per sprint decreased from 14.5 hours to 8 hours. The team shares this data with the engineering manager to demonstrate the impact of debt management.

### Example 3: Making the Case for a Refactoring Investment

The frontend team's React codebase has accumulated significant technical debt: components are tightly coupled, state management is inconsistent, and the build takes 12 minutes. Feature velocity has dropped 30% over the past 6 months. The team needs to convince the product manager to allocate engineering time to refactor.

The team prepares a business case:

**Current state:**
- Average time to implement a standard feature: 5 days (was 3.5 days 6 months ago).
- Average time to fix a bug: 2 days (was 1 day).
- Build time: 12 minutes (was 3 minutes), running 20 times per day = 3 hours of collective waiting per day.
- Onboarding time for new developers: 4 weeks (was 2 weeks).

**Debt items and their interest:**
- Tightly coupled components (principal: 10 days, interest: 2 days per feature due to unintended side effects).
- Slow build (principal: 5 days to optimize Webpack, interest: 3 hours/day = ~1.5 days/sprint).
- Inconsistent state management (principal: 8 days, interest: 1 day per bug fix due to confusion).
- Missing component tests (principal: 12 days, interest: 1 day per bug fix because bugs are not caught early).

**Proposal:**
- Sprint 1: Optimize build (5 days). Expected result: build time drops to 3 minutes, saving 1.5 days per sprint.
- Sprint 2-3: Refactor core components to reduce coupling (10 days). Expected result: feature time drops from 5 days to 3.5 days.
- Sprint 4: Standardize state management (8 days). Expected result: bug fix time drops from 2 days to 1 day.
- Sustained effort: Add component tests as part of feature work (starts immediately, continues indefinitely).

**Return on investment:** After 3 months, the 23-day investment saves the team 3+ days per sprint (build time + fewer side effects + faster bug fixes). The investment pays for itself in approximately 8 sprints (2 months). Beyond that, the team gains 30% more feature capacity.

The product manager approves the investment because it is quantified in terms of feature velocity, not subjective "code quality."
