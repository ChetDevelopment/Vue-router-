# Database Migration & Seeding

## Purpose

Define a rigorous, safe, and repeatable approach to managing database schema changes and seed data across development, staging, and production environments. This skill covers migration tools and patterns (forward-only migrations, zero-downtime expand-contract, backward-compatible changes), rollback strategies, data migrations versus schema migrations, seed data for development, test data factories, migration testing in CI, and migration idempotency.

## Responsibilities

- Selecting and configuring a migration tool appropriate for the database (Alembic for PostgreSQL, Flyway for SQL-first, Prisma Migrate for ORM-based, TypeORM migrations).
- Writing forward-only migrations that are idempotent, backward-compatible, and reversible.
- Designing zero-downtime migration patterns (expand-contract, expand-migrate-contract) for production schema changes.
- Implementing safe rollback strategies that can revert schema changes without data loss.
- Distinguishing between schema migrations (table structure changes) and data migrations (backfilling, transforming existing data).
- Creating seed data for development environments that exercise all application states.
- Building test data factories for integration and end-to-end tests.
- Integrating migration execution into CI/CD pipelines with automated verification.
- Ensuring migration idempotency: running the same migration multiple times must produce the same result.
- Auditing migration history: which migrations have been applied, when, and by whom.

## Decision Process

1. **Select a migration tool based on the project's stack and requirements.** For raw SQL control, use Flyway or Alembic. For ORM-integrated tools, use Prisma Migrate, TypeORM Migrations, or Django Migrations. The tool must support versioned migration files with a tracking table.
2. **Decide between forward-only and reversible migrations.** Forward-only is simpler and safer: once a migration is applied, it stays applied. Reversible migrations (`down` scripts) are only needed when rapid rollback is critical. Prefer forward-only with a separate rollback migration over `down` scripts.
3. **Design the schema change strategy.** For simple, non-blocking changes (adding nullable columns, creating indexes), use direct ALTER statements. For complex changes (column renames, data type changes, table splits), use the expand-contract pattern with backward-compatible intermediate states.
4. **Write migration with idempotency checks.** Before adding a column, check if it exists (`IF NOT EXISTS` or equivalent). Before creating an index, check if it exists. Migrations must succeed even if partially applied due to a previous failure.
5. **Separate schema migrations from data migrations.** Schema migrations run first, then data migrations. Data migrations should be in separate files with a clear naming convention (e.g., `20240715_backfill_user_status.py`). Data migrations must be idempotent (upsert, not insert).
6. **Design seed data for development.** Seeds must create a consistent baseline: admin user, sample data for each entity type, edge case records (null fields, boundary values). Seeds must be runnable multiple times without duplication.
7. **Build test data factories.** Use Factory Bot (Ruby), Factory Boy (Python), or a custom factory pattern to generate test data with randomized but valid attributes. Factories should produce data for unit tests, not seed data.
8. **Integrate migrations into the CI/CD pipeline.** Migrations run as a pre-deployment step. The pipeline must verify that all migrations are up and that the database schema matches the expected version. Fail the pipeline if migrations fail.
9. **Test migrations against a copy of production data.** In staging, restore an anonymized production snapshot, apply migrations, and run test suites. This catches migration performance issues and data compatibility problems.
10. **Audit migration history.** The migration tracking table (e.g., `alembic_version`, `flyway_schema_history`) must record migration name, checksum, applied timestamp, and execution time. Monitor for unexpected rollbacks or reapplied migrations.

## Inputs

- Database schema as it currently exists in production.
- Proposed schema changes defined through ORM entity changes or SQL DDL files.
- Application code that reads/writes the database with current schema expectations.
- Performance characteristics of the production database (table sizes, write throughput, index usage).
- Business requirements for uptime (acceptable downtime window, if any).
- Development and staging database instances for testing migrations.

## Outputs

- Migration files with sequential naming (e.g., `001_add_users_table.sql`, `002_create_orders_table.sql`).
- A migration tracking table in each database recording applied migrations.
- Seed data scripts creating consistent baseline data for development environments.
- Test data factory definitions or libraries for integration tests.
- A migration test suite that verifies migrations are idempotent, backward-compatible, and reversible.
- CI/CD pipeline stage definitions for running and verifying migrations.
- A migration runbook documenting how to apply, verify, and roll back migrations.

## Rules

1. **Every migration must be idempotent.** Running the migration twice must produce the same result as running it once. Use `IF NOT EXISTS`, `CREATE OR REPLACE`, and upsert patterns. Never assume the database is in a specific state.
2. **Never delete a column or table without a two-phase deprecation.** Phase 1: Mark the column as deprecated (documentation, stop writing to it). Phase 2: After confirming no reads, drop it in a separate migration (at least one release cycle later).
3. **Schema migrations and data migrations must be in separate files.** A single migration should do one thing: either change the schema or transform data. This allows independent rollback and reverification.
4. **All migrations must be reviewed in the same PR as the code that uses the new schema.** The code and the migration that supports it must be merged together. Never deploy a migration without the corresponding application code.
5. **Migrations must not lock production tables for extended periods.** Use `CONCURRENTLY` for index creation. Use `SET lock_timeout` for ALTER statements. Use online schema change tools (gh-ost, pt-online-schema-change) for large tables.
6. **Seed data must be runnable multiple times without creating duplicates.** Use `ON CONFLICT DO NOTHING` or upsert patterns. Seed scripts should start with a truncation or should check if data already exists.
7. **Test data factories must produce valid data by default.** Every required field must have a sensible default. Factories should accept overrides for specific test scenarios.
8. **Migration files must never be modified after they are merged.** If a migration has a bug, create a new migration that fixes the issue. Modifying an existing migration that has already been applied in any environment breaks the migration chain.
9. **The development database must be reset using migrations, not by loading a production snapshot.** Developers should run `migrate:latest` to get the latest schema. Loading a snapshot bypasses migration history and can mask migration bugs.
10. **Every migration must have a corresponding rollback plan, even if not a full down migration.** Document the rollback procedure in the migration file header or a runbook. For expand-contract migrations, the contract phase is the rollback.

## Best Practices

1. **Use a naming convention for migration files.** Format: `YYYYMMDDHHMMSS_description_of_change.sql` (timestamp-based) or `V1__description.sql` (version-based). Timestamp-based avoids merge conflicts in large teams.
2. **Wrap data migrations in transactions.** For data transformations (backfilling, denormalizing), use explicit transaction blocks. Commit in batches (e.g., 1000 rows at a time) for large tables to avoid long-running transactions.
3. **Test migrations against a production-sized dataset.** Create a staging database that mirrors production data volume. Time the migration execution. If a migration takes longer than the deployment window, split it into multiple phases.
4. **Use `EXPLAIN ANALYZE` on data migration queries before running in production.** A query that runs in 100ms on a 1000-row table can take 10 minutes on a 10-million-row table. Optimize early.
5. **Generate migrations from ORM entity changes.** Tools like Alembic's `--autogenerate` and Prisma's `prisma migrate dev` can detect schema changes from entity definitions. Always review auto-generated migrations before applying.
6. **Version-control seed data scripts.** Seed data should be in the repository, not manually created in each environment. Use different seed scripts for different scenarios (minimal, full, with-edge-cases).
7. **Use database triggers or application listeners for real-time data migrations.** Instead of a one-time backfill, consider a trigger that populates a new column on INSERT/UPDATE, then backfill existing rows.
8. **Run migrations in a CI pipeline against a fresh database.** Create a temporary database, apply all migrations, run the test suite, then destroy the database. This is the only way to ensure migrations are correct from scratch.
9. **Lock the migration tool version.** Pin the migration library version in package.json or requirements.txt. Migration tools occasionally change behavior in minor versions.
10. **Monitor migration execution time in CI.** If a migration's CI execution time increases significantly, it may indicate a schema change that will be slow in production. Investigate before deploying.

## Anti-patterns

1. **Editing an existing migration that has already been applied to production.** This breaks the migration chain and makes it impossible to reproduce the database state. Always create a new migration to fix issues.
2. **Creating a migration that runs application code.** Migrations should use SQL, not ORM models. ORM models change over time; a migration that references a model that no longer exists will fail.
3. **Dropping a column in the same migration that stops writing to it.** Application code that still reads the column will break. Follow the two-phase deprecation: stop writing, then drop in a later release.
4. **Running data migrations as part of the schema migration.** If a data migration fails, the schema change is already applied, leaving the database in an inconsistent state. Keep them separate.
5. **Using `DELETE` instead of `SOFT DELETE` for data migration rollback.** If a data migration incorrectly removes rows, they are gone. Use soft deletes or backup the affected rows before transformation.
6. **Ignoring migration order in a distributed team.** Two developers creating migrations at the same time can result in merge conflicts or out-of-order migration files. Use timestamp-based naming and a CI check that validates migration order.
7. **Running seeds on production.** Seed data is for development and testing only. Never running seeding scripts against production. Use data migrations for production data changes.

## Edge Cases

1. **Concurrent index creation blocking writes.** Using `CREATE INDEX CONCURRENTLY` avoids locking the table for writes, but it requires more time and must be run outside a transaction. Ensure the migration tool supports non-transactional statements.
2. **NOT NULL columns added to existing tables.** Adding a `NOT NULL` column to a table with existing rows requires a default value. For zero-downtime, add the column as nullable first, backfill data, then add the NOT NULL constraint in a separate migration.
3. **Foreign key constraints causing migration failure.** Adding a foreign key constraint fails if existing rows violate referential integrity. Validate data before adding constraints. Use `NOT VALID` to add the constraint without checking existing rows, then validate later.
4. **Large table ALTER TABLE exceeding lock timeout.** On MySQL, an ALTER TABLE rebuilds the table and locks writes. Use online schema change tools (gh-ost, pt-osc) for tables over 10 GB or use PostgreSQL which can add columns without rewriting the table.
5. **Migration tool mismatch with database version.** Prisma Migrate 5.x requires PostgreSQL 12+. Using an older PostgreSQL version can cause cryptic errors. Verify tool compatibility with the target database version.
6. **Encrypted or hashed columns in data migrations.** If a data migration needs to transform data in an encrypted column, the transformation must happen at the application layer, not in SQL. This requires a separate migration script that reads, decrypts, transforms, and re-encrypts.

## Validation Checklist

- [ ] Migration files are timestamped or versioned, not edited after being applied to any environment.
- [ ] Migration is idempotent: running it twice produces the same result.
- [ ] Schema and data migrations are in separate files.
- [ ] Migration does not drop columns or tables without a two-phase deprecation.
- [ ] Migration does not lock large tables for extended periods.
- [ ] Migration is tested against a production-sized dataset in staging.
- [ ] Migration rollback plan is documented in the migration file header.
- [ ] Seed data scripts are idempotent and safe to run multiple times.
- [ ] Test data factories produce valid data by default and accept overrides.
- [ ] CI pipeline runs migrations against a fresh database and runs the test suite.
- [ ] Migration tracking table (`alembic_version`, `flyway_schema_history`) is present.
- [ ] Migration execution time is monitored and alerted on regressions.
- [ ] Migration tool version is pinned in dependency management.
- [ ] PR includes both migration and the application code that uses the new schema.
- [ ] Data migrations use batch processing for large datasets.

## Engineering Examples

### Example 1: Zero-Downtime Column Rename with Expand-Contract

Renaming a column `user_name` to `username` in a PostgreSQL table with 5 million rows, without downtime.

Phase 1 — Expand (release 1):
```sql
-- Add the new column as nullable
ALTER TABLE users ADD COLUMN username VARCHAR(255);

-- Create a trigger to keep both columns in sync
CREATE OR REPLACE FUNCTION sync_username()
RETURNS TRIGGER AS $$
BEGIN
    NEW.username := COALESCE(NEW.username, NEW.user_name);
    NEW.user_name := COALESCE(NEW.user_name, NEW.username);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_username
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION sync_username();

-- Backfill existing rows (batch in application code for production)
UPDATE users SET username = user_name WHERE username IS NULL;
```

Application changes in release 1:
- Write to both `user_name` and `username`.
- Read from `username` with fallback to `user_name`.
- All queries use `username` when possible, `user_name` for backward compatibility.

Phase 2 — Migrate (release 2):
```sql
-- Ensure all rows have username populated
UPDATE users SET username = user_name WHERE username IS NULL;

-- Add NOT NULL constraint
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
```

Application changes in release 2:
- Remove all reads from `user_name`.
- Write only to `username`.

Phase 3 — Contract (release 3):
```sql
-- Drop the trigger
DROP TRIGGER IF EXISTS trg_sync_username ON users;

-- Drop the old column
ALTER TABLE users DROP COLUMN user_name;
```

Application changes in release 3:
- Remove `user_name` from all code.
- Remove the sync trigger logic.

### Example 2: Seed Data Factories for Integration Tests

Using Factory Boy (Python) for a Django REST API:

```python
import factory
from datetime import datetime, timedelta
from myapp.models import User, Order, Product, OrderStatus
import random

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f'user{n}@example.com')
    name = factory.Faker('name')
    is_active = True
    role = 'customer'
    created_at = factory.LazyFunction(datetime.now)

class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    sku = factory.Sequence(lambda n: f'SKU-{n:05d}')
    name = factory.Faker('word')
    price = factory.Faker('pydecimal', left_digits=3, right_digits=2, positive=True)
    stock = factory.Faker('random_int', min=0, max=1000)

class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    user = factory.SubFactory(UserFactory)
    status = factory.Iterator([s for s in OrderStatus.values])
    total = factory.Faker('pydecimal', left_digits=4, right_digits=2, positive=True)
    created_at = factory.LazyFunction(datetime.now)

    @factory.post_generation
    def products(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for product in extracted:
                self.products.add(product)
        else:
            self.products.add(ProductFactory())

# Usage in integration tests
def test_order_total_calculation():
    user = UserFactory()
    products = [ProductFactory(price=10.00), ProductFactory(price=20.00)]
    order = OrderFactory(user=user, products=products)
    assert order.total == 30.00

def test_inactive_user_cannot_checkout():
    user = UserFactory(is_active=False)
    with pytest.raises(PermissionError):
        checkout(user)
```

### Example 3: Data Backfill Migration for Existing Records

Backfilling a `search_vector` column for full-text search on an `articles` table with 2 million rows.

```sql
-- Migration: 20240715_backfill_article_search_vector.sql
-- Purpose: Populate the search_vector column for existing articles
-- Method: Batch update in application code (for large datasets)
-- Rollback: N/A (forward-only, idempotent)

-- Step 1: Create the tsvector column if it doesn't exist
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Step 2: Create an index for full-text search (concurrently to avoid locks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_search_vector
    ON articles USING GIN(search_vector);
```

Application code for the backfill:
```python
import psycopg2
from datetime import datetime

BATCH_SIZE = 1000

def backfill_search_vectors(conn):
    cursor = conn.cursor()
    last_id = 0

    while True:
        cursor.execute("""
            SELECT id, title, body
            FROM articles
            WHERE id > %s AND search_vector IS NULL
            ORDER BY id
            LIMIT %s
            FOR UPDATE SKIP LOCKED
        """, (last_id, BATCH_SIZE))

        rows = cursor.fetchall()
        if not rows:
            break

        for article_id, title, body in rows:
            cursor.execute("""
                UPDATE articles
                SET search_vector = to_tsvector('english', COALESCE(%s, '') || ' ' || COALESCE(%s, ''))
                WHERE id = %s
            """, (title, body, article_id))

        conn.commit()
        last_id = rows[-1][0]
        print(f"Processed up to article ID {last_id}")

    cursor.close()
```

This migration processes 1000 rows per transaction, uses `SKIP LOCKED` to avoid contention with concurrent writes, and updates only rows where `search_vector IS NULL` (idempotent).
