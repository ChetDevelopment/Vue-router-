# Disaster Recovery

## Purpose

The Disaster Recovery skill defines the strategies, processes, and technical configurations required to recover critical systems and data after a catastrophic failure, natural disaster, or region-level outage. It ensures that the organization can meet its Recovery Time Objective (RTO) and Recovery Point Objective (RPO) for every service. This skill exists because without a codified DR plan, teams scramble during real disasters, make inconsistent decisions, and risk permanent data loss or extended downtime that damages customer trust and regulatory standing. The skill covers backup strategies, replication topologies, failover testing, recovery runbooks, and continuous improvement through DR drills.

## Responsibilities

- **Platform Engineering Team**: Owns the infrastructure-level DR configuration — backup automation, cross-region replication, DNS failover, and cluster provisioning scripts.
- **Service Owners**: Define RTO and RPO for their services based on business criticality. Maintain service-specific recovery runbooks.
- **SRE Team**: Conducts quarterly DR drills, validates backup integrity, and measures recovery times against stated RTOs.
- **Security Team**: Ensures that DR procedures do not introduce security gaps — encryption keys are available in the recovery region, access controls are preserved, and data is encrypted in transit during replication.
- **Engineering Manager**: Approves RTO/RPO targets annually. Allocates budget for cross-region infrastructure and backup storage costs.
- **All Engineers**: Participate in at least one DR drill per year. Familiarize themselves with recovery runbooks for services they own.

## Decision Process

1. **Classify service criticality**: Every service is assigned a tier (Tier 0 = critical, Tier 1 = important, Tier 2 = best-effort) based on business impact analysis.
2. **Define RTO and RPO per tier**: Tier 0 services target RTO <= 15 minutes and RPO <= 5 minutes. Tier 1 targets RTO <= 4 hours and RPO <= 1 hour. Tier 2 targets RTO <= 24 hours and RPO <= 24 hours.
3. **Select backup strategy**: For Tier 0 and Tier 1, continuous backup (WAL archiving, CDC streams) plus daily full backups. For Tier 2, daily full backups with weekly snapshots.
4. **Choose replication strategy**: Tier 0 uses synchronous replication (if within region) or asynchronous streaming replication (cross-region). Tier 1 uses asynchronous replication. Tier 2 uses backup-restore only.
5. **Design deployment topology**: Multi-region active-passive for Tier 0 (primary in us-east-1, standby in us-west-2). Active-active for stateless services with read replicas in each region.
6. **Implement automated failover**: Use health checks, Route53 DNS failover, and cluster orchestration (Kubernetes cluster API failover or RDS Multi-AZ with cross-region read replica promotion).
7. **Write recovery runbooks**: For every service, document step-by-step recovery instructions including exact commands, console URLs, IAM roles, connection strings, and verification checks.
8. **Automate backup verification**: Restore backups in an isolated test environment weekly. Validate schema integrity, row counts on critical tables, and application functionality.
9. **Schedule DR drills**: Quarterly tabletop exercises for Tier 2. Semi-annual full failover drills for Tier 1. Annual full-region failover drills for Tier 0.
10. **Measure and report**: After each drill, measure actual RTO and RPO against targets. Publish a DR scorecard to engineering leadership.
11. **Update runbooks from drill findings**: Every drill produces at least one runbook improvement. Stale runbooks are worse than no runbooks.
12. **Review and reclassify annually**: Revisit business impact analysis annually. Services change criticality as the business evolves. Update RTO/RPO and infrastructure accordingly.

## Inputs

- **Business impact analysis (BIA)**: Document ranking all services by criticality, revenue impact, and regulatory requirements.
- **RTO/RPO targets spreadsheet**: Service-level agreement targets approved by engineering leadership.
- **Infrastructure-as-code definitions**: Terraform or Pulumi configurations for all production infrastructure across all regions.
- **Backup configurations**: AWS Backup plans, Velero schedules, database snapshot schedules, WAL archiving configuration.
- **Replication configurations**: Cross-region read replicas, CDC pipelines (Debezium, Kafka MirrorMaker), DNS failover settings.
- **Monitoring and alerting data**: CloudWatch metrics on replication lag, backup success/failure rates, storage utilization.
- **Previous drill reports**: Lessons learned, measured recovery metrics, and action items from prior DR exercises.

## Outputs

- **Tiered service catalog**: Complete list of all services with their assigned criticality tier, RTO, and RPO.
- **Recovery runbooks**: Per-service, step-by-step documented recovery procedures with exact commands, console paths, IAM roles, and verification steps.
- **Backup verification reports**: Weekly reports showing that every automated backup was successfully restored and validated in an isolated environment.
- **DR drill reports**: Post-drill documentation that includes measured RTO/RPO, timeline, issues encountered, and action items.
- **Architecture diagrams**: Multi-region network topology, DNS failover paths, data replication flows, and backup storage layout.
- **Action item tracker**: Jira tickets for every improvement identified during drills or reviews, with owners and due dates.

## Rules

1. **Backups must be encrypted at rest and in transit**: All backup data must use AES-256 encryption at rest and TLS 1.2+ in transit. Encryption keys must be stored in a separate region from the backup data.
2. **Backups must be stored in a different geographic region from primary data**: Never colocate backups with the primary data store. A regional disaster destroys both.
3. **RTO is measured from disaster declaration, not from drill start**: The clock starts when an authorized person declares a disaster, not when the drill officially begins.
4. **Recovery runbooks must be tested at least annually**: An untested runbook is a fantasy. Test every runbook in a drill or Game Day at least once per year.
5. **Cross-region replication must not replicate corruption**: Use point-in-time recovery (PITR) capabilities. If corruption propagates to the secondary region, the backup is useless.
6. **Failover must be reversible**: The failover process must support failing back to the original region without data loss or extended downtime.
7. **DR drills must interrupt real traffic**: Tier 0 drills must include a planned failover of a subset of production traffic. DR that never touches production gives false confidence.
8. **Backup retention must meet legal requirements**: Follow minimum retention periods defined by compliance regulations (e.g., GDPR requires data to be recoverable for the duration of processing, PCI-DSS requires 12 months of logs).
9. **All DR infrastructure must be maintained under IaC**: Recovery environments must be provisioned and updated through Terraform or Pulumi. Manual recovery environment configuration is forbidden.
10. **Replication lag must be monitored and alerted**: Set alerts on replication lag exceeding half the RPO. If replication lag >= RPO, the DR plan is already violated.
11. **DR credentials must be pre-provisioned**: The recovery region must have pre-configured IAM roles, secrets, and service accounts. Do not rely on being able to create them during a disaster.
12. **Disaster declaration authority must be defined**: Document who has the authority to declare a disaster and initiate failover. At least two people per region must have this authority.

## Best Practices

1. **Automate everything**: Manual steps in recovery are error-prone and slow. Every recovery action should be a single script, CI pipeline, or automation workflow.
2. **Use immutable infrastructure for recovery**: Deploy recovery environments from the same golden AMIs/containers used in primary. Immutable infrastructure eliminates configuration drift.
3. **Pre-warm the standby region**: Keep the recovery region running with a minimum number of instances. Cold start adds 20+ minutes to RTO.
4. **Use DNS TTL of 60 seconds or less**: Long DNS TTLs delay failover. Set TTL to 60 seconds for all production DNS records that may need to fail over.
5. **Test chaos engineering-style failures**: In addition to planned drills, inject real failures (e.g., stop the primary database process, blackhole a region's network) to see if automated failover works.
6. **Include dependent services in DR planning**: When recovering service A, ensure that service B (which A depends on) is also recovered or available in the target region.
7. **Maintain a DR dashboard**: Build a real-time dashboard showing backup status, replication lag, last successful restore, and regional health for all services.
8. **Document the communication plan for a disaster**: Who notifies customers? Who declares the disaster? What is the escalation path if the primary region is unreachable?
9. **Run a "chaos day" annually**: Dedicate one day per year to breaking things in staging and verifying DR processes. Treat it as a learning exercise, not a pass/fail test.
10. **Consider regional dependencies**: If your DR region depends on a service that is itself regional (e.g., Amazon S3, DynamoDB), confirm that service is available in the target region with the same API.
11. **Validate encryption key availability in the recovery region**: If using KMS in one region, confirm that the recovery region can decrypt the data. Use multi-region KMS keys or export keys.
12. **Practice partial recovery**: In addition to full region failover drills, practice recovering a single service or database to validate that isolation works.

## Anti-patterns

1. **"It's in the cloud, it's automatically durable"**: Assuming AWS/Azure/GCP guarantees zero data loss. Cloud providers have region-level outages. Own your DR plan.
2. **Only testing in staging**: Staging DR is necessary but insufficient. Production-configuration differences (instance sizes, network ACLs, IAM policies) cause failures in real DR.
3. **Relying on a single backup type**: If you only have full backups and the last one failed silently, you have no recovery path. Always pair full backups with incremental or continuous backups.
4. **Overlooking networking dependencies**: Recovering compute without confirming that DNS, load balancers, VPN tunnels, and VPC peering are operational in the recovery region leads to a failed recovery.
5. **No backup restore testing**: Taking backups without ever testing restore. The backup that has never been restored is not a backup — it is a delusion.
6. **Pessimistic RTO targets**: Setting RTO of 5 minutes for a service that requires manual database restore from 5 TB of backup files. Be realistic or invest in the infrastructure to match.
7. **Single-person knowledge**: Only one person knows the DR process. If that person is unavailable during the disaster, recovery stalls. Cross-train at least three people on every runbook.
8. **Ignoring data consistency across services**: Restoring a database to a point-in-time that is inconsistent with the data in other services (e.g., orders without payments). Ensure cross-service recovery consistency.

## Edge Cases

1. **Primary and DR regions share a single cloud provider dependency**: If both regions depend on the same global service (e.g., Route53, CloudFront), a provider-level failure blocks both.
2. **Data corruption is discovered after the backup window**: The corruption was introduced 6 hours ago but discovered now. Recovering to the latest backup would restore the corrupted data. Use PITR to recover to just before the corruption timestamp.
3. **DR region is also impacted by the disaster**: A truly large-scale event (earthquake, cloud provider global outage) may impact both regions. Have a manual recovery plan for bare-metal or another cloud provider.
4. **Failover causes a thundering herd**: When a region fails over, all clients reconnect simultaneously, overwhelming the recovery region. Implement connection queuing, rate limiting, and gradual traffic shifting.
5. **Encryption key is unavailable in the DR region**: KMS key from the primary region is not replicated. Database backups are encrypted with a key that cannot be used in the recovery region. Use cross-region KMS key replication.
6. **Third-party API rate limits in the recovery region**: Services that call external APIs may hit rate limits because the new region's IP addresses are unregistered. Pre-register recovery region IPs with third parties.
7. **Regulatory data residency conflicts**: DR region crosses national borders, violating data residency requirements (e.g., GDPR requires data to stay in the EU). Use in-country DR regions or an active-active architecture within the same country.

## Validation Checklist

- [ ] Every service has a documented criticality tier (Tier 0, 1, or 2)
- [ ] Every service has defined RTO and RPO targets approved by leadership
- [ ] Tier 0 services have cross-region synchronous or near-synchronous replication
- [ ] Tier 0 and Tier 1 backups are stored in a different geographic region from primary
- [ ] All backups are encrypted at rest (AES-256) and in transit (TLS 1.2+)
- [ ] Backup restore has been tested and validated within the past 30 days
- [ ] Recovery runbook exists for every service and is up to date (reviewed within 90 days)
- [ ] At least three engineers are trained on the DR process for each service
- [ ] DNS TTL is set to 60 seconds or less for all production records
- [ ] DR drill was conducted within the past 6 months for Tier 0 services
- [ ] DR drill report shows measured RTO and RPO achieved within targets
- [ ] All action items from the last drill are completed or have an active owner
- [ ] Encryption keys required for recovery are available in the DR region
- [ ] IAM roles, secrets, and service accounts are pre-provisioned in the DR region
- [ ] Replication lag alerts are configured and firing correctly
- [ ] DR dashboard is operational and visible to the engineering team
- [ ] Communication plan for disaster declaration is documented and accessible
- [ ] Third-party IPs for recovery region are pre-registered where needed

## Engineering Examples

### Example 1: Designing a Multi-Region Active-Passive Setup for a Tier 0 SaaS Platform

**Scenario**: The company operates a SaaS platform with 99.99% availability requirements (52.56 minutes max downtime per year). They need a DR architecture for their primary database (PostgreSQL on AWS RDS) and compute (Kubernetes on EKS), both running in us-east-1.

**Architecture**: The DR region is us-west-2. The primary RDS PostgreSQL instance has a cross-region read replica in us-west-2. WAL streaming is continuous with 1-second replication lag target. The read replica is configured with automatic backup retention of 35 days. Compute in us-west-2 runs a scaled-down EKS cluster (2 nodes vs 20 in primary) with the same Kubernetes manifests, pointing to the local read replica for read traffic. Route53 is configured with a failover routing policy, health check on the primary region's ALB (TCP health check on port 443 every 10 seconds, failure threshold of 3). DNS TTL is 60 seconds. A Lambda function monitors RDS replication lag. If lag exceeds 60 seconds for 2 consecutive checks, the Lambda sends a PagerDuty alert. The failover playbook: (1) Promote the read replica to a standalone primary via `aws rds promote-read-replica`, (2) Update the EKS cluster's ConfigMap to point to the new primary endpoint, (3) Switch Route53 alias from primary ALB to DR ALB, (4) Scale up EKS from 2 to 20 nodes. Total estimated RTO: 8 minutes. RPO: less than 1 second of data loss. Post-drill measurement confirms RTO of 7 minutes 23 seconds and RPO of 0 (no data loss).

### Example 2: Implementing Automated Backup Verification for a Multi-Tier Application

**Scenario**: The platform has 40 PostgreSQL databases, 15 Redis instances, and 5 TB of file storage in S3. Backups run nightly, but no one verifies that they can actually be restored. After a near-miss where a corrupted backup was discovered during an actual recovery attempt, the team decides to automate backup verification.

**Implementation**: A weekly CI pipeline (GitHub Actions, running Friday night) does the following: (1) Spin up a temporary RDS instance from the latest automated snapshot of each production database using a Terraform module that creates an isolated VPC. (2) Connect to the restored database and run a validation script that checks: row counts on 10 critical tables match expected ranges, the most recent 100 rows in the `orders` table are present, schema matches a reference hash (prevents silent schema drift), replication slots are clean (no orphaned slots from the snapshot). (3) For Redis, restore from the latest RDB backup to a temporary ElastiCache instance and verify key counts and a set of known keys. (4) For S3, restore 0.1% of files from the latest S3 Glacier backup using S3 Batch Operations and verify checksums. (5) If any validation fails, the pipeline sends a PagerDuty critical alert and posts to the #dr-alerts Slack channel with the specific database name and failure reason. (6) If all validations pass, the pipeline publishes a report to a Confluence page showing date, DB count, duration, and checksum results. The pipeline cost is approximately $40 per run (temporary RDS instances for 2 hours) — a small price for confidence.

### Example 3: Conducting a Disaster Recovery Drill for a Regional Outage

**Scenario**: The team schedules a semi-annual full-region failover drill for their Tier 0 service. The drill is planned two weeks in advance with a published schedule. The primary region is us-east-1; the DR region is eu-west-1.

**Drill Execution**: At 10:00 AM, the SRE lead announces the start of the drill in the #dr-drill Slack channel. The on-call engineer uses a ChatOps command `/dr-failover us-east-1` that triggers a workflow: (1) Route53 health checks are artificially failed by blocking the primary ALB's health check endpoint at the security group level. (2) The automated failover responds: Route53 switches traffic to eu-west-1 within 60 seconds (TTL). (3) The DR EKS cluster receives the first surge of connections — the HorizontalPodAutoscaler scales pods from 5 to 25. (4) The read replica in eu-west-1 handles read traffic; write traffic is queued via a message buffer (SQS with a Lambda consumer) until the replica is promoted. Measured metrics: DNS propagation complete at 10:02 (120 seconds — longer than expected due to client-side DNS caching). RDS read replica promotion took 4 minutes 30 seconds. EKS autoscaling to 25 pods took 3 minutes 15 seconds. Total RTO: 6 minutes 45 seconds (under the 15-minute target). RPO: 0 (no data loss — SQS buffer preserved all writes). Issues discovered: (1) Three microservices had hardcoded the primary region endpoint instead of using the DNS name. (2) The read-replica instance class in eu-west-1 was smaller (db.r5.large vs db.r5.xlarge), causing CPU saturation during the failover window. Action items: (1) Audit all microservices for hardcoded regional endpoints and replace with DNS aliases. (2) Match DR database instance class to primary. (3) Run a shorter drill (1 hour) in 3 months to validate the fixes. The drill report is published to the engineering org, and the issues are tracked in Jira.

