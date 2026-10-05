# Image & Media Processing

## Purpose

Define a comprehensive approach to handling images and media files throughout their lifecycle in web applications — from client-side preview and upload, through server-side optimization and format conversion, to responsive delivery via CDN. This skill covers image optimization, responsive image generation, format conversion (WebP, AVIF), lazy loading, CDN integration for media, video transcoding, thumbnail generation, EXIF data handling, and client-side image preview. The goal is media that loads fast, looks good on any device, uses minimal bandwidth, and meets accessibility requirements.

## Responsibilities

- Implementing image optimization pipelines that compress, resize, and convert images to modern formats (WebP, AVIF) on upload, reducing file size by 60-80% without perceptible quality loss.
- Generating responsive image variants (srcset) in multiple sizes (thumbnail, small, medium, large, original) and formats so that browsers can download the most appropriate version for the viewport and device capabilities.
- Converting uploaded images to bandwidth-efficient formats (WebP with quality 80-85%, AVIF with quality 75-80%) with automatic fallback to JPEG/PNG for browsers that don't support modern formats.
- Implementing lazy loading for images using native `loading="lazy"` attribute and Intersection Observer for older browser support, with proper placeholder techniques (blur-up, dominant color, or skeleton).
- Integrating with CDNs (CloudFront, Cloudflare, imgix, Cloudinary) for media delivery, including cache invalidation and origin pull configuration.
- Handling video transcoding: converting uploaded videos to web-optimized formats (H.264 MP4, HLS for streaming), generating multiple resolutions, and creating poster frames.
- Generating thumbnails from video uploads: extracting frames at specific timestamps (1s, 25%, 50%, 75% of duration) and processing them through the image optimization pipeline.
- Processing EXIF data: reading EXIF for orientation correction, stripping EXIF for privacy (removing geolocation, camera info, device ID), and preserving orientation metadata for correct display.
- Implementing client-side image preview before upload: showing a preview of the selected image (cropped, rotated, or filtered) using Canvas API or FileReader, with client-side resizing to reduce upload size.
- Managing media storage lifecycle: temporary upload cleanup, versioned storage (keep original + all variants), CDN cache invalidation on variant regeneration, and orphaned media cleanup.

## Decision Process

1. Determine media characteristics: typical file types (JPEG, PNG, WebP, GIF, SVG, MP4, MOV), average file sizes, upload volume (images/day, videos/day), and storage growth rate.
2. Choose image processing library: Sharp (Node.js) for server-side processing (fast, low memory, supports all required formats). ImageMagick/GM for complex operations. Cloudinary/imgix for fully managed processing with CDN delivery. For client-side: Canvas API for basic operations, browser-image-compression library for client-side resizing.
3. Design responsive image sizes: define breakpoint-specific widths — thumbnail (150px), small (400px), medium (800px), large (1200px), xlarge (2000px). For high-DPI (Retina) displays, generate 2x variants at double resolution. Use `<picture>` and `srcset` to deliver the right size.
4. Configure output formats: WebP as the primary format for all modern browsers (89%+ global support). AVIF as the next-gen format with even better compression (but lower browser support). JPEG as the fallback for older browsers. PNG preserved only when transparency is needed and WebP lossless is too large.
5. Set quality/compression levels: WebP quality 80-85 (perceptually lossless for photos), AVIF quality 75-80 (better compression than WebP at same visual quality), JPEG quality 82-85 (using MozJPEG for better compression at same quality). PNG quantized to 256 colors when possible.
6. Design EXIF handling: on upload, read EXIF for orientation tag and auto-rotate the image (apply the rotation baked into the pixel data). Strip all EXIF data after processing to remove geolocation, camera serial, and device info. Preserve only the ICC color profile if color accuracy is critical (product photography, art).
7. Implement client-side preview: use `FileReader.readAsDataURL()` for instant preview, but for large images (>5MB), use `URL.createObjectURL()` (blob URL) which is faster and doesn't block the main thread. Allow client-side rotation and cropping before upload using Canvas API.
8. Choose video processing approach: for light video needs (user uploads, basic transcoding), use FFmpeg via fluent-ffmpeg (Node.js) or RunPod/banana.dev for serverless GPU transcoding. For heavy video needs (professional content, adaptive bitrate), use dedicated services like Mux, Cloudinary, or AWS Elemental MediaConvert.
9. Design thumbnail generation for videos: extract frames at 1 second (for seek thumbnail), at 25%, 50%, and 75% of duration (for gallery display). Process extracted frames through the image optimization pipeline (resize, convert to WebP/AVIF). Generate a GIF preview (3-5 seconds at 5fps) for silent autoplay previews.
10. Integrate CDN: configure origin-pull behavior (CDN fetches from origin on cache miss, caches perpetually with versioned URLs), set cache headers (`Cache-Control: public, max-age=31536000, immutable` for versioned URLs), implement cache invalidation on asset replacement (versioned URLs avoid need for invalidation), and purge CDN cache on media deletion.

## Inputs

- Media upload requirements: supported file types (JPEG, PNG, WebP, GIF, AVIF, SVG, MP4, MOV), max file sizes per type (image: 20MB, video: 2GB), and upload volume estimates.
- Design system specifications: required image sizes (breakpoints), aspect ratios (16:9, 4:3, 1:1, 3:4), allowed cropping regions (center, top, face-aware), and any watermark/overlay requirements.
- Quality standards: minimum acceptable quality scores (SSIM or DSSIM thresholds), max file size per variant type (thumbnail <10KB, medium <50KB, large <100KB), and format preferences.
- Privacy requirements: EXIF stripping policy (strip all, preserve orientation only, preserve copyright), face blurring requirements, and data retention policy for uploaded originals.
- Delivery requirements: CDN configuration (CloudFront distribution ID, origin domain, behavior settings), cache TTL policies (immutable for versioned, short for user avatars that may change), and signed URL requirements for private media.
- Accessibility requirements: alt-text generation (AI-based or manual), text in images (WCAG requires actual text, not images of text), and video caption/subtitle requirements.

## Outputs

- Image processing pipeline: a service or middleware that receives uploaded images, processes them through optimization (format conversion, resizing, compression, EXIF stripping), and stores all variants with consistent naming conventions.
- Responsive image component: a React/Vue/Svelte component (`<OptimizedImage>`) that renders `<picture>` with multiple source formats, `srcset` with multiple sizes, `loading="lazy"`, proper `alt` text, and a placeholder (blur-up, dominant color, or skeleton).
- Video processing service: a background job handler that transcribes uploaded videos to H.264 MP4, generates HLS stream playlists, extracts thumbnail frames, creates GIF previews, and stores all variants.
- Lazy loading utility: a hook or directive for lazy loading images and iframes with Intersection Observer, including support for `loading="lazy"` attribute (native) and JavaScript fallback for old browsers.
- Client-side preview component: a component that shows an image/video preview before upload, supports client-side rotation and cropping, and optionally performs client-side resizing to reduce upload size.
- Thumbnail generation service: a utility that extracts video frames at specified timestamps, processes them through the image optimization pipeline, and returns the thumbnail URLs.
- CDN integration module: configuration and utilities for CDN cache invalidation (by path or tag), signed URL generation for private media, and URL transformation parameters for on-the-fly processing (if CDN supports it).

## Rules

1. Never serve unoptimized images in production — every image delivered to end users must be compressed, properly sized, and in a modern format. Unoptimized images are the #1 cause of slow page loads.
2. Always include `loading="lazy"` on all below-the-fold images — never load images that are not in the initial viewport eagerly, as this wastes bandwidth and slows down page rendering.
3. Always provide explicit `width` and `height` attributes on images — without dimensions, the browser cannot reserve space, causing layout shifts (CLS) when images load, harming Core Web Vitals.
4. Never use JPEG for images with transparency (logos, icons, screenshots with transparent backgrounds) — use PNG (lossless) or WebP (lossy with transparency). JPEG replaces transparency with white/black.
5. Always strip EXIF data from user-uploaded images before serving them to other users — EXIF can contain GPS coordinates, camera serial numbers, device IDs, and timestamps that are privacy risks.
6. Never generate more image variants than necessary — each variant increases storage costs and processing time. Generate only the sizes that are actually used in the UI (check the CSS/media query breakpoints).
7. Always handle image orientation: use EXIF orientation tag to auto-rotate images on upload so that photos taken in portrait mode display correctly without requiring CSS `object-fit` hacks.
8. Never use GIF for large animations — GIF files are extremely inefficient (8-bit palette, no compression). Convert animations to video (MP4 with autoplay, muted, loop) or animated WebP for 90%+ size reduction.
9. Always set appropriate `Cache-Control` headers for media files — versioned media gets `public, max-age=31536000, immutable`, user avatars get `public, max-age=86400, must-revalidate`, and short-lived media gets `public, max-age=3600`.
10. Never serve SVG files without sanitization — SVG is XML and can contain JavaScript, `<foreignObject>`, and other XSS vectors. Sanitize with DOMPurify or a server-side SVG sanitizer before serving.

## Best Practices

1. Use Sharp (Node.js) for server-side image processing — it is significantly faster (2-10x) than ImageMagick, uses less memory, and supports all modern formats (WebP, AVIF, JPEG, PNG, TIFF) natively.
2. Generate responsive image sets using a consistent naming convention: `{original-name}_{width}w.{format}` (e.g., `photo_400w.webp`, `photo_800w.webp`, `photo_1200w.webp`). This makes it easy to generate URLs programmatically and debug cache issues.
3. Use `<picture>` element with multiple format sources rather than relying on `Accept` headers (content negotiation) — `<picture>` allows explicit fallback order and avoids the complexity of checking browser support server-side.
4. Implement blur-up placeholders: generate a tiny (30px wide, quality 20) version of the image, base64-encode it, and set it as a CSS background or `src` attribute before the full image loads. This provides a smooth loading experience with minimal data overhead.
5. Use AVIF for photographic content where browser support is adequate — AVIF provides 30-50% better compression than WebP at the same quality, which translates to significantly faster loads for photo-heavy pages.
6. Implement client-side resizing before upload for very large images (4000px+) — resizing a 20MB photo to 2000px on the client (using Canvas API) reduces upload size by 90% and processing time significantly, at the cost of a small delay before upload starts.
7. Use WebP for lossy images and PNG for lossless images with transparency, but always provide JPEG/PNG fallbacks via `<picture>` for browsers that don't support WebP (older Safari, some corporate browsers).
8. Integrate with a DAM (Digital Asset Management) system or media library for managing media files at scale — manual file management breaks down beyond a few thousand assets. Use a service like Cloudinary, Uploadcare, or a custom DAM with search, tagging, and deduplication.
9. Set up automated image optimization monitoring: track the average image file size served, the percentage of images using modern formats, and Lighthouse "Properly size images" and "Serve images in next-gen formats" scores.
10. For user-uploaded profile photos and avatars, generate a square-cropped version in addition to the original aspect ratio — use the center of the image as the crop region by default, or use face detection (Cloudinary, AWS Rekognition) for smart cropping.

## Anti-patterns

1. Serving the original uploaded image without any processing — a 4000x3000px, 8MB JPEG from a modern smartphone is served to every visitor, including mobile users with small screens and slow connections, causing multi-second load times.
2. Using a single image for all screen sizes — desktop users see a properly sized image, but mobile users download the same large image and scale it down in the browser, wasting bandwidth and slowing page loads.
3. Generating too many image variants (15+ sizes) — this wastes storage and processing time. Stick to 4-6 sizes that match your actual CSS breakpoints, not every device resolution ever made.
4. Relying on browser `Accept` headers for format negotiation — this works for CDN-based solutions but adds complexity and cache fragmentation. The `<picture>` element with explicit fallbacks is simpler and more reliable.
5. Using animated GIFs for any purpose — a 5-second animation can be 5MB as GIF, 500KB as animated WebP, or 200KB as MP4 video. Only use GIF for truly simple animations (under 50 frames, small dimensions).
6. Not setting explicit image dimensions — without `width` and `height`, images cause Cumulative Layout Shift (CLS) as they load, harming the user experience and SEO (Core Web Vitals impact).
7. Processing images synchronously in the upload request — a large upload + processing can take 10+ seconds, causing the HTTP request to time out. Queue image processing as a background job and notify when variants are ready.
8. Ignoring video poster frames — using the first frame of a video as the poster often shows a black frame or a blank title card. Extract a frame from 10-30% into the video for a representative thumbnail.

## Edge Cases

1. Alpha channel in uploaded PNG: if the input PNG has transparency, converting directly to JPEG produces an opaque image with a black/white background. Detect alpha channel and use WebP or PNG for output, or composite against a specified background color.
2. Very large image dimensions (10,000px+): panoramic photos and high-resolution scans can exceed Sharp's memory limits. Implement a max-dimension constraint (e.g., resize to max 4000px on the longest side before further variant generation).
3. Animated WebP/GIF uploaded: treat as an animation — preserve the animation in the output if the format supports it (WebP preserves animation, JPEG does not). Generate a static poster frame (first frame) as a fallback.
4. CMYK color space: some print-oriented JPEGs use CMYK color space, which displays with incorrect colors in browsers. Detect CMYK and convert to sRGB (with proper ICC profile) during processing.
5. Video files with no duration header: corrupt or partially uploaded videos may lack duration metadata. Use FFprobe to detect and handle — if duration cannot be determined, skip thumbnail extraction and generate a generic poster.
6. SVG with external references: user-uploaded SVG may reference external fonts, images, or CSS. Sanitize SVGs to remove external references and inline all required resources to ensure self-contained, secure SVGs.
7. HEIC/HEIF from iOS: Apple devices capture photos in HEIC format, which is not supported by most browsers. Detect HEIC by magic bytes on upload and convert to WebP/JPEG before storing.
8. Image with embedded ICC profile: stripping the ICC profile can cause color shifts for product photography and art. Preserve the sRGB/AdobeRGB profile if color fidelity is required, otherwise convert to sRGB and strip the profile.

## Validation Checklist

- [ ] Every uploaded image generates at least WebP and JPEG/PNG variants (AVIF optional) — verified by checking storage for each variant format.
- [ ] Responsive images use `<picture>` with `srcset` and `sizes` attributes — verified by inspecting rendered HTML in the browser.
- [ ] Lazy loading is implemented: below-the-fold images have `loading="lazy"` attribute (native lazy loading) and a placeholder (blur-up, dominant color, or skeleton).
- [ ] EXIF data is stripped from all user-uploaded images — verified by running `exiftool` on a processed image and confirming no GPS, camera, or device info remains.
- [ ] Image orientation is corrected: a photo taken in portrait orientation (EXIF orientation 6) displays correctly without requiring CSS rotation — verified by visual inspection.
- [ ] Image compression achieves target sizes: thumbnail <10KB, small <30KB, medium <80KB, large <150KB — spot-check with a random sample of processed images.
- [ ] Video thumbnails are extracted at multiple timestamps and processed through the image optimization pipeline.
- [ ] SVG uploads are sanitized to remove scripts, foreignObject, and external references — verified by testing with an SVG containing `<script>` tag.
- [ ] All images have explicit `width` and `height` attributes or CSS `aspect-ratio` to prevent layout shifts — verified by checking for CLS in Lighthouse audit.
- [ ] CDN cache headers are set correctly: versioned URLs get `immutable` caching, user content gets `must-revalidate` — verified by inspecting response headers.

## Engineering Examples

### Example 1: Building an Image Optimization Pipeline That Generates Multiple Sizes

A photography portfolio site allows users to upload full-resolution photos (up to 6000px wide, 30MB). When a photo is uploaded, an `optimize_image` job is enqueued. The job uses Sharp: first, it reads the EXIF orientation tag and auto-rotates the image. Then it strips all other EXIF data (GPS, camera model, timestamp). It generates 5 variants: 1) thumbnail (150px width, WebP q80), 2) small (400px width, WebP q82), 3) medium (800px width, WebP q85), 4) large (1600px width, WebP q85), 5) original-sized WebP (at source width but compressed, q85). Each variant is also generated as JPEG (q85) for browsers without WebP support. The naming convention: `photo-abc123_150w.webp`, `photo-abc123_400w.webp`, etc. All variants are stored in S3 under `photos/{userId}/{photoId}/`. The database record is updated with all variant URLs. The frontend renders an `<OptimizedImage>` component that generates a `<picture>` with WebP sources (srcset for all 5 sizes, sizes based on CSS breakpoints) and JPEG fallback with the same srcset. The image uses `loading="lazy"` and a dominant color placeholder (the average color of the image, extracted using Sharp during processing, stored in the DB). CDN (CloudFront) serves all variants with `Cache-Control: public, max-age=31536000, immutable`.

### Example 2: Implementing Lazy Loaded Responsive Images for a Gallery

An e-commerce product gallery displays 50 product images on a search results page. Each product card includes an image. The `<OptimizedImage>` component is used: `<OptimizedImage src={product.imageUrl} alt={product.name} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />`. The component renders: a `<picture>` element, a WebP source with `srcset` pointing to 400w, 800w, 1200w variants, and a JPEG fallback `<img>` with the same srcset. Native lazy loading via `loading="lazy"` is used. Below the image, a blur-up placeholder is applied: a tiny 32px-wide WebP version (quality 20, base64-encoded as an inline data URI) serves as the `src` initially, and the Intersection Observer swaps it with the full image when the card scrolls within 200px of the viewport. The placeholder is so small (200-400 bytes) that inlining it has negligible impact on HTML size. The result: a gallery page with 50 product images loads instantly (placeholders visible immediately), and full-resolution images load as the user scrolls, with the browser selecting the appropriate size based on the viewport and device pixel ratio.

### Example 3: Designing a Video Thumbnail Generation Service

A video platform generates thumbnails for every uploaded video. When a video upload completes, a `generate_thumbnails` job is enqueued with the video's S3 URL. The job uses FFprobe to get video metadata (duration, resolution, codec). It then extracts frames at 1 second (for the seek timeline), at 25%, 50%, and 75% of the video duration (for the gallery thumbnail picker), and creates a 3-second GIF preview at 5fps (for the silent autoplay preview on hover). Each extracted frame is passed through the image optimization pipeline (resized to 1280x720 max, converted to WebP q85 and JPEG q85, thumbnails at 320x180). The GIF preview is capped at 3MB (if larger, reduce frame rate or dimensions). Thumbnails are stored at `videos/{videoId}/thumbnails/{timestamp}.webp` and `videos/{videoId}/thumbnails/{timestamp}.jpg`. The video player uses the thumbnail at 1s as the poster image. The gallery shows the 50% thumbnail. Hovering triggers the GIF preview. All thumbnails are served via CDN with immutable caching. If FFmpeg fails (corrupt video), the job retries once with a corrupted-input flag, and if it still fails, the video status is set to "processing_failed" with an error reason, and a generic video placeholder thumbnail is used.
