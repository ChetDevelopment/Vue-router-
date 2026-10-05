# Compliance

## Purpose

The Compliance skill establishes the engineering practices, data handling procedures, and technical controls required to meet regulatory obligations including GDPR, SOC 2, HIPAA, PCI-DSS, and CCPA. It ensures that every system, pipeline, and engineer operates within the boundaries defined by data protection laws and industry standards. This skill exists because non-compliance risks fines (up to 4% of global revenue for GDPR), loss of customer trust, and legal liability. Engineering teams cannot rely on legal or compliance teams alone — compliance must be embedded into the software development lifecycle through automated controls, auditable logging, and privacy-by-design architecture. The skill covers data classification, consent management, audit logging, data retention, right to deletion, encryption, breach notification, and compliance-as-code.

## Responsibilities

- **Engineering Managers**: Ensure their teams comply with data handling policies. Approve data classification decisions. Ensure PII data is handled per regulatory requirements in design reviews.
- **Security and Compliance Team**: Owns the compliance program. Conducts annual risk assessments, manages audit evidence collection, and liaises with external auditors.
- **Platform Engineering Team**: Implements compliance-as-code controls (Open Policy Agent, Cloud Custodian, Terraform Sentinel). Maintains audit logging infrastructure and encryption key management.
- **Service Owners**: Classify data stored in their services. Implement data retention and deletion workflows. Respond to Data Subject Access Requests (DSARs) within regulatory SLAs.
- **All Engineers**: Complete annual compliance training. Tag data with classification labels. Never log PII. Follow data retention policies. Report potential breaches immediately.

## Decision Process

1. **Classify data at the schema level**: Every field in every database table, API request body, log line, and configuration file must be classified as Public, Internal, Confidential, or Restricted (PII/PHI/PCI). Classification is stored in a data dictionary.
2. **Map data flows**: For each service, document where data enters, where it is stored, where it is processed, where it is transmitted, and where it is deleted. Use data flow diagrams with classification annotations per edge.
3. **Identify applicable regulations**: Based on the data classification and flow map, determine which regulations apply. Customer PII from EU users triggers GDPR. Patient health data triggers HIPAA. Credit card numbers trigger PCI-DSS.
4. **Implement consent management**: For GDPR and CCPA, implement a consent management platform that records user consent preferences, enables granular opt-in/opt-out, and propagates consent changes to downstream systems.
5. **Enforce encryption at rest and in transit**: All Restricted data must be encrypted at rest with AES-256 using customer-managed KMS keys. All data in transit must use TLS 1.2+ with strong cipher suites.
6. **Configure audit logging**: All access to Restricted data must be logged with: who accessed it, when, from what IP, what action was taken, and what data was returned or modified. Logs must be immutable and stored in a separate SIEM or log aggregation system.
7. **Implement data retention and deletion**: Each data classification has a retention period (e.g., Restricted: 7 years, Internal: 2 years, logs: 90 days). Automated cron jobs enforce deletion. Hard deletes are preferred over soft deletes for compliance.
8. **Build DSAR and deletion workflows**: For GDPR right to access and right to erasure, build automated workflows that cascade through all services. DSAR must be fulfilled within 30 days (GDPR) and CCPA requests within 45 days.
9. **Create evidence collection pipelines**: For SOC 2 and other audits, automate the collection of evidence — access reviews, penetration test results, change management records, backup verification reports, and training completion logs.
10. **Implement breach detection and notification**: Monitor for unauthorized access. A confirmed breach of Restricted data must be reported to the DPO within 24 hours (GDPR requires notification within 72 hours of awareness).
11. **Conduct access reviews quarterly**: Every quarter, review all IAM users, roles, and service accounts that have access to Restricted data. Revoke unused accounts and rightsize over-provisioned permissions.
12. **Run compliance-as-code in CI/CD**: Use Open Policy Agent (OPA) or Rego policies to enforce compliance rules in CI/CD: no PII in logs, required encryption headers on API responses, no public S3 buckets, data retention tags on databases.

## Inputs

- **Data classification matrix**: A document or database that maps every data field to its classification level and the regulations that apply.
- **Data flow diagrams**: Architecture-level diagrams showing how data moves between services, storage, external APIs, and third-party processors.
- **Regulatory requirements database**: A mapping of regulatory controls (GDPR Articles, SOC 2 criteria, HIPAA rules, PCI-DSS requirements, CCPA sections) to technical controls.
- **Consent records**: User consent preferences stored in a database with timestamps, scope, and consent version tracking.
- **Access logs**: CloudTrail, database audit logs, application access logs, VPN logs, and SIEM event data.
- **Vendor security assessments**: Completed security questionnaires, SOC 2 reports, and data processing agreements for all third-party subprocessors.
- **Incident reports**: Security incident records, breach notifications, and postmortem documents with compliance impact analysis.

## Outputs

- **Compliance evidence repository**: Centralized store of all audit evidence — screenshots, log extracts, policy documents, configuration files, and training records — organized by control.
- **Data processing register**: Record of all processing activities, including purpose, legal basis, data categories, recipients, retention, and cross-border transfers.
- **DSAR fulfillment records**: For each Data Subject Access Request, a case record showing timeline, data collected, redactions applied, and delivery confirmation.
- **Deletion confirmation receipts**: For each right to erasure request, a confirmation record from every service that the data was deleted or anonymized with timestamp.
- **Compliance-as-code policy suite**: A collection of OPA/Rego policies, Cloud Custodian rules, and Terraform Sentinel policies that enforce compliance automatically.
- **Quarterly compliance scorecard**: A dashboard showing control pass/fail rates, open findings, risk acceptance requests, and audit readiness score.

## Rules

1. **PII must never be logged**: Logging PII (email, name, IP address, credit card number, SSN) in application logs, error logs, or access logs is forbidden. Use structured logging with automatic PII scrubbing at the log shipper level.
2. **All access to Restricted data must be authenticated and authorized**: No anonymous access to any database, object store, or API that contains Restricted data. Use IAM roles, API keys, or OAuth — never allow public access.
3. **Encryption keys for Restricted data must be customer-managed (CMK)**: Do not use cloud-provider default keys for Restricted data. Use AWS KMS CMK or equivalent with key rotation every 12 months.
4. **Data retention policies must be automated**: Manual data deletion is not acceptable. Use automated retention policies (S3 lifecycle, RDS automated snapshot retention, database cleanup scripts) with documented schedules.
5. **Cross-border data transfers require a legal basis**: If data moves between countries (e.g., EU to US), there must be a valid transfer mechanism (Standard Contractual Clauses, Binding Corporate Rules, or adequacy decision).
6. **DSARs must be trackable end-to-end**: Every DSAR must have a unique tracking ID, a timestamp for each step, and a final delivery confirmation. Use a ticketing system designed for privacy requests.
7. **Audit logs must be immutable**: Audit logs must be write-once, read-many. Use S3 Object Lock, append-only database tables, or a SIEM with immutable storage. No one (including admins) may modify or delete audit logs.
8. **Vendor due diligence must be completed before data sharing**: Before sharing Restricted data with any third-party service, a security assessment and data processing agreement must be on file.
9. **Security training must be completed annually**: Every engineer must complete compliance and security awareness training within 30 days of hire and annually thereafter. Training completion is tracked and reported to auditors.
10. **Access to Restricted data must be reviewed quarterly**: Service owners must review and attest to the access list for every system containing Restricted data. Over-provisioned access must be revoked within 7 days.
11. **Deletion must include backups and caches**: When deleting a user's data, the deletion workflow must cover primary databases, read replicas, backups, caches (Redis, CDN edge caches), and archived snapshots.
12. **Consent withdrawal must propagate within 24 hours**: When a user withdraws consent, all downstream systems (marketing email, analytics, personalization) must stop processing within 24 hours.

## Best Practices

1. **Tag all resources with data classification**: Use infrastructure-as-code tags to label every database, S3 bucket, and compute resource with its highest data classification level.
2. **Use column-level encryption for sensitive fields**: For fields like SSN, credit card number, or medical record number, use application-level encryption (AWS Encryption SDK, Vault Transcrypt) in addition to storage encryption.
3. **Implement "deny by default" network policies**: Use security groups, network ACLs, and service mesh policies (Istio, Linkerd) to deny all traffic to Restricted data stores unless explicitly allowed.
4. **Use a data loss prevention (DLP) tool**: Scan S3 buckets, databases, and log streams for accidentally exposed PII using tools like Amazon Macie or Google Cloud DLP.
5. **Maintain a data processing register in version control**: Store the data processing register as YAML files in the same repository as the infrastructure code. Changes are reviewed via pull requests.
6. **Automate evidence collection for SOC 2**: Set up periodic cron jobs or CI pipelines that collect and package evidence (user access list, change management records, backup logs, training reports) into a compliance evidence folder.
7. **Use tokenization for PCI data**: Instead of storing credit card numbers, use a tokenization service (Stripe, Square, Vault) that replaces the PAN with a token. The actual credit card number never enters your systems.
8. **Redact PII in production logs retroactively**: If PII is discovered in existing logs, run a script to redact or purge those log entries within 7 days. Document the incident as a security finding.
9. **Conduct quarterly access recertification**: Use an automated tool (Access Reviewer, SailPoint) that sends each data owner a list of users with access and requires attestation or revocation.
10. **Implement a breach notification runbook**: A pre-written runbook for breach notification that includes: who to contact (DPO, legal), what to say, what not to say, notification templates per regulation, and evidence preservation steps.
11. **Use purpose limitation labels in data stores**: Add a label or column to databases indicating the purpose for which the data was collected (e.g., `marketing`, `analytics`, `order-processing`). Enforce that data is not used outside its purpose.
12. **Build a compliance dashboard for auditors**: A read-only dashboard that auditors can access during an audit showing control status, evidence collection, and policy violations. Reduces auditor friction.

## Anti-patterns

1. **PM tool as a DSAR tracker**: Handling DSARs via email or ticketing tickets without automation. Without a dedicated DSAR system, tracking SLA compliance and generating audit evidence is impossible.
2. **Compliance through documentation only**: Writing policies without implementing technical controls. A policy that says "all data must be encrypted" without enforcing encryption at the database level is a compliance theater.
3. **One-size-fits-all data retention**: Applying a single retention period to all data types. Logs may need 90 days, but customer contracts may need 7 years. Use classification-based retention policies.
4. **Ignoring shadow IT for compliance**: Third-party tools used by teams without approval (e.g., a marketing team using a survey tool that stores customer PII). Maintain an approved vendor list and scan for unapproved tools.
5. **Manual evidence collection**: Taking screenshots of configurations during audit prep instead of automated evidence pipelines. Manual collection is error-prone, incomplete, and does not scale.
6. **Relying on soft deletes for compliance**: Setting a `deleted_at` flag without actually deleting the row. Hard deletes (or anonymization) are required for GDPR right to erasure compliance.
7. **Not testing backup encryption recovery**: Assuming encrypted backups are recoverable. Test restoring from encrypted backups annually and verify that encryption keys are accessible.
8. **No data classification at the code level**: Storing PII and non-PII in the same database table without clear classification. Every field must be classified in the data dictionary.

## Edge Cases

1. **DSAR for a user whose data exists in archived backups**: A GDPR right to erasure request conflicts with backup retention policies. The approach is to delete the live data and mark the user as "deleted" in the backup retention system so that when backups are restored, the data is not reprocessed.
2. **CCPA opt-out for a service that has no user interface**: If a service processes data through an API with no UI, provide a dedicated API endpoint for opt-out requests and document it publicly.
3. **Data subject requests a copy of data that includes another user's PII**: When fulfilling a DSAR for access, redact any data that contains another individual's PII (e.g., emails from a co-worker). Document the redaction rationale.
4. **GDPR data portability for unstructured data**: The right to data portability applies to data provided by the user and processed by automated means. Unstructured data (e.g., free-form notes) may not be portable — document the rationale for exclusion.
5. **Vendor data breach that involves your customer PII**: If a subprocessor (e.g., AWS, SendGrid) suffers a breach that exposes your customer data, you must notify affected customers within the regulatory timeline. Ensure your vendor contracts require notification within 24 hours.
6. **Law enforcement request for user data**: A valid legal request (subpoena, warrant) for user data must be handled differently from a DSAR. Notify legal counsel immediately. Do not delete the requested data. Document the request and response.
7. **User deletion overlaps with an active legal hold**: If a user's data is under a litigation hold, the deletion request cannot be fulfilled until the hold is released. Communicate the delay to the user without revealing the reason for the legal hold.

## Validation Checklist

- [ ] All data fields are classified (Public, Internal, Confidential, Restricted) in a data dictionary
- [ ] Data flow diagrams exist for every service showing PII transit and storage points
- [ ] Applicable regulations (GDPR, SOC2, HIPAA, PCI, CCPA) are identified per service
- [ ] Consent management platform is implemented and consent records are auditable
- [ ] All Restricted data is encrypted at rest with customer-managed KMS keys (AES-256)
- [ ] All data in transit uses TLS 1.2+ with strong cipher suites
- [ ] Access to Restricted data is logged with who, what, when, and source IP
- [ ] Audit logs are immutable (write-once, read-many) and stored in a separate system
- [ ] Data retention policies are automated per classification (not manual)
- [ ] Deletion workflows cascade through databases, caches, backups, and archives
- [ ] DSAR workflow is implemented with tracking IDs and SLA enforcement (30/45 days)
- [ ] Deletion confirmation receipts are generated for each erasure request
- [ ] Breach notification runbook exists and is tested annually
- [ ] Access reviews for Restricted data are conducted quarterly
- [ ] Compliance-as-code policies (OPA, Sentinel) are enforced in CI/CD pipelines
- [ ] Vendor due diligence (security assessment, DPA) is on file before data sharing
- [ ] Security training completion rate is >= 95% across engineering
- [ ] Data processing register is maintained and accessible to auditors
- [ ] Backups containing PII are included in the deletion and retention scope
- [ ] Cross-border data transfer mechanisms are documented and valid

## Engineering Examples

### Example 1: Implementing GDPR Data Deletion Workflows

**Scenario**: The company processes data for EU customers. GDPR's right to erasure (Article 17) requires that users can request deletion of their personal data and that the company deletes data across all systems. Prior to this implementation, deletion was performed manually by database admins via SQL queries.

**Implementation**: A Deletion Service (Go service with an API endpoint) is built that orchestrates cascading deletion across 12 microservices, 6 databases, Redis caches, S3 file storage, and 3 third-party APIs. The workflow: (1) A customer submits a deletion request via a web form. (2) The Privacy Request ticketing system (Jira Service Management with a custom workflow) automatically creates a ticket and assigns it to the Deletion Service. (3) The Deletion Service calls each service's `/api/v1/users/{id}/delete` endpoint. Each endpoint: hard-deletes the user row from the primary database, deletes all related records (orders, sessions, logs summaries — but not aggregate analytics), removes the user from the Redis cache, deletes files from S3 that belong to that user, calls the third-party API to request deletion from partners (Stripe, SendGrid, Mixpanel). (4) A confirmation is written to a deletion audit table with the user ID, timestamp, services confirmed deleted, and any failures. (5) For data in weekly database backups that may contain the user's data, a "deletion flag" is written to a registry — if a backup needs to be restored, the restore script checks the registry and re-deletes those users after restoration. (6) The entire pipeline is logged, and a confirmation email is sent to the user. Lessons learned: three services failed during the first drill because they had no deletion endpoint. A compliance check was added to the service template requiring a deletion endpoint before any PII can be stored.

### Example 2: Designing Audit Logging for SOC 2 Compliance

**Scenario**: The company is preparing for a SOC 2 Type II audit. The auditor requires evidence that access to production systems and customer data is logged, reviewable, and tamper-proof. Before this initiative, logs existed in CloudTrail but were spread across accounts, not monitored, and retained only 7 days.

**Implementation**: (1) CloudTrail is enabled for all AWS accounts with log file validation (SHA-256 digest files) and logs are delivered to a centralized S3 bucket with Object Lock enabled (COMPLIANCE mode, 365-day retention). (2) Database audit logging is enabled for all RDS PostgreSQL instances using the `pgaudit` extension, which logs all SELECT, INSERT, UPDATE, DELETE, and DDL statements against tables containing Restricted data. These logs are shipped to CloudWatch Logs with a 1-year retention policy. (3) Application-level access logging: a custom middleware in the API gateway logs every API request that accesses user data — the log includes request ID, user ID, endpoint, HTTP method, timestamp, source IP (masked last octet), and response status. PII fields in request/response bodies are redacted by the middleware. (4) A centralized SIEM (Sumo Logic) ingests all three log streams. Alerts are configured for: access from unexpected geographies, access during off-hours, repeated failed authentication attempts, and access by IAM users that have been deactivated. (5) A monthly access review report is automatically generated from the SIEM, listing all IAM users who accessed Restricted data in the past 30 days. The report is sent to service owners for attestation. (6) For the auditor: a read-only evidence dashboard shows control descriptions, log sample extracts, alert counts, and access review completion status. Audit result: zero findings on the logging and monitoring control.

### Example 3: Handling PII Data in Accordance with HIPAA Requirements

**Scenario**: A health-tech application stores Protected Health Information (PHI) — patient names, diagnoses, treatment records, and insurance information. The application must comply with HIPAA Privacy Rule, Security Rule, and Breach Notification Rule.

**Implementation**: (1) A Business Associate Agreement (BAA) is signed with AWS (the cloud provider). All services are deployed in AWS accounts covered by the BAA. (2) Data classification: every database column that contains PHI is tagged in the schema with a `phi: true` annotation. A CI/CD linter checks that any new column with PHI is encrypted using the AWS Encryption SDK with a key derived from a master key stored in AWS KMS (customer-managed, rotated yearly). (3) Network segmentation: the PHI database is deployed in a private subnet with no public access. Access is granted only through a bastion host with session recording (SSM Session Manager logs captured to CloudWatch and retained for 6 years per HIPAA). (4) Application-level encryption: the `patient_diagnosis` and `insurance_id` columns are encrypted using deterministic encryption (so that indexed lookups still work). The encryption keys are scoped per patient — if one patient's key is compromised, no other patient's data is exposed. (5) Access controls: IAM policies enforce that only the production microservice role has read/write access to the PHI database. Engineers have no direct database access in production. Read-only access for debugging is available through a break-glass process with approval from both the DPO and engineering manager, and every access is logged and reviewed within 24 hours. (6) Audit logging: database audit logs capture every SQL statement against PHI tables. These logs are shipped to a separate AWS account that even the infrastructure team cannot delete (enforced by an SCP). (7) Breach notification: a PagerDuty alert is triggered if the PHI audit log detects access from an unrecognized IP or IAM role. If a breach is confirmed, the DPO is automatically paged. A pre-written breach notification template is stored in the runbook. The template includes: the specific PHI elements exposed, the number of affected individuals, the date of breach, and steps taken to mitigate. The runbook enforces that the DPO must notify affected individuals within 60 days per HIPAA. Annual drill: the team runs a tabletop exercise simulating a PHI breach and practices the notification workflow.

