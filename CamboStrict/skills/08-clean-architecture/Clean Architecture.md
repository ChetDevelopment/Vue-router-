# Clean Architecture

## Purpose

Provide a prescriptive framework for structuring software systems according to Clean Architecture principles as defined by Robert C. Martin, ensuring that business rules remain independent of frameworks, databases, UI technologies, and external agencies. This skill enables engineers to produce systems where the core domain logic is testable in isolation, frameworks are treated as plugins rather than foundations, and the dependency rule prevents architectural erosion.

## Responsibilities

- Enforce the dependency rule: source code dependencies must point inward toward the domain entities and use cases, never outward toward frameworks, databases, or infrastructure
- Define and maintain clear boundaries between the four layers: entities, use cases, interface adapters, and frameworks/drivers
- Ensure that business rules can be unit tested without any infrastructure dependency, including databases, web servers, or file systems
- Design use cases that express business operations in the language of the domain, free from framework annotations, HTTP concerns, or serialization logic
- Manage the boundary crossings using interfaces that are defined by the inner layer and implemented by the outer layer
- Protect the entity layer from changes in use cases by ensuring entities have no dependency on any specific use case
- Govern the separation between application-level business rules (use cases) and enterprise-level business rules (entities)
- Facilitate migration between frameworks by keeping framework code confined to the outermost layer

## Decision Process

1. Identify the core business domain by interviewing domain experts and extracting the fundamental concepts, rules, and processes that define the business. Distinguish between business rules that would exist in a manual system and automation concerns that are purely technical.

2. Define entities as enterprise-wide business objects that encapsulate the most general and high-level business rules. Entities should be plain objects with no framework dependencies, no database annotations, and no serialization attributes. An entity must be valid in its own right regardless of how it is stored or transmitted.

3. Identify use cases that represent specific application operations. Each use case should be a single class or function that takes input, executes business rules using entities and services, and produces output. Use cases orchestrate the flow of data to and from entities but do not contain entity-level business rules.

4. Define the interface adapter boundaries. For each use case, define an input port (interface for the use case's input) and an output port (interface for the use case's output). These ports are interfaces defined in the use case layer and implemented in the adapter layer.

5. Implement the framework and driver layer as the outermost ring. Frameworks, web controllers, database repositories, UI components, and external service clients all belong here. They depend on inner layers but are never depended upon by inner layers.

6. Establish the boundary-crossing mechanism using dependency inversion. For every outward-pointing dependency required by an inner layer (e.g., database access, external service call), define an interface in the inner layer that the outer layer implements.

7. Organize the codebase into packages that reflect the architectural layers. Use explicit package naming (e.g., `domain`, `usecase`, `adapter`, `infrastructure`) and enforce layer dependencies through both code review and automated architecture tests.

8. Verify that each layer can be tested independently. Entities should be testable with zero setup. Use cases should be testable by providing mock implementations of output ports. Adapters should be testable by providing real implementations of the infrastructure but with test doubles for external systems.

9. Review for layer violations. Scan for imports that cross layer boundaries in the wrong direction. A use case should never import a database driver. An entity should never import an HTTP framework. Violations must be resolved by applying dependency inversion or by moving the violating code to the correct layer.

10. Validate that framework changes do not cascade into business logic. If replacing the web framework (e.g., Express to Fastify) or database (e.g., PostgreSQL to MongoDB) requires changes in the entity or use case layer, the architecture boundaries are incorrectly drawn.

## Inputs

- Domain expert knowledge and business process documentation
- Existing codebase and analysis of current architecture violations
- Framework and technology selection decisions
- Testing strategy requirements including unit, integration, and end-to-end test plans
- Use case specifications from product requirements or user stories
- Organizational standards for folder structure and naming conventions

## Outputs

- Clean Architecture layer mapping defining entities, use cases, interface adapters, and frameworks
- Dependency graph showing allowed and prohibited dependencies between layers
- Interface contracts (input ports and output ports) for each use case
- Repository interfaces defined in the use case layer for data access abstraction
- Testing strategy that validates entity and use case logic without infrastructure
- Architecture fitness functions or linter rules that enforce the dependency rule

## Rules

1. The dependency rule is absolute: source code dependencies must point inward toward the core domain. Nothing in an inner circle can know anything about an outer circle, including function names, class names, or variable types.
2. Entities must be plain objects with no framework annotations, no database column mappings, no JSON serialization attributes, and no HTTP concerns. An entity must be a pure business object.
3. Use cases must be expressed in the language of the domain, not in terms of HTTP requests, database queries, or UI components. A use case should read like a description of a business operation.
4. Each use case must define its own input and output data structures. Sharing DTOs across use cases creates coupling between unrelated business operations and violates the Single Responsibility Principle.
5. Boundary crossings must use interfaces defined by the inner layer. The inner layer declares the interface; the outer layer provides the implementation. This ensures the inner layer never depends on outer layer implementations.
6. Frameworks and databases are details that must be kept in the outermost layer. The business rules must be completely unaware of which framework is handling HTTP or which database is storing data.
7. The entity layer must have zero dependencies on any other layer. It cannot import use cases, adapters, or frameworks. Entities must be the most stable, least changing part of the system.
8. Use cases can depend on entities but not on adapters or frameworks. If a use case needs to interact with an external system, it must do so through an output port interface.
9. Controllers and presenters belong in the adapter layer, not in the use case layer. A controller receives input from the outside, converts it into the use case's input format, invokes the use case, and then converts the output for external consumption.
10. Architecture tests must be automated and run in CI. Manual enforcement of the dependency rule always fails as codebases grow and team composition changes.

## Best Practices

1. Start with the domain and use cases, not the framework. Write the business logic first as pure functions and simple objects. Only add framework layers after the core logic is defined and tested.
2. Keep use cases focused on a single business operation. If a use case has more than one reason to change, split it. A use case named `ProcessOrder` should not also handle `SendOrderConfirmation`.
3. Define repository interfaces in the use case layer with methods named in business terms: `findActiveCustomersByRegion`, not `queryByFilterWithPagination`. The interface should speak the language of the domain.
4. Use the Request/Response pattern for use case inputs and outputs. Each use case has a dedicated Request object (input) and Response object (output). These objects contain only simple data structures, no business logic.
5. Implement unit tests for use cases by providing mock output port implementations. A use case test should never require a database connection, HTTP server, or file system. If it does, the use case has a dependency violation.
6. Use the Presenter pattern to transform use case output into external formats. A single use case can have multiple presenters (REST, GraphQL, CLI) without changing the use case itself.
7. Keep framework-specific code confined to single-purpose adapter classes. A `UserController` should only handle HTTP concerns; the business logic should be in a use case that the controller calls.
8. Use a dependency injection container to wire layers together at the composition root. The composition root is the only place where concrete implementations are instantiated and wired to interfaces.
9. Treat external services as plugins. For any third-party integration (payment gateway, email service, cloud provider), define an interface in the use case layer and implement an adapter class.
10. Regularly run architecture tests that verify layer dependencies. Use tools like ArchUnit, jqAssistant, or custom linting rules in CI to catch violations automatically.

## Anti-patterns

1. **Framework-first development**: Starting with a framework (Spring, Django, Next.js) and fitting business logic around it. This produces systems where business rules are scattered across controllers, models, and framework-specific files, making them impossible to test or migrate independently.
2. **Anemic domain model with clean layers**: Having the right package structure but placing all business logic in service classes while entities remain as data bags. Clean Architecture requires rich entities and focused use cases, not procedural services acting on data structures.
3. **Leaky abstractions**: Defining repository interfaces in the inner layer that expose database concepts like `save()`, `update()`, or `findByQuery()`. Repository interfaces should use business language and hide storage implementation details.
4. **Giant use cases**: A single use case class that handles multiple operations or has multiple reasons to change. This is the Clean Architecture equivalent of a god class and produces the same maintenance problems.
5. **Mocking everything in tests**: Using mocking frameworks for every dependency even when the dependency is a pure business object. Clean Architecture enables testing with real objects in the domain layer; mocks are needed only for boundary interfaces.
6. **Over-engineering boundaries**: Creating ports and adapters for every possible external dependency when the system has no realistic need for substitution. Not every database access needs an interface; apply the pattern where substitution is genuinely valuable.

## Edge Cases

1. **Cross-cutting concerns that span layers**: Logging, authentication, transaction management, and caching need to operate across layers without violating the dependency rule. Use decorators or middleware in the adapter layer that wrap use cases. The use case itself must remain unaware of these concerns.
2. **Use cases that need multiple database transactions**: A single use case may require updates across multiple repositories. The transaction management should be handled by a unit of work pattern in the adapter layer, not by the use case. The use case expresses the business operation; the outer layer ensures transactional integrity.
3. **Integration with legacy systems that cross boundaries**: A legacy system may require direct database access that would violate Clean Architecture. Create an anti-corruption layer in the adapter that translates between the legacy system's model and the clean domain model.
4. **Performance requirements that conflict with layer separation**: A use case that needs to return paginated data with total count confronts the clean boundary. Define the pagination contract in the repository interface (inner layer) and let the adapter implementation handle the database-specific pagination.
5. **Framework annotations in domain objects**: ORMs often require annotations on domain objects. The solution is to keep entities annotation-free and create separate persistence models in the adapter layer that map to and from domain entities.
6. **Circular dependencies between use cases**: Use case A needs data from use case B, creating a potential circular dependency. Solve this by extracting shared logic into a domain service that both use cases depend on, or by using dependency injection at the composition root to wire the flow.

## Validation Checklist

- [ ] Entities have zero imports from any framework, database driver, or HTTP library
- [ ] Use cases only import entities, domain services, and interface definitions (ports)
- [ ] Every use case is independently unit-testable with no infrastructure setup
- [ ] Framework annotations (routing, JSON serialization, ORM) appear only in the outermost layer
- [ ] Repository interfaces use business terminology, not database concepts
- [ ] Each use case has a single responsibility and a single reason to change
- [ ] Input/output data structures are defined per use case, not shared across use cases
- [ ] Dependency inversion is applied at every boundary crossing (inner layer defines interface)
- [ ] Dependency injection container exists at the composition root for wiring layers
- [ ] Framework code (controllers, gateways, presenters) is thin and contains no business logic
- [ ] Automated architecture tests run in CI to verify dependency rules
- [ ] Migration path exists for separating any existing framework coupling from business logic

## Engineering Examples

### Example 1: Structuring a Backend with Clean Architecture Layers

A fintech startup built their core banking backend using Clean Architecture with the following package structure:

```
com/bank/
  domain/           # Entities
    Account.java     # Rich domain entity with balance validation
    Transaction.java # Value object with invariants
  usecase/           # Application business rules
    TransferMoney.java  # Single use case with input/output ports
    ports/
      input/TransferMoneyInput.java
      output/LoadAccountPort.java
      output/UpdateAccountPort.java
      output/NotifyFraudDetectionPort.java
  adapter/
    inbound/
      rest/TransferMoneyController.java  # HTTP adapter
      queue/TransferMoneyConsumer.java   # Message queue adapter
    outbound/
      persistence/
        AccountRepositoryImpl.java       # Implements LoadAccountPort
        TransactionRepositoryImpl.java   # Implements UpdateAccountPort
      notification/
        FraudDetectionNotifierImpl.java  # External service adapter
  infrastructure/
    config/DependencyInjectionConfig.java
```

The `TransferMoney` use case contained no imports from Spring, Hibernate, or Jackson. It depended solely on domain entities and port interfaces defined within the use case layer. The use case was tested with mock port implementations, achieving 100% test coverage without starting the Spring context. When the team migrated from Spring Boot 2 to Spring Boot 3, only the controller and infrastructure configuration files changed; the domain and use case layers were untouched.

### Example 2: Refactoring from Spaghetti to Clean Architecture

A legacy order management system had 200,000 lines of PHP where business logic was scattered across Laravel controllers, Eloquent model hooks, Blade templates, and artisan commands. Database queries were embedded in template files and business rules were duplicated across controllers.

The refactoring followed a systematic approach: first, domain entities (`Order`, `Customer`, `Product`) were extracted by identifying business invariants from interviews with domain experts. These entities were pure PHP classes with zero Laravel dependencies. Second, use cases were extracted by analyzing each controller method's business logic. The `PlaceOrderController` had 400 lines; the extracted `PlaceOrder` use case was 60 lines. Third, repository interfaces were defined in the use case layer for data access, with Eloquent implementations in the adapter layer.

The refactoring was done incrementally using the Strangler Fig pattern: new features were implemented in Clean Architecture, and legacy code was gradually replaced. After 8 months, the core domain had 95% unit test coverage running in 3 seconds, compared to the previous integration tests that took 12 minutes. The deployment frequency increased from bi-weekly to daily.

### Example 3: Designing a Use Case That Does Not Depend on Framework Details

A team designed a `SubmitClaim` use case for an insurance claims system. The use case accepted a `SubmitClaimInput` object containing policy number, claim type, incident date, and description. The use case's output was a `SubmitClaimOutput` containing the claim ID and status.

The use case orchestrated three operations: validate policy coverage by calling a `PolicyPort`, create the claim entity with business rules (e.g., claims must be filed within 30 days of incident), and then notify the adjuster through a `NotificationPort`.

The key design decision was that none of these ports referenced HTTP, REST, JSON, or any framework concept. The `PolicyPort` interface had a method `getCoverageDetails(PolicyNumber policyNumber): CoverageDetails` that returned a domain object. The `NotificationPort` had `sendNewClaimNotification(Claim claim): void`. The implementations in the adapter layer used HTTP clients to call the policy microservice and an email service for notifications.

When the team later needed to accept claims via a Kafka queue in addition to the REST API, they created a `SubmitClaimQueueConsumer` adapter that deserialized the Kafka message into `SubmitClaimInput` and invoked the same use case. The use case itself required zero changes. This demonstrated that Clean Architecture's dependency inversion enables adaptation to new delivery mechanisms without touching business logic.
