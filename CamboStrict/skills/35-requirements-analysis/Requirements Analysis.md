# Requirements Analysis

## Purpose

Define a systematic methodology for analyzing, validating, and structuring software requirements to ensure that engineering teams build the right thing. This skill equips analysts and engineers with techniques to decompose ambiguous business needs into precise, testable specifications that can be implemented with confidence and traced back to business value.

## Responsibilities

- Distinguish between functional requirements (what the system must do) and non-functional requirements (how the system must behave) and ensure both are captured and validated
- Decompose epics and high-level business needs into detailed, estimatable user stories with clear acceptance criteria
- Define acceptance criteria that are specific, measurable, testable, and unambiguous for every user story
- Validate requirements against business goals, feasibility constraints, and user needs before development begins
- Detect and resolve ambiguity in requirements by identifying vague terms, implicit assumptions, and contradictory statements
- Identify missing requirements by analyzing edge cases, failure scenarios, and cross-functional concerns
- Apply MoSCoW prioritization (Must have, Should have, Could have, Won't have) to scope delivery and manage stakeholder expectations
- Establish requirements traceability from business objectives through features, stories, and test cases

## Decision Process

1. Elicit requirements from stakeholders using structured techniques including interviews, workshops, document analysis, and observation. Distinguish between what stakeholders say they want, what they actually need, and what users genuinely require. Multiple elicitation techniques produce more complete requirements.

2. Categorize each requirement as functional or non-functional. Functional requirements describe system behavior. Non-functional requirements describe quality attributes: performance, security, scalability, usability, reliability, maintainability. Both categories require equal rigor; non-functional requirements are frequently implicit and frequently missed.

3. Decompose epics into user stories using the standard format: "As a [user role], I want to [goal] so that [benefit]." Each user story must represent a vertical slice of value that can be completed independently. Stories that cannot be completed in a single iteration need further decomposition.

4. Define acceptance criteria for each user story using the Given/When/Then format (Gherkin syntax) or a structured checklist. Acceptance criteria must be testable, unambiguous, and complete. Every acceptance criterion must pass or fail definitively.

5. Validate requirements for ambiguity. Identify vague terms ("fast", "responsive", "secure", "easy to use"), quantify them. "Fast" becomes "responds within 200ms for 95% of requests." "Secure" becomes "all data encrypted at rest and in transit using AES-256 and TLS 1.3."

6. Identify missing requirements by analyzing the requirement through multiple lenses:
   - Happy path: the expected successful scenario
   - Unhappy path: error conditions, invalid inputs, system failures
   - Edge cases: unusual but valid inputs, boundary conditions, empty states
   - Cross-functional concerns: logging, monitoring, auditing, internationalization, accessibility

7. Prioritize requirements using MoSCoW with explicit criteria for each category:
   - Must have: required for the current release; without them the solution is invalid
   - Should have: important but not critical; include if possible without delaying Must haves
   - Could have: desirable but not necessary; include if time and budget permit
   - Won't have: explicitly excluded from the current scope; prevents scope creep

8. Validate requirements against business objectives. For each requirement, ask: "Does this requirement directly support a stated business goal? What is the cost of not implementing this requirement?" Requirements that do not trace to business goals are candidates for deprioritization.

9. Document requirements traceability by linking each requirement to its source (stakeholder, document, regulation), its business objective, its acceptance criteria, and its test cases. Traceability enables impact analysis when requirements change.

10. Review requirements with stakeholders and development team before development begins. Walk through acceptance criteria with examples. Identify gaps, conflicts, and unrealistic expectations. Obtain explicit sign-off from authorized stakeholders.

## Inputs

- Business goals and strategic objectives from product management
- Stakeholder interviews and workshop notes
- Existing system documentation and user feedback
- Market research, competitive analysis, and industry standards
- Regulatory and compliance requirements (GDPR, SOC2, PCI-DSS, HIPAA, accessibility standards)
- Technical feasibility assessments and architectural constraints
- User research including personas, journey maps, and usability test results
- Bug reports and feature requests from existing systems

## Outputs

- User stories with acceptance criteria in Given/When/Then format
- Functional requirements specification
- Non-functional requirements specification with quantified targets
- MoSCoW prioritization matrix with clear rationale for each category
- Requirements traceability matrix linking requirements to business goals and test cases
- Ambiguity resolution log documenting identified ambiguities and their resolutions
- Missing requirements analysis identifying gaps with proposed additions
- Requirements validation sign-off from stakeholders

## Rules

1. Every requirement must be uniquely identifiable and traceable to a business goal. Requirements that cannot be traced to a specific business objective are candidates for elimination.
2. Acceptance criteria must be objectively testable. "The user should have a good experience" is invalid. "The page loads within 2 seconds on a 4G connection" is valid. Every acceptance criterion must have a pass/fail condition.
3. Non-functional requirements must be quantified with specific measures and targets. "The system shall be scalable" is invalid. "The system shall support 10,000 concurrent users with response time under 500ms at p99" is valid.
4. Requirements must be validated with stakeholders before development begins. Stories developed without stakeholder validation have a high probability of rework. Validation must include concrete examples.
5. Ambiguous terms must be identified and resolved before a story enters development. If two team members interpret a requirement differently, it is not ready for implementation. The ambiguity resolution must be documented.
6. Every user story must include both happy path and unhappy path acceptance criteria. Stories that only describe the expected success scenario are incomplete. Error handling, validation failures, and system errors must be specified.
7. Requirements changes must go through a formal change control process. Uncontrolled requirements changes produce scope creep, rework, and schedule delays. Every change must be assessed for impact on scope, schedule, and cost.
8. Must-have requirements must be limited to the essential minimum for a viable release. If more than 60% of requirements are Must have, the prioritization is not discriminating enough. Scope management requires trade-offs.
9. Requirements must be reviewed by at least two people other than the author. Single-author requirements contain blind spots and implicit assumptions that are invisible to the author. Peer review catches ambiguity and missing details.
10. The requirements specification must be version-controlled and all changes must be documented. Requirements are living artifacts that evolve. Version history enables understanding of why and when requirements changed.

## Best Practices

1. Write user stories collaboratively in refinement sessions with product managers, developers, and testers. Collaborative writing produces richer understanding and catches ambiguities earlier than written-then-reviewed approaches.
2. Use story mapping to visualize the user journey and identify gaps in the story coverage. A story map shows the flow of activities from the user's perspective and highlights stories that are missing.
3. Include "happy path" and "unhappy path" examples in the acceptance criteria. For a login story, the happy path is valid credentials; unhappy paths include wrong password, locked account, expired password, and network timeout.
4. Use person-based estimation (or relative sizing) after requirements are clarified but before detailed design. Estimation at the story level should account for both the functional and non-functional aspects of the requirement.
5. Maintain a requirements glossary for domain-specific terms used in requirements. Every term with specialized meaning must be defined. The glossary prevents misinterpretation across teams and stakeholders.
6. Define acceptance criteria before development starts, not during testing. Test-driven requirements produce better outcomes than discovery-driven testing. Acceptance criteria serve as the contract between product and engineering.
7. Use the INVEST criteria to evaluate user story quality: Independent, Negotiable, Valuable, Estimable, Small, Testable. Stories that fail any INVEST criterion need refinement before entering development.
8. Conduct a requirements validation workshop with stakeholders after requirements are drafted. Walk through each requirement with concrete examples and ask stakeholders to demonstrate their understanding by describing test scenarios.
9. Trace non-functional requirements to specific architectural decisions. A non-functional requirement for 99.99% uptime drives architecture choices (multi-AZ deployment, circuit breakers, failover) that must be documented and costed.
10. Revisit priorities at the start of each planning cycle. Business conditions change, and yesterday's Must have may be today's Should have. Regular reprioritization keeps the backlog aligned with current business value.

## Anti-patterns

1. **Requirements as a wishlist**: A collection of unprioritized, unvalidated desires from multiple stakeholders without any trade-off analysis. Wishlists create unrealistic expectations and make scope management impossible.
2. **Assume the reader knows**: Writing requirements that assume domain knowledge without providing context. Requirements must be self-contained or reference a shared glossary. Assuming knowledge excludes new team members and external stakeholders.
3. **Copy-paste requirements**: Reusing requirements from previous projects without validating their applicability to the current context. Each project has unique constraints, users, and business goals that change what requirements mean.
4. **Non-functional requirements as an afterthought**: Defining functional requirements in detail but leaving non-functional requirements as vague statements like "the system must be performant." Non-functional requirements drive architecture and must be specified with the same rigor as functional requirements.
5. **Stakeholder-only sign-off**: Getting approval only from stakeholders without validating with developers or testers. Stakeholders approve the intent; developers and testers validate the implementability and testability. Both approvals are necessary.
6. **Over-specification**: Specifying implementation details in requirements rather than desired outcomes. Requirements should specify what the system must do, not how it must be implemented. Implementation details belong in design documents.

## Edge Cases

1. **Conflicting stakeholder requirements**: Two stakeholders have requirements that cannot both be satisfied (e.g., maximum security vs maximum usability). Document the conflict, facilitate a trade-off discussion, and have the decision-maker choose. Both stakeholder positions must be recorded with the resolution rationale.
2. **Requirements that emerge during development**: A discovery during implementation reveals a requirement that was not identified during analysis. Follow the change control process: assess impact, reprioritize, and adjust scope or schedule. Do not absorb unplanned requirements without adjusting the plan.
3. **Regulatory requirements that conflict with user experience**: A compliance regulation requires a security step that degrades UX (e.g., mandatory MFA every session). Document the conflict and the regulatory mandate. The requirement is non-negotiable but the UX impact can be mitigated through design (remembered devices, session management).
4. **Vague requirements from senior stakeholders**: A senior stakeholder says "make it modern" or "improve the workflow." This must be decomposed into specific, measurable requirements: "The dashboard must load within 2 seconds" and "The checkout process must be completable in 3 steps."
5. **Requirements with hidden dependencies**: Story B appears independent but actually depends on Story A being implemented first. Dependency analysis must be explicit in the requirements specification. Stories with hidden dependencies cause integration failures and schedule delays.
6. **Internationalization and localization requirements**: Requirements written for a single language market miss translation, date formatting, currency, and cultural adaptation needs. Identify i18n/l10n requirements during analysis, not during implementation.

## Validation Checklist

- [ ] Every requirement is uniquely identifiable with a stable ID
- [ ] Every user story follows the "As a... I want... so that..." format
- [ ] Acceptance criteria are written in Given/When/Then format or equivalent
- [ ] Every acceptance criterion is objectively testable (pass/fail)
- [ ] Non-functional requirements are quantified with specific measures and targets
- [ ] Ambiguous terms have been identified and resolved in the ambiguity log
- [ ] Both happy path and unhappy path acceptance criteria are defined
- [ ] MoSCoW prioritization is applied with documented rationale for each category
- [ ] Requirements traceability matrix links every requirement to a business objective
- [ ] Requirements have been validated with stakeholders and signed off
- [ ] Requirements have been reviewed by at least two people other than the author
- [ ] Change control process is defined and communicated to all stakeholders

## Engineering Examples

### Example 1: Breaking Down an Epic into User Stories

**Epic:** "Customers should be able to manage their subscription"

This epic was too large and vague for development. The requirements analyst decomposed it through stakeholder interviews and process analysis:

**Decomposition:**
1. "As a customer, I want to view my current subscription details (plan name, price, renewal date, status) so that I know what I'm currently paying for"
   - Acceptance criteria:
     - Given I am logged in, when I navigate to "My Subscription", then I see my plan name, monthly/yearly price, next renewal date, and subscription status
     - Given my subscription is expired, when I view subscription details, then I see "Expired" status with reactivation prompt

2. "As a customer, I want to upgrade my subscription to a higher tier so that I can access premium features"
   - Acceptance criteria:
     - Given I am on the Basic plan, when I select the Pro plan and confirm, then my plan changes immediately and I am charged the prorated difference
     - Given I attempt to upgrade during a free trial, when I confirm, then my free trial is preserved and upgrade takes effect after trial ends

3. "As a customer, I want to cancel my subscription so that I am not charged at the next renewal"
   - Acceptance criteria:
     - Given I have an active subscription, when I cancel, then my subscription is set to "Canceled" and access continues until the current billing period ends
     - Given I cancel within 14 days of the last upgrade, then I receive a full refund for the upgrade

4. "As a customer, I want to reactivate a canceled subscription so that I can continue service without interruption"
   - Acceptance criteria:
     - Given my subscription was canceled but still within the current billing period, when I reactivate, then my subscription is set to "Active" with no gap in service
     - Given my subscription was canceled and the billing period has ended, when I reactivate, then a new billing period starts immediately

**Non-functional requirements identified:** The subscription management pages must load within 1 second. The plan change operation must be reflected in billing within 5 minutes. Subscription data must be accurate within 30 seconds of any change (read-your-writes consistency).

### Example 2: Identifying Implicit Non-Functional Requirements

**Functional requirement:** "The system shall allow customers to upload profile photos"

The analyst identified the following implicit non-functional requirements through systematic analysis:

**Performance:**
- Photo upload must complete within 3 seconds on a 5 Mbps connection
- The thumbnail generation must complete within 500ms of upload completion

**Scalability:**
- The system must support 1,000 concurrent photo uploads during peak hours
- Photo storage must scale to 10 TB without performance degradation

**Security:**
- Uploaded photos must be scanned for malware before being served to other users
- Photo URLs must be non-guessable (UUID-based, not sequential IDs)
- EXIF data containing GPS location must be stripped during processing

**Reliability:**
- Upload failures must not result in data loss; partial uploads must be retryable
- The system must maintain at least 99.9% availability for the upload endpoint

**Usability:**
- Supported file formats (JPEG, PNG, WebP) and maximum file size (10 MB) must be communicated to the user before upload
- Progress indication must be shown during upload
- Error messages must specify the reason for failure (wrong format, file too large, network error)

**Compliance:**
- Photo storage must comply with GDPR: users must be able to request photo deletion
- Photo content must be reviewable for policy violations within 24 hours of upload

**Operational:**
- Failed uploads must be logged with reason codes for monitoring and debugging
- Upload bandwidth usage must be trackable for cost allocation

These non-functional requirements were documented alongside the functional requirement and used to drive architecture decisions (CDN for photo storage, S3 for scalable object storage, lambda for async thumbnail generation and malware scanning).

### Example 3: Resolving Ambiguous Acceptance Criteria

**Original acceptance criterion:** "The search results should be displayed quickly and should show relevant results"

This criterion failed the testability test. The analyst decomposed it into specific, measurable criteria:

**Resolution:**
- Performance: "Search results must appear within 500ms for queries returning fewer than 1,000 results, and within 2 seconds for any valid query"
- Relevance: "The first result must match at least 3 of the search terms. 90% of the first page results (top 20) must contain at least 1 search term"
- Relevance scoring: "Results are ordered by relevance score computed as: exact title match > partial title match > exact content match > partial content match > tag match"
- Empty results: "When no results match, display 'No results found for [query]. Try adjusting your search terms' with suggestions based on similar queries"
- Partial matches: "Results containing partial matches must indicate which portion matched and show a 3-word context snippet around the match"
- Pagination: "Results are paginated at 20 per page. Pagination controls show at bottom if more than 20 results exist. Total result count must be displayed"

Additionally, the analyst identified missing requirements:
- Search must handle Unicode characters (international names)
- Search must be case-insensitive
- Search must ignore common stop words (the, and, or, of)
- Search must support quoted phrases for exact matching
- Filtered search within existing results (by date, category, status) must be supported

The resolution was documented and reviewed with stakeholders. The product manager confirmed the quantified relevance criteria matched their mental model of "relevant results." The performance criteria were validated as feasible by the engineering team based on the existing search infrastructure.
