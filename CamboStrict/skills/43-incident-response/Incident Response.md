# Incident Response

## Purpose

The Incident Response skill defines a standardized, repeatable process for detecting, triaging, containing, resolving, and learning from production incidents. It ensures that every engineer on the team follows the same playbook when something breaks, reducing mean-time-to-acknowledgment (MTTA), mean-time-to-resolve (MTTR), and the blast radius of failures. This skill exists because ad-hoc response leads to missed steps, finger-pointing, incomplete fixes, and repeat incidents. By codifying the workflow, severity taxonomy, communication templates, and postmortem practices, the team builds operational excellence and blameless culture. The ultimate goal is to protect users, preserve system integrity, and extract maximum learning from every incident.

## Responsibilities

- **Incident Commander (IC)**: Owns the incident from triage through resolution. Assigns roles, declares severity, coordinates responders, and drives the timeline. Does not debug — delegates.
- **Scribe**: Records all actions, timestamps, decisions, and communication in the war room channel. Produces the raw timeline for the postmortem.
- **Subject Matter Expert (SME)**: Diagnoses the technical root cause and implements the fix. Reports status to the IC.
- **On-Call Engineer (Primary)**: First responder. Acknowledges alerts within SLA, performs initial triage, declares incident if severity warrants it, and either resolves or escalates.
- **On-Call Engineer (Secondary)**: Supports primary on-call. Handles lower-severity alerts so primary can focus. Takes over if primary is overwhelmed.
- **Engineering Manager**: Notified for severity 0 and 1 incidents. Handles stakeholder communication, customer messaging, and resourcing.
- **All Engineers**: When not on-call, stay out of the war room unless explicitly pulled in. Avoid debugging in production without IC coordination.

## Decision Process

1. **Alert fires**: A monitoring system (Datadog, PagerDuty, Grafana) triggers a page. The primary on-call receives it.
2. **Acknowledge within SLA**: Acknowledge the alert in PagerDuty within 5 minutes for severity 0/1, 10 minutes for severity 2. If unacknowledged, the secondary is paged automatically.
3. **Perform initial triage**: Determine the scope — how many users are affected, which services are degraded, is data at risk. Classify into one of the four severity levels.
4. **Declare incident if severity >= 2**: If severity is 2 or higher, create a dedicated Slack channel, post the incident template, and assign the IC role. If severity 3, handle synchronously in the existing team channel.
5. **Assemble response team**: Pull in SMEs for affected services. The IC shares a zoom bridge or huddle link. Scribe starts recording the timeline.
6. **Apply containment**: Mitigate blast radius before root causing. Options: feature flag off, rollback deploy, block bad traffic, redirect traffic to healthy region, scale up capacity.
7. **Root cause investigation**: SMEs analyze logs, traces, metrics, and recent changes. The IC tracks hypotheses and rules them out systematically. No random guessing.
8. **Implement fix**: Once root cause is confirmed, develop and deploy the fix. For severity 0/1, bypass normal CI if needed (expedited review required). Deploy canary first.
9. **Verify resolution**: Confirm via monitoring dashboards, synthetic checks, and manual smoke tests that the system is healthy. Announce resolution in the war room.
10. **Declare all-clear**: When metrics recover for 10 consecutive minutes, IC declares the incident resolved. Remove containment measures gradually if they have side effects.
11. **Schedule postmortem**: Within 48 hours, schedule a blameless postmortem meeting. The Scribe converts the timeline into a draft document.
12. **Track action items**: Each action item from the postmortem gets a Jira ticket with a severity-driven due date. Severity 0 action items must be completed within one sprint.

## Inputs

- **Monitoring alerts**: PagerDuty pages, Datadog monitors, Grafana threshold breaches, synthetic check failures, error budget burn rate warnings.
- **User reports**: Customer support tickets, Twitter mentions, status page comments, direct emails from stakeholders.
- **Deployment signals**: Failed canary metrics, increased error rates after deploy, rollback triggers from CI/CD.
- **Security feeds**: IDS/IPS alerts, vulnerability scanner findings, penetration test results, third-party breach disclosures.
- **Manual discovery**: Engineer notices odd behavior in dashboards, logs, or while performing routine maintenance.

## Outputs

- **Incident timeline**: A minute-by-minute chronological record of all actions, decisions, and communications during the incident.
- **Postmortem document**: Structured analysis covering summary, timeline, root cause, impact, action items, and lessons learned.
- **Action items**: Jira tickets with owners, due dates, and priority levels that prevent recurrence or improve detection.
- **Updated runbooks**: Any manual steps discovered during the incident are added to the appropriate runbook.
- **Communication record**: Internal and external status updates sent during the incident, archived for compliance and review.

## Rules

1. **Blameless is non-negotiable**: No postmortem may assign blame to an individual. Root causes must be written as system failures, process gaps, or technical deficiencies — never as "engineer error."
2. **Severity classification must be explicit**: Every incident must be classified into one of four severity levels (S0-S3) using the documented criteria. Never leave severity ambiguous.
3. **IC must not debug**: The Incident Commander must never write code, SSH into boxes, or run database queries during the incident. Command and control is the only job.
4. **Timeline must be real-time**: The Scribe must record events as they happen. Backfilling a timeline after the fact is forbidden — memory is unreliable.
5. **War room is public**: All incident communication must happen in a public Slack channel visible to the entire engineering organization. No direct messages about incident status.
6. **Contain before resolve**: Always apply containment measures before beginning root cause analysis. Stopping the bleeding takes priority over finding the cause.
7. **No heroics**: On-call engineers must hand off if they have been awake for more than 16 hours or have been responding for more than 4 continuous hours. Sleep-deprived decisions cause more incidents.
8. **Customer communication requires approval**: All external-facing incident communications must be reviewed by the IC and Engineering Manager before posting to the status page.
9. **Postmortem within 48 hours**: Every incident severity 2 and above requires a postmortem held within 48 calendar hours. Delays reduce learning fidelity.
10. **Action items must have owners**: Every postmortem action item must have a single named owner. Unowned action items do not get completed.
11. **Follow-the-sun handoff**: If an incident spans a shift boundary, the IC must conduct a live handoff with the incoming IC. Written summary alone is insufficient.
12. **Rollback is the default fix**: When a recent deploy is suspected, rollback is the default action unless the IC explicitly decides that forward-fixing is faster and safer.

## Best Practices

1. **Practice with game days**: Run simulated incidents (Game Days) quarterly using chaos engineering or tabletop exercises. Practice makes real incidents less stressful.
2. **Write runbooks for every alert**: Every PagerDuty alert must link to a runbook. If an alert requires manual investigation without documented steps, it is an incomplete alert.
3. **Use a dedicated war room Slack channel**: Create a naming convention like #incident-yyyymmdd-shortname. Archive channels after postmortem completion.
4. **Link monitoring dashboards in the runbook**: Include direct links to relevant dashboards, log queries, and tracing views in every runbook.
5. **Automate containment actions**: Have scripts or workflows that can feature-flag off a service, block an IP range, or scale up capacity with a single command or chatops slash command.
6. **Keep the status page ready**: Maintain draft templates for each severity level so that customer communications can be sent within 5 minutes of incident declaration.
7. **Record everything to a time-series data store**: Push the scribe timeline into a database that can be queried later for trend analysis across incidents.
8. **Train every engineer as IC**: Rotate the Incident Commander role among all senior engineers. Document the IC checklist and hold a 30-minute training session.
9. **Review on-call handoffs weekly**: In the weekly team meeting, review any on-call handoffs that happened. Discuss whether the handoff documentation was sufficient.
10. **Postmortem before retro**: Always complete the incident postmortem before the team's regular sprint retrospective. Do not conflate the two.
11. **Celebrate good incidents**: When an engineer catches an issue early or handles a response excellently, recognize it in the team standup. Reinforce good behavior.
12. **Monitor MTTA and MTTR trends**: Track acknowledgement and resolution times per severity level on a dashboard. Set targets and alert if trends degrade.

## Anti-patterns

1. **Tunnel-vision debugging**: Spending 30+ minutes investigating without communicating status to the team. Always give a status update every 15 minutes even if there is no news.
2. **Silent fix**: Deploying a fix without announcing it, so other responders duplicate effort or continue investigating the wrong thing.
3. **IC debugging**: Incident Commander jumping into the terminal instead of commanding. This always degrades coordination quality.
4. **Premature postmortem conclusion**: Writing the root cause before fully investigating. This leads to fixing symptoms instead of systemic issues. Let the data drive the conclusion.
5. **Skipping the scribe**: Trying to run an incident without a dedicated scribe. Memory is unreliable and action items will be missed.
6. **Blaming language in postmortems**: Using phrases like "engineer failed to notice" or "developer deployed without testing." Replace with "deploy pipeline lacked canary analysis" or "test suite did not cover this edge case."
7. **Incident hoarding**: An individual handling the entire incident without pulling in help because they feel responsible. On-call is a team activity.
8. **Forgetting to check dependent services**: Investigating a service in isolation without checking upstream/downstream dependencies. Always start with the dependency graph.
9. **Closing the war room before containment is fully removed**: Deleting the Slack channel or closing the bridge while containment measures are still active. Keep the channel until the system is in steady state.

## Edge Cases

1. **Incident occurs during a holiday**: The on-call rotation must have holiday coverage with clear escalation paths. If primary is unavailable, secondary takes over within 5 minutes.
2. **Multiple concurrent incidents**: The IC must triage by severity. If two S0 incidents occur simultaneously, escalate to the Engineering Manager to split the response team.
3. **Primary on-call is the root cause**: If the primary on-call authored the change that caused the incident, they must be excluded from debugging and a different SME assigned.
4. **Partial data corruption discovered late**: When corruption is found hours or days after it occurred, containment includes restoring from backup and assessing total data loss. The timeline must include data recovery steps.
5. **Incident involves a third-party provider**: If a vendor (AWS, Cloudflare, Datadog) is the root cause, the response is to mitigate via failover or feature toggles rather than waiting for the vendor to fix.
6. **Security incident with legal implications**: When a breach or data exposure is suspected, involve legal and infosec before any detailed technical discussion. Do not post details in the war room until cleared.
7. **Incident spans a deployment freeze**: If the fix requires a deploy during a freeze period, the IC must obtain explicit written approval from the VP of Engineering. Document the approval in the timeline.
8. **No obvious root cause after investigation**: If investigation reaches a dead end, the incident must still have a postmortem with the action item to add better observability and a decision to monitor and re-evaluate.

## Validation Checklist

- [ ] Alert was acknowledged within defined SLA for its severity level
- [ ] Incident severity was classified using documented criteria
- [ ] A dedicated war room channel was created for severity >= 2
- [ ] Incident Commander was explicitly named and did not debug
- [ ] Scribe was assigned and timeline was recorded in real-time
- [ ] Containment was applied before root cause investigation began
- [ ] At least one status update was posted every 15 minutes during active response
- [ ] Customer-facing communication was reviewed by IC and EM before posting
- [ ] Fix was deployed with appropriate expedited review (if bypassing normal CI)
- [ ] Resolution was verified via monitoring for 10 consecutive minutes
- [ ] Postmortem was scheduled within 48 hours of incident resolution
- [ ] Postmortem document is blameless in tone and content
- [ ] All action items have single named owners and Jira tickets
- [ ] Action items have severity-appropriate due dates
- [ ] Runbook was updated with any manual steps discovered during response
- [ ] War room channel was archived after postmortem completion
- [ ] MTTA and MTTR were recorded for trend tracking
- [ ] Handoff documentation was reviewed if the incident spanned a shift

## Engineering Examples

### Example 1: Responding to a Production Database Outage

**Scenario**: At 14:23 UTC, PagerDuty pages the primary on-call with a Datadog alert showing the primary production database (PostgreSQL RDS) reaching 100% connections and query latency spiking to 30 seconds. Customers in the US East region cannot load their dashboards.

**Response**: The primary on-call acknowledges the page at 14:24 (1 minute SLA). They check the database dashboard — connections are maxed out at 1000, CPU is at 98%, and there is a blocking query stuck in an open transaction for 8 minutes. They identify this as severity 1 (complete regional outage for a core feature) and declare an incident at 14:26. A #incident-20240717-db-outage channel is created. The Engineering Manager is notified. The IC is assigned (a senior backend engineer) and a scribe begins recording in the thread. Containment: the IC decides to kill the blocking query using `pg_terminate_backend` and reduce the connection pool max from 1000 to 200 to prevent overload. At 14:31, connections drop to 180 and query latency falls to 200ms. Containment successful. Root cause investigation: SMEs check recent deploys and find a code change pushed at 13:00 that introduced a transactional workflow that acquired a lock and then performed a slow external API call, holding the transaction open. The fix: roll back the deploy at 14:40. At 14:45, monitoring confirms the system is healthy. All-clear declared at 14:55. Postmortem scheduled for 16:00 same day. Action items: (1) Add a query timeout middleware at the ORM layer, (2) Add a PagerDuty alert for long-running transactions exceeding 60 seconds, (3) Add a database connection saturation dashboard widget, (4) Add an integration test that detects lock contention.

### Example 2: Handling a Security Incident (Data Breach)

**Scenario**: A security engineer discovers at 09:00 that an AWS IAM key belonging to a former employee who left 6 months ago was used to download 500 GB of customer data from S3 between 02:00 and 04:00. The key was not rotated when the employee departed.

**Response**: The security engineer immediately pages the primary on-call and declares a severity 0 (active data breach with user data exposure). The IC is the head of security; the scribe is the on-call engineer. Legal counsel is pulled into a separate encrypted channel. The IC's first action at 09:02 is containment: the IAM key is deactivated and the S3 bucket policy is changed to block all access from outside the corporate VPN. The timeline records the exact scope: 500 GB of data, approximately 12,000 customer records including names, emails, and hashed passwords. The IC does not discuss details in the main war room — only in the legal channel. The status page says "We are investigating a security issue" with no technical details. Root cause: the offboarding process did not include a step for rotating IAM keys or checking for active keys. The fix: running a script that audits all IAM keys and deactivates keys associated with departed employees. Remediation: all affected customers are notified via email within 72 hours per regulatory requirement. All hashed passwords are force-expired. Postmortem: the root cause is "the offboarding checklist did not include IAM key revocation" — no blame on the person who failed to rotate. Action items: (1) Add IAM key revocation to the offboarding runbook, (2) Write a weekly cron job that audits keys and alerts on any key older than 90 days, (3) Implement short-term STS credentials for all S3 access instead of long-lived keys, (4) Conduct a quarterly access review of all production IAM keys.

### Example 3: Conducting a Blameless Postmortem After a Critical Incident

**Scenario**: A severity 1 incident occurred where an incorrectly configured Kubernetes HorizontalPodAutoscaler caused a cascading failure across all microservices during a traffic spike from a marketing campaign. The outage lasted 47 minutes and affected 80% of users.

**Postmortem Process**: The postmortem is scheduled for 10:00 the next day in a private room with the IC, Scribe, all SMEs, the Engineering Manager, and one observer from each affected team. The IC facilitates but does not present. The Scribe opens the timeline document and walks through it minute by minute. At each point, the group asks: "What was the system doing? What did we know? What did we decide?" No one asks "who did this." The root cause: the HPA was configured with `targetCPUUtilizationPercentage: 50` but the pods had a CPU request of 500m and a limit of 2 CPUs. When traffic spiked 5x, pods scaled from 10 to 100 replicas, but the new pods were immediately overloaded because the HPA target was calculated against the request, not the limit, and the burst was above the aggregate request threshold. This caused a feedback loop: more pods → more CPU pressure → more scaling → all pods crash-looping. The fix: change the HPA to use a custom metric based on request queue depth instead of CPU. Action items: (1) Change HPA metric to request queue depth with appropriate thresholds, (2) Add a maximum replica cap of 50 to all HPA configs, (3) Implement a canary deployment for HPA configuration changes, (4) Add a dashboard showing HPA scaling events in real-time, (5) Create a Game Day scenario specifically for traffic spike cascading failures. The postmortem is published to the engineering org, and the EM presents the learnings at the next all-hands. No one is fired or blamed. The engineer who configured the HPA is asked to lead the Game Day design.

