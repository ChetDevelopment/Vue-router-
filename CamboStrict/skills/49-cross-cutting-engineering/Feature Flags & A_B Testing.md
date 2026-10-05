# Feature Flags & A/B Testing

## Purpose
Define a rigorous engineering framework for implementing feature flags and A/B experiments that enables safe continuous delivery, gradual rollouts, targeted user experiences, and data-driven decision-making — with clear flag lifecycle management, exposure tracking, and automated cleanup to prevent technical debt.

## Responsibilities
- Classify feature flags into the four types (release toggles, ops toggles, permission toggles, experiment toggles) and manage each with appropriate lifecycle and persistence guarantees.
- Evaluate flags in the correct context (user ID, session ID, device ID, environment, region, plan tier) and ensure consistent evaluation for the same context within a session.
- Implement targeting rules that allow flag activation based on user attributes, percentage rollouts, custom cohorts, and prerequisite flags.
- Execute gradual rollouts with percentage increments that can be ramped up or rolled back instantly without a deployment.
- Manage the full flag lifecycle: create → evaluate → stabilize → remove, with automated cleanup of stale flags.
- Design A/B experiments with clear hypothesis, primary and secondary metrics, minimum sample size, and duration estimates.
- Compute and report statistical significance using frequentist or Bayesian methods, with proper guardrails (sequential testing, peeking corrections).
- Track experiment exposure by firing an exposure event when a user is assigned to a variant, ensuring the event is reliable and attributes correctly to the experiment.
- Automate flag cleanup by scheduling removal of flags that have been fully rolled out or have passed their expiration date.

## Decision Process
1. Categorize the flag: release toggles (ship incomplete features safely), ops toggles (kill switches for system behavior), permission toggles (control access by plan tier), experiment toggles (A/B test variants). Each type has different persistence needs and lifespan.
2. Choose the flag evaluation context: determine which identifiers (user ID, account ID, session ID, request ID) are available at the point of evaluation. The context must be deterministic — the same user in the same session must always get the same flag value.
3. Design the targeting rule engine: support simple rules (equals, not equals, in list, contains, greater than, less than) on user attributes, percentage rollouts (hash the user ID into a bucket), prerequisite flags (flag A must be ON for flag B to evaluate), and custom cohorts (uploaded lists of user IDs).
4. For experiment toggles, write the experiment hypothesis: "Changing X will cause Y to change by Z%." Define primary metric (the key business outcome), secondary metrics (guardrail metrics that must not regress), and the minimum detectable effect.
5. Calculate sample size and duration: use a sample size calculator with the baseline conversion rate, minimum detectable effect, significance level (usually 0.05), and power (usually 0.8). Duration must cover at least one full business cycle to account for day-of-week effects.
6. Implement the assignment logic: for percentage rollouts, use a deterministic hash (e.g., MD5 of `experiment_id + user_id`) modulo 10000 to assign the user to a bucket. This ensures consistent assignment across sessions.
7. Set up exposure tracking: fire an exposure event when the variant is determined and the user is exposed to the treatment. The exposure event must include experiment ID, variant ID, user ID, and timestamp. It must fire before any user interaction to avoid selection bias.
8. Define the flag lifecycle: each flag has a creation date, an owner, an expiration date, and a status (active, stale, archived). After the expiration date, the flag is considered stale and scheduled for removal.
9. Build the flag cleanup pipeline: a script that queries all feature flags, identifies flags past their expiration date or with 100% rollout for more than 2 weeks, creates a PR to remove the flag and associated dead code, and assigns it to the flag owner.
10. Implement gradual rollout monitoring: during a percentage ramp (1% → 5% → 25% → 50% → 100%), monitor error rates, latency, and business metrics at each step. If any metric crosses a threshold, roll back the flag to 0% immediately.

## Inputs
- Release management calendar listing planned features and their target release dates.
- Experiment roadmap with hypotheses, metrics, sample size requirements, and durations.
- User attribute taxonomy: which user properties are available for targeting (plan tier, region, signup date, etc.).
- Infrastructure monitoring thresholds: the error rate, latency, and business metric limits that trigger an automatic rollback.
- Flag inventory from any existing ad-hoc flag system that needs to be migrated to the new framework.

## Outputs
- Feature flag configuration schema: the JSON or YAML structure defining flag name, type, owner, targeting rules, rollout percentage, and expiration date.
- Flag evaluation SDK or client: a function `isEnabled(flagName, context)` that returns a boolean, and `getVariant(experimentName, context)` that returns the variant string.
- Experiment results dashboard: a UI showing each experiment's status, sample sizes per variant, primary metric values, statistical significance, and recommendations.
- A/B experiment configuration template: a document with fields for hypothesis, primary metric, secondary metrics, minimum detectable effect, sample size, duration, and variant definitions.
- Flag cleanup automation: a script or CI job that generates a PR to remove flagged code and the flag configuration entry.
- Monitoring alerts for gradual rollout: automated alerts that fire when error rates or latency exceed thresholds during a rollout.

## Rules
- Experiment flags MUST include an exposure event that fires before the user interacts with the experiment variant. Firing exposure after interaction biases results by conditioning on the user's behavior.
- Flag evaluation MUST be deterministic for the same context within the same session. Using random assignment without hashing leads to flickering — the user sees different variants on different page loads.
- Percentage rollouts MUST use a hash-based consistent bucket assignment, not a random number generator. The same user must always be in the same bucket unless the rollout percentage is explicitly changed.
- Feature flags MUST have an expiration date. Flags with no expiration date accumulate as dead code and make the codebase harder to reason about.
- Release toggles MUST be short-lived (weeks, not months). They exist to decouple deployment from release and should be removed once the feature is fully rolled out.
- Experiment flags MUST not be used for permanent configuration. An experiment that has concluded must be resolved (variant chosen) and the flag removed.
- Flag evaluation MUST NOT be used as a security control. Feature flags provide access to unfinished features, not to sensitive data. Authentication and authorization use separate mechanisms.
- Exposure tracking events MUST be reliable — they must not be dropped due to ad-blockers, network failures, or page navigations. Use a first-party endpoint or `sendBeacon` for critical exposure events.

## Best Practices
- Use a centralized feature flag service (LaunchDarkly, Split, Unleash, or Flagsmith) instead of building an in-house system. These services provide auditing, targeting rules, gradual rollout, and SDKs for all platforms.
- Store flag definitions in a remote configuration source (not in the application code). Remote flags can be changed without deployment, enabling kill switches and emergency rollbacks.
- Use a typed flag accessor pattern: define a function `getFeatureFlags()` that returns a typed object with boolean properties, so TypeScript catches typos in flag names at compile time.
- Log flag evaluation decisions in development mode so engineers can see which flags are active and why. Use structured logging with flag name, context, and evaluated value.
- Run a flag evaluation test suite that verifies the evaluation logic for every flag with various context values (anonymous user, premium user, user in region X, etc.).
- For gradual rollouts, start at 1% of users to validate the feature works in production with minimal blast radius. Monitor for 24 hours before increasing.
- Use a consistent user identifier across platforms (web, iOS, Android, API) so that a user assigned to a variant on the web gets the same variant on mobile.
- Archive concluded experiments: document the winner, the effect size, the confidence interval, and any secondary metric movements. Include this in the experiment closure PR.

## Anti-patterns
- Using feature flags as long-lived configuration toggles. A flag that has been in the codebase for 6+ months with no plan for removal is technical debt.
- Evaluating flags client-side for security-sensitive features. A user can inspect the client code or manipulate flag evaluation to access hidden features. Server-side evaluation is required for permission toggles.
- Running multiple overlapping experiments on the same metric without proper interaction analysis. Experiment A may affect the results of Experiment B, leading to incorrect conclusions.
- Peeking at experiment results every day and stopping the experiment as soon as p < 0.05. This dramatically increases the false positive rate. Use sequential testing or a fixed-horizon test with no peeking.
- Firing exposure events for all users regardless of whether they actually saw the treatment. If a user is assigned to a variant but never sees it (bounced, scrolled past), the exposure event is misleading.
- Hard-coding flag values in tests instead of using the flag service. Tests should use the same flag evaluation path as production, with the flag service mocked or configured to specific values.
- Using flags for A/A tests (same variant for both groups) to validate the experimentation infrastructure, but then not monitoring the A/A test for false positives.

## Edge Cases
- The flag service is unavailable (network partition, service outage). The SDK must have a fallback behavior: return the default value specified in the flag configuration, or return a hard-coded default (usually `false`). The SDK must also cache the last known flag values.
- A user is assigned to a variant, clears their cookies/localStorage, and returns. The user's anonymous ID changes, so they may be reassigned to a different variant. For logged-in users, the user ID is stable and consistent assignment works.
- A flag is evaluated during server-side rendering (SSR) and again on the client. Both evaluations must return the same value. Use the same context (user ID) for both evaluations and ensure the flag SDK is initialized before any SSR rendering occurs.
- An experiment's sample size is not reached within the planned duration. The experiment must be extended or stopped with an inconclusive result. Do not cherry-pick results from the available data.
- A bug is discovered in one variant mid-experiment. The experiment must be stopped, the bug fixed, and the experiment restarted with new users (users who were in the buggy variant must be excluded from the final analysis).
- A user is part of a gradually rolled-out feature flag (say at 10%), but the user logs out and logs in as a different user. The new user ID may fall into a different bucket. This is correct behavior — flags are evaluated per user.
- The flag configuration is updated while a user has the app open. The flag SDK should receive a real-time update via WebSocket or Server-Sent Events so the user's experience updates without a page reload (for user-facing flags) or remains stable (for experiment flags).

## Validation Checklist
- [ ] Every flag in the configuration has an owner, creation date, expiration date, and a documented removal plan — verified by a script that lists flags with missing fields.
- [ ] Flag evaluation is deterministic within a session for the same context — verified by asserting that calling `isEnabled(flag, context)` with the same context 100 times returns the same value.
- [ ] Percentage rollout users are consistently assigned to the same bucket across page reloads — verified by logging the bucket assignment and refreshing the page 10 times.
- [ ] Experiment exposure events fire before the user interacts with the variant — verified by checking the timestamp of the exposure event relative to the first interaction event in analytics.
- [ ] Gradual rollout monitoring detects error rate increases and rolls back automatically — verified by injecting a deliberate error in the flagged code and confirming the rollback threshold is hit.
- [ ] The flag cleanup script correctly identifies flags past their expiration date and generates a PR removing both the flag config and the dead code — verified by running the script against a test flag and inspecting the PR.
- [ ] Client-side evaluated flags for non-security features do not expose sensitive functionality — verified by checking that a user cannot enable a flag client-side to access admin features.
- [ ] The flag SDK falls back to the default value when the flag service is unreachable — verified by blocking the flag service URL in the host file and restarting the application.
- [ ] Multiple overlapping experiments do not interfere: a user assigned to variant A of experiment 1 and variant B of experiment 2 receives consistent assignments across sessions — verified by checking both experiment assignments for the same user.
- [ ] Concluded experiments are archived and their flags are removed within 2 weeks of resolution — verified by auditing the flag inventory.

## Engineering Examples

### Example 1: Gradual rollout for a new checkout flow
An e-commerce company redesigned their checkout flow to reduce abandonment. The new flow was deployed under a release toggle named `checkout-v2`. The rollout strategy: start at 1% of users for 24 hours while monitoring the checkout error rate (must stay below 0.5%) and checkout latency (p95 must stay below 3 seconds). No issues detected → ramp to 5% for 48 hours. Monitor cart abandonment rate — if it does not increase more than 2% relative to the control, proceed to 25%. At 25%, a server error rate alert fired (5xx errors on the checkout endpoint spiked to 2%). The team immediately set the flag to 0%, rolling back the feature for all users. The issue was identified (a missing database index caused a timeout under higher load), fixed, and the rollout resumed at 1% the next day. The flag was fully rolled out to 100% after 10 days and the flag configuration was marked for removal 2 weeks later. The cleanup script generated a PR that deleted the `checkout-v2` flag references and removed the old checkout code path.

### Example 2: A/B test for pricing page conversion
A B2B SaaS company wanted to test whether adding a "money-back guarantee" badge to the pricing page increased signup conversion. The team designed an A/B experiment with two variants: control (existing pricing page) and treatment (pricing page with guarantee badge). The primary metric was "signup conversion rate" (users who started a free trial / users who visited the pricing page). Secondary metrics were "trial-to-paid conversion rate" and "support ticket volume" (guardrail — guarantee should not increase support load). The sample size calculator determined 50,000 visitors per variant were needed (baseline 5% conversion, minimum detectable effect 10% relative lift, α=0.05, β=0.2). The experiment was set to run for 2 weeks (covering two full business cycles). Assignment used a deterministic hash of `experiment_id + user_id`. Exposure events fired when the pricing page rendered. After 2 weeks, the treatment variant showed a 7.8% relative lift in signup conversion (p=0.03, 95% CI [2%, 13.5%]). The trial-to-paid conversion rate was unchanged, and support ticket volume did not increase. The team declared the treatment the winner, rolled out the guarantee badge to 100%, and archived the experiment with a documented conclusion.

### Example 3: Feature flag system with user-targeted rules
A collaboration platform wanted to invite beta users to a new "real-time co-editing" feature before the general release. Instead of hard-coding a list of beta users, they used a feature flag system with targeting rules. The flag `realtime-editing` had a targeting rule: `user.email in list: [beta-users@company.com]`. The beta user list was uploaded as a CSV to the flag service and could be updated without deployment. Within the beta, a second flag `realtime-editing-advanced` (for even more experimental features) was gated by a prerequisite: `realtime-editing is enabled` AND `user.plan_tier equals "enterprise"`. The flag evaluation was server-side: when the user loaded the document editor, the server evaluated both flags and passed the results to the client as part of the initial page props. The client never evaluated flags directly. This prevented beta users from sharing the flag name with non-beta users who could manually set it in the browser console. After the beta period, the `realtime-editing` flag was set to 100% for all users, and the beta user list targeting was removed. The `realtime-editing-advanced` flag remained as a permission toggle gated by plan tier.
