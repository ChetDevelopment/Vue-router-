# AI Engineering Skills System

A comprehensive, reusable skills library designed to guide AI agents to think and work like a senior engineering organization rather than simply generating code.

## Philosophy

This system encodes the collective discipline of software engineering into modular, composable skills. Each skill defines how an AI should reason about a specific concern — from requirements analysis to production operations.

The AI must always follow this workflow:

1. Understand the project.
2. Analyze requirements.
3. Understand business goals.
4. Understand user goals.
5. Analyze existing architecture.
6. Analyze existing code.
7. Analyze database.
8. Analyze APIs.
9. Analyze security.
10. Analyze scalability.
11. Compare multiple solutions.
12. Explain trade-offs.
13. Select the best solution.
14. Design implementation.
15. Implement.
16. Test.
17. Review.
18. Optimize.
19. Document.
20. Verify Definition of Done.

Skipping steps is prohibited unless explicitly justified.

## Core Principles

- **Framework independent** — Skills apply to any technology stack.
- **Language independent** — Skills apply to any programming language.
- **Scalable** — Works for projects of any size.
- **Modular** — Skills are self-contained and composable.
- **Easy to maintain** — Clear structure with single responsibility.
- **Easy to extend** — Adding new skills does not break existing ones.
- **Production-ready** — Every skill bakes in production concerns.
- **Enterprise quality** — Security, reliability, and maintainability are default.

## Skill Categories

### Core Fundamentals
| Skill | Purpose |
|-------|---------|
| [AI Identity](01-ai-identity/AI%20Identity.md) | Defines the AI's role, principles, and operating model |
| [Engineering Mindset](02-engineering-mindset/Engineering%20Mindset.md) | Instills disciplined engineering thinking |
| [Critical Thinking](03-critical-thinking/Critical%20Thinking.md) | Ensures rigorous analysis before action |
| [Product Thinking](04-product-thinking/Product%20Thinking.md) | Aligns technical work with product outcomes |
| [Business Analysis](05-business-analysis/Business%20Analysis.md) | Drives requirements from business context |
| [User Flow Analysis](06-user-flow-analysis/User%20Flow%20Analysis.md) | Maps and optimizes user journeys |

### Architecture & Design
| Skill | Purpose |
|-------|---------|
| [Software Architecture](07-software-architecture/Software%20Architecture.md) | Defines system structure and design decisions |
| [Clean Architecture](08-clean-architecture/Clean%20Architecture.md) | Enforces dependency rule and separation of concerns |
| [Modular Design](09-modular-design/Modular%20Design.md) | Designs cohesive, loosely coupled modules |
| [Domain Modeling](10-domain-modeling/Domain%20Modeling.md) | Captures business concepts in code |
| [API Design](11-api-design/API%20Design.md) | Designs consistent, robust APIs |
| [Database Design](12-database-design/Database%20Design.md) | Designs efficient, scalable data storage |
| [Requirements Analysis](35-requirements-analysis/Requirements%20Analysis.md) | Elicits and validates system requirements |
| [System Design](36-system-design/System%20Design.md) | Holistic system-level design and trade-off analysis |

### Engineering
| Skill | Purpose |
|-------|---------|
| [Backend Engineering](13-backend-engineering/Backend%20Engineering.md) | Builds server-side logic and integrations |
| [Frontend Engineering](14-frontend-engineering/Frontend%20Engineering.md) | Builds client-side interfaces and logic |
| [UI/UX Engineering](15-ui-ux-engineering/UI_UX%20Engineering.md) | Bridges design and implementation |
| [State Management](16-state-management/State%20Management.md) | Manages application state predictably |
| [Performance Engineering](17-performance-engineering/Performance%20Engineering.md) | Ensures systems meet performance targets |
| [Security Engineering](18-security-engineering/Security%20Engineering.md) | Integrates security throughout development |
| [Authentication](19-authentication/Authentication.md) | Verifies user identity |
| [Authorization](20-authorization/Authorization.md) | Controls access to resources |
| [Input Validation](21-input-validation/Input%20Validation.md) | Ensures data integrity and safety |
| [Error Handling](37-error-handling/Error%20Handling.md) | Manages failures gracefully |
| [Data Modeling](39-data-modeling/Data%20Modeling.md) | Structures data for clarity and performance |
| [Caching Strategy](40-caching-strategy/Caching%20Strategy.md) | Optimizes performance through caching |

### Quality & Operations
| Skill | Purpose |
|-------|---------|
| [Testing](24-testing/Testing.md) | Ensures correctness through systematic testing |
| [Code Review](25-code-review/Code%20Review.md) | Reviews code for quality and correctness |
| [Refactoring](26-refactoring/Refactoring.md) | Improves code structure without changing behavior |
| [Documentation](27-documentation/Documentation.md) | Creates clear, maintainable documentation |
| [Logging](22-logging/Logging.md) | Provides observability through structured logs |
| [Monitoring](23-monitoring/Monitoring.md) | Tracks system health and performance |
| [Observability](29-observability/Observability.md) | Enables understanding of system internals |

### AI Agent Workflow & Prompting
| Skill | Purpose |
|-------|---------|
| [AI Self-Prompting & Instruction Design](47-ai-agent-workflow/AI%20Self-Prompting%20%26%20Instruction%20Design.md) | Crafts effective self-prompts and instructions |
| [Task Decomposition & Planning](47-ai-agent-workflow/Task%20Decomposition%20%26%20Planning.md) | Breaks complex tasks into manageable steps |
| [Context Window Management](47-ai-agent-workflow/Context%20Window%20Management.md) | Manages limited context effectively |
| [Self-Correction & Output Verification](47-ai-agent-workflow/Self-Correction%20%26%20Output%20Verification.md) | Verifies and corrects generated outputs |
| [Reflection & Continuous Improvement](47-ai-agent-workflow/Reflection%20%26%20Continuous%20Improvement.md) | Learns from completed work |
| [Multi-Agent Coordination](47-ai-agent-workflow/Multi-Agent%20Coordination.md) | Coordinates with other agents and humans |

### Implementation Patterns
| Skill | Purpose |
|-------|---------|
| [Code Generation Patterns](48-implementation-patterns/Code%20Generation%20Patterns.md) | Generates production code systematically |
| [Data Fetching & Server State Patterns](48-implementation-patterns/Data%20Fetching%20%26%20Server%20State%20Patterns.md) | Manages server data and caching |
| [Form Design & Handling Patterns](48-implementation-patterns/Form%20Design%20%26%20Handling%20Patterns.md) | Implements forms with validation |
| [File Upload & Storage Systems](48-implementation-patterns/File%20Upload%20%26%20Storage%20Systems.md) | Handles file uploads and storage |
| [Search Implementation Patterns](48-implementation-patterns/Search%20Implementation%20Patterns.md) | Implements search functionality |
| [Notification Systems](48-implementation-patterns/Notification%20Systems.md) | Designs multi-channel notifications |
| [Real-Time Communication Patterns](48-implementation-patterns/Real-Time%20Communication%20Patterns.md) | Implements WebSockets and real-time features |
| [Background Job Processing](48-implementation-patterns/Background%20Job%20Processing.md) | Manages background work and queues |
| [Data Export & Import Patterns](48-implementation-patterns/Data%20Export%20%26%20Import%20Patterns.md) | Handles CSV, Excel, PDF generation |
| [Image & Media Processing](48-implementation-patterns/Image%20%26%20Media%20Processing.md) | Optimizes and processes media assets |

### Cross-Cutting Engineering
| Skill | Purpose |
|-------|---------|
| [Multi-Tenancy Architecture](49-cross-cutting-engineering/Multi-Tenancy%20Architecture.md) | Isolates tenants in SaaS platforms |
| [Theming & Design System Engineering](49-cross-cutting-engineering/Theming%20%26%20Design%20System%20Engineering.md) | Builds design tokens and component libraries |
| [Internationalization (i18n)](49-cross-cutting-engineering/Internationalization%20(i18n).md) | Supports multiple locales and languages |
| [Offline-First & PWA Patterns](49-cross-cutting-engineering/Offline-First%20%26%20PWA%20Patterns.md) | Builds resilient offline-capable apps |
| [SEO Engineering](49-cross-cutting-engineering/SEO%20Engineering.md) | Optimizes for search engine visibility |
| [Analytics & Event Tracking](49-cross-cutting-engineering/Analytics%20%26%20Event%20Tracking.md) | Tracks user behavior and product metrics |
| [Feature Flags & A/B Testing](49-cross-cutting-engineering/Feature%20Flags%20%26%20A_B%20Testing.md) | Manages feature rollouts and experiments |
| [Undo/Redo & History Patterns](49-cross-cutting-engineering/Undo_Redo%20%26%20History%20Patterns.md) | Implements command history and undo |
| [Drag & Drop Engineering](49-cross-cutting-engineering/Drag%20%26%20Drop%20Engineering.md) | Builds drag-and-drop interactions |
| [Accessibility Engineering (a11y)](49-cross-cutting-engineering/Accessibility%20Engineering%20(a11y).md) | Ensures WCAG compliance and inclusive design |

### Platform & Infrastructure
| Skill | Purpose |
|-------|---------|
| [Container Strategy (Docker)](50-platform-infrastructure/Container%20Strategy%20(Docker).md) | Optimizes Docker images and containers |
| [Serverless Engineering](50-platform-infrastructure/Serverless%20Engineering.md) | Builds serverless applications |
| [CI/CD Pipeline Design](50-platform-infrastructure/CI_CD%20Pipeline%20Design.md) | Designs continuous integration and delivery |
| [Build Systems & Tooling](50-platform-infrastructure/Build%20Systems%20%26%20Tooling.md) | Optimizes build processes and bundling |
| [Environment Management](50-platform-infrastructure/Environment%20Management.md) | Manages environment parity and config |
| [Database Migration & Seeding](50-platform-infrastructure/Database%20Migration%20%26%20Seeding.md) | Handles schema changes and test data |
| [API Client Design](50-platform-infrastructure/API%20Client%20Design.md) | Builds resilient typed API clients |
| [Webhook Design & Security](50-platform-infrastructure/Webhook%20Design%20%26%20Security.md) | Designs secure webhook systems |

### Infrastructure & Strategy
| Skill | Purpose |
|-------|---------|
| [Deployment](28-deployment/Deployment.md) | Delivers software reliably to production |
| [Scalability](30-scalability/Scalability.md) | Designs systems that grow gracefully |
| [Reliability](31-reliability/Reliability.md) | Ensures systems operate correctly over time |
| [Maintainability](32-maintainability/Maintainability.md) | Keeps codebases easy to change |
| [Technical Debt Management](33-technical-debt-management/Technical%20Debt%20Management.md) | Manages trade-offs between speed and quality |
| [Definition of Done](34-definition-of-done/Definition%20of%20Done.md) | Defines completion criteria for every feature |
| [Configuration Management](38-configuration-management/Configuration%20Management.md) | Manages application configuration safely |
| [API Versioning](41-api-versioning/API%20Versioning.md) | Evolves APIs without breaking consumers |
| [Migration Planning](42-migration-planning/Migration%20Planning.md) | Plans safe data and code migrations |
| [Incident Response](43-incident-response/Incident%20Response.md) | Responds to production incidents effectively |
| [Disaster Recovery](44-disaster-recovery/Disaster%20Recovery.md) | Recovers from catastrophic failures |
| [Cost Optimization](45-cost-optimization/Cost%20Optimization.md) | Manages infrastructure and operational costs |
| [Compliance](46-compliance/Compliance.md) | Ensures regulatory and legal compliance |

## How to Use

Each skill is a standalone markdown file. Skills can be loaded individually or composed together for complex tasks.

### Skill Structure

Every skill follows the same structure:

- **Purpose** — Why this skill exists
- **Responsibilities** — What the skill owns
- **Decision Process** — How to reason using this skill
- **Inputs** — Information the skill needs
- **Outputs** — Artifacts the skill produces
- **Rules** — Hard constraints
- **Best Practices** — Recommended approaches
- **Anti-patterns** — What to avoid
- **Edge Cases** — Boundary conditions to handle
- **Validation Checklist** — Verification criteria
- **Engineering Examples** — Real-world application

### Composition

Skills are designed to be composed. For example, building an API endpoint might involve:
- `Task Decomposition` → break the feature into sub-tasks
- `Requirements Analysis` → understand what to build
- `API Design` → design the interface
- `Input Validation` → validate requests
- `Authentication` + `Authorization` → secure the endpoint
- `Backend Engineering` → implement
- `Self-Correction & Output Verification` → review generated code
- `Testing` → verify
- `Documentation` → document
- `Definition of Done` → confirm completeness

Building a complete frontend feature might involve:
- `User Flow Analysis` → map the user journey
- `Accessibility Engineering` → design for inclusion
- `Form Design & Handling Patterns` → implement with validation
- `Data Fetching & Server State Patterns` → handle API data
- `Theming & Design System` → consistent styling
- `Undo/Redo & History Patterns` → support reversion

Building a high-scale backend might involve:
- `Software Architecture` → choose system structure
- `Database Design` → design the schema
- `Data Modeling` → model business entities
- `Multi-Tenancy Architecture` → isolate tenants
- `Caching Strategy` → optimize performance
- `Scalability` → plan for growth
- `Reliability` → ensure fault tolerance
- `CI/CD Pipeline Design` → automate deployment

## License

Internal engineering standard — not for external distribution.
