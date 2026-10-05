# Modular Design

## Purpose

Define a systematic approach to modular software design that produces systems composed of cohesive, loosely coupled, independently understandable modules. This skill enables engineers to decompose complex systems into modules that can be developed, tested, deployed, and evolved independently while maintaining strong encapsulation boundaries and clear interfaces.

## Responsibilities

- Decompose system functionality into modules with high internal cohesion and low external coupling
- Define explicit module boundaries that align with business domains and change patterns
- Design module interfaces that are narrow, stable, and expressive of the module's purpose
- Enforce encapsulation so that module internals are hidden and only public interfaces are accessible
- Apply the Single Responsibility Principle at the module level, ensuring each module has one reason to change
- Manage dependencies between modules through dependency injection and interface segregation
- Organize package and folder structures that visually communicate module boundaries
- Govern module evolution by defining public APIs, internal implementation details, and deprecation policies

## Decision Process

1. Identify the primary decomposition axis by analyzing the system's business domains, change patterns, and team structure. The axis should align with bounded contexts from domain-driven design or with independently deployable capabilities.

2. Define module responsibilities by writing a one-paragraph mission statement for each candidate module. A module whose mission cannot be described in two sentences is too broad and needs further decomposition.

3. Identify all dependencies between candidate modules. Draw a directed graph showing which modules require functionality from others. The graph should be acyclic; cycles in the module dependency graph indicate poor decomposition that will produce maintenance problems.

4. Evaluate module cohesion by checking that all elements within a module contribute to its single mission. If a module contains code that serves different purposes or changes for different reasons, split it into separate modules.

5. Evaluate module coupling by measuring the number and nature of dependencies between modules. Prefer narrow interfaces (few methods, few parameters) over broad interfaces. Aim for modules that communicate through small, stable interfaces.

6. Design module interfaces by identifying the minimal set of operations that external consumers need. Start with the consumer's perspective and only expose what is necessary. Hide everything else as implementation detail.

7. Apply the Interface Segregation Principle to module interfaces. If a consumer of a module only needs a subset of its operations, consider splitting the interface. Large interfaces create unnecessary coupling between consumers and the module.

8. Implement dependency injection at module boundaries. Modules should receive their dependencies through constructors or initialization methods rather than creating them internally. This makes modules testable and replaceable.

9. Validate module independence by verifying that each module can be compiled, tested, and reasoned about in isolation. If understanding one module requires knowledge of another module's internals, the boundary is incorrectly placed.

10. Establish module versioning and evolution policies. Define what constitutes a breaking change to the module's public API, how deprecation is communicated, and how consumers migrate to new versions.

## Inputs

- System requirements and use case specifications
- Domain model and bounded context definitions
- Team structure and team ownership boundaries (Conway's Law consideration)
- Existing codebase analysis identifying god classes, excessive coupling, and circular dependencies
- Build system constraints including compilation time and module resolution
- Deployment topology including whether modules are deployed as monolith or independently
- Organizational standards for package naming, structuring, and dependency management

## Outputs

- Module decomposition diagram showing modules, their responsibilities, and dependencies
- Module interface contracts defining public APIs for each module
- Dependency graph with explicit direction, verified to be acyclic
- Package structure following module boundaries with clear public/private separation
- Dependency injection wiring specification at the composition root
- Module evolution and deprecation policy document
- Static analysis configuration that enforces module boundary rules

## Rules

1. Every module must have a single, well-defined responsibility expressed in a single sentence. A module that cannot be described concisely has multiple responsibilities and must be split.
2. Module dependencies must form a directed acyclic graph. Circular dependencies between modules are prohibited. Every cycle must be broken by extracting shared functionality into a new module or by inverting a dependency.
3. Module internals must be completely hidden from external consumers. Only explicitly designated public APIs are accessible. Reflection-based access, internal type exposure, or any mechanism that bypasses the public API violates encapsulation.
4. Module interfaces must be narrow and stable. A module interface should expose the minimum number of operations required for consumers to fulfill their responsibilities. Interface changes must follow a deprecation policy.
5. The dependency injection principle must be applied at module boundaries. Modules must not instantiate their dependencies; dependencies must be provided through constructors or initialization methods.
6. Each module must be independently compilable and testable. A module's tests must not require loading or initializing other modules beyond their public interfaces.
7. Modules must be organized by business capability, not by technical layer. A "utils" module or "helpers" module is a design smell indicating missing domain decomposition. Group by what the code does for the business, not by the type of code.
8. Module boundaries must align with change patterns. Code that changes for the same reason belongs in the same module. Code that changes for different reasons belongs in different modules.
9. Cross-module communication must use the module's public API only. Direct database access, shared file systems, or internal event channels between modules are prohibited unless part of the explicitly designed public API.
10. Module public APIs must be versioned and have a documented deprecation policy. Breaking changes to a public API require a major version bump and a migration period that is communicated to all consumers.

## Best Practices

1. Apply the Reuse/Release Equivalence Principle: the granularity of reuse is the granularity of release. Modules that are reused together should be released together. Do not force consumers to depend on more than they need.
2. Design modules around change patterns. Use the Common Closure Principle: classes that change together, belong together. If two classes are always modified in the same release, they should be in the same module.
3. Use the Common Reuse Principle: classes that are used together should be packaged together. If a consumer uses one class from a module, it should be able to use all classes in that module without depending on unrelated functionality.
4. Publish the module's public API as a separate package or namespace from internal implementation. In Java, use `module.api` and `module.internal` packages. In TypeScript, use barrel exports that only re-export public symbols.
5. Implement module-level integration tests that exercise the module exclusively through its public API. This provides confidence that the module's contract is correct while allowing internal refactoring.
6. Use architectural tests (e.g., ArchUnit, TypeScript-ESLint boundary rules) to enforce module boundaries in CI. Automated enforcement is essential because manual review cannot scale.
7. Apply the Stable Dependencies Principle: a module should depend on modules that are more stable than it is. Unstable modules (frequently changing) should not be depended upon by stable modules (rarely changing).
8. Apply the Stable Abstractions Principle: a module that is heavily depended upon should be abstract enough to accommodate change without breaking consumers. Stable modules should provide abstract interfaces rather than concrete implementations.
9. Use dependency graphs to visualize module relationships and identify architectural drift. Run automated dependency analysis each quarter and compare against the target architecture.
10. Design modules for replaceability. If a module's implementation could be swapped without affecting other modules (aside from re-wiring at the composition root), the modular design is successful.

## Anti-patterns

1. **The God Module**: A single module that contains functionality spanning multiple business domains or technical concerns. God modules emerge when decomposition is not performed or when module boundaries are not enforced. They create a maintenance bottleneck and prevent independent development.
2. **The Utils Module**: A module named "utils", "helpers", "common", or "shared" that accumulates unrelated functionality. Such modules violate cohesion principles and grow without bound. Every function in a utils module must be evaluated and placed into a domain-aligned module.
3. **The Circular Dependency Chain**: A dependency cycle between modules that requires simultaneous changes across module boundaries. Circular dependencies make independent deployment impossible and force developers to understand multiple modules at once.
4. **Leaky Module Boundaries**: Modules that expose internal implementation details through their public API, requiring consumers to understand internal data structures or configuration. Leaky boundaries create coupling that prevents internal refactoring.
5. **The Framework Module**: Creating a module specifically for a framework (e.g., "spring-module", "hibernate-module") rather than organizing by business capability. Framework modules couple the entire system to framework-specific code and prevent framework migration.
6. **Premature Modularization**: Decomposing a system into modules before the domain is understood, resulting in boundaries that do not align with actual change patterns. Start with a simpler structure and extract modules as patterns emerge.

## Edge Cases

1. **Shared kernel modules**: Some functionality must be shared across multiple modules (e.g., value objects, base types). Create a stable shared kernel module with minimal dependencies and rigorous change management. Every addition to the shared kernel must be reviewed for whether it truly belongs there.
2. **Cross-cutting concerns that span modules**: Logging, metrics, security, and transaction management affect all modules. Implement these as middleware, decorators, or aspect-oriented mechanisms that wrap module boundaries rather than penetrating them.
3. **Performance-sensitive modules that conflict with modularity**: A module that processes high-throughput data may need to bypass normal interface boundaries for performance reasons. Document the performance requirement explicitly, implement the bypass as a measured optimization, and schedule refactoring to restore proper boundaries.
4. **Migration between module structures**: Existing code may not follow modular design and needs gradual refactoring. Use a facade pattern at old boundaries, extract modules behind the facade, and migrate consumers incrementally. Maintain both old and new interfaces during the transition.
5. **Configuration dependencies between modules**: Module A needs Module B's configuration to initialize. This creates a startup ordering dependency. Solve with a configuration service that both modules depend on, or with lazy initialization that resolves configuration at first use.
6. **Reflection-based access across modules**: Frameworks (e.g., ORMs, serialization) often use reflection to access private members. This violates encapsulation. Create explicit mapping layers or data transfer objects that the framework can access through public interfaces, keeping module internals protected.

## Validation Checklist

- [ ] Each module has a one-sentence mission statement that fits on a single line
- [ ] Module dependency graph is acyclic and verified by automated tooling
- [ ] Module public API is explicitly defined and separated from internal implementation
- [ ] No module imports or accesses internal types of another module
- [ ] Each module can be compiled and tested independently of other modules
- [ ] Module interfaces are narrow (fewer than 10 public methods)
- [ ] No module named "utils", "common", "shared", or "helpers" exists
- [ ] Dependency injection is used at all module boundaries
- [ ] Module versioning and deprecation policy is documented and enforced
- [ ] Breaking changes to public APIs are identified and communicated before release
- [ ] Circular dependency detection is automated in CI (fails build on cycles)
- [ ] Module ownership is documented and aligned with team boundaries

## Engineering Examples

### Example 1: Refactoring a God Class into Modules

A billing system had a `BillingService` class with 3,400 lines of code. It handled invoice generation, payment processing, subscription management, tax calculation, credit adjustments, dunning (collection) workflows, and reporting. The class had 28 dependencies and was modified by every team member in every sprint.

The refactoring decomposed `BillingService` into six modules:
- `billing-invoice`: Invoice generation, template rendering, and delivery
- `billing-payment`: Payment processing, gateway integration, and reconciliation
- `billing-subscription`: Subscription lifecycle, plan changes, and renewals
- `billing-tax`: Tax calculation, rate lookup, and compliance reporting
- `billing-credit`: Credit adjustments, promotions, and write-offs
- `billing-dunning`: Collection workflows, reminder schedules, and escalation

Each module had a public interface with 3-5 methods. The interfaces were designed from the consumer perspective: the `billing-invoice` module exposed `generateInvoice(SubscriptionId, BillingPeriod): Invoice` and `deliverInvoice(Invoice, DeliveryMethod): DeliveryResult`. The internal implementation of invoice PDF generation was encapsulated within the module.

After refactoring, developer velocity improved by 3x because a single developer could understand and modify a module without traversing the entire billing codebase. Module-level tests ran in under 2 seconds each, compared to the original integration tests that required 30 minutes.

### Example 2: Designing a Plugin System for a Data Processing Pipeline

An ETL platform needed to support extensible data transformations. The architecture used a modular plugin system where each transformation was a separate module implementing a common interface:

```
plugins/
  transform-filter/       # Remove rows matching criteria
    public/
      FilterTransformPlugin.java  # Implements TransformPlugin interface
    internal/
      FilterEvaluator.java       # Expression parsing and evaluation
      FilterConfigSchema.json    # JSON schema for plugin configuration
  transform-aggregate/    # Group and aggregate data
    public/
      AggregateTransformPlugin.java
    internal/
      AggregationStrategy.java
      WindowFunction.java
  transform-join/         # Join multiple data sources
    public/
      JoinTransformPlugin.java
    internal/
      JoinMatcher.java
      JoinKeyExtractor.java
```

Each plugin was a separate Maven module with its own `pom.xml`, test suite, and version number. The core pipeline engine depended only on the `TransformPlugin` interface, defined in a shared `plugin-api` module. New transformations could be added by creating a new module, implementing the interface, and registering it via Java's ServiceLoader mechanism.

The plugin system enabled three independent teams to develop transformations in parallel. When a transformation had a bug, the fix was isolated to that module and could be released independently. The core pipeline engine saw zero changes during 18 months of plugin additions.

### Example 3: Organizing a Monorepo into Cohesive Packages

A SaaS platform organized its monorepo using domain-aligned modules:

```
packages/
  catalog/              # Product catalog domain
    src/
      api/               # Public types: Product, Category, Price
      application/       # Use cases: SearchProducts, GetProductDetails
      domain/            # Entities: Product, InventoryItem, Category
      infrastructure/    # Database, search index, external catalog API
    tests/
  ordering/             # Order management domain
    src/
      api/
      application/
      domain/
      infrastructure/
    tests/
  billing/              # Billing and subscription domain
    src/
      api/
      application/
      domain/
      infrastructure/
    tests/
  shared/               # Shared kernel (value objects, base types)
    src/
      types/             # Money, Currency, EmailAddress, Address
      errors/            # Domain error types
      testing/           # Test utilities and factories
    tests/
```

Each package was independently versioned and published to a private npm registry. The `shared` package had zero dependencies on other packages and was the most stable. The `catalog` and `ordering` packages depended on `shared` but not on each other. The `billing` package depended on `ordering` only for order reference data.

Package dependencies were enforced with ESLint boundary rules and integrated into CI. Any import across package boundaries that violated the allowed dependency graph would fail the build. This prevented the gradual erosion that normally occurs in monorepos as developers take shortcuts with intra-package imports.

The modular structure enabled independent deployment of each package. When the billing team needed to deploy a critical tax calculation fix, they could release the `billing` package without rebuilding or redeploying `catalog` or `ordering`.
