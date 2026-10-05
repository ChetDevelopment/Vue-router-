# Domain Modeling

## Purpose

Establish a disciplined approach to domain modeling using Domain-Driven Design (DDD) principles, enabling teams to create software models that accurately reflect the business domain, establish a shared ubiquitous language between domain experts and developers, and produce systems that can evolve with business requirements without accumulating technical debt from misaligned abstractions.

## Responsibilities

- Develop a shared ubiquitous language between domain experts and technical teams, ensuring that every term used in code has a precise, agreed-upon meaning
- Distinguish between entities (objects with identity and continuity) and value objects (objects defined by their attributes) and apply the appropriate pattern to each business concept
- Design aggregates that enforce consistency boundaries around clusters of entities and value objects, with clear aggregate roots responsible for all modifications
- Define domain events that capture significant business occurrences and enable reactive and event-driven workflows
- Implement repositories that provide collection-like access to aggregates, abstracting away persistence concerns
- Model domain services for business operations that do not naturally belong to an entity or value object
- Identify and map bounded contexts, defining explicit relationships (partnership, customer-supplier, conformist, anticorruption layer, open-host service) between contexts
- Translate business rules and invariants into code that enforces them within the domain model rather than in application services

## Decision Process

1. Engage with domain experts to discover the mental models they use to reason about the business. Conduct structured interviews, event storming sessions, and domain storytelling workshops. Listen for nouns (potential entities/value objects), verbs (potential domain events or services), and rules (business invariants).

2. Establish the ubiquitous language by documenting key terms and their definitions in a shared glossary. Every term must have a single, unambiguous meaning. When domain experts disagree on a term, the disagreement signals a bounded context boundary that needs exploration.

3. Identify entities by asking: "Does this concept have a lifecycle and identity that persists over time?" If the answer is yes and the concept needs to be tracked across different operations, it is an entity. If the answer is no and the concept is interchangeable based on its attributes alone, it is a value object.

4. Design aggregates by grouping entities and value objects around a consistency boundary. Identify the aggregate root: the single entity that acts as the entry point for all modifications to the aggregate. All business invariants that span multiple objects within the aggregate must be enforced by the root.

5. Define aggregate boundaries by analyzing transaction boundaries and consistency requirements. If two objects must be consistently updated in a single transaction, they belong in the same aggregate. If eventual consistency is acceptable, they can be separate aggregates. Prefer small aggregates; large aggregates create transaction contention and scaling problems.

6. Identify domain events by reviewing business operations and asking: "What would the business want to know about?" Each significant state change in the domain should produce a domain event. Events are named in the past tense (e.g., `OrderPlaced`, `PaymentReceived`) and contain the data relevant to the occurrence.

7. Design repositories for each aggregate root. Repositories provide the illusion of an in-memory collection of aggregates, hiding database access behind a domain-focused interface. Repository methods should be named in business terms, not database terms.

8. Model domain services for operations that involve multiple aggregates or that orchestrate complex business rules. Domain services are stateless and operate on domain objects. They belong in the domain layer, not the application layer, because they express domain logic.

9. Define bounded contexts by identifying the boundaries where ubiquitous language terms change meaning. A "Customer" in the Sales context may have different attributes and behavior than a "Customer" in the Support context. Map the relationships between bounded contexts using context mapping patterns.

10. Validate the model by walking through concrete business scenarios using the ubiquitous language. Simulate the execution of use cases with domain experts present. If the model requires awkward explanations or the language does not flow naturally, refactor the model.

## Inputs

- Domain expert knowledge from interviews, workshops, and documentation reviews
- Business process documentation, SOPs, and policy manuals
- Existing system codebase and data model for analysis and migration
- User stories and use cases describing system functionality
- Regulatory and compliance requirements that impose business rules
- Glossary of business terms currently used (with identified ambiguities)
- Event storming output including domain events, commands, and aggregate candidates

## Outputs

- Ubiquitous language glossary with precise definitions for every domain term
- Entity identification and specification (identity strategy, lifecycle, attributes)
- Value object identification with equality semantics and immutability rules
- Aggregate design including root entity, boundary, invariants, and consistency rules
- Domain event catalog with event names, payload structures, and publishing rules
- Repository interface contracts defined in domain language
- Domain service specifications for跨-aggregate operations
- Bounded context map with context relationships (partnership, anticorruption layer, etc.)
- Rich domain model code that encapsulates business rules and invariants

## Rules

1. The ubiquitous language must be used consistently in code, documentation, tests, and conversations. If a term in the code differs from the term used by domain experts, the code is wrong. There is no exception.
2. Entities must have identity equality. Two entities with the same identity are the same entity regardless of their attribute values. Value objects must have structural equality. Two value objects with the same attributes are interchangeable.
3. Value objects must be immutable. Every operation on a value object returns a new instance rather than modifying the existing one. Immutability prevents aliasing bugs and ensures value objects can be shared safely.
4. Aggregates must enforce all invariants within their boundary. No external code can directly modify the internal state of an aggregate. All modifications must go through the aggregate root, which validates business rules before applying changes.
5. References between aggregates must use the target aggregate's identity, not a direct object reference. Loading one aggregate should not implicitly load another aggregate. Aggregate boundaries are consistency boundaries and should not be traversed in memory.
6. Domain events must be immutable records of past occurrences. Once created and published, a domain event cannot be modified. Event names must use past-tense verbs: `OrderShipped`, `InvoicePaid`, `CustomerMoved`.
7. Repositories must be defined in the domain layer with interfaces that use domain types. Repository implementations belong in the infrastructure layer. Repository methods must not leak database concerns like `save()`, `update()`, or query criteria objects.
8. Domain services must be stateless and side-effect free except for creating domain events. They coordinate operations across aggregates and value objects but do not manage their own state.
9. The domain model must be persistence-ignorant. No database annotations, ORM mappings, or serialization attributes should appear in domain entities or value objects. Persistence concerns belong in infrastructure.
10. Bounded contexts are the primary organizational unit of a large domain model. Each bounded context has its own ubiquitous language, its own domain model, and its own consistency boundaries. Models are not shared across contexts without explicit translation.

## Best Practices

1. Start with event storming to discover the domain. Invite domain experts and developers to a workshop where they collaboratively identify domain events, commands, and aggregates on a virtual or physical whiteboard. This establishes shared understanding before any code is written.
2. Favor small aggregates. A common mistake is creating a single aggregate that contains the entire object graph. Small aggregates reduce transaction contention, improve scalability, and force clearer boundary thinking. The default should be an aggregate with a single entity.
3. Use factory methods on aggregate roots for complex creation logic. Instead of exposing a constructor with many parameters, provide named factory methods like `Order.place(customerId, items, shippingAddress)` that enforce creation invariants.
4. Encapsulate collections within aggregates. Never expose internal collections (e.g., `order.getItems()`) that allow external code to modify aggregate state. Provide controlled access through methods like `order.addItem(productId, quantity)` that enforce business rules.
5. Persist value objects as embedded types when the database supports it. This preserves the value object's encapsulation and avoids separate tables for what are conceptually attributes of the owning entity.
6. Use domain events for跨-aggregate communication. When an aggregate changes state, publish domain events that other aggregates or bounded contexts can react to asynchronously. This maintains aggregate autonomy.
7. Create an anticorruption layer when integrating with legacy systems or external bounded contexts. Translate between the external model and your ubiquitous language, preventing external concepts from leaking into your domain model.
8. Write domain model tests that use the ubiquitous language. Test method names should read as business rules: `should_not_allow_order_when_customer_has_outstanding_balance`. This makes tests executable documentation of the domain.
9. Refactor the model aggressively when the ubiquitous language reveals inconsistencies. If a term's meaning changes as you understand the domain better, update both the glossary and the code. Model drift is inevitable and must be corrected.
10. Use specification pattern for complex query and validation logic. A `Specification` object encapsulates a business rule that can be evaluated against entities or used in repository queries, keeping rules out of infrastructure code.

## Anti-patterns

1. **Anemic Domain Model**: Domain objects that contain only data and no behavior, with all business logic in service classes. This is the most common and damaging anti-pattern in domain modeling. It transforms entities into data bags and creates procedural code disguised as object-oriented design.
2. **Infrastructure Leakage**: Database annotations, JSON serialization attributes, and framework-specific code embedded in domain entities. This couples the domain model to specific technologies and prevents it from being tested or used independently.
3. **The God Aggregate**: A single aggregate that encompasses the entire business domain with dozens of entities and value objects. God aggregates create transaction contention, slow performance, and impossible-to-maintain consistency boundaries.
4. **Settler Pattern everywhere**: Creating entities with public setters for every property and relying on external services to enforce business rules. Setters break encapsulation and allow domain objects to enter invalid states.
5. **Shared model across bounded contexts**: Using the same `Customer` class in Sales, Support, and Billing contexts. Each context has different invariants and behavior for the same real-world entity. Forcing a shared model creates complexity and coupling.
6. **Ignoring the ubiquitous language**: Using technical terms in code that have no meaning to domain experts, or using domain terms in ways that conflict with their business meaning. This creates a translation burden that slows development and introduces errors.

## Edge Cases

1. **Temporal data and bi-temporal modeling**: Entities that need to track both actual and recorded time (e.g., a policy change applied retroactively). Consider using event sourcing or temporal database features. The domain model should explicitly represent time concepts rather than hiding them.
2. **Soft deletes vs hard deletes**: Business rules may require that deleted data remains accessible for audit purposes. Domain entities should model deletion explicitly (e.g., `MarkAsDeleted` method) rather than relying on database-level soft delete mechanisms.
3. **Multi-language and multi-currency domains**: Value objects like `MonetaryAmount` must encapsulate both the amount and the currency, with exchange rate conversions handled as domain services. Never store monetary values as raw decimals or floats.
4. **Legal and compliance constraints**: Regulatory rules (e.g., data retention policies, right-to-erasure) may conflict with ideal aggregate design. Model regulatory constraints explicitly as domain rules rather than post-processing data after domain operations.
5. **Eventual consistency across aggregates**: Business processes may require operations across multiple aggregates that cannot be transactionally consistent. Design the model to handle temporary inconsistencies explicitly, with compensating actions and reconciliation.
6. **Concurrent aggregate modifications**: Multiple users may attempt to modify the same aggregate simultaneously. Use optimistic concurrency control with version numbers on aggregate roots. The domain model should detect and report conflicts rather than silently overwriting.

## Validation Checklist

- [ ] Ubiquitous language glossary is documented and agreed upon with domain experts
- [ ] Entities have identity equality and value objects have structural equality
- [ ] Value objects are immutable and return new instances on operations
- [ ] Aggregate boundaries are defensively small; defaults to single entity aggregates
- [ ] Aggregate roots are the only entry point for all modifications within the boundary
- [ ] No public setters exist on domain objects; all state changes use intention-revealing methods
- [ ] Domain events are defined for all significant business state changes
- [ ] Repository interfaces use domain types and business terminology
- [ ] Domain services are stateless and persist only through aggregate roots
- [ ] No framework annotations, database mappings, or serialization attributes in domain layer
- [ ] Bounded contexts are mapped with explicit relationships documented
- [ ] Domain model tests read as executable business rules using ubiquitous language

## Engineering Examples

### Example 1: Modeling an E-Commerce Domain with Aggregates and Value Objects

An e-commerce platform modeled its core domain with the following aggregates:

**Order Aggregate**: Root entity `Order` with value objects `OrderId`, `OrderLine`, `Money`, `ShippingAddress`, `OrderStatus`. Invariants enforced by `Order`:
- Order total must be recalculated when lines are added or removed
- Order cannot be shipped if payment is not completed
- Shipping address must be in a supported region
- Order lines must reference valid products from the Catalog context (by product ID only, not object reference)

**Customer Aggregate**: Root entity `Customer` with value objects `CustomerId`, `EmailAddress`, `CustomerName`, `LoyaltyTier`. Invariants:
- Email address must be unique (enforced through repository)
- Loyalty tier is recalculated based on purchase history
- Account cannot be closed with active orders

**Product Aggregate**: Root entity `Product` with value objects `ProductId`, `Price`, `StockLevel`. Invariants:
- Price must be positive
- Stock level cannot go below zero

`Money` was modeled as a value object encapsulating `amount` (decimal) and `currency` (ISO 4217 code). Arithmetic operations returned new `Money` instances with currency validation. Adding USD and EUR would throw a domain exception.

The `Order` aggregate's `addItem` method looked like:
```
order.addItem(productId, quantity, unitPrice)
```
This method validated that quantity was positive, added an `OrderLine` to the internal collection, recalculated the total, and published an `OrderLineAdded` domain event. The method guarded the invariant that an order must contain at least one line before it can be placed.

### Example 2: Identifying Bounded Contexts in a Healthcare System

A healthcare platform identified the following bounded contexts through event storming sessions with doctors, administrators, and billing staff:

- **Patient Management**: Manages patient demographics, medical history, consent forms. "Patient" means personal information and medical records. Aggregate: `PatientRecord`.
- **Appointment Scheduling**: Manages appointments, schedules, reminders. "Patient" means an appointment participant with availability preferences. Aggregate: `Appointment`.
- **Clinical Encounters**: Manages diagnoses, prescriptions, test orders. "Patient" means a subject of clinical observations. Aggregate: `Encounter`.
- **Billing and Claims**: Manages insurance claims, payments, invoices. "Patient" means an insurance policy holder with coverage details. Aggregate: `Claim`.
- **Pharmacy**: Manages medication inventory, dispensing, interactions. "Patient" means a medication recipient with allergy profile. Aggregate: `Prescription`.

Each context had its own definition of "Patient" with different attributes and behaviors. The Patient Management context was the system of record for patient identity. Other contexts referenced patients by `PatientId` and maintained only the attributes relevant to their context.

The context map defined:
- Patient Management → Appointment Scheduling: Customer-Supplier (Patient Management provides patient data, Scheduling uses it)
- Clinical Encounters → Billing: Partnership (both need consistent encounter data for complete billing)
- Pharmacy ↔ Clinical Encounters: Partnership (prescriptions require diagnosis codes, encounters require medication data)

When the Billing context needed patient insurance information, it consumed domain events from Patient Management (`PatientInsuranceUpdated`) and maintained its own read model. This prevented Billing from directly accessing Patient Management's aggregates.

### Example 3: Refactoring an Anemic Domain Model to Rich Domain Model

A loan management system initially had an anemic domain model:

```
// Anemic: data bag with no behavior
class Loan {
    private String loanId;
    private String borrowerId;
    private BigDecimal amount;
    private String status; // "PENDING", "APPROVED", "ACTIVE", "DEFAULTED"
    private LocalDate startDate;
    private LocalDate maturityDate;
    // getters and setters for all fields
}

// All business logic in a service
class LoanService {
    public Loan approveLoan(Loan loan) {
        loan.setStatus("APPROVED");
        loanRepository.save(loan);
        // more logic scattered here
    }
}
```

This was refactored to a rich domain model:

```
class Loan {
    private LoanId loanId;
    private BorrowerId borrowerId;
    private Money amount;
    private LoanStatus status; // enum with behavior
    private LoanTerm term;

    public Loan(LoanId loanId, BorrowerId borrowerId, Money amount, LoanTerm term) {
        this.loanId = loanId;
        this.borrowerId = borrowerId;
        this.amount = amount;
        this.term = term;
        this.status = LoanStatus.PENDING;
        this.validateInitiation();
    }

    public void approve(CreditRating rating, LocalDate approvalDate) {
        if (!this.status.canTransitionTo(LoanStatus.APPROVED)) {
            throw new IllegalLoanStateException("Cannot approve loan in state: " + this.status);
        }
        if (!rating.isEligibleFor(this.amount)) {
            throw new CreditInsufficientException("Borrower credit rating insufficient for loan amount");
        }
        this.status = LoanStatus.APPROVED;
        this.addDomainEvent(new LoanApproved(loanId, approvalDate));
    }

    public void disburse(LocalDate disbursementDate) {
        if (this.status != LoanStatus.APPROVED) {
            throw new IllegalLoanStateException("Cannot disburse unapproved loan");
        }
        if (disbursementDate.isAfter(term.fundsReservationExpiry())) {
            throw new FundsReservationExpiredException("Loan approval has expired");
        }
        this.status = LoanStatus.ACTIVE;
        this.startDate = disbursementDate;
        this.addDomainEvent(new LoanDisbursed(loanId, disbursementDate));
    }
}
```

The refactoring moved all business invariants into the domain objects. The `Loan` entity prevented direct state changes, enforced state transitions through the `LoanStatus` enum, and validated credit ratings before approval. Domain services handled operations requiring external data (e.g., checking credit ratings), but the core business decisions remained in the entity. After refactoring, the loan approval logic was covered by 85 unit tests that tested business rules directly against the `Loan` entity without any service layer or database dependency.
