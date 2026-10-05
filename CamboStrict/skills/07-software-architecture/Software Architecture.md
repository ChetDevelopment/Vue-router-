# Software Architecture

## Purpose

Define a rigorous, repeatable decision-making framework for software architecture that ensures systems are built with intentional trade-offs, documented rationale, and alignment with business goals. This skill enables architects to produce designs that balance quality attributes, scale predictably, and remain adaptable to changing requirements without accumulating structural debt.

## Responsibilities

- Select and justify architectural styles that match system constraints and business context
- Document architecture decisions using Architecture Decision Records (ADRs) with clear context, options considered, and rationale
- Analyze trade-offs between competing quality attributes such as performance, scalability, security, maintainability, and reliability
- Produce component diagrams, system context diagrams, and deployment architecture views that communicate the system structure to both technical and non-technical stakeholders
- Govern architectural consistency across teams by defining standards for inter-service communication, data flow, and integration patterns
- Evaluate and mitigate architectural risks early through lightweight architecture evaluations and reviews
- Define architectural runways that enable incremental delivery without compromising long-term structural integrity
- Ensure deployment architecture accounts for infrastructure constraints, disaster recovery, and operational observability

## Decision Process

1. Identify the architectural concern or decision trigger. Distinguish between a tactical implementation choice and a strategic architectural decision that has跨-system impact. A decision trigger might be a new feature requiring跨-service coordination, a performance bottleneck, or a security compliance requirement.

2. Gather all relevant constraints including business goals, team topology, infrastructure limitations, regulatory requirements, and existing technology stack commitments. Document constraints explicitly because they drive the feasible solution space.

3. Define the quality attribute scenarios that the architecture must satisfy. For each quality attribute (performance, scalability, security, maintainability, reliability, cost), specify a concrete stimulus-response measure. For example: "Under 10,000 concurrent users, the system shall respond to search queries within 200ms at p99."

4. Generate at least three distinct architectural options. Avoid anchoring on the first viable solution. Options should represent genuinely different structural approaches rather than minor variations of the same pattern.

5. Evaluate each option against the defined quality attribute scenarios using a weighted scoring matrix. Assign weights based on business priority and score each option's predicted effectiveness using evidence from past projects, documented patterns, and quantitative estimates.

6. Perform trade-off analysis, explicitly identifying which quality attributes each option sacrifices. Every architectural choice involves trade-offs; the decision document must surface what is being given up, not just what is gained.

7. Select the preferred option and document the rationale in an ADR. Include the decision context, options considered, evaluation results, trade-offs accepted, and consequences for the development team.

8. Validate the decision against known constraints. Re-examine the selected option against business constraints, team capability, timeline, and budget. If the option fails any hard constraint, return to step 4.

9. Plan the transition and migration path. If the architecture requires changes to an existing system, define the incremental migration steps, rollback strategy, and coexistence period.

10. Communicate the decision to all affected stakeholders. Producing the ADR alone is insufficient; conduct an architecture review session where questions and challenges are addressed before implementation begins.

## Inputs

- Business goals and product roadmap defining strategic direction
- System requirements including both functional and non-functional specifications
- Existing architecture documentation and codebase analysis
- Infrastructure and platform constraints from operations and DevOps teams
- Regulatory and compliance requirements (GDPR, SOC2, PCI-DSS, HIPAA)
- Team topology including team size, geographic distribution, and skill levels
- Budget and timeline constraints from project management
- Performance and scalability benchmarks from load testing or production monitoring
- Security threat models and risk assessments

## Outputs

- Architecture Decision Records (ADRs) capturing each significant architectural decision with context, options, rationale, and consequences
- System context diagram showing the system's boundaries and external integrations using C4 model or equivalent notation
- Component diagram illustrating the major structural components and their responsibilities
- Deployment architecture diagram showing infrastructure layout, network topology, and deployment units
- Quality attribute trade-off analysis document with weighted scoring and accepted trade-offs
- Architecture runway plan defining the sequence of architectural increments aligned with delivery milestones
- Risk register identifying architectural risks, their likelihood, impact, and mitigation strategies

## Rules

1. Every architectural decision must be documented in an ADR before implementation begins. Undocumented decisions create knowledge gaps that lead to inconsistent interpretations and architectural drift.
2. Architecture must be evaluated against at least three concrete quality attribute scenarios. An architecture that only considers functional requirements is incomplete and will fail under operational pressure.
3. All architectural options must include a clear statement of what is being sacrificed. If no trade-off is identified, the analysis is insufficiently thorough.
4. The dependency rule must be enforced: dependencies in source code point inward toward business logic, never outward toward infrastructure. Violating this rule produces systems where business rules are coupled to frameworks and databases.
5. Architecture decisions must be reversible when possible and irreversible decisions must be flagged with explicit mitigation plans. Irreversible decisions (e.g., database technology, cloud provider) require additional scrutiny and validation.
6. Every component must have a single, well-defined responsibility and a documented reason to change. Components that serve multiple purposes violate separation of concerns and create maintenance burdens.
7. Inter-component communication must be explicitly defined with contracts, including expected latency, reliability guarantees, and data formats. Implicit communication channels produce integration failures that are difficult to diagnose.
8. The architecture must support incremental delivery. No architecture should require a big-bang deployment to deliver value. Every increment must be independently deployable and testable.
9. Security must be considered at the architecture level, not retrofitted. Authentication, authorization, data encryption, and audit logging must be part of the architectural design before any code is written.
10. The architecture must include defined observability mechanisms (logging, metrics, tracing) as first-class architectural components. Systems that lack observability at the architecture level are impossible to operate in production.

## Best Practices

1. Use the C4 model for architecture documentation. Start with context diagrams, then containers, then components, then code. Level of detail should match the audience and decision at hand.
2. Maintain a decision log that is version-controlled alongside the codebase. Place ADRs in an `adr/` directory at the repository root so they are discoverable and subject to the same review process as code.
3. Conduct lightweight architecture evaluations at the end of each major iteration. A two-hour session with key stakeholders can catch structural issues early when they are cheap to fix.
4. Apply the Strangler Fig pattern when migrating from a legacy architecture to a new one. Incrementally replace components rather than attempting a risky rewrite.
5. Design for testability at the architecture level. Every component should be testable in isolation with mocked dependencies. If a component is difficult to test, the architecture is flawed.
6. Use asynchronous communication for跨-service interactions that do not require immediate consistency. Synchronous calls create temporal coupling and reduce system resilience.
7. Establish architectural fitness functions that automatically verify architectural constraints. Use static analysis tools to enforce dependency rules, layer violations, and cyclic dependency prevention.
8. Create an architecture runway that extends approximately two sprints ahead of implementation. This provides enough guidance for teams without over-engineering future requirements that may change.
9. Involve operations teams early in deployment architecture decisions. Infrastructure constraints discovered late in the development cycle lead to costly rework and delayed releases.
10. Document the rationale behind rejected options as thoroughly as the chosen one. Future architects will benefit from understanding why alternatives were discarded, preventing repeated analysis.

## Anti-patterns

1. **Architecture by resume**: Selecting a technology or pattern because it looks impressive on a personal portfolio rather than because it solves a genuine business problem. Netflix-scale architectures are inappropriate for a startup with 100 users.
2. **Analysis paralysis**: Spending excessive time evaluating architectural options without delivering working software. Architecture decisions should follow the 80% rule: gather enough information to make an informed choice, then validate with implementation.
3. **Big Design Up Front**: Attempting to specify every architectural detail before writing any code. Architecture must evolve as understanding deepens. Over-specification leads to wasted effort on designs that become irrelevant.
4. **Architecture astronaut**: Creating layers of abstraction and indirection without a concrete problem to solve. Abstract architectures that predict every possible future change produce complexity that outweighs any imagined benefit.
5. **Golden hammer**: Applying a single architectural pattern (e.g., microservices, event sourcing) to every problem regardless of context. A monolith is a valid and often superior choice for many systems.
6. **Missing trade-off documentation**: Presenting an architectural choice as universally optimal without acknowledging what is sacrificed. Every decision has downsides; hiding them creates false confidence and blindsides the team later.

## Edge Cases

1. **Regulatory override**: A regulatory requirement (e.g., data sovereignty, audit trail) may force an architectural choice that contradicts technical best practices. Document the override explicitly and flag it for periodic review as regulations evolve.
2. **Team topology mismatch**: The ideal architecture assumes a team structure that does not exist. Conway's Law means architecture will mirror communication structures. If the team cannot support the architecture, adapt the architecture to the team.
3. **Legacy constraint**: A required integration with a legacy system may prevent adoption of an otherwise optimal pattern. The architecture must accommodate the legacy system's constraints, including its availability, data formats, and failure modes.
4. **Performance cliff**: A quality attribute scenario may reveal that the architecture performs well at normal loads but has a sudden catastrophic failure at a specific threshold. Document the cliff point and implement circuit breakers or load shedding.
5. **Incremental delivery conflict**: The desired target architecture may require changes that cannot be delivered incrementally without breaking existing functionality. Identify the minimum viable architecture that unlocks incremental delivery.
6. **Hidden coupling through data**: Services may be architecturally decoupled at the code level but remain coupled through shared databases or schemas. Database-level coupling is the most insidious form of coupling and requires explicit management.

## Validation Checklist

- [ ] Every architectural decision has a corresponding ADR with context, options considered, and rationale
- [ ] At least three quality attribute scenarios are defined with concrete stimulus-response measures
- [ ] Trade-offs for the chosen option are explicitly documented, including what was sacrificed
- [ ] Component diagram exists and shows all major components with their responsibilities and interfaces
- [ ] System context diagram shows all external systems and integrations
- [ ] Deployment architecture is documented and accounts for infrastructure, networking, and scaling
- [ ] Dependency rule is enforced with automated checks (static analysis, architecture tests)
- [ ] Each component has a single responsibility and documented reason to change
- [ ] Security requirements are addressed at the architecture level, not deferred
- [ ] Observability (logging, metrics, tracing) is designed into the architecture
- [ ] Incremental delivery path exists from current state to target architecture
- [ ] Migration plan includes rollback strategy and coexistence period for legacy components

## Engineering Examples

### Example 1: Choosing Between Monolith and Microservices for an E-Commerce Platform

A growing e-commerce company with 15 engineers needed to decide whether to split their monolithic application into microservices. The decision process evaluated three options: stay with a well-structured monolith, extract domain boundaries into 6 microservices, or adopt a modular monolith as an intermediate step.

The team weighted maintainability (30%), delivery velocity (25%), scalability (20%), operational complexity (15%), and cost (10%). The modular monolith scored highest because it provided clear module boundaries aligned to bounded contexts, could be deployed as a single unit for operational simplicity, and allowed incremental extraction of services as team size grew. The ADR documented the trade-off: operational simplicity at the cost of not having independent scaling. The team committed to extracting the inventory and payment services into separate deployments when the team reached 30 engineers. The modular monolith was delivered in 4 months and served as the platform for the next 18 months of growth.

### Example 2: Selecting an Event-Driven Architecture for a Notification System

A SaaS platform needed a notification system capable of delivering email, SMS, push, and in-app notifications with delivery guarantees and tracking. The system had to handle burst traffic from marketing campaigns (100,000 notifications in 5 minutes) while maintaining under 30-second delivery latency.

The architecture team evaluated request-response, message queue, and event-driven approaches. The event-driven architecture was selected because it decoupled notification generation from delivery, allowed independent scaling of delivery channels, and provided built-in retry and dead-letter handling through an event broker (Apache Kafka). The ADR noted the trade-off: increased infrastructure complexity and the need for event schema management via Schema Registry. The team implemented idempotency keys in notification producers to handle duplicate events, and designed the consumer groups so that channel failures (e.g., SMS provider outage) did not block other channels. The system handled 500,000 notifications in under 10 seconds during the first campaign.

### Example 3: Documenting an ADR for Database Choice in a Multi-Tenant SaaS

A SaaS team had to choose between PostgreSQL (single-tenant database per customer) and a shared database with row-level security for their multi-tenant application. The quality attribute scenarios were: tenant isolation for security compliance, operational cost at 500 tenants, and query performance under tenant data growth.

The ADR documented three options: dedicated databases per tenant, a shared database with schema per tenant, and a shared database with row-level security. The team selected dedicated databases per tenant because it provided the strongest isolation guarantee required by their SOC2 certification, simplified backup and restore at the tenant level, and eliminated the risk of cross-tenant data leaks from application bugs. The trade-offs documented were higher operational cost (500 database instances) and more complex schema migrations. The ADR included a consequence: the team invested in database provisioning automation and flyway-based migration tooling that could roll out schema changes across all tenant databases within 2 hours.
