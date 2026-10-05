# Data Modeling

## Purpose
Data modeling establishes a structured representation of business entities, their attributes, and the relationships between them. A rigorous data model serves as the foundation for database schema design, API contracts, data integrity enforcement, and application logic. The purpose is to capture the domain's invariants — rules that must always hold true — in a precise, unambiguous form that developers, database administrators, and product managers can all understand. Good data modeling prevents data corruption, simplifies querying, and reduces the cost of future schema changes.

## Responsibilities
1. **Entity Identification** — Identify the core domain entities (users, orders, products, invoices) and differentiate them from value objects (addresses, monetary amounts) that do not have independent identity.
2. **Relationship Mapping** — Define how entities relate to each other (one-to-one, one-to-many, many-to-many) and document the cardinality constraints and optionality (required vs. optional).
3. **Constraint Definition** — Encode business invariants as database constraints (NOT NULL, UNIQUE, CHECK, FOREIGN KEY) so that the database enforces correctness even if application code has bugs.
4. **Data Type Selection** — Choose the most precise data type for each attribute: use <code>timestamptz</code> not <code>varchar</code> for times, use <code>numeric(12,4)</code> not <code>float</code> for money, use <code>uuid</code> not auto-increment for globally unique identifiers.
5. **Temporal Modeling** — Design for how data changes over time: implement <code>valid_from</code>/<code>valid_to</code> columns for slowly changing dimensions, <code>created_at</code>/<code>updated_at</code> for audit trails, and <code>deleted_at</code> for soft deletes.
6. **Normalization Decisions** — Normalize to at least Third Normal Form (3NF) by default, then selectively denormalize only when query performance measurements justify the redundancy cost.
7. **Access Pattern Planning** — Model the data based on how it will be read and written, not on how the UI mockups look. A model optimized for write-heavy workloads may differ significantly from one optimized for complex analytical queries.
8. **Documentation & Communication** — Maintain an entity-relationship diagram and a data dictionary that defines every table, column, data type, constraint, and its business meaning.

## Decision Process
1. **Identify all entities from the business domain.** Interview stakeholders and read product specifications to list every noun that the system must track (User, Organization, Invoice, Payment, Subscription). Distinguish between entities (have identity and lifecycle) and value objects (immutable, interchangeable by value).
2. **Define attributes for each entity.** For each entity, list the atomic attributes. Do not include computed or derivable attributes (e.g., <code>full_name</code> when <code>first_name</code> and <code>last_name</code> exist). Do include foreign key references to other entities.
3. **Determine relationships and cardinality.** For each pair of entities, decide if the relationship is one-to-one, one-to-many, or many-to-many. Document optionality: is the relationship required or optional (e.g., an Order must have a Customer, but a Customer may have zero Orders).
4. **Choose primary keys.** Prefer natural keys (e.g., ISO country code) when they exist and are stable. Otherwise, use surrogate UUIDs. Avoid auto-increment integers for distributed systems or when IDs must be generated before insert.
5. **Apply normalization.** Ensure every non-key column depends on "the key, the whole key, and nothing but the key." Decompose tables until 3NF is reached. Resist premature denormalization.
6. **Add constraints for every invariant.** Translate business rules into database constraints. "An email must be unique" → UNIQUE. "An invoice total must be positive" → CHECK (total > 0). "A user must belong to an organization" → NOT NULL foreign key.
7. **Design for temporal requirements.** If the business needs to query historical states ("what was the price of this product last month"), add valid-time columns. If the business needs an audit trail of all changes, add an audit log table (not just <code>updated_at</code>).
8. **Review with the team and domain experts.** Walk through the model with a DBA, a backend engineer, and a product manager. Check that every column name is understood the same way by all parties. Revise before writing DDL.

## Inputs
- **Product requirements and user stories** that describe what the system must track and what queries it must support.
- **Domain expert knowledge** from product managers, business analysts, and customers about the semantics of data and the rules that govern it.
- **Existing database schemas** if this is a migration or extension of a legacy system.
- **API contracts** (GraphQL schema, REST endpoint specifications) that define what data clients need to send and receive.
- **Regulatory requirements** (GDPR, HIPAA, PCI-DSS) that impose data retention, deletion, and access constraints.

## Outputs
- **Entity-Relationship Diagram (ERD)** — A visual representation of entities, attributes, and relationships with cardinality and optionality annotations.
- **Data dictionary** — A table listing every column across all tables with its name, data type, constraints, default value, and business definition.
- **DDL scripts** — Database-specific SQL that creates tables, indexes, constraints, and triggers. Version-controlled alongside application code.
- **Migration plan** — If modifying an existing schema, a step-by-step plan for transforming the current schema to the target schema without data loss or extended downtime.
- **Validation rules** — Documentation of business invariants that cannot be expressed as database constraints (e.g., "a subscription cannot be downgraded within 30 days of a previous downgrade") and must be enforced in application code.

## Rules
1. **Every column must be the most precise type.** Store timestamps as <code>timestamptz</code> (not <code>varchar</code>), monetary values as <code>numeric</code> (not <code>float</code>), and booleans as <code>boolean</code> (not <code>integer</code> or <code>char(1)</code>).
2. **Every table must have a primary key.** There are no exceptions. Composite primary keys are acceptable when they represent a natural relationship (e.g., a junction table). Prefer <code>uuid</code> over auto-increment for distributed systems.
3. **Use soft deletes only when there is a compliance or recovery requirement.** Otherwise, use hard deletes. Soft deletes add complexity to every query (<code>WHERE deleted_at IS NULL</code>) and accumulate dead rows.
4. **Do not use polymorphic associations.** A <code>foreign_key</code> column that can reference one of several tables (e.g., <code>source_type = 'User' | 'Organization'</code>) loses referential integrity enforcement. Use separate join tables or table inheritance instead.
5. **Every non-key column must depend on the entire key.** In a table with a composite key, ensure each column relates to all parts of the key, not just one. If a column depends on only part of the key, move it to another table.
6. **Do not store computed data unless performance requires it.** Derived columns (e.g., <code>order_total</code> computed from line items) must be updated when source data changes. If you do store computed data, document the staleness tolerance and refresh mechanism.
7. **Treat <code>NULL</code>s carefully.** A NULL in a <code>discount_percent</code> column could mean "no discount" or "discount not yet calculated." Avoid ambiguous NULLs by using separate boolean flags or sentinel values where semantics differ.
8. **Index foreign key columns by default.** Foreign keys are used in JOINs and in cascade operations. Without an index, deletes on the parent table can cause table scans on the child table.

## Best Practices
1. **Model in the application layer first, then generate DDL.** Use an ORM or schema-as-code tool (Prisma, TypeORM, SQLAlchemy) to define the model in code, then generate migrations. This keeps the schema in sync with the application.
2. **Name everything consistently.** Use <code>snake_case</code> for table and column names. Table names are plural (<code>users</code>, <code>orders</code>). Junction tables combine both table names (<code>users_organizations</code>). Foreign key columns are <code>singular_table_id</code>.
3. **Add <code>created_at</code> and <code>updated_at</code> to every table.** These columns are invaluable for debugging, auditing, and data analysis. Use database defaults (<code>NOW()</code>) and triggers if possible to avoid relying on application code.
4. **Validate the model with realistic query patterns.** Before finalizing, write the five most important queries the system will run. If those queries require five JOINs across tables that could be collapsed, consider denormalization or a materialized view.
5. **Use ENUM types for constrained string sets.** For columns like <code>order_status</code> with a fixed set of values (<code>pending</code>, <code>confirmed</code>, <code>shipped</code>, <code>delivered</code>), use a database ENUM or a CHECK constraint rather than a free-text varchar.
6. **Document every column with a COMMENT.** Use the database's COMMENT feature to store the business definition of each column. This metadata is accessible to all engineers running queries and prevents misinterpretation.
7. **Plan for soft deletes with a separate archive table.** Instead of adding <code>deleted_at</code> to every table, move deleted rows to a parallel <code>tablename_archive</code> table. This keeps the primary table's index small and queries simple.
8. **Version your schema migrations.** Each migration file must be sequential (numbered or timestamped), immutable once applied, and reversible. Never edit a migration that has been applied to production.

## Anti-patterns
1. **Entity-Attribute-Value (EAV).** Storing attributes as rows (<code>entity_id, attribute_name, attribute_value</code>) instead of columns. This sacrifices type safety, query performance, and constraint enforcement. Only use EAV when the set of attributes is truly dynamic and unbounded (e.g., custom fields in a CMS).
2. **One "attributes" JSONB column for everything.** Using a single JSONB column to store all entity attributes because "the schema might change." This bypasses type checking, indexing, and constraint enforcement. Use JSONB only for genuinely semi-structured data where columns are not known at design time.
3. **Leaky abstraction with polymorphic associations.** Having a table with <code>owner_type VARCHAR</code> and <code>owner_id INTEGER</code> that can reference Users or Organizations. The database cannot enforce referential integrity, and application code must manually resolve the target table. Use separate foreign key columns or table inheritance instead.
4. **Over-normalization.** Decomposing a table to 5NF or 6NF without a concrete query-performance justification. Every additional JOIN adds complexity and cost. Normalize to 3NF by default, then measure before going further.
5. **Storing money as <code>float</code> or <code>double</code>.** Floating-point types cannot represent decimal values exactly, leading to rounding errors in financial calculations. Always use <code>numeric</code> or <code>decimal</code> with explicit precision and scale.
6. **Using natural keys that can change.** Using a user's email address as the primary key. When the user changes their email, the key must be updated in every referencing table. Use a stable surrogate key and add a UNIQUE constraint on the email.
7. **Cascading deletes without review.** Adding <code>ON DELETE CASCADE</code> on every foreign key without understanding the impact. A single delete can cascade through dozens of tables, potentially deleting data unintentionally. Prefer <code>ON DELETE RESTRICT</code> and handle cleanup explicitly.

## Edge Cases
1. **Timezone ambiguity in timestamps.** A <code>created_at</code> stored without timezone information is ambiguous when users span multiple timezones. Always store as <code>timestamptz</code> (TIMESTAMP WITH TIME ZONE) and convert to the user's local timezone in the presentation layer.
2. **Handling data that spans multiple valid time periods.** An employee may have multiple roles over time, and each role has a <code>valid_from</code> and <code>valid_to</code>. Queries that ask "what was the employee's role on January 15?" require temporal joins with overlapping date ranges.
3. **Concurrent inserts violating unique constraints that are checked at application level.** Two requests check that a username is available simultaneously, both see it as available, and both insert. Use database UNIQUE constraints as the ultimate authority, not application-level checks.
4. **Rows that exceed the maximum row size.** In PostgreSQL, a row cannot exceed 1.6 GB (or 8 KB for TOAST-eligible columns). If an entity has hundreds of columns or very large text fields, consider vertical partitioning or a separate table.
5. **Natural key changes that require cascade updates.** A product SKU changes due to a rebranding. If SKU is a natural key used in multiple foreign key references, the update must cascade or be handled with a surrogate key that masks the change.
6. **Soft-deleted rows causing UNIQUE constraint violations.** If a user with email <code>alice@example.com</code> is soft-deleted and a new user registers with the same email, the UNIQUE constraint on email will fail. Solutions: use a composite unique constraint on <code>(email, deleted_at)</code> with NULL considered distinct, or move soft-deleted emails to a separate table.

## Validation Checklist
- [ ] Every table has a primary key (preferably UUID).
- [ ] All timestamps use <code>timestamptz</code>.
- [ ] Monetary values use <code>numeric</code> with explicit precision and scale.
- [ ] Every foreign key column has an index.
- [ ] Every column has a COMMENT describing its business meaning.
- [ ] No polymorphic associations exist (<code>type</code> + <code>id</code> columns).
- [ ] No NULL-ambiguous columns (each nullable column has documented semantics for NULL).
- [ ] Check constraints exist for all numeric ranges (e.g., <code>CHECK (quantity > 0)</code>).
- [ ] UNIQUE constraints exist on all natural identifiers (email, slug, SKU).
- [ ] <code>created_at</code> and <code>updated_at</code> exist on every table with database defaults.
- [ ] No column stores data that can be computed from other columns.
- [ ] All ENUM values are documented and have a migration strategy for adding new values.
- [ ] The ERD is up-to-date and matches the DDL.
- [ ] Cascade behaviors are explicitly set (not default NO ACTION) and reviewed.

## Engineering Examples

### Example 1: Modeling a Multi-Tenant Data Schema

A B2B SaaS application needs to support organizations (tenants) where each organization has its own users, projects, and billing data. Data isolation is critical; one tenant must never see another tenant's data.

**Approach:** Add <code>organization_id</code> as a foreign key on every table that is tenant-scoped (users, projects, invoices). Create a composite index on <code>(organization_id, id)</code> for every table to ensure efficient queries within a tenant scope. All application queries include <code>WHERE organization_id = $1</code> enforced by a middleware layer that extracts the tenant from the authentication context. Row-Level Security (RLS) is enabled as a defense-in-depth measure; a policy <code>USING (organization_id = current_setting('app.organization_id')::uuid)</code> prevents any query — even one from a database console — from leaking data across tenants.

**Result:** Tenant isolation is enforced at both the application layer (every query scoped) and the database layer (RLS as a safety net). Adding a new tenant is as simple as inserting a row into the <code>organizations</code> table. The schema scales to thousands of tenants with appropriate indexing and partitioning by <code>organization_id</code>.

### Example 2: Designing an Audit Log System

A fintech application must record every change to sensitive fields (account balance, KYC status, personal information) for compliance with financial regulations. The audit trail must be immutable and queryable by entity ID and timestamp.

**Approach:** Create a single <code>audit_log</code> table with columns: <code>id (UUID PK)</code>, <code>entity_type (VARCHAR)</code>, <code>entity_id (UUID)</code>, <code>action (VARCHAR)</code> — one of <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code>, <code>changed_fields (JSONB)</code> — a map of field names to <code>{old_value, new_value}</code>, <code>changed_by (UUID FK to users)</code>, <code>changed_at (timestamptz DEFAULT NOW())</code>. Index <code>(entity_type, entity_id, changed_at)</code> for efficient per-entity queries. Use database triggers on sensitive tables to automatically insert audit log rows on UPDATE and DELETE. The <code>changed_fields</code> JSONB only includes fields that actually changed (diff). The application never writes to the audit_log table directly; only triggers do.

**Result:** Every change to a sensitive field is automatically recorded with before-and-after values, the user who made the change, and a precise timestamp. The audit log is immutable because the application never has permissions to UPDATE or DELETE from it. Compliance auditors can query "who changed the interest rate on account X between January 1 and January 15?" in milliseconds.

### Example 3: Choosing Between Relational and Document Stores for a Given Domain

A content management system stores blog posts that have a fixed set of metadata (title, author, publish date) and a variable set of custom fields that differ per post type (a recipe post has ingredients and cook time; a travel post has destination and coordinates; a review post has rating and product name).

**Approach:** Use PostgreSQL with a hybrid model. The fixed metadata lives in a normalized relational table: <code>posts(id, title, author_id, published_at, post_type)</code>. The variable custom fields are stored in a JSONB column <code>custom_fields</code> on the same row. A CHECK constraint validates that the <code>custom_fields</code> JSONB contains keys appropriate for the <code>post_type</code> using a JSON schema validation function. GIN indexes on <code>custom_fields</code> allow querying by specific custom keys (e.g., <code>WHERE custom_fields @> '{"destination": "Paris"}'</code>).

**Result:** The team avoids the complexity of EAV or polymorphic tables while maintaining type safety. The relational part enforces referential integrity (author must exist). The JSONB part allows schema flexibility per post type. Performance is excellent: the GIN index makes queries against custom fields efficient. The team gains the best of both worlds without adopting a full document database.
