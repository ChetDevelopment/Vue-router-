# Data Export & Import Patterns

## Purpose

Define a systematic approach to building data export and import features that handle large volumes reliably, provide clear progress feedback, validate data rigorously, and recover gracefully from failures. This skill covers the full spectrum from generating small CSV exports on demand to batch-importing millions of records with comprehensive error reporting. The goal is data pipelines that are robust, observable, and produce predictable results whether processing 10 records or 10 million.

## Responsibilities

- Generating exports in common formats (CSV, Excel, PDF) with proper formatting, escaping, and encoding (UTF-8 BOM for Excel compatibility with CSV).
- Streaming large exports (millions of rows) without loading all data into memory, using cursor-based database iteration and streaming HTTP responses or writing to temporary files.
- Providing async export workflows: when an export takes longer than 30 seconds, queue it as a background job, notify the user via email or in-app notification when the file is ready, and clean up expired export files.
- Validating imported data with clear, actionable error messages: field-level validation, row-level error reporting, and summary statistics (X rows imported, Y rows with errors, Z rows skipped).
- Supporting rollback on import failure: for transactional imports (financial data, critical records), roll back the entire batch if any row fails; for bulk imports, commit valid rows and report invalid rows separately.
- Implementing header mapping: allowing users to map columns from their uploaded file (CSV columns "First Name", "Last Name") to system fields (`firstName`, `lastName`) with an interactive mapping UI.
- Handling large file chunked imports: splitting multi-gigabyte files into manageable chunks, processing each chunk in a background job, and tracking overall progress across chunks.
- Providing progress tracking for long operations: exports show "Processing row 150,000 of 1,200,000" or percentage; imports show "Validating...", "Importing batch 3 of 20", "Generating error report".
- Building column mapping UI: displaying a sample of the user's uploaded data, allowing drag-and-drop or dropdown mapping of source columns to destination fields, auto-detecting common column names.
- Managing export formats: CSV (with UTF-8 BOM and proper quoting), Excel (.xlsx using a streaming library), PDF (with pagination for large reports), and structured formats (JSON, XML) for API consumers.

## Decision Process

1. Determine data volume: estimate the maximum number of rows and total file size for exports/imports. Under 10,000 rows: synchronous processing. 10,000 to 500,000 rows: background job with progress tracking. Over 500,000 rows: streaming/chunked processing with async notification.
2. Choose export format: CSV for universal compatibility and large volumes (streaming-friendly). Excel for business users who need formatting and multiple sheets. PDF for formatted reports (invoices, statements). JSON for API consumers. Generate format-specific configurations (CSV delimiter, Excel column widths, PDF page size).
3. Design export streaming: use database cursor iteration (Postgres `DECLARE CURSOR` or `cursor-based pagination`) rather than loading all rows into memory. Stream rows to the response (HTTP chunked transfer encoding) or write to a temporary file in chunks.
4. Implement async export workflow: for exports over 30 seconds, create an `ExportJob` record, queue the export, poll for completion from the frontend (or get notified via WebSocket), and provide a download link with expiration (24 hours).
5. Design import validation pipeline: parse the file, validate headers, validate each row against the schema, collect all errors (not just the first error), return a structured error report with row numbers, field names, and descriptive messages.
6. Choose import strategy: transactional (all-or-nothing) for financial data where partial imports are unacceptable. Batch (valid rows imported, invalid rows reported) for bulk data where hitting 95% success is acceptable. Preview mode: validate and report errors without importing.
7. Implement header mapping: when uploading a file, show the first 5 rows as a preview. Auto-detect common header names (email, e-mail, Email Address -> email). Allow the user to match unmapped columns manually via a dropdown. Persist mapping templates for repeated imports.
8. Design chunked import for large files: split the uploaded file into chunks of 5000 rows each, enqueue each chunk as a separate background job, track overall progress (chunks completed / total chunks), and aggregate per-chunk error reports into a single summary.
9. Implement progress tracking: for exports, report `rowCount / totalRows * 100` at 1000-row intervals or every 5 seconds. For imports, report `(completedChunks / totalChunks) * 100` plus `(errors / totalRows)` for error rate. Store progress in the job record for polling.
10. Plan file cleanup: export files are temporary and expire after 24 hours (delete via cron). Import error reports are available for 7 days. Archive logs of imports/exports for audit purposes.

## Inputs

- Data schema: field names, types, constraints (required, unique, max length, regex), and descriptions for the data being exported or imported.
- Format requirements: CSV delimiter (comma, tab, semicolon), encoding (UTF-8, UTF-8 BOM for Excel), Excel template, PDF layout design, and any format-specific configuration.
- Volume estimates: expected number of rows, file sizes, and frequency (daily exports of 50K rows, monthly exports of 2M rows).
- Export/Import triggers: user-initiated via UI (export button), scheduled (daily CSV export to SFTP), or API-triggered (webhook calls import endpoint).
- Mapping templates: existing header-to-field mappings that can be reused for repeated imports from the same source.
- Compliance requirements: audit logging of all imports/exports, data retention policies for exported files, PII handling (masking sensitive fields in exports).

## Outputs

- Export service: a service that supports exporting data in multiple formats with streaming, progress reporting, and async notification for large exports.
- Import service: a service that validates uploaded files, processes rows in chunks, reports errors with row/field granularity, and supports both transactional and batch modes.
- Column mapping UI: a frontend component that displays a preview of uploaded data, allows column-to-field mapping with auto-detection, and stores mapping templates.
- Progress components: reusable progress indicators for export (percentage, row count) and import (chunks, rows processed, errors count) with polling or WebSocket updates.
- Error report generator: a utility that produces structured error reports (CSV or JSON) showing each failed row, the field that failed, the invalid value, and the validation rule violated.
- Async notification system: a notification sent via email or in-app when an async export is ready, with a secure download link that expires after 24 hours.
- File cleanup cron: a scheduled job that removes expired export files and import error reports based on their TTL.

## Rules

1. Never load all export data into memory — always stream rows from the database and write to output in chunks (using cursors, pagination, or batch fetching), otherwise a 10M row export will crash the server with OOM.
2. Always include a UTF-8 BOM at the start of CSV files — without it, Excel opens UTF-8 CSVs with garbled characters for non-ASCII text (accents, Cyrillic, CJK).
3. Always escape CSV fields properly — wrap fields containing commas, quotes, or newlines in double quotes, and double-escape internal quotes. Use a CSV library (Papa Parse, \`csv\` npm package), never manual string concatenation.
4. Never accept an import file without validating its structure first — validate headers, column count, row count, and encoding before processing any data rows. Reject malformed files immediately with a clear error message.
5. Always report ALL validation errors per row, not just the first error — finding one error at a time forces users to fix, re-upload, find the next error, fix, re-upload, creating a frustrating cycle.
6. Never process an import without a preview step — show users a preview of how their data will be mapped with a sample of rows (first 5-10), highlighting any unmapped columns or validation warnings, and let them confirm before committing.
7. Always provide a downloadable error report for failed imports — the report must include original row data, field-level error messages, and the row number, formatted as CSV so users can fix errors in bulk.
8. Never leave exported files on disk indefinitely — set a TTL (24 hours for user exports, 7 days for admin exports) and clean them up with a scheduled job to avoid filling storage.
9. Always log every import and export with user ID, timestamp, row count, file name, and success/failure status — data movement operations are critical for audit trails and debugging.
10. Never expose sensitive/PII data in exports unless the user has explicit permission — mask or exclude password hashes, API keys, internal IDs, and other non-public fields from user-facing export features.

## Best Practices

1. Use streaming CSV/Excel libraries (csv-parser, csv-writer, exceljs/stream) that process data row by row without loading the entire dataset into memory — critical for exports over 100K rows.
2. Implement dry-run import mode: process and validate the entire file without committing any data, then show a full error report. Users can fix errors and re-upload with confidence.
3. Use a state machine for import status: `uploaded → validating → ready (preview) → confirmed → processing → completed / partially_completed / failed`. Track the current state and allow transitions only in order.
4. Provide import templates: generate a template CSV/Excel file with the correct headers, column descriptions, accepted values (dropdown validation in Excel), and example rows. Users fill in data against this template.
5. Use database transactions for imports where consistency is critical (financial data, user accounts): wrap each batch in a transaction, roll back on any error, and report the exact row that caused the failure.
6. Implement column mapping persistence: after a user maps columns once for a given import type (e.g., "Import Users from Salesforce"), save the mapping as a template they can reuse or share with team members.
7. Generate PDF exports using a template engine (Puppeteer with HTML template, EJS, or a reporting library) rather than a low-level PDF library — templates are easier to maintain and style.
8. Use gevent/background workers for async exports: the API returns immediately with an export ID and status URL, the background worker processes the export, and the frontend polls or subscribes for completion.
9. Validate encoding on upload: check that the uploaded file is valid UTF-8 (or the expected encoding). Invalid encoding can cause silent data corruption — detect and report it before processing.
10. Implement rate limiting for imports: limit the number of concurrent imports per user (e.g., 1 at a time) and globally (e.g., 5 concurrent) to prevent resource exhaustion from large imports.

## Anti-patterns

1. Generating exports by loading all records into an array and then writing the file — for 2M rows, this uses gigabytes of memory and will OOM the server. Always stream.
2. Importing data row by row in a single HTTP request — for 100K rows, this takes minutes and the HTTP connection will time out. Always use background jobs for any import over 1000 rows.
3. Showing a single generic error message for import failures ("Import failed due to validation errors") without specifying which rows or fields — users have no way to fix the data.
4. Using \`eval()\` or dynamic column mapping that executes user-provided expressions — this is a code injection vulnerability. Use a safe column-name-to-field-name lookup, never execute user input.
5. Accepting imports without checking for header row or column names — if users upload a file with no headers, data may be mapped to wrong columns. Reject files without recognizable headers.
6. Overwriting existing data on import without confirmation or diff preview — users may accidentally overwrite hundreds of records. Show a diff (rows to create, update, delete) and require confirmation.
7. Generating all PDF pages at once for large reports — a 500-page PDF generated in memory uses excessive RAM. Use streaming PDF generation or limit page count.
8. Using the same export endpoint for both small CSV downloads and large async exports — small exports get the overhead of async notification, large exports return a timeout. Use separate endpoints or auto-detect based on row count.

## Edge Cases

1. File with no data rows (header only): the import should accept it and report "0 rows processed" rather than failing. The export should return a file with headers and a "No data" message or empty body.
2. Character encoding issues: a CSV uploaded as ISO-8859-1 (Western European) but parsed as UTF-8 produces garbled text. Detect encoding on upload (using `jschardet` or similar) and convert to UTF-8 before processing.
3. Extremely long cell values: a cell with 100,000 characters (JSON blob, base64 image) can exceed database column limits. Truncate or reject cells above the column's max length with a specific error message.
4. Duplicate detection: during import, two rows may have the same unique key (email, SKU). The import should detect duplicates within the same file and optionally within the existing database, and report them as errors.
5. Import file with mixed data types in the same column: "10", "N/A", "15" in a numeric column. Each value should be validated independently — "N/A" fails, the other two succeed. The error report shows only the failing row.
6. Column mapping ambiguity: "email" could map to `email` or `username`. The auto-detection should choose the most likely match and flag ambiguous mappings for user review.
7. Exports with related data (JOINs): exporting orders with line items requires denormalizing or using multiple sheets. Use Excel's ability to have multiple sheets, or generate a join query and repeat order data for each line item.
8. Import file with formulas (Excel): if a cell contains `=SUM(A1:A10)` instead of a value, the import should either evaluate the formula (dangerous) or reject it with "Formulas are not supported; please paste values only."

## Validation Checklist

- [ ] Export data is streamed (not loaded into memory) — verified by checking memory usage during a 500K-row export (should stay under 100MB).
- [ ] CSV files include UTF-8 BOM and proper field escaping (commas, quotes, newlines within fields).
- [ ] Async exports create a job, notify user on completion, provide a download link that expires in 24 hours, and clean up expired files.
- [ ] Import validates file structure (headers, row format, encoding) before processing any data rows.
- [ ] Import reports all validation errors per row (not just first error) — downloadable as a CSV error report with row number, field name, invalid value, and error message.
- [ ] Import supports dry-run/preview mode: validates the entire file and shows error report without committing any data.
- [ ] Column mapping UI shows a preview of uploaded data (first 5 rows), auto-detects common headers, and allows manual mapping with persistence.
- [ ] Large imports (>10K rows) are processed in background jobs as chunks, with progress tracking per chunk and an aggregated completion percentage.
- [ ] All imports and exports are logged for audit: user, timestamp, row count, file name, success/failure status, and (for imports) counts of created/updated/error rows.
- [ ] Temporary export files are cleaned up by a scheduled job based on their TTL (24 hours default).

## Engineering Examples

### Example 1: Building an Async CSV Export for Millions of Records

A CRM system allows users to export all contacts (up to 5 million records). When the user clicks "Export as CSV", the frontend calls `POST /api/exports` with `{ format: "csv", filters: { tags: ["customer"] } }`. The server creates an `Export` record with status "queued" and enqueues a `generate_export` job with the export ID. The API returns `{ exportId: 123, status: "queued" }`. The frontend polls `GET /api/exports/123` every 5 seconds, which returns `{ status: "processing", progress: 45, rowCount: 2250000, totalRows: 5000000 }`. The job handler uses a PostgreSQL cursor (`DECLARE export_cursor CURSOR FOR SELECT * FROM contacts WHERE ...`) and streams rows to a CSV file in chunks of 1000 rows. The CSV is written with UTF-8 BOM, proper quoting, and chunked writes. When all rows are written, the job uploads the CSV to S3, generates a signed URL with 24-hour expiration, updates the export status to "completed" with the download URL, and sends an in-app notification: "Your export of 5,000,000 contacts is ready. Download link expires in 24 hours." The frontend displays the download button. A cleanup cron removes the S3 file after 24 hours.

### Example 2: Implementing a Bulk User Import with Validation Errors

An admin imports 10,000 users from a CSV file. The upload page shows a drag-and-drop zone, accepts .csv files, and immediately validates the file: checks encoding (UTF-8), checks headers (must include `email`, `name`, `role`), and rejects the file if headers are missing. Then it shows a preview: first 5 rows with the auto-detected column mapping. The admin confirms the mapping and clicks "Import". The file is uploaded to a temporary location and a `process_import` job is enqueued with the file path. The job validates each row: email format (regex), name required and max 100 chars, role must be one of [admin, user, viewer]. Validation results are collected per row: `{ row: 42, field: "email", value: "not-an-email", error: "Invalid email format" }`. Rows with errors are collected into an error CSV: original data plus an "Error" column. Valid rows are inserted into the database in transactions of 500 rows each. The final result: `{ totalRows: 10000, imported: 9872, errors: 128, errorFileUrl: "..." }`. The admin can download the error CSV, fix the 128 rows, and re-upload only the corrected rows (the system detects headers and merges into the previous import).

### Example 3: Generating PDF Invoices with Templating

An invoicing system generates monthly PDF invoices for 5,000 customers. A cron job runs on the 1st of each month: it queries all active subscriptions with billing due, and for each subscription, enqueues a `generate_invoice` job. The job handler: 1) queries the subscription data (customer name, address, line items, totals), 2) renders an HTML invoice template with EJS (company logo, itemized table, totals, payment terms, QR code), 3) converts HTML to PDF using Puppeteer in a headless browser, 4) saves the PDF to S3 with a path like `invoices/2024/01/INV-001234.pdf`, 5) creates an Invoice record in the database with the PDF URL, and 6) enqueues an `email_invoice` job. Concurrency is limited to 3 (Puppeteer is memory-intensive). If the PDF generation fails (e.g., Puppeteer crashes), the job retries up to 3 times with 5-minute backoff. After all retries fail, the job goes to DLQ and an admin is notified. The PDF includes a footer with page numbers, invoice number, and payment deadline. The invoice email includes the PDF as an attachment and a link to the online version.
