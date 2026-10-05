# File Upload & Storage Systems

## Purpose

Provide a comprehensive, production-ready approach to handling file uploads and storage in web applications. This skill covers the complete lifecycle from client-side file selection through transfer (with progress), server-side validation, secure storage, optimization, and eventual cleanup. The goal is a file system that handles everything from a 10 KB avatar image to a 10 GB video file reliably, securely, and with a smooth user experience.

## Responsibilities

- Implementing client-side upload workflows with progress indicators (XMLHttpRequest or fetch with ReadableStream) so users can see upload progress, especially for large files.
- Breaking large files into chunks (5-10 MB) and uploading them sequentially or in parallel with resume capability, tracking which chunks have been uploaded.
- Validating file types on both client and server: MIME type checking, magic byte verification, and extension whitelist to prevent malicious uploads.
- Enforcing file size limits at multiple layers: client-side pre-upload check, server-side limit in the API handler, and reverse proxy limit (Nginx/AWS ALB) as a final guard.
- Integrating with virus scanning services (ClamAV, AWS S3 virus scanning) to quarantine infected files and notify admins without exposing users to malicious content.
- Abstracting storage backends behind a common interface (local filesystem, S3-compatible, CDN) so the application code does not depend on a specific storage provider.
- Performing image optimization on upload: resizing, compression, format conversion (WebP, AVIF), and generating multiple sizes/breakpoints for responsive images.
- Generating secure, time-limited access URLs (signed URLs, pre-signed S3 URLs) for file downloads so that storage is not publicly accessible.
- Identifying and cleaning up orphaned files: temporary uploads that were never finalized, files associated with deleted records, and expired temporary files.

## Decision Process

1. Determine file characteristics: typical file size distribution (small profile pics < 1MB, documents < 10MB, media files > 100MB), total storage volume expected, and access frequency (hot vs cold storage).
2. Choose upload mechanism: direct-to-server upload for small files under 10MB and simple infrastructure, direct-to-S3 presigned URL upload for large files and scalability, or chunked upload for files over 100MB or unreliable networks.
3. Design chunked upload strategy: choose chunk size (5-10MB based on network conditions), parallelism (2-4 concurrent chunks max to avoid overwhelming the client), and resume logic (track uploaded chunks server-side, resume from last successful chunk on interruption).
4. Implement file type validation layers: client-side MIME type check for instant feedback, server-side MIME + magic bytes (first 512 bytes read using `file` command or library) for security, and extension allowlist as final filter.
5. Configure size limits: client-side limit with user-friendly message (e.g., "File too large. Max size: 10MB"), server-side limit in the web server (e.g., Nginx `client_max_body_size`), and application-level limit for per-file and per-request total.
6. Select virus scanning strategy: synchronous scanning for small files (scan on upload, reject if infected), asynchronous scanning for large files (upload first, scan in background, quarantine if infected, notify user).
7. Choose storage backend: local filesystem for development and single-server deployments, S3-compatible (AWS S3, MinIO, DigitalOcean Spaces) for distributed deployments, with CDN (CloudFront, Cloudflare) for frequently accessed public files.
8. Implement image optimization: determine required sizes (thumbnail 150px, small 400px, medium 800px, large 1600px), choose format (WebP with AVIF fallback via `<picture>` element), set quality (80-85% for photos, 90-95% for product images), and strip EXIF data.
9. Design secure access: private bucket with no public read, pre-signed URLs with expiration (1 hour for direct viewing, 5 minutes for inline display in emails), IP-restricted access for internal tools.
10. Implement cleanup: temporary file TTL (24 hours for unclaimed uploads), orphan detection (daily cron comparing storage against database records), and quarantine retention (30 days before deletion for infected files).

## Inputs

- Upload requirements: max file size, accepted file types (MIME types and extensions), expected file count per upload (single vs multiple), and concurrency limits.
- Storage configuration: storage backend details (S3 bucket name, region, access keys; local storage path), CDN domain, and public/private access rules.
- Image processing parameters: required output sizes, formats (WebP, AVIF, JPEG), quality settings, and EXIF handling policy (strip vs preserve orientation).
- Security requirements: virus scanning integration, signed URL expiration durations, encryption at rest requirements (SSE-S3, SSE-KMS), and compliance standards (HIPAA, GDPR).
- UI/UX specifications: progress indicator style, drag-and-drop zone design, file preview requirements, upload cancellation behavior, and error message templates per failure type.
- Cleanup policy: temporary file TTL, orphan cleanup schedule, quarantine retention period, and notification channels for infected file alerts.

## Outputs

- Upload service: client-side upload handler with progress tracking, chunking logic, retry capability, and cancellation support.
- Server-side upload endpoint: API route that accepts uploaded files, validates type/size, stores to the configured backend, and returns file metadata (ID, URL, size, type).
- File validation pipeline: middleware or utility that checks MIME type, magic bytes, extension allowlist, size limits, and virus scan results before finalizing storage.
- Storage abstraction layer: an interface or adapter pattern (`StorageInterface` with `put`, `get`, `delete`, `getSignedUrl` methods) implemented by `LocalStorage`, `S3Storage`, etc.
- Image processing pipeline: a service that receives uploaded images, generates resized versions, converts formats, optimizes compression, and stores all variants with consistent naming.
- Secure URL generation: signed URL service that generates time-limited, single-use URLs for file access, with support for content-disposition headers for download vs inline display.
- Cleanup cron job: scheduled task (cron, AWS EventBridge) that removes orphaned temporary files, expired quarantine files, and files associated with deleted records.

## Rules

1. Never trust client-side file validation alone — always validate MIME type, magic bytes, extension, and size on the server before storing or processing a file.
2. Always set a maximum file size on the server that matches or is stricter than the client-side limit — never accept a file larger than what the client said it would send.
3. Never store files in the application's root directory or a web-accessible path without access control — always use a private storage location (non-public S3 bucket, directory outside `public/`).
4. Always generate unique file names on the server — never use the original client-provided filename as the storage key, as it can cause collisions and path traversal attacks.
5. Never allow direct public access to uploaded files — always serve files through signed URLs, authenticated download endpoints, or a CDN with referer/authorization checks.
6. Always scan uploaded files for malware before making them available to other users — schedule scanning for large files asynchronously and reject small files synchronously if infected.
7. Always clean up temporary files that were uploaded but never finalized (e.g., user closed the browser during a multi-step upload) within 24 hours.
8. Never hardcode storage credentials or bucket names — use environment variables, secrets manager, or IAM roles for all storage configuration.
9. Always set CORS headers correctly on the storage backend when doing direct-to-S3 uploads — misconfigured CORS causes upload failures that are hard to debug.
10. Never overwrite an existing file without versioning — use versioned object storage or append a timestamp/uuid to the filename to preserve history.

## Best Practices

1. Use presigned URLs for direct-to-S3 uploads to reduce server load and bandwidth costs — the client uploads directly to S3, the server only needs to generate the signed URL and handle post-upload processing.
2. Implement chunked upload with local hash tracking: compute MD5 or SHA256 of each chunk client-side, send the hash with the chunk, and verify it server-side before acknowledging — this detects corruption during transfer.
3. Use multipart uploads for files over 100MB even in server-mediated flows — S3 multipart upload allows parallel chunk uploads and individual chunk retry without restarting the entire upload.
4. Strip EXIF data from uploaded images to remove geolocation, device info, and camera settings that are privacy risks and add unnecessary file size.
5. Generate responsive image variants asynchronously (queue a background job) so the upload API responds quickly — return immediately with the original file ID, and update the record when all variants are ready.
6. Implement a progress endpoint for chunked uploads — the client can poll or the server can push progress updates so the UI can show a percentage even for large files.
7. Use content-addressable storage naming (hash-based) for deduplication — if two users upload the same file, store it once with the same hash-based key and reference it from both user records.
8. Implement soft delete for files: mark files as deleted in the database with a scheduled cleanup, rather than immediately deleting from storage — this allows recovery within a grace period (e.g., 30 days).
9. Set appropriate cache headers on CDN-served files: immutable caching (year-long `Cache-Control: public, max-age=31536000, immutable`) for versioned file URLs, short caching for dynamic content.
10. Log all file operations (upload, download, delete, virus detection) with user ID, file ID, file size, and timestamp for auditing and security incident investigation.

## Anti-patterns

1. Accepting file uploads directly to the application server's filesystem and serving them via a static file route — this can lead to disk exhaustion, path traversal vulnerabilities, and no scalability.
2. Using the original filename from the client as the storage key — this causes collisions (two users uploading "resume.pdf"), path traversal (`../../etc/passwd`), and encoding issues with special characters.
3. Allowing uploads without any size limit — a single 100GB upload can fill the disk, crash the server, and cause a denial of service.
4. Serving uploaded files directly from the storage backend without signed URLs — if the bucket is public, anyone can enumerate or guess file URLs; if private, the application cannot control access.
5. Blocking the upload API response while processing images synchronously — uploading a 20MB photo and generating 5 thumbnails can take 10+ seconds, causing the client to time out.
6. Not cleaning up temporary or orphaned files — over months, millions of abandoned partial uploads and deleted file references accumulate, wasting storage space and cost.
7. Ignoring virus scanning entirely — an infected file uploaded to storage can be distributed to all users who download it, causing a widespread security incident.
8. Hardcoding storage provider credentials in the codebase — credentials committed to version control are exposed to all developers with repo access and cannot be rotated cleanly.

## Edge Cases

1. Network interruption mid-upload: for chunked uploads, the client must be able to resume from the last successful chunk rather than restarting from zero — track completed chunks on the server keyed by upload session ID.
2. Duplicate file detection: if a user uploads the exact same file twice (same content, same hash), the system should detect the duplicate and create a reference to the existing stored file rather than storing two copies.
3. File with no extension or unknown extension: validate by MIME type and magic bytes, not by extension alone — if the magic bytes indicate a valid file type, accept it even without a matching extension.
4. Concurrent uploads of the same file from multiple users: use content-addressable storage (hash-based naming) so the file is stored only once, and both users get a reference to the same stored object.
5. Browser tab closed during upload: if using chunked upload, the upload session should be persisted server-side with a TTL so the user can reopen the page, see the partially uploaded file, and resume.
6. Unicode filenames with special characters: sanitize filenames by removing or replacing characters that are invalid on the target filesystem (Windows: `<>:"/\|?*`, Linux/Mac: null bytes, control characters).
7. Upload from mobile with camera capture: mobile browsers may generate HEIC files (iOS) that need server-side conversion to JPEG/WebP before processing — detect HEIC by magic bytes and convert automatically.
8. Rate limiting and DDoS: without rate limiting, a malicious client can upload thousands of tiny files to exhaust storage space or inode count — enforce per-user and per-IP upload rate limits.

## Validation Checklist

- [ ] File type is validated on the server using magic bytes (not just MIME type or extension) — verified by reading the first 512 bytes of the file.
- [ ] File size limit is enforced at the client, server, and reverse proxy (Nginx/AWS ALB) levels.
- [ ] Uploaded files are stored with server-generated unique names (UUID or hash-based), never with original client-provided filenames.
- [ ] Storage backend is configured as private (no public read access) — all file access goes through signed URLs or authenticated endpoints.
- [ ] Signed URLs have explicit expiration times (1 hour max for viewing, 5 minutes for downloads) and are regenerated per request.
- [ ] Image uploads are stripped of EXIF data and optimized (compression, format conversion, resized variants).
- [ ] Virus scanning is integrated: synchronous scanning for files under 10MB, asynchronous scanning for larger files with quarantine workflow.
- [ ] Chunked uploads (for files >100MB) support resume — upload session is tracked server-side with a session ID.
- [ ] Cleanup cron job exists and removes: temporary files older than 24 hours, files associated with deleted records, and quarantine files older than 30 days.
- [ ] All file operations are logged (upload, download, delete, virus detection) with user ID, file ID, size, and timestamp.

## Engineering Examples

### Example 1: Implementing a Chunked Upload for Large Video Files

A video platform allows users to upload recordings up to 4GB. The client splits the file into 10MB chunks using `File.slice()`. Each chunk is uploaded with a session ID, chunk index, and MD5 hash of the chunk content. The server (Express) receives each chunk, verifies the MD5 hash matches, stores the chunk to a temporary directory (`/tmp/uploads/{sessionId}/chunk_{index}`), and returns `{ received: true, nextIndex: 5 }`. If the client receives a network error, it retries the same chunk up to 3 times with 2-second backoff. On the final chunk, the server merges all chunks in order, computes the final file hash, moves the file to permanent storage (S3 via presigned URLs), deletes the temporary chunks, and returns the file metadata including a pre-signed thumbnail URL. The UI shows a progress bar (percentage = completedChunks / totalChunks × 100) with a pause/resume button. If the browser crashes, the session ID (stored in localStorage) allows resuming from the last acknowledged chunk on page reload.

### Example 2: Building a Secure File Access System with Signed URLs

A document management system stores files in a private S3 bucket. When a user requests to view a file, the application generates a presigned S3 URL with a 1-hour expiration: `s3.getSignedUrl('getObject', { Bucket: 'docs', Key: fileKey, Expires: 3600 })`. The URL is returned to the client, which uses it as the `src` for an `<iframe>` or `<img>` (for images). For file downloads, the expiration is 5 minutes with `ResponseContentDisposition: attachment; filename="report.pdf"`. Access control is enforced before generating the URL: the application checks if the requesting user has the `read:file` permission for that document, and logs the access event. Signed URLs are never cached — every page load generates fresh URLs. For embedded images in emails, a separate endpoint generates single-use URLs that expire after the first request. The S3 bucket policy denies all public access and only allows access via presigned URLs or from the application's VPC endpoint.

### Example 3: Designing an Image Upload Pipeline with Automatic Compression

A social media app allows users to upload profile photos and post images. When an image is uploaded to the server, the pipeline runs: 1) magic byte verification (PNG, JPEG, WebP, GIF allowed), 2) EXIF stripping via Sharp, 3) format conversion to WebP (quality 85%) with AVIF fallback (quality 80%), 4) generation of three responsive sizes — thumbnail (150×150 crop), medium (600×600 max), large (1200×1200 max), 5) optimization with MozJPEG for JPEG inputs (quality 82%), 6) storage to S3 with key pattern `{userId}/{type}/{size}_{hash}.{format}`, 7) database record created with all variant URLs. The upload API returns immediately after the original file is stored and the processing is queued to a background job (Bull/BullMQ). A WebSocket event notifies the client when processing is complete, and the UI updates the image source to use the optimized WebP version with an AVIF fallback via `<picture>` element. The CDN (CloudFront) cache hits the variants with `Cache-Control: public, max-age=31536000, immutable`.
