# Input Validation

## Purpose

To provide a comprehensive framework for validating, sanitizing, and encoding all data entering a software system. This skill covers whitelist vs. blacklist validation, validation layers (client, API, service, database), sanitization, encoding, type coercion, schema validation, custom validators, cross-field validation, and internationalization of validation messages. The goal is to eliminate injection attacks, data corruption, and logic errors by ensuring that every input is validated against an explicit, strict schema at every trust boundary before it is processed or stored.

## Responsibilities

- Implement whitelist validation (allow known-good patterns) as the primary validation strategy. Blacklist validation (block known-bad patterns) is used only as a secondary defense layer.
- Apply validation at every layer: client-side for instant user feedback, API layer for request integrity, service layer for business rule validation, and database layer for referential integrity and constraint enforcement.
- Sanitize input by removing or escaping characters that could be interpreted as code in the target context (HTML, SQL, JavaScript, shell commands, LDAP, XML).
- Encode output based on the output context: HTML entity encoding for HTML output, URL encoding for URLs, JavaScript string encoding for JS contexts, and CSS encoding for CSS contexts.
- Perform type coercion safely: convert strings to numbers, dates, and booleans with explicit error handling for invalid conversions. Never rely on dynamic type coercion (JavaScript's `==`, PHP's automatic type coercion).
- Define and enforce schema validation for every API request body, query parameter, and path parameter using a schema definition language (Zod, Joi, Pydantic, JSON Schema).
- Write custom validators for domain-specific rules that cannot be expressed with schema languages alone: e.g., "the end date must be after the start date," "the discount cannot exceed 50% for non-premium users," "the IBAN must pass checksum validation."
- Implement cross-field validation: rules that depend on the values of multiple fields (passwords must match, shipping address is required when billing address is different, start date must be before end date).
- Internationalize validation messages: error messages must be translatable, use correct grammar for the locale, and avoid technical jargon. Messages must include the field name (localized) and the expected format.
- Validate file uploads by extension, MIME type (content inspection), file size, dimensions (for images), and content scanning for malware.

## Decision Process

1. **Identify the trust boundary.** Determine where the data is coming from: public internet (untrusted), authenticated API client (partially trusted), internal microservice (trusted but validate), or database (trusted but validate on read for defense in depth). The more untrusted the source, the more validation layers required.
2. **Define the expected schema.** For every input (request body, query parameters, path parameters, file upload, message queue event), write a schema that defines the expected structure, types, constraints, and defaults. Use a schema library (Zod, Joi, Pydantic, JSON Schema).
3. **Choose whitelist validation.** Define the set of allowed values, patterns, or formats. For example, for a `countryCode` field, whitelist the ISO 3166-1 alpha-2 codes. For a `username` field, define an explicit regex: `/^[a-zA-Z0-9_]{3,30}$/`.
4. **Select sanitization strategy.** For fields that will be rendered in HTML, apply HTML entity encoding. For fields stored in the database, use parameterized queries (no manual sanitization of SQL needed). For fields included in shell commands (avoid this if possible), escape shell metacharacters.
5. **Design cross-field validation.** Identify validation rules that involve multiple fields. These are best performed in the service layer after individual field validation has passed. Examples: password confirmation, date range validity, conditional required fields.
6. **Determine error message strategy.** For each field, define a human-readable error message that explains what is wrong and how to fix it. Messages must be internationalizable. Use ICU message format or a similar standard for pluralization and gender.
7. **Plan for type coercion.** Decide which type coercions are safe: converting a string `"123"` to number `123` is safe with error handling. Converting `"true"` to boolean `true` is safe with error handling. Never silently coerce invalid values (e.g., `"abc"` to `0` or `NaN`).
8. **Implement file upload validation.** For every file upload endpoint, validate: file extension against an allowlist, MIME type by content inspection (not just the Content-Type header), file size against a maximum (in bytes), image dimensions (if applicable), and malware scanning (if available).
9. **Test validation with edge cases.** Write tests that send: empty values, null values, missing fields, extremely long strings, Unicode homoglyphs, SQL injection payloads, XSS payloads, NoSQL injection payloads, and boundary values (max length, min length, max number, min number).
10. **Monitor validation failures.** Log every validation failure with the field name, received value (sanitized, if it contains sensitive data), error message, and the client's IP/user ID. Track validation failure rates per endpoint. A spike may indicate an attack probe or a broken client.

## Inputs

- API request bodies (JSON, form-data, XML), query parameters, path parameters, and headers.
- File uploads: images, documents, CSVs, any binary data.
- Message queue events: JSON payloads from internal or external systems.
- Webhook payloads from third-party services.
- User registration data: email, password, name, address, phone number.
- Search queries and filter parameters.
- Configuration values: environment variables, feature flags, admin settings.

## Outputs

- Validation schemas for every API endpoint, defined in a schema library (Zod, Joi, Pydantic, JSON Schema).
- Custom validator functions for domain-specific rules.
- Sanitization/encoding utilities: HTML entity encoding function, URL encoding function, shell-argument escaping function, SQL parameterization wrapper.
- Cross-field validation logic in the service layer, executed after field-level validation.
- Localized error message strings: translations for each supported locale, in a standard format (ICU messages, gettext, YAML).
- File upload validation middleware: validates extension, MIME type (content inspection), size, and dimensions.
- Validation test suite: unit tests for every schema, custom validator, and edge case, plus integration tests that send malformed input to endpoints.
- Monitoring dashboard: validation failure rate per endpoint, most common validation errors, and alerts for unusual spikes.

## Rules

1. **Whitelist validation is mandatory for all free-form text fields.** Define an explicit allowlist of characters, lengths, and patterns. For example, `username` must match `/^[a-zA-Z0-9_]{3,30}$/`. `email` must match the RFC 5321 email pattern (or use a well-tested email validation library).
2. **Blacklist validation must never be the sole validation strategy.** Blocking known-bad patterns (SQL keywords, `<script>`, `../`) is insufficient—attackers will find bypasses. Always use whitelist validation as the primary defense.
3. **All input must be validated at the API layer before reaching the service layer.** The schema validation at the API layer validates structure and types. The service layer validates business rules. Never skip the API layer validation.
4. **Type coercion must be explicit, never implicit.** Parse strings to numbers with `parseInt(value, 10)` or `Number(value)` and check for `NaN`. Parse JSON with `JSON.parse()` in a try/catch. Never rely on JavaScript's `==` or PHP's automatic type coercion.
5. **Validation must reject, not sanitize.** If a value does not match the schema, reject the entire request with a 400 validation error. Do not silently truncate, remove characters, or modify the user's input. Silently modifying input confuses users and can hide security issues.
6. **Error messages must not leak implementation details.** A validation error message must say "Invalid email format," not "Regex mismatch at position 5 in pattern /^[a-zA-Z0-9.../"
7. **All database queries must use parameterized statements or prepared statements.** String interpolation of user input into SQL queries is forbidden. Manual escaping functions are insufficient. Use the parameterization features of your database driver or ORM.
8. **File extensions must be validated against an allowlist, not a blocklist.** Allow only specific extensions (`.jpg`, `.png`, `.gif`, `.pdf`). Do not block `.exe`, `.php`, `.html` (attackers will find an extension you did not block). Verify the MIME type by inspecting the file's content (magic bytes), not the Content-Type header.
9. **Cross-field validation must be performed in the service layer, not the API layer.** Schema validation libraries can handle simple cross-field rules (e.g., `password === confirmPassword`), but complex rules that require database lookups or domain logic belong in the service layer.
10. **Validation schemas must be the source of truth for API documentation.** Generate OpenAPI schemas from your validation schemas (or vice versa). The schema defines the contract between the client and server. Both sides must stay in sync.

## Best Practices

1. **Use a schema validation library as the single source of truth.** Define all request and response schemas using Zod, Pydantic, or Joi. Derive TypeScript/Python types from the schema. Generate OpenAPI documentation from the schema. This eliminates drift between validation, types, and documentation.
2. **Validate at the boundary, not deep inside the code.** Validate input as soon as it enters the system (in the controller/middleware). Do not pass raw, unvalidated input through multiple layers before validation.
3. **Define reusable validators.** Create a library of common validators: `email()`, `phone()`, `url()`, `isoDate()`, `uuid()`, `hexColor()`, `creditCard()`. Use them across all endpoints. This ensures consistent validation rules.
4. **Provide clear, specific validation messages.** "Age must be between 18 and 120" is better than "Invalid age." "Password must be at least 8 characters and contain one uppercase letter" is better than "Invalid password."
5. **Use input masking for sensitive fields.** Do not log or expose the actual value of sensitive fields (passwords, credit card numbers, secrets). Log "password: [FILTERED]" instead. Mask the input in validation error messages: "The field 'password' is too short."
6. **Validate the structure before the content.** First, validate that the input is valid JSON (try to parse). Then, validate that all required top-level keys exist. Then, validate the types of each field. Finally, validate the constraints (length, range, pattern). This produces clear error messages at each stage.
7. **Implement a validation error response format.** Use a consistent format: `{ "errors": [{ "field": "email", "message": "Invalid email format", "code": "INVALID_FORMAT" }] }`. Include a machine-readable `code` so the client can handle errors programmatically.
8. **Limit input size at the HTTP server level.** Set a maximum request body size (e.g., 1MB) at the web server or framework level (Nginx `client_max_body_size`, Express `body-parser` limit). Reject oversized requests before they reach the application.
9. **Validate query parameters and path parameters.** These are often overlooked. A path parameter like `/users/:id` should validate that `:id` is a valid UUID or positive integer. Query parameters should be validated against a schema, just like the request body.
10. **Write negative tests.** For every validation rule, write a test that sends an invalid value and asserts that the response is 400 with the expected error message. Cover edge cases: empty string, null, undefined, very long string, special characters, Unicode, SQL injection patterns, XSS patterns.

## Anti-patterns

1. **Validating only on the client side.** The JavaScript form validation runs, but the API accepts any value. An attacker bypasses the browser and sends raw HTTP requests. Fix: always validate on the server. Client-side validation is for UX only.
2. **Using regular expressions for everything.** A monolithic regex that tries to validate an email address, URL, or HTML tag. Regex is error-prone for complex formats. Fix: use well-tested validation libraries. Use regex only for simple, well-defined patterns (e.g., alphanumeric usernames).
3. **Silently truncating user input.** Accepting a 200-character string and silently truncating it to 50 characters without telling the user. The user thinks their data was saved but it was truncated. Fix: reject input that exceeds the maximum length with a clear error message.
4. **Sanitizing instead of validating.** Accepting any input and running it through a sanitizer (strip tags, remove "bad" characters). This is unpredictable—the user's input may be modified in unexpected ways. Fix: validate that the input matches the expected format. Reject if it does not.
5. **Trusting the Content-Type header for file uploads.** Checking `file.type === 'image/jpeg'` in the browser and trusting it on the server. The Content-Type header can be spoofed. Fix: inspect the file's magic bytes (first few bytes of the file) to determine the actual type.
6. **Not validating array lengths.** Accepting an array of 100,000 items because there is no maximum length validation. This can cause memory exhaustion, slow processing, and denial of service. Fix: set a `maxItems` constraint on every array field.
7. **Error messages that change based on the reason for failure.** "Email not found" vs. "Incorrect password" — these different messages allow attackers to enumerate valid emails. Fix: use a single generic message for authentication failures.
8. **Not handling Unicode normalization.** A user enters "café" using composed form (é as a single character) and another user searches for "café" using decomposed form (e followed by combining acute accent). The strings do not match. Fix: normalize Unicode to a consistent form (NFC or NFD) before validation and storage.

## Edge Cases

1. **Null vs. undefined vs. empty string.** A JSON field can be `null`, `undefined` (omitted), empty string `""`, or have a value. Each should be handled differently: `null` means "set to null," omitted means "do not update," empty string may mean "clear the value." The schema must explicitly define which values are allowed.
2. **Extremely long strings beyond the maximum limit.** A user pastes a 1MB string into a 255-character field. The application should reject with a 400 error, not attempt to truncate, process, or store the oversized input.
3. **Unicode homoglyphs.** The username "pаypal" looks like "paypal" but uses Cyrillic 'а' instead of Latin 'a'. An attacker registers a homoglyph domain or username to impersonate another user. Fix: optionally normalize Unicode confusables. For security-critical fields (email, domain), consider blocking homoglyphs or restricting to ASCII.
4. **SQL/NoSQL injection payloads in string fields.** An attacker sends `' OR 1=1; --` as a search term. With parameterized queries, this is safe. But if the application uses a search engine (Elasticsearch) that constructs queries differently, the payload may cause injection. Fix: validate search inputs with whitelist patterns. Use parameterized queries for SQL. Use query builders for NoSQL/Elasticsearch that escape special characters.
5. **Array with mixed types.** An endpoint expects `[1, 2, 3]` but receives `[1, "two", null]`. The schema validator should reject this. TypeScript's `number[]` type provides no runtime protection—the schema validation library does.
6. **Deeply nested JSON objects.** An attacker sends a deeply nested JSON object (100 levels deep) to cause stack overflow or excessive CPU usage during parsing. Fix: set a maximum nesting depth in the JSON parser (e.g., `JSON.parse(str, { maxDepth: 20 })` or use a library that enforces depth limits).
7. **Integer overflow and underflow.** An attacker sends `999999999999999999999999999999999999` as the `price` field. In JavaScript, this exceeds `Number.MAX_SAFE_INTEGER` and is silently rounded. Fix: use `bigint` for financial values or validate that the number is within the safe integer range (`Number.isSafeInteger`).
8. **Validation of read-only fields.** An API endpoint should not allow the client to set `createdAt`, `id`, or `lastModified`. But the client includes these fields in the request body. Fix: define a "create" schema (without read-only fields) and an "update" schema (with optional read-only fields that are ignored or rejected).

## Validation Checklist

- [ ] Every API endpoint has a request validation schema defined using a schema library.
- [ ] Whitelist validation is used for all free-form text fields (allowed characters, length, pattern).
- [ ] Blacklist validation is used only as a secondary defense layer, never the primary.
- [ ] All input is validated at the API layer before reaching the service layer.
- [ ] Type coercion is explicit and handles errors (e.g., `parseInt` with NaN check).
- [ ] Validation errors return 400 with a consistent format: `field`, `message`, `code`.
- [ ] Error messages are localized, specific, and do not leak implementation details.
- [ ] Database queries use parameterized statements (no string interpolation of input).
- [ ] File uploads are validated by extension allowlist, content inspection (magic bytes), and file size.
- [ ] Maximum request body size is enforced at the HTTP server level.
- [ ] Array and object fields have `minItems`/`maxItems` and `minProperties`/`maxProperties` constraints.
- [ ] Cross-field validation is implemented in the service layer for complex rules.
- [ ] Validation schemas are the source of truth for types and API documentation.
- [ ] Unicode normalization (NFC/NFD) is handled consistently.
- [ ] Negative tests exist for every validation rule, covering edge cases (empty, null, overflow, injection).
- [ ] Sensitive fields are masked in logs and validation error responses.

## Engineering Examples

### Example 1: Validating a User Registration Form at Every Layer (React + Node.js + PostgreSQL)

A user registration form collects name, email, password, age, and country. Validation is applied at every layer.

**Client-side (React + React Hook Form + Zod):**
```typescript
const registrationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128).regex(/[A-Z]/).regex(/[0-9]/),
  age: z.number().int().min(18).max(120),
  country: z.string().length(2) // ISO 3166-1 alpha-2
});
```
The form validates on blur and on submit. Error messages are displayed inline below each field. The submit button is disabled while validation errors exist.

**API layer (Node.js + Express + Zod):**
```typescript
const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  age: z.number().int().positive().max(150),
  country: z.string().length(2).toUpperCase()
});

// Middleware
function validate(schema: ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        errors: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

router.post('/register', validate(registrationSchema), registrationController.register);
```

**Service layer:**
```typescript
async function registerUser(data: RegistrationDTO) {
  // Business rule validation
  if (data.age < 13) {
    throw new ValidationError('age', 'MINIMUM_AGE', 'Users must be at least 13 years old');
  }
  // Cross-field validation
  // (none for registration, but could check password == confirmPassword)
  // Check uniqueness
  const existing = await userRepo.findByEmail(data.email);
  if (existing) {
    throw new ValidationError('email', 'ALREADY_EXISTS', 'This email is already registered');
  }
  // Create user
  return userRepo.create(data);
}
```

**Database layer (PostgreSQL):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 2),
  email VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^.+@.+\..+$'),
  password_hash VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 13 AND age <= 150),
  country CHAR(2) NOT NULL REFERENCES countries(code),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The database provides the final layer of defense: NOT NULL constraints, CHECK constraints for ranges, UNIQUE constraint for email, and a foreign key for country. Even if all upper layers fail, the database will reject invalid data.

### Example 2: Preventing NoSQL Injection Through Input Validation (Node.js + MongoDB)

A search endpoint for a product catalog uses MongoDB. The endpoint accepts a `q` query parameter that is used in a text search.

**Vulnerable code:**
```javascript
router.get('/search', async (req, res) => {
  const query = { $where: `this.name.includes("${req.query.q}")` };
  const results = await Product.find(query);
  res.json(results);
});
```
An attacker sends `q = "a"; sleep(5000); //"` causing a NoSQL injection that pauses the database for 5 seconds.

**Secure code with validation and parameterized queries:**
```javascript
const searchSchema = z.object({
  q: z.string().trim().min(1).max(100)
    .regex(/^[a-zA-Z0-9\s\-']+$/, 'Search query can only contain letters, numbers, spaces, hyphens, and apostrophes'),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

router.get('/search', validate(searchSchema), async (req, res) => {
  const { q, category, page, limit } = req.validatedQuery;

  // Use MongoDB's text search with parameterized query
  const filter = { $text: { $search: q } };
  if (category) {
    filter.category = category;
  }

  const results = await Product.find(filter)
    .skip((page - 1) * limit)
    .limit(limit);

  res.json(results);
});
```

Additional layers:
- The `q` field is validated against a whitelist regex, blocking any attempt to inject MongoDB operators (`$where`, `$ne`, `$gt`, `$regex`, etc.).
- The `page` and `limit` fields are coerced to numbers and bounded (no negative pages, no unlimited limits).
- MongoDB's `$text` operator is parameterized—the query string is passed as a value, not concatenated into a query object.
- An allowlist of permitted query parameters is defined. Extra parameters (like `$where`) are stripped by the schema validation.

### Example 3: Implementing File Upload Validation for Images (Python/FastAPI)

A user avatar upload endpoint accepts images. The team implements validation at multiple layers.

**Endpoint implementation:**
```python
from fastapi import FastAPI, UploadFile, File, HTTPException
import filetype  # library for MIME type detection by magic bytes
from PIL import Image
import io

app = FastAPI()

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_IMAGE_DIMENSIONS = (4096, 4096)  # max width, height

@app.post("/api/users/me/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    # 1. File size validation (before reading the file)
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File size exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit")

    # 2. Extension validation (whitelist)
    import os
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File extension '{ext}' is not allowed. Allowed: {ALLOWED_EXTENSIONS}")

    # 3. MIME type validation by magic bytes
    kind = filetype.guess(contents)
    if kind is None or kind.mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, f"File type '{kind.mime if kind else 'unknown'}' is not allowed")

    # 4. Image dimension validation
    try:
        image = Image.open(io.BytesIO(contents))
        width, height = image.size
        if width > MAX_IMAGE_DIMENSIONS[0] or height > MAX_IMAGE_DIMENSIONS[1]:
            raise HTTPException(400, f"Image dimensions {width}x{height} exceed maximum {MAX_IMAGE_DIMENSIONS[0]}x{MAX_IMAGE_DIMENSIONS[1]}")
    except Exception:
        raise HTTPException(400, "File is not a valid image")

    # 5. Re-encode the image to strip EXIF data and potential payloads
    output = io.BytesIO()
    image = image.convert("RGB")  # remove alpha channel and convert to safe format
    image.save(output, format="JPEG", quality=85)
    sanitized_contents = output.getvalue()

    # 6. Store with a random filename
    import uuid
    filename = f"{uuid.uuid4()}.jpg"

    # Store the file (e.g., to S3 or local storage)
    # storage.save(filename, sanitized_contents)

    return {"avatar_url": f"/avatars/{filename}"}
```

Additional considerations:
- The file is re-encoded as a sanitized JPEG, which strips EXIF metadata (which could contain GPS location, camera serial number) and any embedded JavaScript/payloads in the original file.
- The file is stored with a UUID-based filename, preventing path traversal (the filename is not user-controlled).
- The storage path is outside the web root. A separate endpoint serves the file with the correct Content-Type header and Content-Disposition if needed.
- A cron job scans stored avatars for malware (ClamAV) periodically.
