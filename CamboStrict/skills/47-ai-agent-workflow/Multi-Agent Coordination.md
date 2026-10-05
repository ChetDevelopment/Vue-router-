# Multi-Agent Coordination

## Purpose

Define protocols and methodologies for AI agents to coordinate effectively with other AI agents and human team members in a collaborative software engineering environment. This skill ensures clean handoffs, shared context, clear responsibility boundaries, avoidance of duplicate work, proper synchronization at integration points, and escalation paths when agents are stuck. It also addresses communicating technical decisions appropriately to different audiences.

## Responsibilities

- Establishing clear handoff protocols between agents when passing work
- Maintaining shared context across agent boundaries without duplication
- Defining and respecting responsibility boundaries to avoid stepping on each other's work
- Detecting and preventing duplicate work when agents have overlapping capabilities
- Establishing synchronization points where dependent work must be coordinated
- Providing escalation paths when an agent cannot resolve a blocker independently
- Adapting communication format and detail level for different audiences (engineers, PMs, QA)
- Producing integration contracts between agent deliverables (API specs, shared interfaces)
- Resolving conflicts when two agents produce incompatible outputs
- Tracking cross-agent dependencies and notifying affected agents of changes
- Conducting cross-agent retrospectives to improve coordination

## Decision Process

1. **Identify the coordination need** — At the start of a multi-agent or team task, determine which parts require coordination: shared interfaces, API contracts, database schema changes, deployment order, testing handoffs.
2. **Define agent boundaries** — For each agent, specify: which files/modules they own, what decisions they can make independently, what requires cross-agent approval, and what their output artifact is.
3. **Establish shared context** — Create a shared context document that contains: project goals, constraints, architecture decisions, interface contracts, and a glossary. This is the single source of truth that all agents reference.
4. **Define handoff points** — Identify natural handoff points where one agent's output becomes another agent's input. For each handoff, specify: the artifact being handed off, the expected format, the acceptance criteria, and the fallback if the handoff fails.
5. **Set synchronization points** — Identify stages where agents must synchronize: schema freeze before API work starts, API contract freeze before frontend work starts, integration testing after all components are built.
6. **Configure communication per audience** — For each message, determine the audience and adjust: engineers get technical details, decisions, and rationale; PMs get progress, risks, and timeline impact; QA gets test cases, edge cases to cover, and known limitations.
7. **Establish conflict resolution** — When two agents produce incompatible outputs, the conflict resolution protocol is: (a) identify the incompatibility, (b) determine which agent's output is upstream, (c) upstream agent's decision takes precedence unless it causes downstream failure, (d) if both directions are affected, escalate to human.
8. **Set up change notification** — When an agent changes a shared interface (API response shape, function signature, data model), they must notify all downstream agents within 5 minutes.
9. **Define escalation triggers** — An agent should escalate when: blocked for more than 30 minutes, discovered a dependency that isn't available, encountered a conflict that can't be resolved via the protocol, or needs a decision outside their authority boundary.
10. **Prepare integration testing** — Before integration, each agent must verify their component against the shared contract independently. Then integration tests run across all components.
11. **Track cross-agent dependencies** — Maintain a dependency matrix showing which agents depend on which outputs. When a dependency changes, automatically flag affected agents.
12. **Conduct cross-agent retrospective** — After project completion, all agents participate in a shared retrospective: what coordination worked, what broke down, what protocol changes are needed.

## Inputs

- Project goal and scope
- Team composition (agents and humans, their capabilities and boundaries)
- Shared interface contracts (API specs, data models, message formats)
- Agent-specific status updates and blockers
- Change notifications from other agents
- Escalation requests from blocked agents
- Integration test results

## Outputs

- Shared context document (single source of truth for all agents)
- Agent boundary map (who owns what files/modules/decisions)
- Handoff artifacts with acceptance criteria
- Synchronization point checklist with sign-off gates
- Change notifications with impact analysis
- Integration test results across agent boundaries
- Escalation records with resolution
- Communication artifacts tailored to audience (technical RFC, status update, QA handoff)
- Cross-agent retrospective report

## Rules

1. A single shared context document must exist and be referenced by all agents. No agent should maintain their own version of shared context.
2. Interface contracts must be defined and frozen before dependent work begins. Changes after freeze require a formal change process with all affected agents notified.
3. Handoff artifacts must include a manifest: what is being handed off, what format, what the receiver needs to know, and acceptance criteria.
4. Agents must not modify files owned by another agent without explicit approval from the owning agent.
5. Duplicate work is prohibited: before starting any task, check the shared task board or context to ensure no other agent is working on the same task.
6. Change notifications must be sent within 5 minutes of any shared interface change and must include: what changed, why, and a link to the updated contract.
7. Synchronization points must have sign-off gates: all agents must confirm readiness before proceeding past the gate.
8. Escalations must include: what is blocked, why it is blocked, what the agent has tried, and what specific decision/action is needed to unblock.
9. Communication to non-engineers must exclude implementation details and focus on: what, why impact, when, risks, and what help is needed.
10. Integration tests must cover the contract between agents, not just each agent's internal logic.
11. When conflicts cannot be resolved via the defined protocol within 15 minutes, they must be escalated to a human.
12. Cross-agent retrospectives must be conducted after every project phase, not just at the end, to improve coordination incrementally.

## Best Practices

- Use a shared task board (physical or digital) where all agents and humans can see: who is working on what, status, blockers, and next steps.
- Define agent boundaries by file/directory ownership. Create a `CODEOWNERS`-like map that agents check before modifying files.
- For API contract coordination, use OpenAPI/Swagger as the single source of truth. The backend agent defines the spec, the frontend agent consumes it. Any change to the spec triggers a notification.
- When handing off work, include a "what I would have done next" section to provide context for the receiving agent.
- For parallel work on independent features, schedule a mid-implementation sync to check for integration issues before they compound.
- When communicating with PMs or non-technical stakeholders, use this template: "Status: [on track / blocked / needs decision]. What we've done: [1 sentence]. Next: [1 sentence]. Risk: [if blocked, what help is needed]. Timeline impact: [if any]."
- For QA handoffs, include: what was changed, what was not changed, known edge cases, risky areas, and automated test coverage gaps.
- Use a "lightweight RFC" process for cross-agent decisions: one agent writes a 1-page proposal, other agents have 24h to respond, then a decision is made.
- Maintain a "blocker log" that all agents can see: current blockers, who owns them, and expected resolution time.
- After each synchronization point, update the shared context document with any new decisions or changes to the plan.

## Anti-patterns

- **Siloed work with big-bang integration** — Agents work independently for days and then try to integrate everything at once. This leads to discovery of incompatible interfaces late in the process. Sync points should be frequent (daily for fast-moving projects).
- **No shared context** — Each agent operates on their own understanding of the project. When contexts inevitably diverge, incompatible outputs are produced. A shared context document is non-negotiable.
- **Over-specified boundaries** — Defining agent boundaries so rigidly that agents cannot help each other when one is blocked. Boundaries should be clear but flexible with an override process.
- **Notification fatigue** — Sending notifications for every minor change, causing agents to ignore important ones. Notifications should be reserved for shared interface changes only.
- **Talking over each other** — Multiple agents asking the same questions or seeking the same clarification from a human because they don't check if it's already been asked. Always check the shared context and recent communication history first.
- **Assuming perfect handoffs** — Handing off work without acceptance criteria and assuming the receiving agent will figure it out. Every handoff needs explicit criteria.
- **Escalation as first resort** — Escalating without trying to resolve independently first. Escalation should be after the agent has exhausted its own capabilities and clear protocols.
- **Technical jargon with non-engineers** — Explaining technical implementation details to PMs or stakeholders who need business impact and timeline information. Adjust communication to the audience.

## Edge Cases

- **Agent goes offline mid-task** — If an agent is interrupted or loses context mid-task, another agent must be able to pick up the work. Handoff artifacts must be structured to allow mid-task takeover, with current state and next steps clearly documented.
- **Conflicting changes from two agents** — Two agents modify the same file or interface simultaneously. The conflict resolution protocol must determine: (a) which change happened first, (b) which change is more critical, (c) merge if possible, otherwise revert one and coordinate.
- **Shared contract becomes unstable** — An upstream agent needs to change a frozen interface due to a discovered issue. The change must go through a formal process: document the reason, assess downstream impact, notify all affected agents, and schedule the change at a sync point.
- **One agent is significantly faster than others** — The fast agent finishes all their work and is now idle while waiting for dependencies. They should not start work outside their boundaries. Instead, they should help with testing, documentation, or code review of other agents' work.
- **Human gives conflicting instructions to different agents** — The human tells one agent "use PostgreSQL" and another agent "use MongoDB" for the same feature. Agents must detect the conflict during a sync point and escalate to the human for clarification.
- **Agent boundary dispute** — Two agents both believe they own a particular file or decision. The dispute must be escalated to a human or resolved by checking CODEOWNERS or the boundary map. If neither specifies, the human decides.

## Validation Checklist

- [ ] Shared context document exists and is referenced by all agents.
- [ ] Agent boundaries are defined by file/module ownership.
- [ ] Interface contracts are documented and frozen before dependent work begins.
- [ ] Handoff artifacts include manifest, format, context, and acceptance criteria.
- [ ] No agent is working on a task that another agent has already claimed.
- [ ] Change notifications are sent within 5 minutes of shared interface changes.
- [ ] Synchronization points have sign-off gates with confirmation from all agents.
- [ ] Escalations include blocker description, attempted solutions, and specific unblock request.
- [ ] Communication is tailored to the audience (technical vs non-technical).
- [ ] Integration tests cover cross-agent contracts, not just internal logic.
- [ ] Conflict resolution protocol is documented and understood by all agents.
- [ ] Cross-agent retrospective is scheduled at the end of each phase.

## Engineering Examples

### Example 1: Frontend and Backend Agents Coordinating API Contract Design

**Scenario:** A frontend agent and backend agent need to build a user dashboard feature. They must coordinate on the API contract before either starts implementation.

**Step 1: Shared Context Setup**
Both agents agree on the shared context:
- Goal: "Build user dashboard showing order history, account details, and notification preferences."
- Data models: User, Order, NotificationPreference (defined in shared context doc)
- Tech stack: Backend: Express + PostgreSQL. Frontend: React + React Query.
- API base path: `/api/v1/dashboard`

**Step 2: API Contract Coordination**
Backend agent proposes API contract (written as OpenAPI snippet):
```yaml
GET /api/v1/dashboard/summary
Response:
  {
    user: { name, email, avatarUrl, memberSince },
    recentOrders: [{ id, date, total, status }],
    notifications: { unreadCount, preferences: { email, sms, push } }
  }
```

Frontend agent reviews and responds:
- "I need `memberSince` as ISO 8601 string for date formatting."
- "Can `recentOrders` be paginated? The dashboard might have many orders."
- "I need `avatarUrl` to be a full URL, not a relative path."

Backend agent updates contract:
- `memberSince`: ISO 8601 string.
- Add `recentOrdersPaginated: { items, total, page, pageSize }` — default pageSize=5.
- `avatarUrl`: full URL with protocol.

**Step 3: Contract Freeze**
Both agents sign off on the contract. Backend agent starts building the endpoint. Frontend agent starts building the UI with mock data matching the contract.

**Step 4: Change Mid-Implementation**
Backend agent discovers that fetching notification preferences requires a separate service call that might fail. They notify the frontend agent:
- "Change: `notifications` will now be `notifications: { status: 'loaded'|'error'|'loading', data?: {...}, error?: string }`."
- "This allows graceful degradation if the notification service is down."
- "Affects: frontend rendering needs to handle the `error` and `loading` states."

Frontend agent acknowledges and updates their mock data and UI to handle the three states.

**Coordination Outcome:** Clean handoff, no integration surprises, graceful error handling built from the start.

### Example 2: Orchestrating Parallel Work on Independent Features with Later Integration

**Scenario:** Three agents working on features for a v2.0 release: Agent A (Payment Gateway), Agent B (Subscription Management), Agent C (Notification System). They have no direct dependencies but all integrate with the User model.

**Coordination Plan:**

**Phase 1: Shared Model Freeze (Synchronization Point)**
- Agents A, B, and C agree on the User model extensions needed for each feature.
- A needs: `stripeCustomerId`, `defaultPaymentMethodId`
- B needs: `subscriptionTier`, `subscriptionStatus`, `renewalDate`
- C needs: `notificationPreferences`, `emailVerified`
- All additions are merged into a single shared migration. All three agents test against this shared schema.

**Phase 2: Parallel Implementation**
- Agent A works on `src/services/payment/` — no overlap with B or C files.
- Agent B works on `src/services/subscription/` — no overlap with A or C files.
- Agent C works on `src/services/notification/` — no overlap with A or B files.
- Each agent commits to their own directory. Daily status updates shared via the task board.

**Phase 3: Integration Testing**
- Agent A's payment gateway needs to update User.subscriptionTier when a payment succeeds (triggers subscription upgrade). This creates a cross-agent dependency.
- Agent A notifies Agent B: "I will call `subscriptionService.upgrade(userId, newTier)` on successful payment. Confirm this method signature."
- Agent B provides the method signature. Agent A implements the call.
- Integration test: "Payment success → subscription upgraded → notification sent" is written collaboratively.

**Phase 4: End-to-End Verification**
- All three agents run integration tests together.
- Agent C discovers that Agent A's payment success event doesn't trigger notification preferences check. Agent C adds the notification trigger.
- Final verification passes.

### Example 3: Communicating a Technical Decision to Non-Technical Stakeholders

**Scenario:** The engineering team (including AI agents) decided to migrate from a monolithic payment processing to a microservice. The decision needs to be communicated to the Product Manager.

**Technical Agent's Internal Decision Record:**
```
Decision: Extract payment processing to standalone microservice.
Rationale:
- Monolith payment code has 5,000 lines with 12 external API integrations.
- Current deployment: any payment change requires full app redeploy (45 min).
- Microservice enables independent scaling (payments need 3x more resources).
- Fault isolation: a payment API outage currently takes down the entire app.
- Tech: NestJS + Redis queue + PostgreSQL (same stack, minimal new learning).
- Timeline: 3 sprints for extraction, 1 sprint for migration, 1 sprint for cleanup.
- Risk: Increased operational complexity (new service to deploy/monitor).
- Mitigation: Shared library for models and logging, standardized deployment pipeline.
```

**Communication to PM (tailored):**
```
Subject: Payment architecture change — decision and impact

What: We're splitting our payment processing into its own dedicated service.

Why:
- Faster deployments: Payment changes deploy in 5 minutes instead of 45.
- Better reliability: A payment system issue won't crash the main app anymore.
- Easier scaling: We can give the payment service extra resources during peak sales without over-provisioning the whole app.

Timeline: 5 sprints total (about 5 weeks).
- Sprint 1-3: Build the new service (no visible change to users).
- Sprint 4: Switch users to the new service (expected 1 hour of degraded performance).
- Sprint 5: Clean up old code (no user impact).

Risks we've accounted for:
- The new service uses the same technologies, so no new training needed.
- We've built rollback capability at every step.
- Customer-facing behavior will be identical.

What we need from you:
- Approval on the 5-sprint timeline.
- Help communicating the 1-hour degraded performance window in Sprint 4 to stakeholders.
- Any feature freeze considerations during sprints 1-3?

Questions? Happy to walk through the technical details if helpful, but the TL;DR is: faster, safer, more scalable.
```
