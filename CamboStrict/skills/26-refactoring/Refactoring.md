# Refactoring

## Purpose

Improve the internal structure of existing code without changing its external behaviour. Refactoring reduces technical debt, improves readability, lowers maintenance costs, and makes the codebase easier to extend with new features. It is a disciplined technique, not a mandate to rewrite everything.

## Responsibilities

- Identify code that needs refactoring: excessive complexity, duplication, coupling, or rigidity.
- Ensure refactoring changes are behaviour-preserving—no new features, no bug fixes, no API changes.
- Maintain test coverage before, during, and after refactoring. Tests are the safety net that makes refactoring safe.
- Keep refactoring commits isolated from feature commits to simplify review and bisection.
- Educate the team on refactoring patterns, techniques, and the value of incremental improvement.
- Apply the boy scout rule: leave the codebase cleaner than you found it, even on small changes.

## Decision Process

1. Identify the code that needs refactoring. Signals: the class is too large (>300 lines), the method is too long (>30 lines), the cyclomatic complexity is too high (>10), there are duplicated code blocks, or adding a new feature requires touching too many places.
2. Verify that the code has adequate test coverage. Use code coverage tools to identify untested paths. If coverage is below 70% for the module being refactored, write characterisation tests first that capture the current behaviour before making any changes.
3. Choose the refactoring technique based on the code smell:
   - Long method → Extract Method or Replace Temp with Query.
   - Large class → Extract Class or Extract Module.
   - Duplicate code → Pull Up Method or Form Template Method.
   - Long parameter list → Introduce Parameter Object or Preserve Whole Object.
   - Conditional complexity → Replace Conditional with Polymorphism or Introduce Strategy.
4. Apply the refactoring in the smallest possible step. Each step compiles and tests pass. If a step breaks the build, roll back and try a smaller step.
5. Run the full test suite after each step. If a test fails, the refactoring introduced a behaviour change—revert the last step and re-apply more carefully.
6. Commit after each successful step. Each commit should represent a single, coherent behavioural-preserving transformation. This makes the refactoring easy to review and easy to revert if necessary.
7. After all refactoring steps are complete, run the full test suite one final time. Also run performance benchmarks if the refactored code is in a hot path.
8. Open a pull request that contains only refactoring commits. Do not mix refactoring with feature work in the same PR. The review should focus on verifying that behaviour is preserved.
9. If the refactoring reveals a bug (a test that was passing but should have been failing), fix the bug in a separate commit after the refactoring is merged. Do not mix bug fixes into refactoring commits.
10. Document the refactoring in the codebase if it introduces new abstractions or changes module boundaries. Update or add architecture decision records as needed.

## Inputs

- Code coverage reports identifying untested or low-coverage modules
- Complexity metrics (cyclomatic complexity, class coupling, method length, nesting depth)
- Linter or static analysis reports flagging code smells
- Engineering team's pain points: modules that are frequently buggy, hard to extend, or slow to build
- Architecture decision records describing current module boundaries
- Test suite that can be run locally and in CI

## Outputs

- Refactored code with improved structure, reduced complexity, and preserved behaviour
- Test suite that still passes with the same assertions (no tests modified unless assertions were testing implementation details)
- Commit history with isolated, reviewable refactoring steps
- Updated architecture documentation if module boundaries changed
- Removal of deprecated code, dead code, or commented-out code encountered during refactoring

## Rules

1. Never refactor code that does not have tests. Without tests, you cannot verify that behaviour is preserved. Write characterisation tests first.
2. Never refactor and add a feature in the same commit. The two activities have different goals: refactoring changes structure, features change behaviour. Mixing them makes reviews impossible and bisection unreliable.
3. Never refactor code that is about to be deleted or replaced. If a module is scheduled for removal, leave it alone. Time spent refactoring deprecated code is wasted.
4. Do not optimise and refactor simultaneously. Optimisation changes performance characteristics; refactoring should not. If the code is both complex and slow, refactor first to make the optimisation obvious, then optimise in a separate step.
5. Do not rename symbols during refactoring unless the rename is part of the structural change. Widespread renaming creates noise in the diff and hides the actual structural changes.
6. Do not introduce new dependencies during refactoring. Refactoring should reduce coupling, not increase it. If you need a new library, that is a separate decision.
7. Each refactoring step must be reversible. If the tests break, you should be able to undo the last change without affecting other work. This means small, frequent commits.
8. Do not refactor public APIs that are consumed by external teams without a deprecation plan. Changing public APIs is a breaking change, not a refactoring.
9. Run the linter after each refactoring step. If the linter catches issues, fix them in the same step. A clean linter pass confirms the refactoring did not introduce style inconsistencies.
10. Stop refactoring if you are tired. Fatigue leads to mistakes. Refactoring requires full concentration because you are working without a safety net of new tests.

## Best Practices

1. Apply the boy scout rule on every change: if you touch a file for a feature or a bug fix, leave it slightly cleaner than you found it. Rename a bad variable, extract a small method, remove a dead comment. Small improvements compound.
2. Use automated refactoring tools (IDE refactoring commands, codemods, sed) for mechanical transformations. Manual refactoring is error-prone for operations like rename, move, or extract.
3. Keep refactoring sessions timeboxed. Set a timer for 60 minutes. If the refactoring is not complete, stop and commit the current state. Unfinished refactoring in progress is worse than no refactoring.
4. Refactor in the direction of the design you want, not away from it. If the team has agreed on hexagonal architecture, refactor toward hexagonal boundaries. If you are adopting CQRS, refactor read and write models separately.
5. Start with the most painful code. The module that everyone hates, that causes the most bugs, or that blocks every feature is the highest-value refactoring target. Do not waste effort on code that works fine.
6. Use the "strangler fig" pattern for large-scale refactoring of critical systems. Build the new implementation alongside the old one, route traffic incrementally, and remove the old implementation only when the new one is proven.
7. Pair or mob on complex refactoring. Two pairs of eyes catch behavioural changes that a single developer might miss. Pairing also transfers knowledge of the refactored code to multiple team members.
8. Measure before and after. If the refactoring aims to improve performance, measure the baseline. If it aims to reduce complexity, measure the cyclomatic complexity. If it aims to improve testability, measure the test setup boilerplate. Numbers validate the effort.
9. Write characterisation tests by running the code against known inputs and recording the outputs. These tests capture current behaviour without asserting correctness. They serve as a safety net during refactoring and can be replaced with proper tests later.
10. Prefer composition over inheritance during refactoring. Inheritance hierarchies are rigid and hard to refactor. Composition with interfaces allows you to swap implementations without changing consumers.

## Anti-patterns

1. **Big-bang refactoring**: Stopping all feature work for weeks to "clean up" the entire codebase. This is a rewrite, not a refactoring. It carries enormous risk, blocks the team, and often produces a new set of problems. Always refactor incrementally.
2. **Refactoring for its own sake**: Cleaning up code that works perfectly well and is never touched. Refactoring has a cost (review time, testing, merge conflicts). Only refactor code that is causing measurable pain.
3. **Refactoring without tests**: Making structural changes in a codebase that has no tests and hoping nothing breaks. This is not refactoring—it is risky editing. Write characterisation tests first.
4. **Mixing refactoring with feature work**: A single commit that says "refactored UserService and added avatar upload." The reviewer cannot distinguish structural changes from behavioural changes. Keep them separate.
5. **Golden-hammer refactoring**: Applying the same pattern (Strategy, Factory, Singleton) to every problem regardless of appropriateness. Refactoring should simplify, not over-engineer. A simple if-else chain is sometimes better than a polymorphic hierarchy.
6. **Refactoring public APIs without migration**: Changing the signature of a public function and updating all callers in the same commit without a deprecation period. External consumers break silently. Use deprecation annotations and a migration window.
7. **Refactoring third-party code**: Modifying library code inside node_modules or vendor directories. This creates a fork that must be maintained forever. If you need different behaviour, wrap the library in your own abstraction.

## Edge Cases

1. **Dead code removal**: Removing unused code during refactoring seems safe, but the code might be used by a runtime reflection mechanism (dependency injection container, ORM, plugin system). Verify usage with a text search and runtime checks before deleting.
2. **Performance regression**: A refactoring that improves readability might introduce performance regressions (e.g., replacing a loop with a more readable but slower collection operation). Profile hot paths before and after refactoring. If the regression is unacceptable, keep the faster version but add a comment explaining the trade-off.
3. **Concurrent access**: Refactoring code that is accessed by multiple threads. Extracting a method that accesses shared state can change locking behaviour if the original code held a lock across a larger scope. Trace lock boundaries carefully.
4. **Serialization compatibility**: Refactoring classes that are serialized (JSON, binary, database columns). Renaming fields or changing types breaks serialization with stored data. Use serialization aliases or migration scripts.
5. **Null safety changes**: Refactoring that changes a nullable field to non-nullable (or vice versa) can break callers that depend on the nullability contract. Update all callers in the same refactoring step and verify with a type checker.
6. **Framework constraints**: A refactoring that removes a framework-required convention (e.g., removing a parameter from a method that a DI container uses for constructor injection) will break the framework integration. Understand framework constraints before refactoring.

## Validation Checklist

- [ ] The test suite passes before any refactoring begins (baseline).
- [ ] Characterisation tests exist for any code that lacks unit tests.
- [ ] Refactoring commits are isolated from feature and bug-fix commits.
- [ ] Each refactoring commit compiles and tests pass.
- [ ] Cyclomatic complexity of refactored methods is ≤ 10.
- [ ] Method length of refactored methods is ≤ 30 lines.
- [ ] Class length of refactored classes is ≤ 300 lines.
- [ ] No new dependencies were introduced.
- [ ] No public API signatures were changed without a deprecation plan.
- [ ] Linter passes on all refactored files.
- [ ] Performance benchmarks show no regression on hot paths.
- [ ] Architecture documentation is updated if module boundaries changed.
- [ ] No dead or commented-out code remains after refactoring.
- [ ] The team agrees that the refactored code is simpler than the original.

## Engineering Examples

### Example 1: Extracting a god class into smaller modules

A `ReportGenerator` class grew to 1200 lines over two years. It handles data fetching, CSV formatting, PDF rendering, email sending, and scheduling. The original class:

```python
class ReportGenerator:
    def generate_csv(self, report_id): ...
    def generate_pdf(self, report_id): ...
    def send_email(self, report_id, recipients): ...
    def schedule_report(self, cron_expr): ...
    def _fetch_data(self, report_id): ...
    def _format_csv(self, data): ...
    def _format_pdf(self, data): ...
    # ... 15 more private methods
```

The refactoring extracted five focused classes:

```python
class ReportDataFetcher:
    def fetch(self, report_id): ...

class CsvFormatter:
    def format(self, data): ...

class PdfFormatter:
    def format(self, data): ...

class EmailSender:
    def send(self, report, recipients): ...

class ReportScheduler:
    def schedule(self, cron_expr, report_id): ...
```

Each class is under 200 lines with a single responsibility. The original `ReportGenerator` becomes a facade that delegates to the five classes. Testing improved: `CsvFormatter` is tested with a dictionary and asserts string output (2ms), `EmailSender` is tested with a fake mail server (50ms). The refactoring was done over five separate PRs, one per extraction, with characterisation tests written first for the original class.

### Example 2: Refactoring conditional logic to polymorphism

An order discount calculator had deeply nested conditionals:

```python
def calculate_discount(order):
    if order.customer.is_vip:
        if order.total > 1000:
            return order.total * 0.2
        else:
            return order.total * 0.1
    elif order.is_holiday_season:
        return order.total * 0.15
    elif order.coupon and order.coupon.type == "percentage":
        return order.total * (order.coupon.value / 100)
    elif order.coupon and order.coupon.type == "fixed":
        return order.coupon.value
    else:
        return 0
```

Each new discount rule required adding another `elif`. The refactoring used the Strategy pattern:

```python
class DiscountStrategy:
    def apply(self, order): ...

class VipDiscount(DiscountStrategy):
    def apply(self, order):
        rate = 0.2 if order.total > 1000 else 0.1
        return order.total * rate

class HolidayDiscount(DiscountStrategy):
    def apply(self, order):
        return order.total * 0.15

class CouponDiscount(DiscountStrategy):
    def apply(self, order):
        if order.coupon.type == "percentage":
            return order.total * (order.coupon.value / 100)
        return order.coupon.value

class NoDiscount(DiscountStrategy):
    def apply(self, order):
        return 0
```

The calculator selects strategies dynamically: `discount = strategy_factory.for_order(order).apply(order)`. Adding a new discount type now requires a new class and a registration in the factory—no existing code changes. The refactoring was verified by running characterisation tests that recorded the original output for 200 test orders, then comparing outputs after the refactoring.

### Example 3: Applying the strangler pattern to replace a legacy system

A monolithic billing system handles subscription management, invoicing, and payment processing. The team wants to replace it with a microservice-based solution without a big-bang rewrite.

The strangler fig approach:

1. **Build the new service alongside the old one**: The new billing microservice is deployed with its own database. Initially it serves no traffic.
2. **Route new functionality to the new service**: A new subscription plan type is implemented only in the new service. The monolith has a fallback path that returns an error for unrecognized plan types. The API gateway routes requests for the new plan type to the new service.
3. **Migrate existing functionality gradually**: Invoice generation is migrated next. The gateway intercepts invoice requests and calls both the monolith and the new service. A comparison job logs discrepancies but serves the monolith's response to the customer. After two weeks of no discrepancies, the gateway switches to the new service.
4. **Redirect traffic incrementally**: Payment processing is migrated by routing 10% of payment requests to the new service, then 25%, 50%, 75%, 100%. At each step, errors are monitored and the percentage is rolled back if error rates increase.
5. **Decommission the old system**: Once all traffic runs through the new service and the monolith serves zero requests for billing functionality for one month, the monolith's billing module is removed. The team deletes the old code, updates the build configuration, and removes the gateway routing rules.

The strangler pattern took six months but had zero customer-facing incidents. Each migration step was independently reversible. The key was never routing all traffic to the new service until it was proven in production at lower traffic levels.
