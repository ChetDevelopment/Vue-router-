# Testing

## Purpose

Provide a disciplined, repeatable approach to software testing that catches defects early, enables safe refactoring, documents system behavior, and creates a fast feedback loop for developers. Testing is not a phase—it is an integral part of the development process that directly impacts code quality, deployment confidence, and team velocity.

## Responsibilities

- Define and enforce the test pyramid structure across all projects (unit, integration, e2e).
- Ensure every merge request includes appropriate tests that cover the changed logic.
- Maintain a flaky-test detection and remediation process.
- Own the test infrastructure: runners, test databases, mock servers, and CI pipeline integration.
- Promote test-driven development (TDD) practices for new features and bug fixes.
- Review test quality during code reviews—not just coverage numbers but assertion quality and isolation.
- Establish and enforce test naming conventions, file layout, and mocking strategies.
- Track and improve test suite execution time; prevent regression in CI pipeline duration.

## Decision Process

1. Identify whether the code change introduces new logic, modifies existing logic, or is a refactor with no behavioral change. If no behavioral change, verify existing tests still pass—do not add new tests for unchanged behavior.
2. For new logic, write a failing unit test first (TDD red phase) that describes the expected behavior from the consumer's perspective.
3. Determine if the logic depends on external I/O (database, network, filesystem). If yes, write an integration test that exercises the real I/O boundary against a test-controlled resource (Testcontainers, localstack, in-memory DB). Do not mock the external service at the unit level if the behavior of that service is central to correctness.
4. If the logic is purely algorithmic with no I/O dependency, keep it at the unit test layer—fast, isolated, no mocks needed.
5. Evaluate whether the feature spans multiple services or user journeys. If yes, add one or two end-to-end tests covering the critical happy path and the most likely failure mode. Keep e2e tests minimal—they are slow and brittle.
6. Choose the assertion style: use property-based testing when there is a broad input space with an invariant; use example-based testing for known boundary values and typical cases. Do not write example-based tests that duplicate property-based checks.
7. Decide on test doubles: use real implementations when fast and deterministic; use in-memory fakes when the real resource is unavailable in CI; use mocks only when you need to verify interaction patterns (e.g., "was the callback invoked?"). Never mock types you do not own.
8. Add the test to the CI pipeline. Ensure the test is tagged correctly (unit/integration/e2e) so that the pipeline can parallelize and prioritise appropriately. If the test is slow (>100ms for unit, >2s for integration), flag it for performance review.

## Inputs

- Product requirements and acceptance criteria
- Architecture decision records (ADRs) describing system boundaries
- Existing test suite and coverage reports
- CI pipeline configuration and test runner setup
- Bug reports and incident post-mortems that reveal testing gaps
- API contracts (OpenAPI, GraphQL schema, protobuf definitions)
- Mock service definitions and test fixture data

## Outputs

- Test suite with clear separation by pyramid layer (unit, integration, e2e)
- Test execution reports with pass/fail/skip/flaky annotations
- Coverage reports aggregated by module (target: 80% line coverage, 90% branch coverage on critical paths)
- Flaky test inventory with tracking tickets and remediation dates
- CI pipeline stage definitions for parallel test execution
- Test documentation: README explaining how to run tests, interpret results, and add new tests

## Rules

1. A test that fails intermittently is worse than no test—it erodes trust. Flag flaky tests immediately, quarantine them, and fix or delete within one sprint.
2. Do not share test state between test cases. Each test must set up its own fixtures and clean up after itself. Shared state is the number one cause of order-dependent failures.
3. Use the Arrange-Act-Assert pattern explicitly. Separate setup, invocation, and verification with blank lines. Do not mix assertions with setup code.
4. Do not write tests that pass with a null implementation. A test that asserts `1 + 1 == 2` on a function that always returns 2 adds zero value.
5. Name tests as complete sentences describing the scenario and expected outcome. Format: `[Method]_[Scenario]_[ExpectedResult]`. Example: `Withdraw_InsuffientBalance_ReturnsError`.
6. Keep unit tests under 100ms each. If a test exceeds 100ms, it likely crosses an I/O boundary and belongs in the integration layer.
7. Do not assert on implementation details (private methods, internal state). Test observable behavior only.
8. Every test must be able to run in isolation with a single command. No manual setup steps, no external services that require authentication secrets.
9. Do not use `Thread.Sleep` or `Task.Delay` for timing coordination in tests. Use polling with a timeout or synchronisation primitives.
10. All test code must be reviewed with the same rigour as production code. Tests are production code for other developers.

## Best Practices

1. Follow the "one assertion per test" guideline for unit tests. Integration and e2e tests may group related assertions for a single scenario.
2. Write tests at the right level. If a piece of logic is covered by a fast unit test, do not duplicate the coverage in an integration test. Redundancy across layers slows the suite.
3. Use test factories or builders to construct complex objects instead of inlining constructor arguments in every test. This makes test changes resilient to constructor signature changes.
4. Prefer fakes over mocks. A fake is a lightweight implementation of an interface that behaves like the real thing (e.g., an in-memory repository). Mocks should be reserved for verifying interactions, not state.
5. Run the full unit test suite before every commit. Run integration tests before pushing. Run e2e tests in CI on every merge to main.
6. Introduce property-based testing for functions that accept a wide range of inputs and have a clear invariant. For example, a sorting function should always return a list of the same length with the same elements.
7. Use code coverage as a signal, not a target. If you need to add meaningless tests to hit a coverage number, lower the target and focus on meaningful assertions instead.
8. Treat test code with the same hygiene as production code: no dead code, no commented-out tests, no unused imports, no duplication.
9. When fixing a bug, always write a test that reproduces the bug before applying the fix. This test becomes a regression guard.
10. Keep test data explicit. Avoid generating random data in tests unless you are using property-based testing. Explicit values make tests readable and deterministic.

## Anti-patterns

1. **Ice-cream cone pyramid**: Having more e2e tests than integration and unit tests. This leads to slow, brittle suites that fail for irrelevant reasons. Invert to the proper pyramid.
2. **Mocking everything**: Every test mocks all dependencies, turning the test suite into a validation of mock setup rather than real behavior. This produces false confidence.
3. **Testing the framework**: Writing tests that verify that a framework (Express, Spring, Django) works as documented. Framework tests are the framework authors' responsibility.
4. **Over-mocking HTTP calls**: Replacing every HTTP call with a mock response instead of using a realistic test server (WireMock, MockServer). This misses issues like serialization mismatches, headers, and timeouts.
5. **Touching the database in unit tests**: Unit tests should never hit a real database. When a unit test connects to a database, it ceases to be a unit test and becomes a slow, flaky integration test.
6. **Snapshots without review**: Accepting snapshot test outputs automatically without visual inspection. Snapshots should be reviewed like any other diff. Blind approval defeats their purpose.
7. **Test pollution**: One test modifies shared global state (environment variables, static singletons, file system) and another test fails because of it. Always isolate state per test.
8. **Testing through the UI**: Automating end-to-end flows exclusively through the UI layer when the same logic can be tested at the API or unit level. UI tests are slow and expensive.

## Edge Cases

1. **Time-dependent code**: Functions that depend on the current time. Solution: inject a clock interface so tests can control time deterministically.
2. **Concurrent operations**: Tests that need to verify thread-safe behaviour. Use stress tests with controlled thread counts and synchronisation primitives. Avoid non-deterministic sleeps.
3. **Randomness**: Code that uses random values. Seed the random generator in tests to produce repeatable sequences, or use property-based testing with a fixed seed.
4. **External rate limits**: Integration tests that hit an external API with rate limits. Use test-specific API keys with higher limits, or use a sandbox environment that bypasses rate limiting.
5. **Unicode and locale**: Code that processes text differently based on locale or Unicode normalization. Write explicit test cases for edge characters (emoji, RTL text, null byte, combining marks).
6. **Network partitions**: Tests should verify behaviour when a dependency is unreachable. Use a circuit-breaker test: start the system, disconnect the dependency, assert graceful degradation, reconnect, assert recovery.
7. **Empty and null inputs**: Every function that accepts collections or nullable values must be tested with empty collections, null values, and single-element collections.
8. **Large payloads**: API handlers should be tested with payloads near the configured size limit to verify memory usage and timeout behaviour.

## Validation Checklist

- [ ] Every new feature has at least one unit test covering the core logic.
- [ ] Every bug fix includes a regression test that reproduces the bug.
- [ ] All tests follow the Arrange-Act-Assert pattern with clear separation.
- [ ] No test depends on another test's state or output (no test ordering).
- [ ] No test uses `Thread.Sleep` or `Task.Delay` for coordination.
- [ ] The full unit test suite completes in under 60 seconds.
- [ ] Integration tests use controlled resources (Testcontainers, in-memory DB) instead of production dependencies.
- [ ] Flaky tests are quarantined in a separate CI stage and tracked in the issue tracker.
- [ ] Code coverage on new code meets the project threshold (80%+ lines, 90%+ branches on critical paths).
- [ ] Test names are readable sentences that describe scenario and expected outcome.
- [ ] No test mocks types from external libraries or frameworks.
- [ ] Snapshot changes are reviewed as part of the merge request diff.
- [ ] E2e tests cover only the critical happy path and primary failure mode.
- [ ] Test suite can be executed locally with a single command and no manual setup.

## Engineering Examples

### Example 1: Writing testable code with dependency injection

A payment processing service originally instantiated its database connection directly in the constructor:

```python
class PaymentService:
    def __init__(self):
        self.db = DatabaseConnection("prod-url")  # Hardcoded dependency
```

This made unit tests impossible without a real database. The refactor injects the dependency:

```python
class PaymentService:
    def __init__(self, db: DatabaseConnection):
        self.db = db
```

Now the unit test passes an in-memory fake:

```python
def test_process_payment_deducts_balance():
    db = InMemoryDatabase()
    svc = PaymentService(db)
    svc.process_payment("user_1", 50)
    assert db.get_balance("user_1") == 950
```

The test runs in 2ms, requires no external services, and fails only if the business logic is broken. If the real database has quirks (transaction isolation, constraint validation), those are covered by a separate integration test that uses Testcontainers with a real Postgres instance. The key insight: dependency injection is not just for testing—it improves modularity and makes the dependency graph explicit.

### Example 2: Testing asynchronous operations

A notification service sends emails asynchronously through a message queue. The production code publishes to a RabbitMQ exchange; the test must verify that messages are published correctly without needing a running RabbitMQ.

Solution: define a thin `MessageBus` interface with a fake implementation that captures published messages:

```python
class FakeMessageBus:
    def __init__(self):
        self.published = []

    def publish(self, exchange: str, payload: dict):
        self.published.append((exchange, payload))
```

The test uses `asyncio.wait_for` with a timeout to prevent hangs:

```python
async def test_send_welcome_email_publishes_message():
    bus = FakeMessageBus()
    svc = NotificationService(bus)
    await asyncio.wait_for(svc.send_welcome_email("user@example.com"), timeout=5)
    assert len(bus.published) == 1
    exchange, payload = bus.published[0]
    assert exchange == "email.welcome"
    assert payload["to"] == "user@example.com"
```

Tests for timeout and retry behaviour use controlled fakes that simulate slow or failing responses. This approach covers all async paths (success, timeout, retry exhaustion) in milliseconds without a real queue.

### Example 3: Building an integration test suite for an API

An e-commerce API has endpoints for placing orders, managing inventory, and processing payments. The integration test suite uses Testcontainers to start Postgres and Redis, then runs HTTP tests against the application server:

```python
@containers(PostgresContainer, RedisContainer)
def test_place_order_decrements_inventory(api_client, db):
    db.execute("INSERT INTO inventory (sku, qty) VALUES ('SKU-001', 10)")
    resp = api_client.post("/orders", json={"sku": "SKU-001", "qty": 2})
    assert resp.status_code == 201
    row = db.query_one("SELECT qty FROM inventory WHERE sku = 'SKU-001'")
    assert row.qty == 8
```

The suite also tests failure modes explicitly:

```python
def test_place_order_insufficient_inventory_returns_409(api_client, db):
    db.execute("INSERT INTO inventory (sku, 'SKU-001', 0)")
    resp = api_client.post("/orders", json={"sku": "SKU-001", "qty": 1})
    assert resp.status_code == 409
    assert resp.json()["error"] == "insufficient_inventory"
```

Key practices: each test seeds its own data and asserts on both the HTTP response and the database state. Tests are grouped by resource (orders, inventory, payments) and run in parallel using pytest-xdist. The entire integration suite completes in under three minutes and is triggered on every pull request. No test shares database state with another—each test runs in a transaction that is rolled back after the test finishes.
