# Security Engineering

## Purpose

To provide a rigorous framework for identifying, mitigating, and preventing security vulnerabilities in software systems. This skill covers threat modeling using the STRIDE framework, secure defaults, defense in depth, least privilege principle, security headers, injection prevention, XSS and CSRF protection, secrets management, dependency scanning, and security testing. The goal is to shift security left—integrating security considerations into every phase of the software development lifecycle so that vulnerabilities are prevented at the design stage rather than patched after deployment.

## Responsibilities

- Conduct threat modeling sessions for every new feature or significant change, using STRIDE to systematically enumerate threats.
- Enforce secure defaults: authentication required by default, encryption in transit and at rest, least privilege permissions on all resources, and safe default configurations that minimize attack surface.
- Implement defense in depth: multiple overlapping layers of security controls (network, application, data) so that if one layer is breached, others still provide protection.
- Apply the principle of least privilege to all system components: service accounts, database users, IAM roles, API keys, and application permissions. Grant only the minimum permissions required for the component to function.
- Configure security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy) to enforce browser-side security policies.
- Prevent injection attacks (SQL, NoSQL, OS command, LDAP, template) by using parameterized queries, input validation, and context-aware escaping.
- Prevent cross-site scripting (XSS) by implementing output encoding, Content Security Policy, input sanitization, and proper HTTP-only/same-site cookie flags.
- Implement cross-site request forgery (CSRF) protection using synchronizer tokens (CSRF tokens), SameSite cookies, and custom request headers.
- Manage secrets (API keys, database passwords, signing keys) through a dedicated secrets management solution (Vault, AWS Secrets Manager, Azure Key Vault) with automatic rotation.
- Maintain a dependency vulnerability scanning process: automated scanning in CI, periodic manual review, and a defined patching SLA for critical vulnerabilities.
- Perform security testing: static analysis (SAST), dynamic analysis (DAST), dependency scanning, container scanning, and penetration testing.

## Decision Process

1. **Identify the asset.** Determine what is being protected: user data (PII, credentials, financial information), intellectual property, system availability, or compliance data. Classify the data according to the organization's data classification policy (public, internal, confidential, restricted).
2. **Create a threat model.** Use STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege). Draw a data flow diagram of the feature. For each data flow, trust boundary, and storage node, enumerate the applicable STRIDE threats.
3. **Determine the attack surface.** Identify all entry points: HTTP endpoints, message queue consumers, file uploads, WebSocket connections, CLI interfaces. Determine which ones are authenticated vs. unauthenticated. Reduce the attack surface by disabling unused features and endpoints.
4. **Choose the security control for each threat.** For a given threat (e.g., "attacker spoofs a user's identity"), select the appropriate control (e.g., "multi-factor authentication + rate-limited login + audit logging"). Use defense in depth: layer multiple controls.
5. **Define the authentication strategy.** Select the authentication mechanism: session-based with cookies (for traditional web apps) or token-based with JWT (for APIs and SPAs). Implement secure storage, rotation, and revocation.
6. **Define the authorization model.** Determine the access control model: RBAC (role-based), ABAC (attribute-based), or ReBAC (relationship-based). Map roles/permissions to operations. Enforce authorization at the API layer, not just the UI.
7. **Select security headers.** For every HTTP response, set CSP (Content-Security-Policy), HSTS (Strict-Transport-Security), X-Content-Type-Options (nosniff), X-Frame-Options (DENY or SAMEORIGIN), and Permissions-Policy. Review and tighten the CSP to the strictest possible policy.
8. **Choose input validation strategy.** Use whitelist validation (allow known good patterns) whenever possible. Validate at every trust boundary: client-side for UX, server-side for security. Use parameterized queries for all database operations. Encode output based on the context (HTML, JavaScript, CSS, URL).
9. **Manage secrets securely.** Never hard-code secrets in source code, configuration files, or environment variable files committed to version control. Use a secrets manager with automatic rotation. For local development, use a `.env.local` file that is gitignored.
10. **Set up security testing in CI.** Integrate SAST (ESLint security plugin, Brakeman, Bandit) and SCA (Snyk, Dependabot, OWASP Dependency-Check) into the CI pipeline. Fail the build on critical or high-severity vulnerabilities. Schedule periodic DAST scans (OWASP ZAP, Burp Suite) against staging.

## Inputs

- Feature design documents and data flow diagrams.
- Data classification guidelines (what data is PII, PCI, PHI).
- Compliance requirements (GDPR, SOC 2, PCI-DSS, HIPAA).
- Existing infrastructure architecture (network topology, cloud services, database engines).
- Authentication and authorization requirements (user roles, permission matrix, SSO requirements).
- Security audit findings or penetration test reports from previous assessments.
- Dependency inventory (libraries, frameworks, runtime versions).
- Third-party integration contracts (data shared, APIs consumed, data retention policies).

## Outputs

- Threat model documents for each feature, including mitigated and accepted risks.
- Security control implementations: authentication middleware, authorization checks, input validation functions, output encoding helpers, CSP configurations.
- Secrets management configuration: Vault policies, secret rotation schedules, emergency access procedures.
- Security headers configuration for the web server (Nginx, Apache) or application middleware.
- SAST/SCA configuration files integrated into the CI pipeline.
- Incident response runbooks for common security scenarios (credential leak, DDoS, data breach).
- Security training materials and secure coding guidelines for the engineering team.
- Audit logs of security-relevant events (logins, permission changes, data access).

## Rules

1. **Never trust user input.** All input from clients, APIs, file uploads, or message queues must be validated, sanitized, or escaped before use. Validation must happen server-side, not only client-side.
2. **All database queries must use parameterized statements or prepared statements.** String concatenation or interpolation of user input into SQL/NoSQL queries is forbidden. Use ORMs with parameterized queries or raw queries with bind parameters.
3. **Passwords must never be stored in plain text.** Use a strong, adaptive hashing algorithm: bcrypt (cost factor >= 10), Argon2id, or PBKDF2 with a work factor appropriate to the hardware. Always use a unique, random salt per password.
4. **All network communication must use TLS 1.2 or higher.** Enforce HTTPS with HSTS. Disable SSLv3, TLS 1.0, and TLS 1.1. Use secure cipher suites. Redirect all HTTP traffic to HTTPS.
5. **Secrets must never appear in logs, error messages, or stack traces.** Implement log scrubbing for known secret patterns (API keys, passwords, tokens). Use a structured logging approach that allows easy redaction.
6. **Every API endpoint must authenticate and authorize the request.** Exceptions (unauthenticated endpoints like login, registration, password reset) must be explicitly documented and reviewed. No endpoint may default to "no auth required."
7. **File uploads must be validated by type, size, and content.** Validate the file extension, MIME type (using content inspection, not just the Content-Type header), file size (limit to a reasonable maximum), and scan for malware. Store uploaded files outside the web root with random filenames. Do not execute uploaded files.
8. **Session identifiers and tokens must be cryptographically random.** Use a cryptographically secure pseudo-random number generator (CSPRNG). For session IDs, minimum 128 bits of entropy. For API tokens, minimum 256 bits of entropy. Regenerate session IDs after login.
9. **All dependencies must be scanned for vulnerabilities before deployment.** Use automated dependency scanning in CI. Pinned versions (lock files) are required. When a vulnerability is identified in a dependency, assess its exploitability in your context and patch within the defined SLA.
10. **Security controls must be tested continuously.** SAST runs on every commit. DAST runs nightly against staging. Penetration tests occur at least annually. Vulnerabilities found in testing must be tracked in the issue tracker and prioritized by severity.

## Best Practices

1. **Use a Content Security Policy (CSP) with strict restrictions.** Start with a restrictive policy and loosen only when necessary. Use `'strict-dynamic'` for script-src to allow trusted scripts while blocking inline event handlers and `eval()`. Use `report-uri` or `report-to` to receive violation reports.
2. **Implement rate limiting at the API gateway.** Rate limit by IP, user ID, and API key separately. Apply stricter limits to authentication endpoints (login, password reset, MFA verification). Return `429 Too Many Requests` with a `Retry-After` header.
3. **Use a web application firewall (WAF).** Deploy a WAF (Cloudflare, AWS WAF, ModSecurity) in front of the application. Configure rules to block common attack patterns: SQL injection, XSS, path traversal, and known exploit payloads. Regularly update WAF rules.
4. **Implement a secrets rotation policy.** Rotate database passwords every 90 days. Rotate API keys every 180 days or immediately if compromised. Rotate TLS certificates before expiry (automate with cert-manager or Let's Encrypt). Use a secrets manager that supports automatic rotation.
5. **Log all security-relevant events.** Log authentication attempts (success and failure), authorization failures (403s), input validation failures, privilege changes, data access to sensitive resources, and configuration changes. Include timestamp, user ID, source IP, action, and resource ID. Protect logs from tampering (write to a SIEM or immutable storage).
6. **Use a separate service account for each component.** Database users, IAM roles, and API keys should be specific to each microservice. A bug in one service should not expose credentials that grant access to another service's resources.
7. **Validate redirect URLs.** Open redirect vulnerabilities occur when the application accepts a `redirect_to` or `next` parameter without validation. Whitelist allowed redirect URLs. Reject any URL that does not match the allowed pattern (same origin or explicit allowlist).
8. **Set the `Secure` and `HttpOnly` flags on all cookies.** The `Secure` flag ensures cookies are only sent over HTTPS. The `HttpOnly` flag prevents JavaScript access to cookies (mitigating XSS-based cookie theft). Set `SameSite=Lax` as the default; use `SameSite=Strict` for sensitive operations.
9. **Implement account lockout after failed login attempts.** After 5 failed attempts in 15 minutes, lock the account for 15 minutes (temporary lockout) or until the user resets their password (permanent lockout). Inform the user of the lockout and the reason. Use exponential backoff for lockout duration.
10. **Run regular penetration tests.** Engage an external penetration testing firm at least annually. Additionally, perform internal red team exercises. Track and remediate all findings within the agreed SLA. Re-test after remediation.

## Anti-patterns

1. **Security by obscurity.** Believing that hiding the database port, using a non-standard URL path, or not publishing the source code makes the system secure. Security through obscurity provides no real protection and must never be relied upon as the primary control.
2. **Rolling your own cryptography.** Implementing custom encryption algorithms, hashing functions, or authentication protocols. Homegrown crypto is almost always flawed. Fix: use well-vetted, standard libraries (libsodium, Bouncy Castle, Web Crypto API).
3. **Storing secrets in environment variables in source code.** Committing a `.env` file or hard-coding secrets in a configuration file that ends up in version control. Environment variables are better than hard-coding, but they still leak in process dumps and CI logs. Fix: use a secrets manager.
4. **Trusting the client for authorization decisions.** Checking "Is this user an admin?" only on the frontend and hiding the "Delete" button. An attacker can send a DELETE request directly to the API. Fix: enforce authorization server-side for every operation.
5. **Exposing stack traces in production error responses.** Returning the full exception stack trace in a 500 response. This leaks internal paths, library versions, and code structure. Fix: map exceptions to generic error responses server-side. Log the full stack trace with the correlation ID.
6. **Using outdated dependencies with known vulnerabilities.** Running a production system with libraries that have known CVEs for years. This is the most common attack vector. Fix: automate dependency scanning. Set up alerts for new CVEs. Patch within SLA (critical: 48h, high: 7 days).
7. **Ignoring the principle of least privilege for database users.** Using the same database user for migrations, read-write operations, and read-only queries. A SQL injection in the listing page can drop tables. Fix: use separate database users: one with DDL permissions (migrations), one with DML permissions (app writes), and one with read-only permissions (reporting).
8. **Disabling security features for "convenience."** Turning off CSRF protection because "it breaks the API," setting CSP to `default-src 'none'` for convenience, or allowing all origins in CORS because "it's just internal." Fix: security features can be inconvenient, but each one protects against a real attack vector. Find a way to make them work rather than disabling them.

## Edge Cases

1. **IDOR (Insecure Direct Object Reference) with UUIDs.** The developer assumes that because UUIDs are hard to guess, they do not need to check if the user owns the resource. An attacker who discovers another user's UUID can access their data. Fix: always verify ownership or authorization, regardless of whether the identifier is sequential or random.
2. **Race condition in authentication.** A user submits the login form twice rapidly. Two requests pass the password check simultaneously, but only one session is created. The second request may create a second session or leave the user in an inconsistent state. Fix: use idempotency keys for login requests. Use database transactions for session creation.
3. **CSP bypass via JSONP endpoints.** A third-party endpoint returns user-controlled data as JavaScript (JSONP). Even with a strict CSP, a JSONP endpoint can be used to exfiltrate data. Fix: do not include third-party JSONP endpoints as script sources in CSP. Prefer CORS-enabled endpoints.
4. **Prototype pollution in JavaScript.** A malicious payload `__proto__.isAdmin = true` pollutes the prototype chain, bypassing authorization checks. Fix: use `Object.create(null)` for maps/dictionaries. Use libraries that are immune to prototype pollution (lodash > 4.17.11). Validate that input objects do not contain `__proto__`, `constructor`, or `prototype` keys.
5. **JWT algorithm confusion.** The server accepts a JWT with `alg: "none"` or `alg: "HS256"` when the public key is meant for `RS256`. An attacker modifies the algorithm and forges tokens. Fix: explicitly validate the JWT algorithm on the server. Use a library that does not allow algorithm confusion. Set the expected algorithm as a strict configuration.
6. **Partial content-type validation for file uploads.** Checking only the file extension or the Content-Type header (which can be spoofed). An attacker uploads a PHP file as `image.jpg` but with `Content-Type: image/jpeg`. Fix: validate the actual file content using magic bytes. Use a library that reads the file header and confirms the type. Store files with randomly generated names and serve with a `Content-Disposition: attachment` header.
7. **SSRF (Server-Side Request Forgery) via URL parameters.** An endpoint accepts a URL parameter and fetches it server-side. An attacker provides `http://169.254.169.254/latest/meta-data/` to access cloud metadata. Fix: validate the URL against an allowlist of permitted domains. Block private IP ranges, loopback addresses, and metadata endpoints.
8. **Timing attacks on comparison operations.** Comparing a password hash or an API key using `==` or `===` stops at the first mismatched character, leaking information through response timing. Fix: use constant-time comparison functions (`crypto.timingSafeEqual` in Node.js, `hmac.compare_digest` in Python).

## Validation Checklist

- [ ] Threat model exists for the feature covering all STRIDE categories, with identified threats either mitigated or accepted.
- [ ] All user input is validated server-side using whitelist validation where possible.
- [ ] All database queries use parameterized statements or an ORM with parameterized queries.
- [ ] Passwords are hashed using bcrypt (cost >= 10), Argon2id, or PBKDF2 with a unique salt per password.
- [ ] All network communication uses TLS 1.2+ with HSTS enabled and secure cipher suites.
- [ ] Secrets are stored in a secrets manager, never in source code, config files, or environment files committed to version control.
- [ ] Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy) are set on every HTTP response.
- [ ] Authorization is enforced server-side for every API endpoint (no endpoint relies on client-side enforcement).
- [ ] Sessions and tokens use CSPRNG-generated values with sufficient entropy (128 bits for sessions, 256 bits for tokens).
- [ ] File uploads are validated by extension, content inspection, and file size, and stored outside the web root.
- [ ] All dependencies are scanned for vulnerabilities in CI; critical vulnerabilities are patched within 48 hours.
- [ ] CSRF protection is implemented (Synchronizer Token Pattern or SameSite cookies).
- [ ] Security-relevant events (login, auth failure, permission change) are logged and sent to a SIEM.
- [ ] Rate limiting is configured for authentication endpoints and sensitive operations.
- [ ] The application uses separate service accounts per component with least privilege permissions.

## Engineering Examples

### Example 1: Threat Modeling a Payment Feature (STRIDE)

A team is building a "Pay Invoice" feature. Before writing code, they conduct a threat modeling session.

Data flow: User → Web App → Payment Service → Payment Gateway (Stripe). The web app stores invoice data in the database.

STRIDE analysis (partial):

- **Spoofing**: An attacker impersonates a user and pays an invoice with someone else's saved card. Mitigation: require password re-entry or MFA for payment. Use the Stripe Payment Intents API with a client secret that is tied to the specific payment.
- **Tampering**: An attacker intercepts the payment request and changes the amount from $10 to $1. Mitigation: use Stripe's idempotency key and server-side amount calculation. The frontend sends an invoice ID; the server calculates the amount from the database. Never trust the amount from the client.
- **Repudiation**: A user claims they did not make a payment. Mitigation: log all payment attempts with timestamp, user ID, IP address, invoice ID, and Stripe charge ID. Store logs in a write-once, immutable log.
- **Information Disclosure**: The payment confirmation response includes the full credit card number (last 4 should be fine, but the full number must not be exposed). Mitigation: strip sensitive card data from API responses. Use Stripe's returned card object, which provides only the last 4 digits and expiration.
- **Denial of Service**: An attacker submits thousands of payment requests, exhausting Stripe API quota. Mitigation: rate limit payment attempts per user (max 5 per minute). Use a queue for processing payments. Implement a circuit breaker for Stripe API calls.
- **Elevation of Privilege**: A regular user calls the "refund" endpoint to refund another user's payment. Mitigation: enforce server-side authorization: only users with the `admin` role or the original payer can request a refund. Verify the payment belongs to the requesting user.

Each threat is documented in a threat model spreadsheet with: threat description, STRIDE category, affected component, mitigation, mitigation status (implemented/planned/accepted), and verification method.

### Example 2: Fixing an SQL Injection Vulnerability (Node.js + PostgreSQL)

A code review finds this code in a search endpoint:

```javascript
const query = `SELECT * FROM products WHERE name LIKE '%${req.query.q}%'`;
const results = await db.query(query);
```

An attacker sets `q = '; DROP TABLE products; --`, potentially deleting the products table.

Fix:

```javascript
// Parameterized query
const query = `SELECT * FROM products WHERE name LIKE $1`;
const results = await db.query(query, [`%${req.query.q}%`]);

// Also add input validation
const maxLength = 200;
const sanitized = req.query.q.slice(0, maxLength).replace(/[<>"'\\]/g, '');
const results = await db.query(query, [`%${sanitized}%`]);
```

Additional hardening:

- The database user for the app has only SELECT, INSERT, UPDATE, and DELETE on specific tables. No DDL (DROP, CREATE, ALTER) permissions. Even if the injection succeeded, `DROP TABLE` would fail due to missing permissions.
- An ORM (Prisma) is used for all queries. Raw queries are reviewed in every PR by a second engineer.
- The WAF has a rule that blocks requests containing SQL keywords (`DROP`, `UNION`, `SELECT ... FROM`) in query parameters.
- The CI pipeline runs a SAST tool that flags string concatenation in SQL queries.

The layered approach means that even if one control fails (e.g., a new team member writes a raw query), the database permissions and WAF provide backup protection.

### Example 3: Implementing Proper Secrets Rotation (AWS + Vault)

A microservice needs to connect to an RDS PostgreSQL database, an S3 bucket, and the Stripe API. The team implements a secrets rotation strategy.

**Initial state**: Database password, AWS access keys, and Stripe API key are stored in environment variables in the deployment configuration. Rotation requires a manual process: generate new secret, update deployment, restart service.

**Improved state using AWS Secrets Manager and Vault**:

1. **Database passwords**: A Lambda function runs weekly to rotate the RDS password. The new password is stored in AWS Secrets Manager. The application retrieves the database password from Secrets Manager at startup (cached in memory with a 1-hour TTL). If the password changes during the TTL window, the database connection fails, the application catches the error, retrieves the new password from Secrets Manager, and retries the connection.
2. **Stripe API key**: Stored in HashiCorp Vault with a 90-day rotation policy. Vault automatically generates a new Stripe API key before the current one expires. The application uses Vault's dynamic secrets feature: it requests a temporary API key valid for 24 hours. The application does not have a long-lived Stripe key.
3. **Emergency rotation**: If a compromise is detected, the on-call engineer runs a "rotate now" command in the deployment pipeline. This invalidates the current secret in Vault/Secrets Manager, generates a new one, and restarts all affected services with the new secret.
4. **Audit**: Vault and Secrets Manager log every secret access and rotation event. These logs are sent to the SIEM. A monthly report shows which secrets are approaching their rotation deadline.

The result: secrets are rotated automatically, reducing the risk of long-lived credential exposure. Emergency rotation is a single command. Access to secrets is audited.
