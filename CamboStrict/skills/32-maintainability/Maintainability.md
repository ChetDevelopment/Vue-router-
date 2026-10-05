# Maintainability

## Purpose

The Maintainability skill defines the standards and practices for writing code and designing systems that are easy to understand, change, and extend over time. It prioritizes the needs of future maintainers (including the original authors six months later) over cleverness or short-term velocity. The goal is to reduce the cost and risk of every future change by making the codebase predictable, well-structured, and well-documented. Maintainable software has lower defect rates, faster onboarding, and higher developer productivity.

## Responsibilities

- Write code that is readable and self-explanatory, with clear naming and a consistent style that follows team conventions.
- Enforce consistent naming conventions across the entire codebase for variables, functions, classes, modules, files, and database schemas.
- Apply the single responsibility principle at every level: functions do one thing, classes have one reason to change, modules have one concern, services have one domain boundary.
- Minimize dependencies between modules and enforce strict dependency direction (higher-level modules depend on lower-level abstractions, not concrete implementations).
- Design clear abstractions with well-defined interfaces that hide implementation details and make the contract explicit.
- Treat testability as a first-class design goal. If a component is hard to test, the design is flawed. Refactor until it is testable without mocking infrastructure.
- Maintain documentation that is useful to maintainers: architecture decision records (ADRs), module READMEs, complex algorithm explanations, and setup/run instructions.
- Participate in code reviews with the goal of knowledge sharing and collective code ownership, not just defect detection.
- Actively reduce cognitive load: break large methods into smaller ones, flatten deep nesting, validate early, and minimize mutable state.
- Continuously identify and refactor code that is becoming hard to maintain, before it reaches the threshold where a full rewrite is considered.

## Decision Process

1. **Assess the change footprint.** Before modifying any code, determine how many files, modules, and layers the change will touch. A change that touches more than 5 files across 3 different layers suggests a possible architectural issue. Consider whether the change indicates a missing abstraction or a violation of separation of concerns.

2. **Evaluate naming quality.** Read the code you need to change. Do the names clearly convey intent? Is there any name that requires reading the implementation to understand? Rename anything ambiguous. A function called `processData` tells the reader nothing. `calculateInvoiceTotal` tells everything.

3. **Apply single responsibility.** If a function or method does more than one thing, split it. "More than one thing" means: it has multiple distinct stages, it has side effects beyond its return value, or it can be described with an "and" or "then" in its name. Extract each concern into its own function.

4. **Analyze dependency graph.** For the module you are changing, identify its dependencies. Does it import from modules it should not know about? Is there a circular dependency? Does it depend on concrete implementations instead of interfaces? Refactor to invert dependencies where needed. Use dependency injection to decouple creation from usage.

5. **Design the abstraction.** Define the interface (contract) before implementing. What inputs does the caller provide? What outputs does it expect? What are the error conditions? Write the interface and its documentation first, then implement. This prevents the implementation details from leaking into the interface.

6. **Consider testability.** Can you write a unit test for the logic without spinning up a database, a cache, or an HTTP server? If not, extract the pure logic from the infrastructure code. The business logic should be testable with plain function calls and simple data structures. Infrastructure code should be thin and tested with integration tests.

7. **Write for the maintainer.** Assume the maintainer is a junior engineer who has never seen this code before. Add comments only where the code cannot be made self-documenting: explaining business rules, documenting non-obvious performance decisions, noting why a seemingly wrong approach was chosen. Do not comment the obvious; let the code speak.

8. **Validate consistency.** Check that the new code follows the same patterns as the existing code in the same module. If the team uses Result objects for error handling, do not throw exceptions. If the team uses async/await, do not use raw promises. Consistency is more important than personal preference.

9. **Review the change as a reviewer.** Before opening a pull request, self-review: does every file change have a clear purpose? Is there any dead code, commented-out code, debugging code, or "just in case" code? Is the change as small as it can be while still being correct?

10. **Document the "why."** If the change involves a non-obvious decision, add an architecture decision record (ADR) or comment explaining the context, alternatives considered, and the rationale for the chosen approach. This prevents future maintainers from reverting the decision without understanding it.

## Inputs

- The codebase itself, along with its version history and code review trails.
- Coding standards and style guides defined by the team (e.g., linter config, formatter config, naming conventions doc).
- Architecture decision records and technical design documents.
- Existing test suites (unit, integration, end-to-end) that define expected behavior.
- Onboarding documentation and setup instructions for new developers.
- Bug reports and feature requests that indicate areas of the codebase that are hard to maintain.
- Dependency inventories (package.json, go.mod, requirements.txt, Cargo.toml) and module dependency graphs.
- Code review comments and discussions that reveal maintainability concerns.

## Outputs

- Self-documenting code: names that convey intent, functions that do one thing, modules with clear responsibility.
- Consistent codebase: linter and formatter pass, naming conventions are followed, patterns are uniform across modules.
- Testable components: business logic isolated from infrastructure, pure functions where possible, dependency injection used throughout.
- Clear module boundaries with enforced dependency direction (no circular deps, no upward dependencies from lower layers).
- Useful documentation: module READMEs, ADRs, complex algorithm explanations, which are kept up to date with code changes.
- Reduced cognitive load: small functions, shallow nesting (max 3 levels), early returns, minimal mutable state.
- Code that is safe to change: high test coverage (>80%) on critical paths, tests that fail meaningfully when behavior changes.
- Collective code ownership: every team member is familiar with multiple areas of the codebase and can make changes outside their primary domain.

## Rules

1. Every function must do one thing. If a function name contains "and", split it. If a function has more than 20 lines of logic, consider splitting it. If a function has more than 3 parameters, consider a parameter object.
2. Every name must reveal intent. A name like `data`, `info`, `temp`, `result`, `helper`, `util`, `manager`, or `processor` is always wrong. Rename it with something that describes what it is or what it does.
3. Nesting must not exceed 3 levels deep. If you need more than 3 levels of `if`, `for`, `while`, or `try-catch` nesting, extract the inner logic into a separate function.
4. No function may have more than 30 lines of executable code (excluding blank lines and comments). This is a hard limit. If a function exceeds 30 lines, it is doing too much.
5. No file may have more than 400 lines of code. If a file exceeds 400 lines, it contains too many abstractions and should be split into multiple files by concern.
6. Every public function, class, module, and interface must be documented. Documentation must describe the "what" and "why," not the "how." The code itself describes the "how."
7. No circular dependencies between modules. If module A imports from B and B imports from A, the design is wrong. Extract the shared code into a third module or introduce an interface.
8. Every change must be accompanied by tests that cover the changed logic. If the change fixes a bug, the test must cover the bug scenario. If the change adds a feature, the test must cover success and failure paths.
9. No code may be committed without running the linter and formatter. Linting errors are not warnings; they are failures. Formatted code is not optional; it is enforced by automation.
10. No dead code may remain in the codebase. If a function, class, or file is no longer used, delete it. Do not comment it out. Do not leave it "just in case." If it is needed later, version control will bring it back.

## Best Practices

- Use domain-driven design (DDD) to align module boundaries with business domains. Each bounded context gets its own module with a clear public API and hidden internal implementation.
- Write tests as documentation. A well-written test reads like a specification: `it("calculates tax for a gift card purchase with no tax zone")`. Tests that are hard to read indicate maintainability issues in the production code.
- Minimize mutable state. Prefer immutable data structures. When mutation is unavoidable (performance, interoperability), document why and encapsulate it behind a safe interface.
- Use dependency injection consistently. Pass dependencies as constructor parameters or function arguments. Avoid static service locators, global state, and `new` keyword inside business logic.
- Use linter rules that enforce maintainability: maximum function length, maximum cyclomatic complexity, maximum nesting depth, ban on `todo` and `fixme` without an associated ticket number.
- Keep the build fast. If a full build takes more than 10 minutes, improve the build system or split the monolith into micro repos. A slow build discourages frequent commits and thorough testing.
- Remove complexity aggressively. Every abstraction, every design pattern, every library dependency adds cognitive load. If simpler code works, use it. Do not add patterns that are not needed yet.
- Use version control history to understand the "why." When reading unfamiliar code, use `git blame` to see when and why it was last changed. Reference the commit message and linked ticket for context.
- Establish a coding standard document that goes beyond syntax formatting. Cover naming conventions, error handling patterns, logging standards, and test organization rules. Update it quarterly.
- Rotate code review responsibilities. Every team member should review code from every other team member. This spreads knowledge, reduces bus factor, and prevents specialized silos.

## Anti-patterns

- **The God class.** A class with hundreds of lines and dozens of methods that handles everything from data access to business logic to UI formatting. It violates single responsibility and is impossible to test or change safely.
- **Comments that explain "what" instead of "why."** `// increment counter` is useless. `// Use pre-increment because the compiler generates one fewer instruction on ARM` is useful. Aim for no comments needed because the code is self-explanatory.
- **Copy-paste reuse.** Duplicating code because it is "faster than refactoring" creates maintenance debt. When the duplicated code needs to change, it must be found and changed in every copy. Extract once, use everywhere.
- **Premature abstraction.** Creating interfaces, factories, and visitor patterns before they are needed. This adds complexity without proven benefit. Follow the rule of three: abstract only when the same pattern appears in three places.
- **Shotgun surgery.** A single logical change requires editing many files across different modules. This indicates poor separation of concerns. The change should be contained within one module or a small number of related files.
- **Leaky abstractions.** An interface that exposes implementation details (e.g., requiring the caller to close a database connection, or passing configuration options that are specific to one implementation). The caller should not need to know how the abstraction is implemented.
- **Ignoring the IDE.** If the IDE highlights a warning (unused variable, unused import, possible null reference), fix it. Treat warnings as errors. Every ignored warning is a potential bug or maintenance burden.

## Edge Cases

- **Temporary code that becomes permanent.** A quick fix "just for now" that remains for years. Always add a warning: linter config that forbids `TODO` without a linked ticket, or code review that rejects temporary solutions without a plan to make them permanent.
- **High churn files.** Some files change in every PR because they accumulate too many unrelated changes. These files should be identified via git analysis and either refactored (split by responsibility) or stabilized (stop adding new concerns to them).
- **The not-invented-here trap.** Rejecting external libraries and writing everything in-house because "it is cleaner." This increases maintenance burden. Use well-maintained external libraries for standard problems. Maintain in-house code only for business-specific logic.
- **Over-normalization of database schemas.** Highly normalized schemas with dozens of joins create complex queries that are hard to understand and slow to execute. Denormalize for read performance and use views or materialized views to simplify data access.
- **Monorepo vs. polyrepo decision.** A monorepo enforces consistency across all services but slows builds and makes ownership unclear. Polyrepos speed up builds and clarify ownership but make cross-service changes harder. Choose based on team size and change frequency.
- **Significant refactoring that touches many files at once.** A large refactoring that changes 50 files in one PR is difficult to review and risky to deploy. Break it into smaller, independent PRs that each preserve correctness and pass tests.

## Validation Checklist

- [ ] Every function and method is less than 30 lines and has no more than 3 parameters.
- [ ] Every file is less than 400 lines and has a clear, single responsibility.
- [ ] Naming conventions are consistent: same casing for same kinds of things, no ambiguous names.
- [ ] No circular dependencies exist between modules. Dependency direction is enforced.
- [ ] Business logic is separated from infrastructure. Unit tests can be written without database, cache, or HTTP dependencies.
- [ ] Linter and formatter pass without warnings. All warnings are treated as errors.
- [ ] Test coverage for changed code is >= 80% for unit tests and includes success and failure paths.
- [ ] Documentation exists for all public functions, classes, and modules. ADRs exist for non-obvious design decisions.
- [ ] No dead code, commented-out code, or TODO/FIXME without a linked ticket exists in the codebase.
- [ ] The change can be self-reviewed: every file modification is necessary and has a clear purpose.
- [ ] Module boundaries are respected: the change does not leak implementation details across module boundaries.

## Engineering Examples

### Example 1: Refactoring a Method with High Cyclomatic Complexity

A billing service has a method `calculateCharge` with a cyclomatic complexity of 54. It handles discounts, proration, taxes, coupons, gift cards, and promotional credits, all in a single 200-line method with 14 levels of nested if-else. Every bug fix or feature change requires hours of analysis to understand the logic flow.

The team refactors it by extracting each concern into its own function:

```
function calculateCharge(subscription, plan, period) {
  const baseAmount = getBaseAmount(plan, period);
  const discountAmount = calculateDiscount(subscription, plan, period);
  const proratedAmount = calculateProration(subscription, period);
  const taxAmount = calculateTax(subscription, baseAmount - discountAmount);
  const credits = calculateCredits(subscription, baseAmount - discountAmount - proratedAmount);
  return baseAmount - discountAmount - proratedAmount + taxAmount - credits;
}
```

Each helper function is a pure function that takes clear inputs and returns a clear output. Each is independently testable (30 unit tests across all helpers, compared to 1 integration test covering all cases). The refactoring reduced the main method from 200 lines to 30 lines and reduced bug fix time from 4 hours to 45 minutes.

The team enforced the new structure with a linting rule: cyclomatic complexity per function must not exceed 10. Any new billing logic that exceeds this must be broken into separate functions.

### Example 2: Reducing Tight Coupling Between Modules

A monolithic application had a `UserModule` that directly imported and instantiated classes from `PaymentModule`, `NotificationModule`, and `AnalyticsModule`. Any change to these dependencies required changing `UserModule`. The team applied dependency inversion and introduced interfaces.

Before:
```
// UserModule depends directly on concrete classes
const paymentGateway = new StripePaymentGateway(config.stripeApiKey);
const emailService = new SendGridEmailService(config.sendGridKey);
await paymentGateway.charge(user, amount);
await emailService.sendReceipt(user.email, amount);
```

After:
```
// UserModule depends on interfaces, not concrete classes
interface PaymentGateway {
  charge(user: User, amount: Money): Promise<ChargeResult>;
}
interface NotificationService {
  send(userId: string, message: Notification): Promise<void>;
}

function registerUser(
  user: User,
  paymentGateway: PaymentGateway,
  notification: NotificationService
) { ... }
```

The concrete implementations are injected at the composition root (application entry point). This decoupling allows each module to be developed, tested, and maintained independently. Unit tests for `registerUser` use mock implementations of `PaymentGateway` and `NotificationService`, making tests fast and deterministic.

### Example 3: Improving Codebase Navigability with Clear Package Structure

A backend codebase with 500+ files had no clear package structure. Files were placed in a flat `src/` directory or in vaguely named directories like `src/utils/`, `src/helpers/`, and `src/services/`. A developer needed to open 20+ files to understand how a simple feature was implemented.

The team reorganized the codebase using domain-driven design:

```
src/
  billing/
    domain/       // Entities, value objects, domain events
    application/  // Use cases, application services
    infra/        // Database repositories, external API clients
  user/
    domain/
    application/
    infra/
  notification/
    domain/
    application/
    infra/
  shared/
    kernel/       // Base classes, common interfaces
    util/         // Really generic utilities (date formatting, string manipulation)
```

Each domain module has a clear public API (exported from an `index.ts`) and internal implementation that is not visible to other modules. Cross-module communication happens only through application services or domain events. A developer working on billing knows to look in `billing/domain/` for entities and `billing/application/` for use cases.

The reorganization reduced onboarding time from 3 weeks to 1 week. New developers can quickly locate the relevant code for any feature. The module boundaries are enforced by a lint rule: `import/no-restricted-paths` prevents billing code from importing from notification's infrastructure layer.
