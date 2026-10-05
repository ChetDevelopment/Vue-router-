# Cost Optimization

## Purpose

The Cost Optimization skill defines a systematic approach to managing and reducing cloud infrastructure costs without sacrificing performance, reliability, or security. It moves cost optimization from a periodic fire drill to a continuous practice embedded in the engineering culture. This skill exists because unmanaged cloud costs grow exponentially — idle resources, overprovisioned instances, unnecessary data transfer, and unused services silently consume budget. Without intentional optimization, teams either waste money or resort to arbitrary cutbacks that degrade customer experience. The skill covers FinOps principles, resource right-sizing, purchasing options, auto-scaling strategies, storage tiering, data transfer minimization, and cost allocation tagging.

## Responsibilities

- **Engineering Managers**: Own the monthly cost budget for their team. Review cost reports weekly. Approve provisioning requests above the baseline.
- **Platform Engineering Team**: Maintains cost monitoring dashboards, implements tagging strategies, enforces provisioning policies, and manages reserved instance portfolios.
- **Service Owners**: Right-size their services quarterly. Implement auto-scaling. Respond to cost anomaly alerts within 24 hours.
- **FinOps Champion**: A designated person from engineering who leads cost optimization reviews, publishes monthly cost reports, and advocates for cost-aware engineering decisions.
- **All Engineers**: Consider cost implications during architecture design and code reviews. Tag all resources appropriately. Do not leave idle resources running.

## Decision Process

1. **Establish cost allocation**: Every AWS/GCP/Azure resource must have tags for `team`, `service`, `environment`, `cost-center`, and `owner`. Resources without these tags are flagged in a daily compliance report.
2. **Set budgets and alerts**: Configure monthly budgets per cost-center in AWS Budgets (or equivalent). Set alerts at 50%, 80%, and 100% of budget. Budgets must be approved by Engineering VP.
3. **Analyze usage patterns**: Use Cost Explorer, CloudHealth, or Vantage to identify the top 10 cost drivers. Sort by percentage of total spend — focus on the top 3.
4. **Right-size over-provisioned resources**: For each resource in the top 10, check utilization over the past 30 days. If average CPU < 20%, memory < 30%, or network < 10%, downsize to the next appropriate instance type.
5. **Evaluate purchasing options**: For resources with stable utilization (>= 70% average over 3 months), purchase Reserved Instances (1-year term for 30% savings, 3-year for 50%). For variable workloads, use Savings Plans instead.
6. **Implement auto-scaling**: Stateless compute tiers must use horizontal auto-scaling with target utilization of 60-70%. No fixed-size instance fleets allowed.
7. **Optimize storage**: S3/GCS objects older than 30 days move to Infrequent Access tier. Objects older than 90 days move to Glacier/Archive. Use S3 Intelligent Tiering if access patterns are unpredictable.
8. **Minimize data transfer costs**: Keep data within the same region and availability zone where possible. Use CloudFront or CDN for external delivery. Use VPC endpoints instead of NAT gateways for AWS service access.
9. **Review database costs**: Check RDS/Aurora instance utilization. Consolidate small databases. Use Aurora Serverless for variable workloads. Remove unused read replicas.
10. **Eliminate idle resources**: Weekly scan for unattached EBS volumes, unused load balancers, idle NAT gateways, stagnant RDS instances, and orphaned EIPs. Automate deletion with a 7-day grace period.
11. **Monitor cost anomalies daily**: Use Anomaly Detection in AWS Cost Explorer (or third-party tool). Anomalies that exceed 20% daily increase must be investigated within 24 hours.
12. **Review and report monthly**: Publish a cost optimization summary showing savings achieved, top costs, overspend areas, and action items. Present at the engineering all-hands.

## Inputs

- **Cloud provider billing data**: AWS Cost and Usage Report, GCP BigQuery billing export, Azure Cost Management exports.
- **Resource utilization metrics**: CloudWatch, Datadog, or GCP Monitoring metrics for CPU, memory, network, and disk IOPS — 30-day and 90-day lookback.
- **Tagging compliance reports**: Weekly reports showing untagged resources, wrong environment tags, and missing cost-center tags.
- **Reserved instance portfolio**: Current RI coverage, upcoming expiry dates, utilization rates, and recommendations from AWS Cost Explorer.
- **Auto-scaling configuration**: Current scaling policies, desired min/max, target utilization metrics, and scaling event history.
- **Budget alerts**: Notifications from AWS Budgets, Slack alerts for cost spikes, and email reports from billing dashboard.
- **Architecture change log**: Recent deployments that added, removed, or resized infrastructure resources.

## Outputs

- **Cost optimization dashboard**: Real-time view of monthly spend by team, service, and environment with trend lines and budget burn rates.
- **Monthly cost report**: PDF or wiki page showing top costs, savings achieved, overspend areas, and planned actions for the next month.
- **Reserved instance strategy**: Documented decisions on which resources to cover with RIs, instance families, term lengths, and payment options.
- **Tagging compliance score**: Monthly score (percentage of resources properly tagged) with historical trend. Target is > 95%.
- **Resource right-sizing recommendations**: Quarterly list of specific instances that should be downsized, deleted, or migrated to different purchase options.
- **Cost anomaly investigations**: For each anomaly, a root cause, cost impact, and preventative action documented in a Jira ticket.

## Rules

1. **No production resources without tags**: Every production resource must have `team`, `service`, `environment`, `cost-center`, and `owner` tags. Provisioning pipelines must reject untagged resources.
2. **Budgets must be team-specific**: Each engineering team has a dedicated monthly budget. Blast radius of cost overruns is isolated to the responsible team.
3. **Prefer horizontal scaling over vertical scaling**: Autoscale out, not up. Vertical scaling (larger instances) is allowed only when horizontal scaling is technically infeasible (e.g., stateful databases).
4. **No idle resources older than 7 days**: Scripts run daily to identify idle resources. After 7 days of idleness, the resource is automatically terminated with a warning sent to the owner.
5. **Reserved instances only for stable workloads**: If a workload's utilization fluctuates more than 30% month-over-month, do not purchase RIs. Use Savings Plans or On-Demand instead.
6. **Data transfer costs must be estimated during architecture review**: Every architecture design review must include a data transfer cost estimate. Cross-region and cross-AZ traffic is the largest hidden cost.
7. **Dev/staging environments must be shut down outside business hours**: Use instance scheduling to stop dev/staging resources at 8 PM and start at 6 AM. Weekend shutdown is mandatory.
8. **GP3 volumes are the default**: Use gp3 EBS volumes instead of gp2. gp3 provides baseline 3000 IOPS at no additional cost, compared to gp2 which requires larger volumes for higher IOPS.
9. **Use managed services where cost-effective**: Managed services (RDS, Aurora, ECS Fargate) transfer operational overhead to the cloud provider but may cost more. Evaluate tradeoff. If the team spends more than 10 hours/month managing a self-hosted service, migrate to managed.
10. **Every cost optimization must include a rollback plan**: Before changing instance types, scaling policies, or storage tiers, document how to revert in under 30 minutes if performance degrades.
11. **Tagging must be validated in CI/CD**: Terraform or CloudFormation linting rules must check for required tags. Deploy without tags must fail.
12. **No single point of cost failure**: At least two engineers per team must understand the cost structure and be able to investigate anomalies.

## Best Practices

1. **Use containerization to improve density**: Run multiple containers per ECS/EKS node to achieve higher CPU/memory utilization (target 60-70%). Lower density means wasted capacity.
2. **Leverage spot instances for fault-tolerant workloads**: For stateless, fault-tolerant, or batch workloads, use spot instances (60-90% discount). Use instance diversification and Spot Fleet to handle interruptions.
3. **Implement cost-aware auto-scaling**: Use custom metrics (request queue depth, concurrent connections) rather than just CPU. CPU-based scaling often keeps instances running at low utilization.
4. **Use S3 Intelligent Tiering for unpredictable access**: S3 Intelligent Tiering automatically moves objects between access tiers based on access patterns for a small monitoring fee. It almost always beats manual tiering.
5. **Review and remove unused load balancers**: ALB/NLB costs are based on time and LCUs. An unused ALB costs the same as a heavily used one. Eliminate orphaned load balancers.
6. **Consolidate small RDS instances**: Multiple small RDS instances (db.t3.micro for each microservice) cost more than one larger shared instance. Consider consolidation with proper resource isolation.
7. **Use CloudFront for egress cost reduction**: CloudFront egress costs ~$0.085/GB versus direct S3 egress at ~$0.09/GB. More importantly, CloudFront reduces origin load with caching, reducing compute costs.
8. **Schedule Lambda provisioned concurrency**: If Lambda has provisioned concurrency, disable it during off-hours. Provisioned concurrency costs the same whether the function is used or not.
9. **Use Compute Savings Plans for workload diversity**: If you have a mix of EC2, Fargate, and Lambda workloads, Compute Savings Plans cover all three. EC2 Savings Plans only cover EC2.
10. **Monitor storage costs per GB monthly**: Track storage cost growth rate. If it exceeds data growth rate, investigate inefficient storage usage or expensive storage tiers.
11. **Use cost allocation tags in CI/CD**: Require that every Terraform module includes a variable for `cost_center` and that it is always set before apply.
12. **Set up recurring cost reports to email**: Weekly auto-generated cost reports sent to each team's mailing list keep cost awareness high without manual reporting effort.

## Anti-patterns

1. **Saving money by disabling auto-scaling**: Disabling auto-scaling to save on instance hours is dangerous. It sacrifices availability for cost. Instead, optimize the scaling policy and use spot instances.
2. **Blindly purchasing 3-year RIs**: Long-term commitments for services that may be decommissioned or migrated. Only purchase 3-year RIs for services with a confirmed 3-year roadmap.
3. **Ignoring data transfer costs during migration**: Moving data between regions or providers without estimating the transfer cost. A one-time data migration can cost more than a year of compute.
4. **Developer VMs running 24/7**: Individual developer EC2 instances or Cloud9 environments running continuously. Enforce automatic shutdown after 8 hours of inactivity.
5. **Premature optimization of low-cost resources**: Spending engineering hours optimizing a $50/month service while a $10,000/month database goes untouched. Focus on the top 5 cost drivers.
6. **No cost consideration during architecture review**: Selecting a service, instance type, or storage tier without checking the pricing page. Cost should be a first-class architecture concern.
7. **Snapshot hoarding**: Keeping every automated snapshot forever. EBS and RDS snapshot costs accumulate quickly. Set snapshot retention to 30 days unless there is a specific compliance reason.
8. **Assuming serverless is always cheaper**: Lambda costs scale with invocation count and duration. High-throughput, long-running workloads are often cheaper on Fargate or EC2.

## Edge Cases

1. **Cost anomaly during a marketing campaign**: A planned traffic spike triggers a cost anomaly alert. The response is to acknowledge the anomaly as expected and adjust the budget alert threshold temporarily.
2. **Reserved instance expires during a migration**: If an RI is about to expire and the workload is being migrated to a new instance family, do not renew the RI. Accept On-Demand costs during the transition window.
3. **Data transfer costs between microservices in different availability zones**: Microservices in separate AZs communicate across AZ boundaries, incurring transfer costs. Redesign to colocate in the same AZ or use private link with cross-AZ traffic.
4. **A single team overspends its budget due to a bug**: An infinite loop in batch processing triggers a massive cost spike. The response is to kill the process immediately, fix the bug, and add a budget alert at the AWS account level as a safety net.
5. **Storage costs explode due to logging**: Application logs written to CloudWatch Logs or Elasticsearch with infinite retention. Add log retention policy (30 days default, 90 days max), use S3 export for long-term archival.
6. **Divergence between staging and production costs**: Staging environment mirrors production scale but serves little traffic. Use production-identical schema but smaller instance sizes, or use Aurora Serverless for staging.
7. **Unexpected egress costs from a new third-party integration**: A new API integration requires the service to fetch large datasets from an external provider, then process and return results to the client. Optimize by caching responses and reducing payload size.

## Validation Checklist

- [ ] All production resources have required tags (`team`, `service`, `environment`, `cost-center`, `owner`)
- [ ] Untagged resources are identified and remediated within 7 days
- [ ] Monthly budget is set for each team/cost-center with 50%, 80%, and 100% alerts
- [ ] Top 5 cost drivers are identified and reviewed monthly
- [ ] EC2, RDS, and other compute instances have < 30% utilization investigated for right-sizing
- [ ] Reserved Instance / Savings Plan coverage is reviewed and optimized quarterly
- [ ] Auto-scaling is enabled for all stateless compute tiers with target utilization of 60-70%
- [ ] S3/GCS lifecycle policies are configured to transition or expire objects automatically
- [ ] Dev/staging environments are scheduled to shut down outside business hours
- [ ] Idle resources (EBS volumes, load balancers, IP addresses) are cleaned up weekly
- [ ] Data transfer costs are estimated during architecture design reviews
- [ ] Cost anomaly detection is configured and alerts are responding within 24 hours
- [ ] Monthly cost optimization report is published and reviewed by engineering leadership
- [ ] A FinOps champion is appointed and actively reviewing costs
- [ ] Lambda provisioned concurrency is scheduled to reduce during off-hours
- [ ] Storage costs are tracked as a percentage of total spend
- [ ] Snapshot retention policies are in place (max 30 days unless compliance requires longer)
- [ ] Serverless vs. containerized cost tradeoffs are evaluated for each new service

## Engineering Examples

### Example 1: Reducing Cloud Costs by Right-Sizing Underutilized Instances

**Scenario**: Monthly cloud spend is $85,000. The team suspects that many EC2 instances are overprovisioned. A 30-day utilization analysis using CloudWatch metrics shows that 40% of production EC2 instances have average CPU below 10% and memory below 20%.

**Action**: The platform team runs a right-sizing analysis using AWS Compute Optimizer and exports the recommendations. For each instance: (1) If average CPU < 5% and memory < 10%, downsize two tiers (e.g., m5.xlarge -> m5.large). (2) If average CPU < 20% and memory < 30%, downsize one tier. (3) If CPU < 5% and there is no burst pattern, consider moving to a burstable instance family (t3). A total of 47 instances are downsized during a maintenance window. Each change is validated against the rollback plan — if error rates increase by > 5% after the change, the instance is restored. The results: Monthly EC2 spend drops from $42,000 to $29,000 — a $13,000/month savings (31% reduction). CPU utilization rises from 8% average to 45% average. No performance degradation is observed. The same analysis is repeated quarterly, and a script is written to automatically generate right-sizing recommendations and open Jira tickets with the estimated savings.

### Example 2: Optimizing Database Costs with Proper Instance Sizing and Storage Tiers

**Scenario**: The platform has 12 RDS PostgreSQL instances across production, staging, and analytics. Total monthly RDS cost is $18,500. Analysis reveals that two analytics databases (combined 4 TB) use provisioned IOPS (io1) storage at $0.125/GB/month, costing $500/month just in IOPS, while actual IOPS utilization is below 100 IOPS on average.

**Action**: The two analytics databases are migrated from io1 to gp3 storage. gp3 provides 3000 IOPS baseline at no extra cost, eliminating the $500/month IOPS charge. Next, the production database is right-sized from db.r5.4xlarge (16 vCPU, 128 GB) to db.r5.2xlarge (8 vCPU, 64 GB) after confirming that peak CPU never exceeds 25% and memory usage never exceeds 40 GB over 90 days. A performance test in staging confirms the smaller instance handles peak traffic at 55% CPU. The change saves $900/month. Next, two small staging databases (db.t3.small) are consolidated into a single db.t3.medium instance with separate databases and connection pools, saving $80/month plus the overhead of managing two instances. Total savings: $1,480/month (8% reduction). The unused db.t3.small instances are removed. Additionally, automated snapshots are pruned to retain only 14 days instead of 90, saving $120/month in snapshot storage. Automated checks are added to alert if any RDS instance has provisioned IOPS with utilization below 10%.

### Example 3: Implementing Auto-Scaling to Match Demand and Reduce Waste

**Scenario**: A customer-facing API service runs on a fixed fleet of 20 m5.large EC2 instances behind an ALB. During off-peak hours (midnight to 8 AM), traffic drops by 80%, but all 20 instances continue running at 3% CPU utilization. Monthly cost: $4,200.

**Action**: The service is migrated from a fixed fleet to an auto-scaling group with the following configuration: minimum 4 instances, maximum 40 instances, desired 10 instances. The scaling policy uses a custom metric — request count per target (tracked via ALB) — with a target value of 500 requests/target/minute. Scale-out happens when the metric exceeds 600 for 3 consecutive minutes. Scale-in happens when it drops below 400 for 10 consecutive minutes. Cooldown period is 120 seconds. A scheduled action reduces the minimum to 4 at 11 PM and increases it back to 10 at 6 AM. A load test is run in staging to validate that the scaling policy responds within 2 minutes. After deployment, the following results are observed: During peak hours (10 AM-4 PM), the fleet scales to 28-35 instances. During off-peak hours (1 AM-5 AM), it runs at 4 instances. Average CPU utilization increases from 12% to 58%. Monthly cost drops from $4,200 to $1,340 — a 68% reduction ($2,860/month). The auto-scaling group is also configured with a mix of On-Demand and Spot instances (70% Spot, 30% On-Demand) using instance diversification across m5.large, m5a.large, and m6i.large to reduce the impact of Spot interruptions. This adds an additional 20% savings on the compute portion. Total savings across the year: $34,320. The template is published as a reference architecture for other API services in the organization.

