# Authorization

## Purpose

To provide a systematic framework for implementing authorization—determining what authenticated users are allowed to do. This skill covers Role-Based Access Control (RBAC), Attribute-Based Access Control (ABAC), Relationship-Based Access Control (ReBAC), permission models, policy-based access control, ownership-based access, scope-based permissions, middleware/hook patterns, frontend vs. backend enforcement, and audit of authorization decisions. The goal is to ensure that every access control decision is explicit, testable, centrally auditable, and enforced at the server level.

## Responsibilities

- Design and implement the authorization model: choose between RBAC, ABAC, ReBAC, or a hybrid approach based on the application's permission requirements.
- Define roles, permissions, and role hierarchies. Map roles to the operations they can perform on which resources.
- Implement policy-based access control using a policy engine (OPA, Casbin, AWS IAM) for complex, attribute-driven permission rules.
- Enforce ownership-based access: users can only access resources they own (documents, orders, profiles), with owner override for admins.
- Implement scope-based permissions for API tokens: a token can be scoped to `read:orders` without `write:orders` or `read:users`.
- Build authorization middleware/hooks that run on every request before the business logic executes, returning 403 Forbidden if the user lacks permission.
- Ensure authorization is enforced on the backend for every API endpoint. Frontend enforcement is only for UX (hiding buttons); backend enforcement is the security boundary.
- Log every authorization decision (grant or deny) with the user, resource, action, and policy rule that decided the outcome. Send logs to a SIEM for audit and anomaly detection.
- Support resource-level permissions: different users may have different permissions on different resources (e.g., User A can edit Document 1 but only view Document 2).
- Handle authorization for background jobs and system-to-system calls: service accounts need permissions just like user accounts.

## Decision Process

1. **Identify the resources and actions.** List every resource type in the system (Document, Order, User, Organization, Project, Invoice). For each resource type, list the actions: `create`, `read`, `update`, `delete`, `approve`, `archive`, `share`, `transfer`.
2. **Determine the access control model.** If permissions are based on job function (Admin, Editor, Viewer), use RBAC. If permissions depend on resource attributes (e.g., "documents marked as confidential can only be read by senior staff"), use ABAC. If permissions depend on relationships (e.g., "users can view documents shared with them by their team members"), use ReBAC.
3. **Define roles and their permissions.** Create a permission matrix: roles as rows, actions as columns. For multi-tenant systems, include a tenant dimension: the `Admin` role may apply only within an Organization, not globally.
4. **Choose the enforcement point.** For most applications, a middleware/hook at the API gateway or controller level is sufficient. For fine-grained, resource-level permissions, add checks in the service layer. For database-level row security, consider PostgreSQL Row-Level Security (RLS) for defense in depth.
5. **Design for testability.** Authorization logic must be testable without making HTTP requests. Write unit tests that create a user with specific roles/permissions, call the authorization function with a specific resource and action, and assert the boolean result.
6. **Plan for audit.** Every authorization decision must be logged. The log entry must include: user ID, resource ID, resource type, action, decision (allow/deny), policy rule that matched, timestamp, and request ID. Store logs in a write-only, immutable log store.
7. **Handle denied access explicitly.** A denied access should return 403 Forbidden with a structured error body: `{ "error": { "code": "FORBIDDEN", "message": "You do not have permission to perform this action" } }`. Do not return 404 (which would leak the resource's existence in some contexts).
8. **Decide on frontend enforcement.** The frontend should hide buttons and routes that the user is not authorized to use, but this is purely for UX. The backend must enforce authorization independently. Never trust the frontend's disabled/hidden state as a security control.
9. **Handle ownership vs. role-based access.** If a user owns a resource, they typically have full access (read, update, delete) regardless of their role. If they are an admin, they also have full access. Implement an "owner override" that allows the owner and admins to bypass role checks for owned resources.
10. **Implement scope-based access for API tokens.** When an API token is issued, it should have a scope (e.g., `read:orders`, `write:invoices`). The authorization middleware must check both the user's role/permissions AND the token's scope. The effective permission is the intersection of the user's permissions and the token's scope.

## Inputs

- Permission matrix: which roles/permissions/attributes grant access to which actions on which resources.
- Organizational hierarchy: team structure, reporting lines, project membership, organization membership.
- Resource and action inventory: every API endpoint mapped to a resource type and action.
- Compliance requirements: separation of duties (a user cannot approve their own purchase order), least privilege, and audit requirements.
- API token scope requirements: what scopes are available, which endpoints require which scopes.
- Third-party integration permissions: what data can external services access via API tokens.

## Outputs

- Authorization model definition: roles, permissions, policies, and their hierarchy.
- Authorization middleware: a function that extracts the user and resource from the request context, evaluates the policy, and either allows the request or returns 403.
- Policy engine configuration (if using OPA, Casbin, or similar): policy files in Rego, Casbin model, or JSON rules.
- Permission check functions in the service layer: `can(user, action, resource)` returning `boolean`.
- Audit log entries for every authorization decision, sent to the audit logging system.
- Frontend permission utilities: hooks or functions that the frontend uses to conditionally render UI elements based on the user's permissions.
- API token scope validation: middleware that checks the token's scope against the required scope for the endpoint.
- Test suite for authorization: unit tests for every role/permission combination and edge case.

## Rules

1. **Authorization must be enforced server-side for every API endpoint.** No endpoint may skip authorization. If an endpoint is intentionally public, it must be explicitly excluded in the authorization configuration, and the exclusion must be reviewed.
2. **The frontend must never be trusted for authorization decisions.** Frontend code can be modified by the user. Hiding a button in the UI is not a security control. The backend must re-verify authorization for every request.
3. **Authorization checks must be explicit, not implicit.** Do not rely on the absence of a route handler or a database query that returns no rows as an authorization mechanism. Write explicit `if (!can(user, 'read', document)) return 403` code.
4. **Default to deny.** If no policy rule matches the request, the default decision is DENY. There is no default-allow in authorization. A missing policy for a resource should result in a denied request.
5. **Permissions must be granular enough to support least privilege.** Avoid monolithic permissions like "admin" or "full_access." Define specific permissions for each action on each resource type: `document:read`, `document:write`, `document:delete`, `document:share`, `user:invite`, `billing:view`, `billing:manage`.
6. **API token scopes must be validated against the user's permissions.** A token with scope `read:orders` cannot be used to call a `write:orders` endpoint, even if the user has `write:orders` permission. The effective permission is the user's permissions intersected with the token's scopes.
7. **Authorization decisions must be logged.** Every allow and deny must be recorded with user ID, resource ID, action, policy rule, timestamp, and request ID. Logs must be immutable and write-once.
8. **Role hierarchies must be explicit and documented.** If `Admin` inherits from `Editor` which inherits from `Viewer`, this hierarchy must be defined in the authorization model, not duplicated in code. Changes to the hierarchy must be reviewed.
9. **Ownership must be checked for personal resources.** For resources that belong to a user (documents, orders, messages), the authorization check must verify that `resource.ownerId === userId` OR the user has an admin role. This check happens in addition to role/permission checks.
10. **Authorization logic must be testable in isolation.** The `can(user, action, resource)` function must be a pure function that takes user attributes, action, and resource attributes as input and returns a boolean. No side effects, no database calls, no HTTP requests in the authorization function itself.

## Best Practices

1. **Use a policy engine for complex authorization rules.** For RBAC, a simple database table of role-permission mappings is sufficient. For ABAC or ReBAC, use a policy engine like Open Policy Agent (OPA) or Casbin. Policy engines separate authorization logic from application code and allow policy changes without code deployments.
2. **Cache authorization decisions when appropriate.** If the same user repeatedly accesses the same resource (e.g., loading a document editor), cache the authorization decision for a short duration (e.g., 5 seconds). Invalidate the cache when the user's roles/permissions change or when the resource's ownership changes.
3. **Use attribute-based conditions within RBAC.** RBAC can be extended with conditions: "Editors can edit documents only if the document status is `draft`." This hybrid approach covers many real-world scenarios without the complexity of full ABAC.
4. **Test authorization with a matrix test.** Write a parameterized test that iterates over every combination of role, action, and resource type and asserts the expected allow/deny outcome. This provides a single source of truth for the permission matrix.
5. **Include authorization metadata in API responses.** When returning a list of resources, include the permissions the user has on each resource: `{ "id": "doc-1", "title": "...", "permissions": ["read", "write"] }`. This allows the frontend to render the correct UI elements without additional permission checks.
6. **Implement a "super admin" role carefully.** A super admin bypasses all authorization checks. This role should be reserved for system administrators and should require additional controls: MFA, IP allowlisting, and audit logging. There should be very few super admin accounts.
7. **Separate authorization data from user data in the database.** Store roles and permissions in a separate table (`user_roles`, `role_permissions`) rather than in the `users` table. This makes it easier to manage permissions, audit changes, and support multiple roles per user.
8. **Handle authorization in background jobs.** A background job that processes a document must check whether the user who queued the job still has permission to perform that action. Alternatively, the job can inherit the permissions of a system service account that has been explicitly granted the required permissions.
9. **Provide a permission introspection API.** An endpoint like `GET /api/auth/permissions?resource=document:doc-123` returns the permissions the current user has on the specified resource. The frontend calls this to determine which UI elements to show.
10. **Review authorization rules during code review.** Every PR that adds a new endpoint or modifies authorization logic must include the authorization check code. The reviewer should verify that the correct permission is checked and that no endpoint is accidentally left unprotected.

## Anti-patterns

1. **Only checking authorization on the frontend.** Hiding the "Delete" button for non-admin users but not checking authorization on the DELETE API endpoint. An attacker sends a DELETE request directly and the server processes it. Fix: always enforce authorization server-side.
2. **Using a single "admin" boolean column.** A `users.is_admin` boolean that grants all permissions. There is no granularity. If a user needs access to one admin feature, they get all admin features. Fix: use a roles and permissions system with granular permissions.
3. **Checking authorization by comparing to a hard-coded user ID list.** `if (userId !== 1 && userId !== 2) return 403`. This is brittle, unscalable, and impossible to audit. Fix: use a proper role/permission system.
4. **Authorization logic scattered across the codebase.** Each service method checks permissions differently: some check the user's role, some check ownership, some check nothing. There is no central authorization module. Fix: create a centralized authorization service that all endpoints call.
5. **Returning 404 instead of 403 for unauthorized access.** The server returns 404 when an authorized user would have gotten a 200, to "hide" the resource's existence. This breaks the client's ability to distinguish between "resource does not exist" and "you are not allowed to see it." Fix: return 403 for denied access. Only return 404 when the resource truly does not exist.
6. **Not checking authorization for background jobs.** A user queues a job to export all invoices. By the time the job runs, the user's role may have changed (they were demoted from admin to viewer). The job runs with the original permissions. Fix: check authorization at the start of the job. If the user no longer has permission, fail the job and notify the user.
7. **Granting overly broad API token scopes.** An integration token has scope `*` or `admin`, giving full access to all resources. If the token is compromised, the attacker has full access. Fix: grant the minimum required scopes for each integration. Review scopes periodically.
8. **Mixing authentication and authorization errors.** Returning 401 Unauthorized when the user is authenticated but not authorized. 401 means "not authenticated" (missing or invalid credentials). 403 means "authenticated but not authorized." Fix: return 401 for auth failures, 403 for authz failures.

## Edge Cases

1. **User with multiple roles.** A user is both an "Editor" and a "Moderator". The Editor role grants `document:write`. The Moderator role grants `comment:delete`. The user should be able to perform both actions. Fix: union the permissions from all roles. If any role grants the permission, the user has it.
2. **Resource that changes ownership.** A document is transferred from User A to User B. User A should lose access to the document immediately. Fix: on ownership transfer, invalidate any cached authorization decisions for User A and that document. The next request from User A triggers a fresh authorization check that denies access.
3. **Delegated authorization (impersonation).** A support agent needs to perform actions on behalf of a user. The agent should have limited permissions (e.g., view only, no password changes). Fix: implement a separate "impersonation" permission that must be explicitly granted. All impersonation actions are logged with both the agent's ID and the target user's ID.
4. **Soft-deleted resources.** A document is soft-deleted (archived, `deleted_at` set but row remains). Should the owner still be able to access it? Should an admin be able to restore it? Fix: add a `deleted` attribute to the resource. Authorization rules for deleted resources should be stricter: only the owner and admin can view/undelete; editors cannot.
5. **Cross-organization access in a multi-tenant system.** User A belongs to Organization 1. User A should not be able to access Organization 2's resources, even if User A's role is "Admin" (which is scoped to Organization 1). Fix: include the organization/tenant ID in the authorization context. Every resource is associated with a tenant. The authorization check verifies that the user belongs to the resource's tenant.
6. **Rate limiting on authorization failures.** An attacker tries to brute-force access to resources by guessing resource IDs. Each guess returns 403. The attacker learns which resources exist (403) vs. which do not (404). Fix: return uniform responses for both 403 and 404: use a generic error message. Rate-limit all 403 responses per user/IP.
7. **Inherited permissions via group membership.** User is a member of Team A. Team A has `document:write` on Project X. The user should be able to edit documents in Project X without being individually assigned permissions. Fix: implement group-based permissions. Check the user's direct permissions AND the permissions of all groups the user belongs to.
8. **Temporary permissions (time-bound access).** A user is granted `document:read` for 24 hours (e.g., for an audit). After 24 hours, the permission should expire automatically. Fix: include an `expires_at` column in the permissions table. The authorization middleware checks `expires_at` and treats expired permissions as not granted.

## Validation Checklist

- [ ] Every API endpoint has an explicit authorization check before business logic executes.
- [ ] Authorization is enforced server-side; frontend enforcement is only for UX.
- [ ] Default policy is DENY; all allow decisions are explicitly granted.
- [ ] Permissions are granular (`document:read`, not `document:*` or `admin`).
- [ ] API token scopes are validated and intersected with user permissions.
- [ ] Every authorization decision (allow and deny) is logged with user ID, resource ID, action, and timestamp.
- [ ] Authorization logic is testable in isolation (pure function, no side effects).
- [ ] Role hierarchies are explicit and documented, not duplicated ad-hoc.
- [ ] Ownership checks verify `resource.ownerId === userId` for personal resources.
- [ ] Multi-tenant scoping is enforced: users cannot access resources of other tenants.
- [ ] Soft-deleted resources have appropriate authorization rules.
- [ ] Time-bound permissions expire correctly and are enforced by the authorization middleware.
- [ ] Group membership permissions are inherited correctly.
- [ ] Authorization for background jobs is re-verified at job execution time.
- [ ] 403 and 404 responses are distinct and semantically correct.
- [ ] Permission introspection API exists for the frontend to determine UI visibility.

## Engineering Examples

### Example 1: Implementing RBAC for a Multi-Tenant SaaS

A SaaS application serves multiple organizations. Each organization has its own users, projects, and documents. There are three roles within an organization: Admin, Editor, and Viewer.

Implementation:

**Data model:**
- `organizations` table: `id`, `name`
- `users` table: `id`, `email`, `name`
- `organization_memberships` table: `user_id`, `organization_id`, `role` (admin | editor | viewer)
- `role_permissions` table: `role`, `resource_type`, `action` — e.g., ("admin", "document", "read"), ("admin", "document", "write"), ("editor", "document", "read"), ("editor", "document", "write"), ("viewer", "document", "read")

**Authorization function:**
```typescript
function can(userId: string, organizationId: string, action: string, resourceType: string): boolean {
  const membership = db.organization_memberships.findFirst({
    where: { user_id: userId, organization_id: organizationId }
  });
  if (!membership) return false;

  const permission = db.role_permissions.findFirst({
    where: { role: membership.role, resource_type: resourceType, action: action }
  });
  return permission !== null;
}
```

**Middleware:**
```typescript
// Express middleware
function authorize(action: string, resourceType: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const organizationId = req.params.organizationId || req.body.organizationId;
    if (!can(userId, organizationId, action, resourceType)) {
      logger.warn({ userId, organizationId, action, resourceType, decision: 'deny' });
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    next();
  };
}

// Usage: router.delete('/documents/:id', authorize('delete', 'document'), documentController.delete);
```

**Testing:**
```typescript
describe('Authorization', () => {
  it('allows admin to delete documents', () => {
    expect(can('user-1', 'org-1', 'delete', 'document')).toBe(true);
  });
  it('denies viewer to delete documents', () => {
    expect(can('user-3', 'org-1', 'delete', 'document')).toBe(false);
  });
  it('denies cross-organization access', () => {
    expect(can('user-1', 'org-2', 'read', 'document')).toBe(false);
  });
});
```

### Example 2: Designing Fine-Grained Permissions for a Document Management System

A document management system needs granular permissions: some users can only view documents, some can edit, some can delete, some can share, and some can change permissions.

Implementation:

**Permission model (ABAC with RBAC):**
- Resources: Document, Folder, Workspace
- Actions: read, write, delete, share, change_permissions, archive
- Roles: Owner, Contributor, Reviewer, Commenter, Viewer
- Conditions: A Contributor can write only to documents in "draft" status. A Reviewer can read but cannot edit. The Owner of a document has all permissions.

**Policy evaluation (using OPA/Rego):**
```rego
package document.authz

default allow = false

# Owners have full access
allow {
  input.user.id == input.resource.owner_id
}

# Role-based access
allow {
  some perm in data.permissions
  perm.user_id == input.user.id
  perm.resource_id == input.resource.id
  perm.action == input.action
}

# Group-based access (user inherits permissions from groups)
allow {
  some group in data.user_groups[input.user.id]
  some perm in data.group_permissions[group]
  perm.resource_id == input.resource.id
  perm.action == input.action
}

# Condition: Contributors can only write to draft documents
allow {
  input.action == "write"
  some perm in data.permissions
  perm.user_id == input.user.id
  perm.resource_id == input.resource.id
  perm.action == "write"
  input.resource.status == "draft"
}
```

**Permission inheritance:**
- If a user has `read` on a Folder, they have `read` on all Documents in that folder.
- If a user has `write` on a Workspace, they can create documents in that workspace but not delete them.
- Inheritance is resolved at the policy evaluation level (OPA) or via a materialized permission tree.

**Audit:**
Every permission change is logged: "User A granted `write` on Document X to User B at timestamp T." Every access check is logged: "User B was denied `delete` on Document X at timestamp T (reason: role is 'Reviewer')."

### Example 3: Implementing Organization-Level Access Control

A project management tool has organizations, teams within organizations, and projects within teams. Users can be members of multiple organizations.

**Data model:**
```sql
CREATE TABLE organization_members (
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  PRIMARY KEY (user_id, organization_id)
);

CREATE TABLE team_members (
  user_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  role VARCHAR(20) NOT NULL CHECK (role IN ('lead', 'member')),
  PRIMARY KEY (user_id, team_id)
);

CREATE TABLE project_members (
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  permissions JSONB NOT NULL DEFAULT '[]'
  -- Example: ["read", "write", "delete_tasks", "manage_members"]
);
```

**Authorization flow:**
1. User requests `GET /api/organizations/:orgId/projects`.
2. Middleware extracts the user ID and organization ID.
3. The authorization service checks:
   a. Is the user a member of the organization? (Check `organization_members`)
   b. If not, return 403.
   c. Does the user have `read` permission on projects in this organization?
   d. Organization owners and admins can read all projects. Regular members can read projects they are explicitly added to.
4. The query filters projects by the user's access level: owners/admins see all projects; members see only projects they are part of.

**Performance optimization:**
- Materialized permission views for frequently accessed resources.
- Cache the user's permissions for the current session (with a 1-minute TTL).
- Use database-level row-level security (RLS) as a defense-in-depth layer: `CREATE POLICY project_access ON projects FOR SELECT USING (user_can_access_project(current_user_id(), id))`.

**Edge case: user leaves an organization.**
When a user leaves an organization, all their permissions within that organization must be revoked immediately. The `organization_members` row is deleted. Any cached permissions for that user in that organization are invalidated. If the user has open sessions, the next API request will trigger a fresh authorization check that returns deny.
