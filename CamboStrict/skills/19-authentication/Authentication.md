# Authentication

## Purpose

To provide a comprehensive framework for implementing secure, user-friendly authentication systems. This skill covers password hashing, session management, JWT strategy, OAuth2 flows, multi-factor authentication (MFA), biometric authentication, token rotation, secure cookie configuration, brute force protection, and account recovery flows. The goal is to ensure that every authentication mechanism implemented is resistant to common attacks (credential stuffing, session hijacking, token theft, brute force) while providing a smooth user experience.

## Responsibilities

- Implement password hashing using strong, adaptive algorithms (Argon2id, bcrypt, scrypt) with unique salts and configurable cost factors.
- Design session management systems: session creation, storage (server-side or encrypted client-side), renewal, invalidation on logout, and timeout on inactivity.
- Implement JWT-based authentication: token issuance, signing (RS256 or ES256), short-lived access tokens (15 minutes), longer-lived refresh tokens (7 days), secure storage, and rotation.
- Integrate OAuth2 flows: Authorization Code flow with PKCE for SPAs and mobile apps, Client Credentials flow for service-to-service communication, and Implicit flow (deprecated—do not use).
- Implement multi-factor authentication: TOTP (time-based one-time passwords), SMS codes, hardware security keys (WebAuthn/FIDO2), and backup codes.
- Support biometric authentication on mobile devices: Face ID, Touch ID, fingerprint, and Windows Hello via platform APIs (WebAuthn, platform-specific SDKs).
- Implement token rotation: refresh token rotation (the old refresh token is invalidated when a new one is issued), with a sliding expiration window.
- Configure secure cookies: `Secure` flag (HTTPS only), `HttpOnly` flag (no JavaScript access), `SameSite=Lax` or `SameSite=Strict`, and explicit `Domain` and `Path` attributes.
- Implement brute force protection: rate limiting by IP and username, account lockout after failed attempts, progressive delay, and CAPTCHA after a threshold.
- Design account recovery flows: email-based password reset with time-limited tokens, account recovery codes, identity verification questions, and social recovery.

## Decision Process

1. **Determine the authentication context.** Is this a first-party web app (use session-based auth with cookies), a single-page app consuming APIs (use JWT with refresh tokens and PKCE), a mobile app (use OAuth2 with PKCE + biometric), or a service-to-service integration (use OAuth2 Client Credentials or API keys)?
2. **Choose the password hashing algorithm.** Use Argon2id if the platform supports it (Node.js `argon2` library, Python `argon2-cffi`). Fall back to bcrypt with cost factor >= 10. Never use MD5, SHA-1, SHA-256 (fast hashes), or plain text.
3. **Select the session/token strategy.** For server-rendered apps: session IDs stored in an HTTP-only cookie with server-side session storage (Redis). For SPAs: short-lived access tokens (15 min) + long-lived refresh tokens (7 days) stored in an HTTP-only cookie or secure storage.
4. **Design the OAuth2 flow.** For SPAs and mobile apps, use the Authorization Code flow with PKCE. For server-side web apps, use Authorization Code flow without PKCE (the client secret is stored server-side). Never use the Implicit flow. For machine-to-machine, use Client Credentials flow.
5. **Decide on MFA requirements.** Is MFA required for all users (banking, healthcare) or optional for high-security actions (admin panel, payment confirmation)? Choose MFA methods based on user base: TOTP is the most widely compatible, WebAuthn is more secure but has lower adoption.
6. **Design token rotation.** When a refresh token is used to obtain a new access token, the old refresh token is invalidated and a new refresh token is issued. This limits the window of token theft. Set a sliding expiration: reset the refresh token's expiry on each rotation, up to a maximum absolute lifetime (e.g., 30 days).
7. **Configure secure cookies for tokens.** Access tokens and refresh tokens can be stored in HTTP-only cookies with `Secure`, `HttpOnly`, and `SameSite=Strict`. This prevents XSS-based token theft. For mobile apps, use the platform's secure keychain/keystore.
8. **Implement brute force protection.** Track failed login attempts per username/IP combination. After 5 failures in 15 minutes, lock the account for 15 minutes or require CAPTCHA. Use exponential delay (1s, 2s, 4s, 8s) after each failure. Notify the user of the failed attempts via email.
9. **Design the password reset flow.** User requests reset, email with a time-limited token (15 minutes), user clicks link, verify token, prompt for new password, enforce password policy, hash and store, invalidate all existing sessions, notify user of password change.
10. **Plan for account recovery.** What happens when a user loses access to their MFA device? Provide backup codes (10 one-time use codes) during MFA enrollment. If the user loses both password and MFA, require identity verification (email verification, knowledge-based questions, manual review for high-value accounts).

## Inputs

- Authentication requirements: supported authentication methods, MFA requirements, SSO integration needs, and session duration policies.
- User model schema: fields for storing password hashes, MFA secrets, recovery codes, and session references.
- OAuth2 provider configurations: client IDs, client secrets, redirect URIs, scopes, and token endpoints for each third-party provider.
- Password policy requirements: minimum length, complexity rules, password history, and expiration.
- Compliance requirements: password storage rules (NIST 800-63), MFA requirements (PCI-DSS, SOC 2), and session timeout rules.
- Security assessment results: penetration test findings, vulnerability scan results related to authentication.

## Outputs

- Authentication middleware: verifies tokens/sessions on each request, attaches user identity to the request context, handles anonymous access for public endpoints.
- Login, logout, registration, and password reset endpoints with proper validation, rate limiting, and security controls.
- JWT signing and verification utilities: configurable algorithms, key rotation support, and token introspection.
- OAuth2 integration modules: authorization URL generation, callback handling, token exchange, and user info retrieval for each provider.
- MFA enrollment and verification endpoints: TOTP secret generation, QR code display, backup code generation, and WebAuthn registration/authentication.
- Secure cookie configuration: domain, path, secure, httpOnly, sameSite, and maxAge for all authentication cookies.
- Brute force protection middleware: rate limiter tracking failed attempts per identity, account lockout mechanism, and CAPTCHA integration.
- Password hashing utilities: hash creation, verification, and cost factor adjustment for future-proofing.
- Session/token store: Redis or database schema for active sessions, refresh token allowlist/blocklist.

## Rules

1. **Passwords must be hashed with a strong adaptive algorithm.** Use Argon2id as the primary choice. If unavailable, use bcrypt with a minimum cost factor of 10. Use scrypt as a third option. Always generate a unique, cryptographically random salt per password (minimum 16 bytes).
2. **All authentication tokens must be short-lived.** Access tokens must expire within 15 minutes. Refresh tokens must expire within 7 days (or less for high-security applications). Session cookies must expire within 24 hours of inactivity. No token or session may have an indefinite lifetime.
3. **Refresh tokens must be rotated.** Each time a refresh token is used to obtain a new access token, the old refresh token is invalidated and a new refresh token is issued. This limits the damage of token theft. If a stolen refresh token is used after the legitimate user has already rotated it, the system detects the reuse and invalidates all tokens for that user.
4. **OAuth2 state parameters must be used and validated.** The `state` parameter in authorization requests must be a cryptographically random string, stored in the user's session. On callback, the returned `state` must match the stored value. This prevents CSRF attacks on the OAuth callback.
5. **PKCE must be used for public clients.** All SPAs and mobile apps using OAuth2 must use the Authorization Code flow with PKCE (Proof Key for Code Exchange). The `code_challenge` must use S256 (SHA-256). The `code_verifier` must be a cryptographically random string with at least 128 bits of entropy.
6. **MFA enrollment must verify the device before enabling.** When a user enrolls in TOTP MFA, the server must validate a generated TOTP code before saving the MFA secret. For WebAuthn, the server must validate the attestation object before storing the credential.
7. **Login rate limiting must apply per identity, not just per IP.** An attacker can bypass IP-based rate limiting by using a botnet. Rate limit by username/email AND by IP. Use a sliding window (e.g., 5 attempts per 15-minute sliding window per username).
8. **Account lockout must not reveal whether the account exists.** The login response must be identical for "incorrect password" and "account does not exist." The error message should be "Invalid email or password" in both cases.
9. **Password reset tokens must be single-use and time-limited.** Tokens expire in 15 minutes. After use, the token is invalidated. If the user requests a second reset, the first token is invalidated. The user must not be able to reuse a password reset token to change the password again.
10. **All authentication events must be logged.** Log every login success, login failure, logout, token refresh, password change, MFA enrollment, MFA verification, and account recovery. Include timestamp, user ID, source IP, user agent, and event type. Send logs to a SIEM system.

## Best Practices

1. **Use a well-vetted authentication library.** Do not build authentication from scratch. Use Passport.js (Node.js), Devise (Ruby), Django Allauth (Python), Spring Security (Java), or Firebase Auth. These libraries have been battle-tested and handle edge cases that custom code would miss.
2. **Implement account email verification.** When a user registers, send a verification email with a time-limited token. Do not allow the user to access sensitive features until the email is verified. Re-verify the email when the user changes their email address.
3. **Notify users of security events.** Send an email when: password is changed, email is changed, MFA is enrolled or removed, a new device logs in (based on user agent/IP fingerprint), or multiple failed login attempts are detected.
4. **Use a separate service for authentication.** Consider using a dedicated auth service (Auth0, Cognito, Keycloak, Firebase Auth) rather than building auth into each microservice. This centralizes security hardening, audit logging, and compliance.
5. **Implement credential stuffing detection.** Monitor for login attempts that use the same password across multiple accounts (suggests a credential stuffing attack). Use a list of known compromised passwords (Have I Been Pwned API) and reject them during registration and password change.
6. **Store only the last 4 digits of payment cards.** If you must store payment card information, store only the last 4 digits. The full number belongs in a PCI-compliant vault (Stripe, Braintree). Never log or expose the full card number.
7. **Use passkeys (WebAuthn) as a passwordless alternative.** Passkeys replace passwords with public-key cryptography. They are phishing-resistant and do not require the user to remember a password. Support passkeys for login as a primary or secondary factor.
8. **Implement a secure logout that invalidates all sessions.** When a user logs out, invalidate all their active sessions (not just the current session). This ensures that if the user forgot to log out on a shared computer, the session is not reusable.
9. **Use a separate cookie domain for authentication cookies.** Set authentication cookies on `auth.example.com` (or `api.example.com`) rather than on the main app domain. This reduces the attack surface for XSS-based cookie theft from other subdomains.
10. **Regularly audit authentication logs for suspicious patterns.** Review logs for: multiple failed logins across different accounts from the same IP, login success after a string of failures, logins from unexpected geographic locations, and token reuse (refresh token rotation violation).

## Anti-patterns

1. **Rolling your own password hashing.** Implementing password hashing with MD5 or a homemade algorithm. This is guaranteed to be insecure. Fix: use a well-known library (bcrypt, Argon2) with default parameters recommended by OWASP.
2. **Storing JWT tokens in localStorage.** localStorage is accessible to any JavaScript running on the same origin. An XSS vulnerability can exfiltrate tokens stored in localStorage. Fix: store tokens in HTTP-only cookies. If cookies are not feasible (mobile app), use platform secure storage (iOS Keychain, Android Keystore).
3. **Using the Implicit OAuth2 flow.** The Implicit flow returns the access token in the URL fragment. It is vulnerable to access token interception. It is deprecated by the OAuth 2.1 specification. Fix: use the Authorization Code flow with PKCE.
4. **Ignoring token expiration in the client.** The client never checks if the access token is expired before making an API call. The API rejects the expired token, and the client fails without attempting a refresh. Fix: implement automatic token refresh in the client's API client. Intercept 401 responses and attempt to refresh the token before retrying the request.
5. **Sessions that never expire.** A session cookie with no expiration (or a very long expiration like 1 year) and no inactivity timeout. If the session is stolen, the attacker has access indefinitely. Fix: set a session inactivity timeout (e.g., 24 hours of inactivity) and an absolute maximum session lifetime (e.g., 30 days).
6. **Not validating the redirect URI in OAuth2.** The OAuth2 provider accepts any redirect URI that starts with the registered domain. An attacker registers a malicious subdomain or path and intercepts the authorization code. Fix: register the exact redirect URI in the OAuth2 provider. Validate that the redirect URI matches exactly, character for character.
7. **Rate limiting only by IP.** An attacker uses a botnet with thousands of IPs to bypass IP-based rate limiting. The login endpoint is hammered with one attempt per IP. Fix: rate limit by username/email AND by IP. Use a sliding window and consider the combination of IP and username.
8. **Showing the user "Invalid password" vs "User not found."** A login form that tells the attacker whether the email exists in the system (different messages for "user not found" vs "wrong password"). This allows attackers to enumerate valid accounts. Fix: always return the same generic message: "Invalid email or password."

## Edge Cases

1. **Token reuse detection (refresh token theft).** The user's refresh token is stolen. The attacker uses it to get a new access token (and a new refresh token, due to rotation). The user then tries to use their (now-stale) refresh token and gets an error. The server detects that a refresh token was reused (the attacker used the original, the user used the stale one). The server invalidates all sessions for that user and forces re-login. The user is notified of potential token theft.
2. **Clock skew in JWT verification.** The server's clock is 30 seconds ahead of the token issuer's clock. Valid tokens are rejected as "not yet valid" (nbf) or "expired" (exp). Fix: allow a configurable clock skew tolerance (usually 30 seconds) in JWT verification. Use NTP on all servers to minimize clock drift.
3. **Account recovery when the user has no access to email.** The user cannot access their email (lost access, email provider down). The standard password reset flow is unavailable. Fix: provide alternative recovery methods: pre-generated recovery codes (given during account setup), phone-based recovery (SMS), or identity verification via support tickets with manual review.
4. **MFA device loss.** The user loses their phone (TOTP app and SMS both on the same phone). They cannot log in because they cannot complete MFA. Fix: during MFA enrollment, generate 10 one-time backup codes. The user stores these securely. One backup code can replace a single MFA challenge. After a backup code is used, it is invalidated. If the user exhausts all backup codes, they must contact support for manual recovery.
5. **Simultaneous login on multiple devices.** The user logs in on their phone and laptop simultaneously. The server creates two separate sessions. If the user changes their password on one device, should the other device's session be invalidated? Fix: invalidate all sessions except the current one on password change. Provide a "log out of all other devices" option in the account settings.
6. **OAuth2 account linking conflicts.** The user registers with email+password, then later tries to log in with Google OAuth2 using the same email. The system should link the accounts. But what if a different user already used that Google account? Fix: prompt the user to log in with their existing email+password first, then link the Google account. Prevent accidental account merging.
7. **Concurrent registration race condition.** Two users try to register the same email simultaneously. Both pass the email uniqueness check (before the INSERT) and both accounts are created. Fix: use a unique constraint on the email column in the database. The second INSERT will fail, and the registration endpoint will return an "email already taken" error.
8. **Session fixation.** An attacker sets the user's session ID to a known value before the user logs in. After login, the server continues using the same session ID, and the attacker now has access to the authenticated session. Fix: regenerate the session ID after successful login (and after any privilege level change). Invalidate the old session ID.

## Validation Checklist

- [ ] Passwords are hashed using Argon2id or bcrypt (cost >= 10) with a unique, random salt per password.
- [ ] Access tokens expire within 15 minutes; refresh tokens expire within 7 days.
- [ ] Refresh token rotation is implemented: old refresh token is invalidated when a new one is issued.
- [ ] Token reuse detection is implemented: if a rotated refresh token is used again, all sessions are invalidated.
- [ ] OAuth2 Authorization Code flow with PKCE is used for SPAs and mobile apps.
- [ ] The `state` parameter is used in all OAuth2 authorization requests and validated on callback.
- [ ] Login rate limiting is applied per username AND per IP with a sliding window.
- [ ] Login error messages are generic ("Invalid email or password") and do not reveal whether the account exists.
- [ ] Password reset tokens are single-use, time-limited (15 minutes), and invalidate previous tokens on re-request.
- [ ] All authentication events are logged with timestamp, user ID, source IP, and event type.
- [ ] Session IDs are regenerated after login to prevent session fixation.
- [ ] MFA enrollment requires verification of the device before enabling.
- [ ] Backup codes (minimum 10) are generated during MFA enrollment for account recovery.
- [ ] Authentication cookies use `Secure`, `HttpOnly`, and `SameSite=Strict` attributes.
- [ ] Account lockout is implemented after 5 failed attempts in 15 minutes.
- [ ] Users are notified by email of password changes, email changes, and MFA changes.

## Engineering Examples

### Example 1: Implementing JWT-Based Authentication with Refresh Tokens (Node.js)

A team builds a REST API for a single-page application. They need stateless authentication using JWTs with refresh tokens.

Implementation:

**Token issuance (login endpoint):**
- User submits email and password via POST `/api/auth/login`.
- Server validates credentials using bcrypt.compare.
- Server generates an access token (RS256, 15-minute expiry) containing `{ sub: userId, role: userRole, scope: "read write" }`.
- Server generates a refresh token (random 256-bit string, stored as a SHA-256 hash in Redis with a 7-day TTL). The refresh token is also returned to the client.
- Access token and refresh token are both set as HTTP-only cookies (`Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/api`).
- Response: `{ "message": "Login successful" }` (tokens are in cookies, not the response body).

**Token refresh:**
- Client calls POST `/api/auth/refresh`. The refresh token cookie is sent automatically.
- Server looks up the refresh token hash in Redis. If found and not expired, it:
  1. Deletes the old refresh token hash from Redis.
  2. Generates a new access token (15-minute expiry).
  3. Generates a new refresh token (256-bit random, stored in Redis with 7-day TTL).
  4. Sets both as new HTTP-only cookies.
- If the refresh token is not found in Redis (expired, invalidated, or reused), the server clears the cookies and returns 401. If it finds that the refresh token was already used (rotated) and now a stale token is presented, it detects token reuse and invalidates all sessions for the user.

**Logout:**
- Client calls POST `/api/auth/logout`.
- Server deletes the refresh token hash from Redis. The access token is short-lived and will expire naturally.
- Server clears auth cookies.

**Security:**
- Access tokens are never stored server-side. They are validated using the RS256 public key on every request.
- Refresh tokens are stored as SHA-256 hashes, not plaintext, in Redis. If Redis is compromised, refresh tokens cannot be extracted.
- The refresh endpoint is rate-limited (5 requests per minute per user).

### Example 2: Designing a Secure Password Reset Flow (Python/FastAPI)

A SaaS application needs a password reset flow that is resistant to token theft and enumeration attacks.

Implementation:

1. **Request reset**: User submits their email via POST `/api/auth/reset-password`. Regardless of whether the email exists, the server responds with "If an account with that email exists, a reset link has been sent." The server generates a cryptographically random 256-bit token, stores a SHA-256 hash of the token in Redis with a 15-minute TTL (key: `reset_token:{hash}`, value: `user_id`). The server sends an email with a link: `https://app.example.com/reset-password?token={raw_token}`.
2. **Validate token**: User clicks the link. The frontend calls GET `/api/auth/reset-password/validate?token={raw_token}`. The server hashes the raw token, looks it up in Redis. If found and not expired, the server responds with a temporary reset authorization code (another short-lived JWT, 5-minute expiry). If not found, the server responds with "Invalid or expired reset link."
3. **Reset password**: User submits the new password and the reset authorization code via POST `/api/auth/reset-password/confirm`. The server validates the authorization code, validates the new password against the password policy (min 8 chars, at least one number and one uppercase letter, not in the top 10,000 common passwords), hashes the new password with bcrypt, updates the user record, deletes the reset token from Redis, invalidates all active sessions for the user, and sends a confirmation email: "Your password has been changed. If you did not request this, please contact support."
4. **Token expiration**: The reset token expires in 15 minutes. If the user requests another reset, the previous token is invalidated. A user cannot have multiple active reset tokens.

**Prevention of enumeration**: The "If an account exists" message is identical for both existing and non-existing accounts. The response time is also consistent: the server always takes 500ms (with a deliberate delay for non-existing accounts) to prevent timing-based enumeration.

### Example 3: Integrating OAuth2 with a Third-Party Provider (Google)

A team adds "Sign in with Google" to their application. They follow the Authorization Code flow with PKCE.

Implementation:

1. **Registration**: The team registers their application in the Google Cloud Console with the exact redirect URI: `https://app.example.com/auth/google/callback` (not `https://app.example.com/*`, not `https://*.example.com`).
2. **Authorization request**: The user clicks "Sign in with Google". The frontend generates a `code_verifier` (cryptographically random 128-character string) and stores it in sessionStorage. It computes the `code_challenge` = base64url(SHA256(code_verifier)). It redirects the user to Google's authorization endpoint with `response_type=code`, `client_id`, `redirect_uri`, `scope=openid profile email`, `state` (random string stored in sessionStorage), and `code_challenge_method=S256`.
3. **Callback**: Google redirects to the callback URL with `code` and `state`. The backend validates `state` against the stored value. It then exchanges the `code` for tokens by calling Google's token endpoint with `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `client_secret`, and `code_verifier` (retrieved from the frontend via a session lookup mechanism or by having the frontend send it separately).
4. **User info**: The backend decodes the ID token (JWT signed by Google) and validates the `iss`, `aud`, and `exp` claims. It extracts the user's email, name, and profile picture. If the email is already registered in the app, the backend links the Google account to the existing user. If not, it creates a new user account.
5. **Session creation**: The backend creates a session (or issues JWTs) for the authenticated user, exactly as in Example 1. The user is redirected to the app's dashboard.
6. **Account linking edge case**: If the user's email already exists but is associated with a different OAuth provider (e.g., the user signed up with Facebook), the backend prompts the user to log in with their existing method first, then link Google from the account settings page.

This flow is secure against CSRF (via `state`), authorization code interception (via PKCE), and provides a seamless user experience.
