# SEO Engineering

## Purpose
Define an engineering-driven approach to search engine optimization that treats SEO as a technical discipline — implementing semantic HTML, structured data, server-side rendering, performance optimization, and automated validation to achieve high crawlability, indexability, and search ranking for web applications.

## Responsibilities
- Structure HTML with semantic elements ( `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`) that convey document outline and hierarchy to search engine crawlers.
- Generate unique, descriptive, and keyword-rich title tags and meta descriptions for every indexable page, staying within length guidelines.
- Implement Open Graph (og:) and Twitter Card meta tags for social sharing previews on every page.
- Embed structured data using JSON-LD format with schema.org types (Product, Article, Organization, FAQPage, BreadcrumbList, etc.) for rich search results.
- Set canonical URLs on every page to indicate the preferred version and prevent duplicate content issues.
- Generate and submit XML sitemaps that cover all indexable pages with correct `lastmod`, `changefreq`, and `priority` values, excluding non-indexable pages.
- Configure `robots.txt` to disallow non-indexable paths (admin, staging, API) and reference the sitemap URL.
- Implement server-side rendering (SSR) or static site generation (SSG) for crawlers that do not execute JavaScript, ensuring content is present in the initial HTML.
- Optimize Core Web Vitals (LCP, FID/INP, CLS) through performance engineering — not as an afterthought but as a core development requirement.
- Enforce heading hierarchy (one `<h1>` per page, proper nesting of `<h2>`–`<h6>`) and require descriptive alt text on all images.
- Structure pagination with `rel="next"` and `rel="prev"` link tags, or use Google's view-all approach for paginated content.

## Decision Process
1. Determine which pages should be indexable (public content pages) and which should be excluded (admin dashboards, logged-in-only pages, API routes, staging environments, paginated filter combinations with thin content).
2. Choose the rendering strategy for each page type: SSG for static content (blog, docs, landing pages), SSR for dynamic content that changes per request (product pages with inventory), and client-side rendering only for logged-in pages that should not be indexed.
3. Design the JSON-LD structured data for each page type: start with the most relevant schema.org type (Product for product pages, Article for blog posts, FAQPage for help pages) and include all required and recommended properties.
4. Build meta tag generation into the route configuration: each route defines a `meta` object with `title`, `description`, `ogImage`, and the framework's head manager injects the tags server-side and client-side.
5. Select the canonical URL strategy: always self-referential `<link rel="canonical" href="{currentUrl}" />`, except for parameterized pages (sort, filter, page) which canonical to the clean version.
6. Generate the XML sitemap programmatically from the route configuration, respecting canonical URLs, excluding noindex pages, and updating `lastmod` from the content's last-modified timestamp.
7. Implement structured logging of crawl errors by parsing the Search Console API or crawling the site with a headless browser and checking for broken links, missing meta tags, and thin content.
8. Set up automated SEO validation in CI: a Lighthouse SEO audit and a custom suite that checks every page for required meta tags, JSON-LD validity, heading hierarchy, and canonical tags.
9. Design pagination SEO: for list pages (blog index, product category), use `rel="next"` and `rel="prev"` link tags, ensure each page has unique meta descriptions, and consider infinite scroll with a `history.replaceState` fallback so crawlers see paginated URLs.
10. Optimize Core Web Vitals by profiling with Lighthouse and WebPageTest: target LCP < 2.5s (optimize images, preload hero, minimize render-blocking resources), INP < 200ms (break up long tasks, lazy off-screen content), CLS < 0.1 (set explicit dimensions on images/embeds, reserve space for dynamic content).

## Inputs
- Site architecture document listing all routes, page types, and their indexability classification.
- Content inventory with titles, descriptions, and Open Graph images for each page.
- Schema.org type requirements from the marketing team (e.g., Product rich results for e-commerce, FAQ rich results for help center).
- Core Web Vitals baseline measurements from Lighthouse, PageSpeed Insights, and CrUX (Chrome User Experience Report).
- Competitor analysis showing which structured data types competitors are using and which rich results they have earned.

## Outputs
- Route-level meta tag configuration: `title`, `description`, `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`, `twitter:site` for every indexable route.
- JSON-LD structured data templates for each page type, validated against the schema.org specification and tested with Google's Rich Results Test.
- XML sitemap generation script that outputs a `sitemap.xml` and optional sitemap index for sites with over 50,000 URLs.
- `robots.txt` file that disallows non-indexable paths and references the sitemap URL.
- Canonical URL logic: middleware or helper function that constructs the canonical URL and emits the link tag.
- SEO validation CI suite: Lighthouse budget, meta tag presence tests, JSON-LD schema validation, heading hierarchy checks, and image alt-text verification.

## Rules
- Every indexable page MUST have a unique `<title>` tag between 50–60 characters and a unique `<meta name="description">` between 150–160 characters. Duplicate or missing meta tags fail CI.
- Every indexable page MUST have exactly one `<h1>` that matches the page's primary topic and title tag. Multiple `<h1>` elements per page are a lint error.
- Every `<img>` tag MUST have a non-empty `alt` attribute. Decorative images must use `alt=""` (empty alt). Missing alt text fails the build.
- Canonical URLs MUST be self-referential by default. The only exception is paginated or sorted views, which canonical to the clean base URL.
- JSON-LD structured data MUST be valid JSON and must pass Google's Rich Results Test. Invalid JSON-LD blocks rich result eligibility.
- SSR/SSG rendered pages MUST include the full content in the initial HTML — not loaded via client-side JavaScript. A crawler that does not execute JS must see the same content as a user.
- `robots.txt` MUST NOT disallow CSS, JS, or image files — doing so prevents crawlers from computing Core Web Vitals and understanding page layout.
- Each paginated page (`?page=2`) MUST have a unique meta description to avoid duplicate content penalties. Generic "Page 2" descriptions are not acceptable.

## Best Practices
- Use Next.js `generateMetadata` (App Router) or Nuxt's `useHead` to co-locate meta tags with each page component, making SEO metadata part of the component definition rather than a separate configuration file.
- Preload the LCP image with `<link rel="preload" as="image" href="..." fetchpriority="high">` to ensure the hero image is prioritized in the loading sequence.
- Use `next/script` or equivalent with `strategy="afterInteractive"` for analytics scripts to avoid blocking rendering and impacting LCP.
- Implement automatic breadcrumb structured data by deriving the breadcrumb trail from the route hierarchy and embedding `BreadcrumbList` JSON-LD on every page.
- Create a custom 404 page with a `<meta name="robots" content="noindex">` tag and a link to the sitemap so crawlers do not index the 404 page.
- Generate the sitemap dynamically from the CMS content API so new pages are automatically included without manual sitemap updates.
- Use `rel="nofollow"` on external links that are not endorsed (user-generated content, sponsored links) to avoid distributing PageRank to untrusted domains.
- Monitor the Core Web Vitals in production using the `web-vitals` library and send metrics to analytics, alerting when LCP exceeds 3s or CLS exceeds 0.25 for any page.

## Anti-patterns
- Using `<div>` or `<span>` for all page structure instead of semantic HTML elements. Crawlers rely on `<article>`, `<nav>`, `<main>`, and heading tags to understand content hierarchy.
- Generating identical meta descriptions for all pages using a template ("Learn about {topic} on our website"). Each page needs a unique, descriptive, hand-crafted or smartly generated description.
- Embedding structured data as RDFa or Microdata inline in HTML attributes. JSON-LD in the `<head>` is easier to maintain, validate, and inject without affecting rendering.
- Using client-side rendering (CSR) for content pages without SSR or SSG. Google can render JavaScript but with a delay, and not all crawlers (Bing, Yandex, social media scrapers) execute JS.
- Setting the canonical URL to a different domain or to a URL that redirects. The canonical URL must resolve to a 200 and be on the same domain (or a verified subdomain).
- Hiding content behind tabs, accordions, or "load more" buttons that require JavaScript interaction without providing a fully expanded static version for crawlers.
- Using `meta robots` tags inconsistently — noindex on some pages but not others without a clear policy. Every page should have a default indexability determined by its type.
- Generating sitemaps manually or with static files. Sitemaps must be generated dynamically or rebuilt whenever content changes.

## Edge Cases
- A blog post title exceeds 60 characters. The title tag generator must truncate gracefully at a word boundary with an ellipsis, ensuring the core keyword remains in the first 60 characters.
- A product goes out of stock. The product page should remain indexable with `availability: "OutOfStock"` in the structured data rather than removing the page entirely.
- A page has multiple valid URLs (HTTP/HTTPS, www/non-www, trailing slash vs non). All variants must 301 redirect to the canonical URL, and the canonical tag must point to the final destination.
- The site uses infinite scroll on the blog index. Crawlers do not trigger scroll events. The implementation must use `<link rel="next">` and `<link rel="prev">` tags and provide paginated URLs (`?page=N`) that the client-side router can parse.
- A page is moved from one URL to another. The old URL must 301 redirect to the new URL for at least 6 months, and the sitemap must be updated to reflect the new URL.
- The user changes the product title in the CMS. The meta title, JSON-LD `name`, and `<h1>` must all update automatically from the same content source.
- A staging environment is accidentally indexed by Google. The `robots.txt` file on staging must block all crawlers, and a `<meta name="robots" content="noindex, nofollow">` must be injected on all staging pages.
- The site has both a mobile and desktop version on different subdomains. Instead of separate versions, use a responsive design with a single URL. If separate versions are unavoidable, use `rel="alternate"` with `media` attribute for mobile.

## Validation Checklist
- [ ] Every indexable page has a unique `<title>` (50–60 chars) and unique `<meta name="description">` (150–160 chars) — verified by crawling the site with a custom script.
- [ ] Every page has exactly one `<h1>` element and heading hierarchy is respected (no skipped levels, e.g., `h1` → `h3`) — verified by a heading lint checker.
- [ ] Every image has an `alt` attribute (non-empty for content images, empty for decorative) — verified by `axe-core` or custom audit.
- [ ] JSON-LD structured data passes Google's Rich Results Test and Schema.org validation — verified by automated API call to the Rich Results Test endpoint.
- [ ] Canonical URL is self-referential on clean URLs and points to the base URL on parameterized pages — verified by checking the canonical tag on sampled URL variants.
- [ ] XML sitemap includes all indexable pages, excludes noindex pages, and `lastmod` values are current — verified by comparing sitemap URLs against the route list.
- [ ] `robots.txt` is accessible at `example.com/robots.txt`, allows CSS/JS/images, disallows appropriate paths, and references the sitemap — verified by fetching and parsing.
- [ ] Core Web Vitals pass the target thresholds (LCP < 2.5s, INP < 200ms, CLS < 0.1) for the top 10 most-trafficked pages — verified by Lighthouse CI and CrUX data.
- [ ] SSR/SSG pages render full content without JavaScript — verified by fetching the page with `curl` or a headless browser with JS disabled and checking for visible text content.
- [ ] Paginated pages have `rel="next"`/`rel="prev"` link tags and unique meta descriptions — verified by sampling pages 1–5 of the blog index.
- [ ] Social previews (Open Graph, Twitter Cards) render correctly — verified by the Social Share Preview tool or `opengraph.xyz`.

## Engineering Examples

### Example 1: JSON-LD structured data for an e-commerce product page
An online electronics retailer needed rich search results showing price, availability, reviews, and shipping information directly in Google SERP. The team added JSON-LD structured data of type `Product` to every product detail page. The JSON-LD includes `name`, `description`, `sku`, `brand` (with nested `Brand` type), `offers` (with `price`, `priceCurrency`, `availability`, `priceValidUntil`), `aggregateRating` (with `ratingValue`, `reviewCount`), and `image`. The JSON-LD is server-rendered in the `<head>` using a template that pulls data from the product API response. The team validated each product page against Google's Rich Results Test in CI by firing a headless Chrome that extracts the JSON-LD and posts it to the Google Rich Results Test API. A failed validation (e.g., missing `availability` field) blocks the deployment. After launch, the team observed that 40% of search impressions for their products included rich result badges, and click-through rates increased by 18%.

### Example 2: Server-rendered site with proper meta tags for SEO
A news publication migrating from a legacy WordPress site to a Next.js application needed to preserve their SEO traffic. The team implemented `generateMetadata` for every page type: articles, category pages, author pages, and the homepage. The article page metadata includes the headline as the title (truncated to 60 chars), the first paragraph as the description (truncated to 160 chars), the featured image as `og:image`, the author Twitter handle as `twitter:creator`, and the full URL as `og:url`. The JSON-LD for articles uses `NewsArticle` schema with `headline`, `datePublished`, `dateModified`, `author`, `publisher`, and `mainEntityOfPage`. The sitemap is generated from the CMS API on every build, listing all published articles with their `lastmod` set to the article's `updatedAt` timestamp. The `robots.txt` disallows `/api/`, `/search?*`, `/tag/*/page/*` (thin tag pages), and `*/amp` (prefer the canonical). An SEO CI pipeline runs on every PR: it starts a production build, serves it locally, and runs a suite of checks — meta tag presence, heading hierarchy, JSON-LD validation, and Lighthouse SEO score — failing the PR if any check fails.

### Example 3: Dynamic sitemap generation for large content sites
A job listing platform with 500,000+ active listings and 10,000+ company pages needed a sitemap strategy that covered all indexable content without exceeding Google's 50,000 URL per sitemap limit. The team implemented a sitemap index: `sitemap.xml` lists 12 child sitemaps — `sitemap-jobs-1.xml` through `sitemap-jobs-10.xml` (50,000 jobs each), `sitemap-companies.xml`, `sitemap-static.xml` (about, contact, help pages). Each child sitemap is generated by a scheduled background job that queries the database, chunks the results, and writes the XML files to the public directory on the CDN. The `lastmod` for each job listing is the date the job was last updated. Jobs that are expired (over 30 days past closing) are excluded from the sitemap and return a `410 Gone` status. The sitemap index references `lastmod` as the most recent generation time so crawlers know to re-fetch. The team also generates a sitemap for the news section using the `news` sitemap extension, which includes `<news:publication_date>` and `<news:title>` tags. Google Search Console reports that 95% of submitted sitemap URLs are indexed within 48 hours.
