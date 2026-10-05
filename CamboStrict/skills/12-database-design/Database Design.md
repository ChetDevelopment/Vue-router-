# Database Design

## Purpose

Define a comprehensive framework for database design that produces schemas optimized for data integrity, query performance, operational efficiency, and long-term maintainability. This skill covers the full spectrum of database design decisions from schema normalization and indexing strategies to migration planning and sharding considerations, ensuring that data storage choices align with application access patterns and business requirements.

## Responsibilities

- Design normalized schemas that eliminate data redundancy while supporting query patterns through strategic denormalization where justified by performance requirements
- Develop indexing strategies that accelerate critical query paths without imposing unnecessary write overhead or storage cost
- Analyze query patterns and optimize schema and indexes accordingly, using query execution plans to validate design decisions
- Select appropriate data types for every column, balancing storage efficiency with application requirements
- Define constraints (primary keys, foreign keys, unique constraints, check constraints) that enforce data integrity at the database level
- Model relationships (one-to-one, one-to-many, many-to-many) with appropriate join tables or denormalized structures
- Plan and execute database migrations that support zero-downtime deployment and rollback capabilities
- Design read/write separation strategies, including read replicas and CQRS patterns, to handle traffic growth

## Decision Process

1. Analyze the application's data access patterns by reviewing the most frequent and critical queries. Identify which queries need to be fast and which data relationships are accessed together. This analysis drives both the schema design and indexing strategy.

2. Create a logical data model representing entities, attributes, and relationships without considering physical storage concerns. Apply normalization to at least Third Normal Form (3NF) to eliminate duplicate data and prevent update anomalies.

3. Evaluate the logical model against query patterns. Identify cases where normalization would require joining many tables for frequently accessed queries. Make conscious decisions to denormalize where the performance benefit justifies the data redundancy cost.

4. Select appropriate data types for each column. Use the smallest data type that can accommodate the expected data range. For example, use `INT` for integer IDs, `BIGINT` only when exceeding 2 billion rows. Use `VARCHAR(n)` with explicit length limits, never unbounded `VARCHAR`.

5. Define constraints for every table. Every table must have a primary key. Foreign key constraints must enforce referential integrity. Unique constraints must prevent duplicate data where business rules require uniqueness. Check constraints must enforce domain-specific data validation.

6. Design the indexing strategy starting with the primary key (clustered index in most RDBMS). Add indexes for foreign key columns used in joins. Add indexes for columns used in `WHERE`, `ORDER BY`, and `GROUP BY` clauses in critical queries. Create composite indexes that match the column order of query predicates exactly.

7. Analyze query execution plans for the top 10 most critical or most frequent queries. Verify that indexes are being used effectively. Look for table scans, key lookups, and sort operations that could be optimized with better indexing.

8. Plan the migration strategy considering how schema changes will be applied to production. Each migration must be reversible. Migrations must support incremental deployment with backward compatibility. Avoid migrations that require table locking on large tables in production environments.

9. Determine the scaling strategy based on read/write ratio, data volume growth, and latency requirements. Evaluate read replicas for read-heavy workloads, sharding for write-heavy workloads, and caching layers for hot data.

10. Document the database design decisions including schema diagrams, index justifications, data type choices, and migration plans. Every denormalization, every unusual index, and every deviation from convention must have a documented rationale.

## Inputs

- Application domain model defining entities, relationships, and business rules
- Query patterns from application code review and performance profiling
- Data volume estimates including current size and projected growth over 12, 24, and 36 months
- Performance requirements including query latency SLAs and throughput targets
- Compliance and data retention requirements (GDPR, HIPAA, SOC2, PCI-DSS)
- Infrastructure constraints including storage type (SSD/HDD), memory, IOPS, and network bandwidth
- Team operational capabilities for database administration and migration execution

## Outputs

- Entity-Relationship Diagram (ERD) showing tables, columns, relationships, and cardinalities
- Data dictionary documenting every table, column, data type, constraint, and purpose
- Index specification including index type (B-tree, Hash, GiST, GIN), columns, and covering columns
- Query execution plan analysis for critical queries with optimization recommendations
- Migration scripts (both forward and rollback) following a zero-downtime deployment pattern
- Scaling plan including read replica configuration, sharding key selection, or CQRS design
- Database backup and recovery strategy including RPO and RTO targets

## Rules

1. Every table must have a primary key. Natural keys are preferred when stable and unique. Surrogate keys (auto-increment or UUID) are acceptable when natural keys are unavailable, composite, or change over time.
2. Foreign key constraints must be defined at the database level. Application-level referential integrity is insufficient because it can be bypassed by direct database access, batch operations, and data migration scripts.
3. Every column must have an explicitly defined data type with appropriate length limits. Avoid `TEXT`, `VARCHAR(max)`, or `NVARCHAR(max)` without length constraints. Unbounded types prevent the database from optimizing storage and indexing.
4. Indexes must be justified by query patterns. Do not index every column "just in case." Each index adds write overhead (slower INSERT/UPDATE/DELETE) and consumes storage. Unused indexes must be removed.
5. Composite indexes must match the column order in query predicates. An index on `(country, status, created_at)` will not be effective for a query filtering on `status` alone unless `status` is the leading column.
6. All schema changes must be applied through version-controlled migration scripts. Direct `ALTER TABLE` statements in production are prohibited. Every migration must have a corresponding rollback script.
7. Migrations must be backward-compatible with the current application version. A migration must not remove or rename columns that the currently deployed application reads. Use a multi-phase migration pattern: add new column → deploy app update → remove old column.
8. NULL handling must be explicit for every column. Specify `NOT NULL` with a default value when possible. Columns that allow NULL require special handling in queries, indexes, and application code. NULL ambiguity leads to bugs.
9. Soft deletes are prohibited unless there is an explicit audit or recovery requirement. Use a `deleted_at` column only when the application needs to recover deleted records and when the query layer consistently filters out soft-deleted records.
10. Database credentials and connection strings must never be hard-coded in application code. Use environment variables, secrets management services, or database connection brokers.

## Best Practices

1. Use UUIDs for primary keys in distributed systems to avoid auto-increment contention and enable offline entity creation. For single-server deployments, auto-increment integer keys are more efficient for both storage and indexing.
2. Create indexes on foreign key columns by default because they are used in JOIN operations. Most query performance problems originate from missing indexes on foreign key columns in large tables.
3. Use partial indexes for queries that target a subset of rows. `CREATE INDEX idx_active_users ON users(status) WHERE status = 'active'` creates a smaller, more efficient index when most users are inactive.
4. Covering indexes can eliminate table access entirely. Include all columns referenced in the query in the index definition to enable index-only scans. This is particularly effective for read-heavy workloads.
5. Use `EXPLAIN ANALYZE` (PostgreSQL) or `SET STATISTICS TIME ON` (SQL Server) to validate query performance before deploying schema or query changes. Never deploy a schema change without reviewing the execution plan impact.
6. Partition large tables by date or natural range to improve query performance and enable partition-level operations (e.g., dropping old partitions instead of expensive `DELETE`). Partition tables exceeding 10 million rows or 100 GB.
7. Implement connection pooling at the application or middleware layer. Connection creation is expensive. Pool connections with a maximum size that matches database connection limits and thread pool capacity.
8. Use database migration tools (Flyway, Liquibase, Alembic) that track which migrations have been applied. Manual migration execution is error-prone and does not support team collaboration or CI/CD integration.
9. Monitor and index-based on actual query performance, not assumed patterns. Use slow query logs, database monitoring tools, and periodic query performance reviews to identify missing or unused indexes.
10. Archive or purge historical data according to retention policies. Tables that accumulate data indefinitely degrade query performance and increase backup/recovery times. Implement data lifecycle management from the beginning.

## Anti-patterns

1. **Index everything**: Creating indexes on every column "just in case" they might be needed. This doubles or triples write time, consumes significant storage, and confuses the query optimizer. Index only what queries actually need.
2. **Generic column names**: Using `column1`, `attribute2`, or `data` as column names. Column names must be descriptive of the data they contain. Generic names require constant cross-referencing with documentation and produce unreadable queries.
3. **EAV (Entity-Attribute-Value) misuse**: Using a generic EAV schema where normal columns would work. EAV makes queries complex, indexing nearly impossible, and data integrity enforcement impractical. EAV is justified only for truly dynamic attributes.
4. **One table for everything**: A single massive table with nullable columns for all entity types, instead of normalized tables. This violates first normal form, wastes storage, complicates constraints, and makes query optimization impossible.
5. **No foreign key constraints**: Relying on application code to maintain referential integrity. Application bugs, data migration scripts, and direct database access will inevitably produce orphaned records. Foreign keys are the database's job.
6. **Over-normalization**: Splitting data into dozens of tiny tables to achieve 5NF or 6NF when queries require constant 15-table joins. Normalization serves data integrity; when it harms query performance without measurable integrity benefit, denormalize.

## Edge Cases

1. **Multi-tenancy isolation**: A database serving multiple tenants must ensure complete data isolation. Choose between dedicated databases (strongest isolation, highest cost), shared database with schema per tenant (medium isolation, medium cost), or shared database with tenant discriminator column (weakest isolation, lowest cost). Document the isolation guarantees and compliance implications.
2. **Soft delete with unique constraints**: A `deleted_at` column combined with a unique constraint on another column will conflict when a record is deleted and replaced. Remove the deleted record from the constraint by using a partial unique index: `CREATE UNIQUE INDEX idx_unique_active ON users(email) WHERE deleted_at IS NULL`.
3. **Time zone handling**: Store timestamps in UTC in the database using `TIMESTAMP WITH TIME ZONE` (PostgreSQL) or `datetime2` (SQL Server). Convert to local time in the application layer. Never store time zone offsets in timestamp columns.
4. **Large object storage**: Files, images, and binary data should not be stored in the database unless there is a specific transactional consistency requirement. Store large objects in object storage (S3, Azure Blob) and store the reference URL in the database.
5. **Schema migration on large tables**: Adding a column with a default value to a table with 100 million rows can lock the table for hours. Use database-specific features for online schema changes (pgroll, gh-ost, or adding a nullable column first and backfilling in batches).
6. **Deadlocks in high-concurrency workloads**: Concurrent transactions updating the same rows in different orders will deadlock. Enforce consistent access order in application code (e.g., always update accounts in ascending ID order) to prevent deadlocks.

## Validation Checklist

- [ ] Every table has a primary key and is in at least 3NF (unless documented denormalization)
- [ ] All columns have explicit data types with length limits
- [ ] Foreign key constraints are defined for all relationships
- [ ] Indexes exist for all foreign key columns used in joins
- [ ] Indexes exist for columns in critical query WHERE, ORDER BY, and GROUP BY clauses
- [ ] Query execution plans show index usage (no table scans) for critical queries
- [ ] No unused indexes identified through monitoring or index usage statistics
- [ ] All migrations are version-controlled with forward and rollback scripts
- [ ] Migrations are backward-compatible with the currently deployed application version
- [ ] Connection pooling is configured with appropriate min/max pool sizes
- [ ] Database backup strategy is documented with RPO and RTO targets
- [ ] Data retention and archiving policy is defined and implemented

## Engineering Examples

### Example 1: Designing a Schema for a Social Feed

A social media application needed a database schema for a user feed that shows posts from followed users, sorted by recency, with likes and comments counts.

**Schema design:**

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts table (normalized for write efficiency)
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);

-- Follows table for many-to-many relationship
CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id),
    followee_id UUID NOT NULL REFERENCES users(id),
    followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX idx_follows_follower ON follows(follower_id);

-- Likes with unique constraint to prevent duplicates
CREATE TABLE likes (
    user_id UUID NOT NULL REFERENCES users(id),
    post_id UUID NOT NULL REFERENCES posts(id),
    liked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX idx_likes_post ON likes(post_id);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id),
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at);
```

**Query optimization:** The feed query for a user's timeline was:
```sql
SELECT p.id, p.content, p.created_at,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
FROM posts p
JOIN follows f ON f.followee_id = p.author_id
WHERE f.follower_id = $1
ORDER BY p.created_at DESC
LIMIT 50;
```

To optimize this query, the team added a covering index on `follows(follower_id, followee_id)` and ensured `posts.created_at` was indexed. When the feed grew to 10 million posts, the query took 800ms. The team implemented a fan-out-on-write approach: when a user creates a post, it is written to a Redis sorted set for each follower's timeline. The database remained the system of record, while Redis served the hot read path with 5ms latency.

### Example 2: Optimizing a Slow Query with Proper Indexing

An e-commerce reporting query was timing out after 30 seconds:
```sql
SELECT p.category_id,
       COUNT(DISTINCT o.id) AS order_count,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM products p
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE o.created_at BETWEEN '2024-01-01' AND '2024-03-31'
  AND o.status IN ('shipped', 'delivered')
GROUP BY p.category_id
ORDER BY revenue DESC;
```

**Analysis:** The execution plan showed a full table scan on `orders` (5 million rows) and a hash join requiring a large memory grant. No indexes supported the filtering on `created_at` and `status`.

**Solution:** A composite index was created on `orders`:
```sql
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
```

This index exactly matched the query's WHERE clause, enabling an index seek rather than a table scan. Additionally, a covering index was created on `order_items`:
```sql
CREATE INDEX idx_order_items_product_revenue ON order_items(product_id, quantity, unit_price) INCLUDE (order_id);
```

The execution plan changed from a full table scan and hash join to three index seeks with a merge join. Query time dropped from 30 seconds to 180ms. The index was also used by other reporting queries filtering on `status` and `created_at`, justifying its maintenance overhead.

### Example 3: Choosing Between Normalized and Denormalized for a Reporting System

A business intelligence system needed to store sales transactions for reporting. The team evaluated two approaches:

**Normalized approach (3NF):**
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    store_id UUID REFERENCES stores(id),
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(5,2),
    transaction_date DATE NOT NULL
);
-- Requires JOINs to get customer name, store name, product name
```

**Denormalized approach:**
```sql
CREATE TABLE sales_facts (
    id UUID PRIMARY KEY,
    customer_id UUID,
    customer_name VARCHAR(100),
    customer_segment VARCHAR(50),
    store_id UUID,
    store_name VARCHAR(100),
    store_region VARCHAR(50),
    product_id UUID,
    product_name VARCHAR(200),
    product_category VARCHAR(100),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(5,2),
    net_revenue DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price - discount) STORED,
    transaction_date DATE NOT NULL
);
```

**Decision:** The team chose a hybrid approach. The operational system maintained normalized tables for transactional integrity. A nightly ETL process populated denormalized `sales_facts` in a separate reporting schema optimized for analytical queries. The denormalized table was indexed on `transaction_date`, `store_region`, and `product_category` to support the most common reporting queries (sales by region, sales by category, trend analysis).

The denormalized approach sacrificed storage efficiency (20% more storage due to duplicated names) but enabled reporting queries that previously required 8-table joins to execute as single-table scans. Query time dropped from 15 seconds to 300ms for the most common reports. The ETL process handled denormalization in the background, and the nightly refresh meant reports were at most 24 hours stale, which was acceptable for the business.
