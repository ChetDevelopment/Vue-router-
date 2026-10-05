# Business Analysis: Engineering Requirements and Stakeholder Alignment

## Purpose

This skill defines how the AI performs business analysis as part of the engineering process. It exists to ensure that the AI can translate business needs into precise technical requirements, identify all relevant stakeholders, decompose goals into measurable outcomes, and maintain traceability from business objective through implementation to validation. Without this skill, the AI risks building technically correct solutions that fail to deliver business value, missing critical non-functional requirements, or making assumptions about stakeholder needs that turn out to be wrong.

## Responsibilities

1. **Stakeholder identification.** The AI must identify every person or group who has a stake in the system being built: end users, operators, maintainers, managers, compliance officers, customers of the system, and anyone whose work is affected by the system. Each stakeholder's needs must be explicitly considered.

2. **Goal decomposition.** The AI must break high-level business goals into specific, measurable, achievable, relevant, and time-bound (SMART) outcomes. A business goal like "improve customer satisfaction" must be decomposed into specific metrics and targets that can be validated.

3. **Requirements elicitation.** The AI must ask the right questions to surface real needs, distinguishing between stated requirements (what the stakeholder says they want) and actual needs (what would solve their problem). The AI must probe for implicit assumptions, unstated constraints, and hidden dependencies.

4. **Requirements classification.** The AI must classify every requirement by type: functional (what the system must do), non-functional (how the system must behave: performance, security, availability, scalability, maintainability), implicit (assumed but not stated), and explicit (formally specified). Missing non-functional requirements are a common source of project failure.

5. **Traceability management.** The AI must maintain a clear chain from each business goal through requirements to implementation decisions and test cases. Every line of code should be traceable to a requirement, and every requirement should be traceable to a business goal.

6. **Value analysis.** The AI must assess the business value and cost of each requirement, enabling prioritization decisions. Value is measured in business outcomes (revenue, cost savings, risk reduction, user satisfaction). Cost includes engineering time, operational cost, opportunity cost, and ongoing maintenance.

## Decision Process

**Step 1: Identify the business context.** What is the business goal? Who defined it? What metrics will determine success? What is the timeline? What constraints exist (budget, regulatory, technical, organizational)?

**Step 2: Identify stakeholders.** Create a stakeholder map. For each stakeholder, identify: their relationship to the system, their goals, their pain points, their influence on the project, and how they will validate the solution.

**Step 3: Elicit requirements.** Engage with each stakeholder (directly or through available artifacts) to understand their needs. Ask open-ended questions. Probe for the problem behind the requested solution. Listen for what is not being said.

**Step 4: Classify and document requirements.** For each requirement, classify it as functional or non-functional and as explicit or implicit. Document it with a unique identifier, description, source, priority, and acceptance criteria. Ensure non-functional requirements are quantified (e.g., "the system must handle 1,000 concurrent users with P99 latency under 500ms" rather than "the system must be fast").

**Step 5: Analyze dependencies and conflicts.** Identify where requirements depend on each other, where they conflict, and where they are redundant. Requirements conflicts must be resolved with stakeholder input, not by engineering guessing which one to prioritize.

**Step 6: Prioritize requirements.** Using business value, cost, risk, and dependency information, create a prioritized requirement list. Distinguish between minimum viable set (must-have for initial release), important but deferrable (should-have), and nice-to-have (could-have). Be explicit about what is explicitly out of scope.

**Step 7: Establish traceability.** Create a traceability matrix linking business goals to requirements to implementation modules to test cases. This ensures coverage and enables impact analysis when requirements change.

**Step 8: Validate requirements.** Review the requirements with stakeholders. Confirm that the documented requirements accurately reflect their needs. Use concrete examples and acceptance criteria to ensure shared understanding.

## Inputs

- Business goals and strategy documents
- Stakeholder interviews, surveys, and feedback
- Existing system documentation and codebase
- Market research, competitive analysis, user research
- Regulatory and compliance requirements
- Budget, timeline, and resource constraints
- Technical architecture and platform constraints

## Outputs

- Stakeholder map with roles, goals, and pain points
- Documented requirements with unique identifiers, classification, and priorities
- Requirements traceability matrix from business goals to test cases
- Value analysis for each requirement (business value vs. cost)
- Prioritized requirement list (must-have, should-have, could-have, out-of-scope)
- Risk assessment for requirements conflicts and gaps
- Validation criteria and acceptance tests for each requirement

## Rules

1. **Every requirement must have a source.** If a requirement cannot be traced to a specific stakeholder or business goal, it is an assumption, not a requirement. Label it as such and validate it before treating it as a requirement.

2. **Non-functional requirements must be quantified.** Performance requirements must specify the metric, the threshold, and the conditions. Security requirements must specify the threat model. Availability requirements must specify the uptime percentage and the measurement window. Unquantified non-functional requirements are not actionable.

3. **Requirements must be testable.** Every requirement must have an associated acceptance test that can determine objectively whether the requirement is satisfied. If you cannot write a test for a requirement, the requirement is not well-defined.

4. **Stakeholder requests are not requirements.** A stakeholder's proposed solution is a hypothesis about how to meet their needs, not a requirement. The underlying need is the requirement. The AI must distinguish between the two and validate the proposed solution against the actual need.

5. **Requirements change — plan for it.** The requirements elicitation process is iterative, not one-time. The AI must design for change: use modifiable requirement documents, maintain traceability, and expect that priorities will shift. Requirements changes should trigger impact analysis, not frustration.

6. **Silence is not agreement.** When stakeholders do not respond to requirements review requests, it does not mean they approve. It means they have not reviewed the requirements. Unreviewed requirements should be flagged as unvalidated.

7. **The cost of a requirement includes the cost of verifying it.** When estimating effort for a requirement, include the cost of writing tests, setting up test environments, and performing validation. A requirement that costs 5 days to implement and 5 days to verify costs 10 days, not 5.

8. **Scope creep must be managed explicitly.** When new requirements emerge during implementation, they must go through the same prioritization process as original requirements. Every scope change must include a trade-off discussion about what will be descoped to accommodate it.

9. **Regulatory requirements are non-negotiable.** Compliance requirements (GDPR, PCI-DSS, HIPAA, SOC2) are hard constraints. The AI must identify applicable regulations, understand the specific requirements, and ensure the solution meets them. Cost or timeline pressure is not a valid reason to skip compliance.

10. **Requirements must be written for the intended audience.** Technical requirements for engineers should be precise and detailed. Business requirements for stakeholders should focus on outcomes and value. The same requirement may need multiple formulations for different audiences.

## Best Practices

1. **Use the 5 Whys for requirement elicitation.** When a stakeholder states a requirement, ask "why" five times (or until you reach a fundamental need). This prevents building solutions to surface-level requests and reveals the underlying true need.

2. **Create user stories with acceptance criteria.** Write requirements as user stories following the format: "As a [user role], I want [goal] so that [reason]." Add acceptance criteria as concrete examples in Given-When-Then format. This ensures shared understanding and testability.

3. **Maintain a glossary of terms.** Stakeholders from different parts of the business use the same words to mean different things. Document key terms with precise definitions and resolve terminology conflicts before they cause implementation errors.

4. **Perform impact analysis for every change.** When a requirement changes, trace its impact through the full chain: what implementations are affected, what tests must be updated, what documentation must change, what deployments are affected, what rollback plans need updating.

5. **Use prototypes to validate requirements.** When requirements are uncertain or complex, build a low-fidelity prototype (wireframe, clickable mockup, or proof-of-concept) and validate it with stakeholders before committing to the full implementation.

6. **Separate "what" from "how" in early requirements.** Early requirements should focus on what the system must do (functional) and how well it must perform (non-functional), not how it should be implemented. Leave implementation decisions to the design phase.

7. **Conduct requirements reviews with diverse stakeholders.** Include representatives from all stakeholder groups in requirements reviews. Engineers, product managers, QA, operations, customer support, and compliance should all have a voice.

8. **Document decisions and their rationale.** When requirements are refined, changed, or rejected, document why. This prevents repeated debate over closed decisions and provides context for future engineers who need to understand the current state.

9. **Use the MOSCOW method for prioritization.** Classify every requirement as: Must have (critical for launch), Should have (important but not critical), Could have (nice to have), Will not have (explicitly out of scope for this iteration). This creates a shared vocabulary for prioritization discussions.

10. **Quantify business value in monetary terms when possible.** Instead of "improve user experience," estimate "reduce support ticket volume by 15%, saving $20,000/month in support costs." Monetary quantification makes trade-off discussions concrete and objective.

## Anti-patterns

1. **Building what was asked for instead of what is needed.** Taking a stakeholder's proposed solution as the requirement and implementing it without understanding the underlying problem. This produces a solution that may be precisely wrong rather than approximately right.

2. **Assuming all stakeholders have the same priorities.** Treating all stakeholder input equally without understanding the power dynamics, competing interests, and different success criteria. This leads to requirements that satisfy no one.

3. **Ignoring non-functional requirements until they cause failure.** Treating performance, security, scalability, and maintainability as afterthoughts rather than first-class requirements. This leads to systems that function correctly but fail in production.

4. **Requirements gold-plating.** Adding unnecessary detail, precision, or scope to requirements because it feels safer or more thorough. This increases cost and time without delivering proportional value.

5. **Analysis paralysis.** Spending so much time on requirements elicitation and documentation that there is insufficient time left for implementation. Requirements should be sufficient, not exhaustive. The incremental delivery model reduces the need for perfect up-front requirements.

6. **Documenting requirements without validating them.** Writing detailed requirement documents that stakeholders sign off on without actually understanding them. True validation requires stakeholders to engage with concrete examples and prototypes, not just read and approve a document.

7. **Treating requirements as static.** Once requirements are documented, treating changes as failures of the requirements process rather than as inevitable learning. Agile projects expect requirements to evolve; the process should accommodate change gracefully.

8. **Blaming stakeholders for unclear requirements.** When requirements are unclear, it is the engineer's responsibility to ask clarifying questions, not the stakeholder's responsibility to have perfectly specified requirements from the start.

## Edge Cases

1. **The stakeholder does not know what they want.** When stakeholders cannot articulate requirements, use probing questions, provide concrete examples, show similar solutions, build prototypes, and use the 5 Whys technique. The goal is to collaborate on discovering the requirements, not to extract them from an unwilling source.

2. **Different stakeholders give conflicting requirements.** When requirements conflict, do not resolve the conflict yourself. Surface it to the stakeholders with the relevant trade-offs and let them (or their management) make the decision. Document the decision and the reasoning.

3. **There is no existing stakeholder.** For new systems or greenfield projects, the AI must identify who the stakeholders should be, not just who they currently are. This might include future users, operations teams that do not yet exist, or regulatory bodies that would apply to the system.

4. **The requirements change frequently.** High requirements churn is a signal that the problem is not well understood, the stakeholders are not aligned, or the business context is highly volatile. The AI should respond by shortening iteration cycles, investing in lightweight requirements, and deferring detailed specification as late as possible.

5. **Regulatory compliance is discovered mid-project.** When a previously unknown regulatory requirement is discovered, perform an impact assessment: what needs to change, what is the cost, what is the timeline impact, and can the requirement be met without a fundamental architecture change? If the requirement requires significant rework, escalate to stakeholders with a clear analysis.

6. **The real decision-maker is not participating.** When the person with actual authority over requirements and priorities is not engaged in the requirements process, requirements are likely to be overturned later. Flag this risk and advocate for the decision-maker's involvement.

7. **Requirements are copied from a competitor.** When stakeholders justify requirements by saying "competitor X has this feature," probe deeper: does the feature serve your users' needs? Does it fit your architecture? Is there evidence it drives the desired outcomes? Copying features without understanding their value is a common source of waste.

## Validation Checklist

- [ ] All stakeholders have been identified and their needs documented
- [ ] Requirements are classified by type (functional, non-functional, implicit, explicit)
- [ ] Every requirement has a traceable source (stakeholder or business goal)
- [ ] Non-functional requirements are quantified with specific metrics and thresholds
- [ ] Every requirement has a testable acceptance criterion
- [ ] Requirements conflicts have been identified and resolved or escalated
- [ ] Requirements are prioritized using the must-have/should-have/could-have/out-of-scope framework
- [ ] A traceability matrix links business goals to requirements to implementation to tests
- [ ] Stakeholders have reviewed and validated the requirements
- [ ] The cost (engineering, operational, opportunity) of each requirement has been estimated
- [ ] Requirements have been reviewed for completeness (no critical gaps)
- [ ] A change management process exists for handling requirement changes
- [ ] Regulatory and compliance requirements have been identified and addressed
- [ ] Requirements are written at the appropriate level of detail for the audience

## Engineering Examples

### Example 1: Analyzing a vague feature request

**Scenario:** A product manager requests: "We need a recommendation engine to increase sales."

**Business analysis approach:** The AI does not start implementing a recommendation engine. Instead, the AI begins the elicitation process. First, stakeholder identification: who is the requester? The product manager for the e-commerce team. Who benefits? Customers (better product discovery) and the business (increased revenue). Who is affected? The catalog team (data integration), the data science team (algorithm selection), the infrastructure team (hosting the engine). Next, goal decomposition: "increase sales" is too vague. The AI asks: what specific metric? Increase average order value? Increase conversion rate? Increase cross-sell rate? Increase repeat purchase rate? Each suggests a different type of recommendation (cross-sell, upsell, reorder, personalized browse). The AI also asks: what is the current baseline? Current cross-sell rate is 5% of orders. What is the target? 8% within 3 months. The AI probes the surface-level requirement: the product manager asked for a recommendation engine because they read about Amazon's success with one. But the actual need might be simpler: manually curated "frequently bought together" pairs for the top 100 products could achieve the same lift with 1% of the engineering cost. The AI classifies requirements: the explicit functional requirement is "recommend products to users." The implicit non-functional requirements include: latency (recommendations must appear within 200ms of page load), freshness (product availability must be current within 5 minutes), and privacy (user behavior data must not be exposed). The AI also identifies missing stakeholders: the legal team needs to review data collection practices, and customer support needs to understand how to explain recommendations to confused users. The AI produces a documented requirement set with priorities, traces each to the business goal, and includes acceptance criteria for each.

### Example 2: Identifying missing non-functional requirements

**Scenario:** The team is building a real-time collaborative document editor. The functional requirements are well-documented: create documents, share with collaborators, edit simultaneously, see changes in real-time, comment, and version history.

**Business analysis approach:** The AI reviews the requirements and immediately notices the complete absence of non-functional requirements. The AI asks: what happens when 500 users edit the same document? What is the maximum acceptable delay between one user typing and another seeing the text? What happens when a user is on a 3G connection in a moving train? What happens when the real-time service goes down? Can users continue editing offline? What is the data retention policy for deleted documents? What happens when two users delete different paragraphs simultaneously? Each of these questions surfaces a non-functional requirement that affects the architecture profoundly. The latency requirement (200ms for real-time updates vs 2 seconds) determines whether conflict-free replicated data types (CRDTs) or operational transformation is the right approach. The offline support requirement determines whether a local-first architecture is needed. The conflict resolution requirement determines whether the system needs a last-write-wins strategy or a more sophisticated merge algorithm. The AI documents these as specific requirements: "P99 latency from keystroke to visibility across all connected clients must be under 500ms on a standard broadband connection," "System must support 200 concurrent editors on a single document without degrading below the latency SLO," and "The server must be able to lose 50% of its instances without losing user edits or showing inconsistent state to users." These non-functional requirements are linked to specific implementation decisions and test cases. The AI also identifies a regulatory requirement: if the document editor handles health records, HIPAA compliance requires audit logging, access controls, and data encryption at rest and in transit.

### Example 3: Decomposing a business goal into technical requirements

**Scenario:** The executive team sets a goal: "Reduce customer churn by 20% in the next 6 months."

**Business analysis approach:** The AI decomposes this business goal into measurable outcomes: reduce churn rate from 5% monthly to 4% monthly. The AI then asks: what causes churn? Analysis of exit surveys shows three primary drivers: (a) users cannot find the features they need (35% of churn), (b) the onboarding process takes too long (30% of churn), (c) users experience performance issues on the mobile app (20% of churn). The remaining 15% is price-related and out of scope for engineering. The AI maps each driver to engineering requirements. For (a): improved search, better navigation, personalized onboarding that highlights relevant features. The measurable outcome: reduce average time-to-find-a-feature from 45 seconds to 10 seconds. For (b): simplify the sign-up flow from 5 steps to 3 steps, add progressive onboarding that delays non-essential configuration. The measurable outcome: reduce time-to-complete-onboarding from 8 minutes to 3 minutes. For (c): identify the specific performance bottlenecks, set performance budgets, and optimize the critical user paths. The measurable outcome: reduce mobile app cold start time from 4 seconds to under 1.5 seconds. Each of these measurable outcomes is then broken into specific functional and non-functional requirements with acceptance criteria. The AI creates a traceability matrix showing how each requirement traces back to a churn driver and how each churn driver traces to the 20% churn reduction goal. The AI also identifies dependencies: the navigation improvement (a) depends on the search infrastructure being upgraded first. The AI prioritizes the requirements by estimated impact on churn reduction vs. engineering effort, recommending that onboarding simplification (b) be tackled first because it has the highest impact-to-effort ratio. The AI also identifies a risk: without measuring the actual impact of each change on churn, the team will not know whether they are on track. The AI includes analytics instrumentation requirements as part of the implementation plan.
