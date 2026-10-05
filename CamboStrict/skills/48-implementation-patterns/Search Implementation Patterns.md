# Search Implementation Patterns

## Purpose

Establish a comprehensive approach to implementing search functionality across web applications, from simple database full-text search to sophisticated, multi-layered search systems with autocomplete, faceted filtering, typo tolerance, and relevance ranking. This skill ensures search implementations are fast, accurate, scalable, and provide a user experience that helps users find what they need even when they don't know exactly what they're looking for.

## Responsibilities

- Distinguishing between full-text search (fuzzy matching across text fields with relevance ranking) and exact match search (precise SQL WHERE clauses for specific field values) and choosing the right approach for each use case.
- Implementing search indexing strategies that determine which fields are indexed, how they are tokenized and analyzed, and how frequently indexes are rebuilt or updated.
- Providing typo tolerance through fuzzy matching, n-gram tokenization, or Levenshtein distance algorithms so users find results even with spelling mistakes.
- Implementing relevance ranking that orders search results by a combination of text relevance, recency, popularity, user preferences, and business-specific boosting rules.
- Supporting faceted search (filterable categories like price range, brand, color, rating) with accurate facet counts that respect the current search query and applied filters.
- Implementing autocomplete/suggestions that show real-time suggestions as the user types, sourced from popular searches, product names, or indexed terms.
- Capturing search analytics: tracking search queries, click-through rates, zero-result queries, and conversion rates to identify search quality issues and content gaps.
- Designing hybrid search that combines vector search (semantic similarity via embeddings) with keyword search (exact/lexical matching) for best-of-both-worlds results.
- Implementing search result highlighting that shows matched terms in context within the result snippets so users can see why a result matches.

## Decision Process

1. Determine search scope and scale: number of documents to search (hundreds vs millions), update frequency (real-time vs daily rebuilds), query volume (10 QPS vs 10000 QPS), and latency requirements (sub-50ms vs sub-500ms).
2. Choose search backend: PostgreSQL full-text search (`tsvector`/`tsquery`) for simple text search on small-to-medium datasets with existing Postgres infrastructure; Elasticsearch or Meilisearch for dedicated search requiring faceting, typo tolerance, and high performance at scale; Algolia or Typesense for managed search with low operational overhead.
3. Design the index schema: identify searchable fields (title, description, tags, content), filterable/facetable fields (price, category, brand, rating), sortable fields (price, date, popularity), and fields to return in results (id, title, excerpt, thumbnail URL).
4. Configure text analysis: choose analyzers (standard for general text, keyword for exact matches, n-gram for prefix autocomplete, stemmer for language-specific root matching), set stop words list per language, and configure synonym groups for domain-specific terminology.
5. Implement typo tolerance strategy: Levenshtein distance of 1-2 characters for short queries (<5 chars: distance 1, >=5 chars: distance 2), n-gram tokenization for prefix matching in autocomplete, and phonetic matching for names.
6. Design relevance ranking formula: BM25 for text relevance base score, then apply boosts — freshness boost (`DECAY` function on recency), popularity boost (log of view count), exact match boost (phrase match gets 2× score), and personalized boost (user's preferred categories get 1.5×).
7. Implement faceted search: return facet counts with every search response, ensure counts are accurate even with multiple filters applied (counts reflect results after current filters), support multiple selections per facet, and handle large facet value sets (show top N with "Show all" option).
8. Build autocomplete: source suggestions from three tiers — exact title matches, popular search queries (from analytics, last 30 days), and indexed n-gram terms. Debounce input at 150ms, limit to 8 suggestions, show with highlighted matching prefix.
9. Capture analytics pipeline: log every search query (query string, filters, result count, clicked result ID, timestamp, user ID) to a search analytics store. Compute zero-result query rate, click-through rate by position, and query frequency distribution weekly.
10. Implement hybrid search: generate embedding vectors for documents using a sentence transformer model, store in a vector database (pgvector, Pinecone), combine with keyword search using reciprocal rank fusion (RRF) or a learned weighting function, and tune the hybrid weight based on A/B test results.

## Inputs

- Search requirements: document types and fields to search, expected query volume, latency SLAs, typo tolerance level (lenient vs strict), and language(s) to support.
- Data sources: primary database (Postgres, MySQL), document store (MongoDB), or content management system that provides the data to be indexed.
- Facet configuration: list of filterable fields with their types (numeric range, categorical, boolean), default sort order for facet values (by count or alphabetical), and multi vs single selection per facet.
- Relevance business rules: which fields are most important (title > tags > description > content), freshness requirements, popularity metrics, and any manual boosting rules for specific documents or categories.
- UI mockups: search input design, autocomplete dropdown layout, search results page with facet sidebar, result card design, and highlighting style for matched terms.
- Analytics requirements: which search metrics to track, retention period for query logs, and integration target for analytics data (data warehouse, dashboards).

## Outputs

- Search index configuration: index mapping with analyzed fields, filterable/ facetable fields, sort fields, and language-specific analyzer configurations.
- Search service: typed service functions (`search(query, filters, sort, page)`, `suggest(query)`, `indexDocument(doc)`, `deleteFromIndex(id)`) that abstract the search backend behind a clean API.
- Autocomplete component: real-time suggestion dropdown with debounced input, keyboard navigation (Arrow keys, Enter, Escape), highlighted matches, and analytics tracking.
- Search results component: result list with pagination or infinite scroll, highlighted snippets, facet sidebar with dynamic counts, sort dropdown, and active filter display with remove buttons.
- Faceted search hooks: custom hooks (`useSearch`, `useAutocomplete`) that manage query state, filter state, pagination, and integration with URL search params for shareable search results.
- Search analytics pipeline: middleware or service that captures every search interaction and writes to analytics store, with batch processing for high-volume scenarios.
- Index maintenance scripts: full reindex script for initial population, incremental update triggers for real-time indexing (webhooks, CDC), and index health monitoring.

## Rules

1. Never search without an index — scanning the entire database with `LIKE '%query%'` for full-text search is unacceptable for any collection larger than 1000 records.
2. Always return search results in under 200ms at the 95th percentile — if the search backend cannot meet this, add a caching layer (CDN for popular queries, Redis for recent queries).
3. Always highlight matched terms in search result snippets so users can immediately see why each result matches their query.
4. Never show "No results found" without suggestions — suggest alternative spellings, broader categories, or popular searches to guide the user to relevant content.
5. Always handle empty search queries gracefully — either show recent/popular results or a "Type to search" message, never show all documents or an error.
6. Always respect user permissions in search results — never return documents the user does not have access to, even if they match the query (apply document-level security filters).
7. Never index sensitive or personal data that should not be searchable — exclude password fields, internal notes, PII, and other non-public fields from the search index.
8. Always debounce autocomplete requests by at least 150ms — never send a request on every keystroke, which overloads the server and wastes bandwidth.
9. Never return more than 10,000 results in a single search response — paginate with a hard limit and communicate total results count as an approximation for large result sets.
10. Always log zero-result queries separately and review them weekly — zero results often indicate content gaps, misspellings, or indexing issues that need attention.

## Best Practices

1. Use dedicated search engines (Elasticsearch, Meilisearch, Typesense) for any search that requires typo tolerance, faceting, or relevance tuning — PostgreSQL `tsvector` is excellent for simple full-text search but lacks these features natively.
2. Implement document-level security (DLS) as filters in every search query — filter results by user role, group membership, or ownership at query time, not post-query, to avoid leaking data through result counts.
3. Use search-as-you-type (prefix matching) for autocomplete rather than waiting for the user to finish typing — prefix matching catches queries mid-word and reduces the number of keystrokes needed.
4. Tune the `analyzer` per field: use a `standard` analyzer with stemming for long text (descriptions, articles), a `keyword` analyzer for exact match fields (SKU, ISBN, email), and an `edge_ngram` analyzer for autocomplete fields.
5. Implement A/B testing for relevance tuning: serve 50% of traffic with the current ranking formula and 50% with a proposed change, measure click-through rate at position 1-3, and promote the winner.
6. Use `search_after` or cursor-based pagination for deep pages in search results instead of `from`/`size` — deep offset pagination is expensive in Elasticsearch and can time out on pages beyond 1000.
7. Index denormalized documents: flatten related data (category name, author name, tags) into the search document at index time rather than joining at query time — this keeps queries fast and simple.
8. Implement a synonym dictionary for domain-specific terms: e.g., "laptop" = "notebook", "cell phone" = "mobile phone" = "smartphone" — this increases recall without requiring exact matches.
9. Use function score queries to blend multiple signals: `0.6 × BM25(text relevance) + 0.3 × log(popularity) + 0.1 × freshness_score` — weighted scores produce more relevant results than any single signal.
10. Warm the search cache for popular queries: pre-execute the top 100 most frequent search queries every 5 minutes and keep them cached in Redis — this provides sub-10ms response times for the most common queries.

## Anti-patterns

1. Using `SELECT * FROM products WHERE name LIKE '%query%'` for search on a table with 10,000+ rows — this is a full table scan that gets slower as data grows and provides no relevance ranking.
2. Returning all search results in a single page without pagination — large result sets cause slow page loads, memory issues on the client, and poor user experience.
3. Implementing autocomplete with zero debounce — sending a network request on every keystroke creates hundreds of requests per search session, overwhelming the server and wasting data on mobile.
4. Ignoring zero-result queries — users who search and find nothing are likely to leave; zero-result queries indicate content gaps or poor index coverage that should be investigated.
5. Hiding the total result count or showing inaccurate counts — users need to know the scope of results; faceted search with inaccurate counts (counts not updated when filters change) destroys trust.
6. Using the same analyzer for all fields — applying stemming to product SKUs turns "ABC-123" into garbage tokens, and using keyword analysis on long descriptions prevents any partial matching.
7. Not applying document-level security filters — users may see results they cannot access, and clicking them leads to 403 errors or partial content, a confusing and trust-breaking experience.
8. Indexing every field without consideration — indexing large binary fields, raw HTML, or JSON blobs bloats the index, increases storage costs, and slows down indexing and searching.

## Edge Cases

1. Very short queries (1-2 characters): must still return relevant results — use prefix matching for short queries or boost exact prefix matches over partial matches.
2. Special characters in queries: handle `@`, `#`, `!`, `"`, `+`, `-` correctly — some search engines treat these as operators; escape them or treat them as literals depending on intent.
3. Queries with only stop words (e.g., "to be or not to be"): the search engine may find nothing if stop words are removed — index with stop words preserved or switch to a match_phrase query.
4. Language detection: if the index contains documents in multiple languages, detect the query language and apply the appropriate analyzer — mixing analyzers across languages produces poor results.
5. Empty index during initial indexing: if the search service starts before the first index is built, return a friendly "Search is being indexed, please try again soon" message rather than "No results found".
6. Index lag: when a document is created but not yet indexed, it won't appear in search results — implement a "search within my recent documents" fallback that queries the database directly for just-created documents.
7. Facet value explosion: a "color" facet with 200 distinct values is unusable — cap facets to the top 10-20 values by count and provide a "Show all" link or a search-within-facets input.
8. Personalization and A/B testing: if search results are personalized, ensure that caching strategies respect user identity — never serve a cached personalized result to a different user.

## Validation Checklist

- [ ] Search results return in under 200ms (p95) with the expected query volume — load test confirms performance target.
- [ ] Typo tolerance works as expected: "teh" returns results for "the", "mik" returns results for "milk" (distance 2).
- [ ] Autocomplete shows suggestions within 150ms of the last keystroke, limited to 8 suggestions, with highlighted prefixes.
- [ ] Facet counts accurately reflect the result set after applying all current filters — verified by manual testing.
- [ ] Search result snippets highlight matched terms with `<mark>` or equivalent styling.
- [ ] Zero-result queries show suggestions (alternate spelling, broader category, popular searches) instead of a blank page.
- [ ] Document-level security filters are applied: querying while logged in as User A does not show User B's private documents.
- [ ] Search analytics are captured: query, filters, result count, clicked result ID, timestamp, and user ID are logged.
- [ ] The index is kept up to date: new documents appear in search within 60 seconds of creation (near-real-time indexing).
- [ ] Pagination is implemented with `search_after` or cursor-based pagination, not deep offsets (pages beyond 100 are fast).

## Engineering Examples

### Example 1: Implementing Full-Text Search with Postgres tsvector

An e-commerce site with 50,000 products implements search using PostgreSQL's built-in full-text search. A `products` table has columns: `name`, `description`, `category`, and `tags`. A generated `tsvector` column `search_vector` is created as: `to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(tags, ' '), ''))`. A GIN index on `search_vector` enables fast searches. The search query is: `SELECT *, ts_rank(search_vector, plainto_tsquery('english', :query)) AS rank FROM products WHERE search_vector @@ plainto_tsquery('english', :query) ORDER BY rank DESC LIMIT 20`. For relevance, `ts_rank` is used with weights: `setweight(to_tsvector(coalesce(name, '')), 'A') || setweight(to_tsvector(coalesce(description, '')), 'B')` so matches in the title (weight A) rank higher than matches in the description (weight B). The search results page shows 20 results at a time with offset-based pagination. Highlighting is done in the application layer by wrapping query terms in `<mark>` tags within the result snippets. This implementation handles 50,000 products with sub-10ms query times and zero additional infrastructure.

### Example 2: Building Faceted Search with Elasticsearch

An online fashion retailer with 500,000 products uses Elasticsearch for search. The index mapping has `name` (text with edge_ngram analyzer), `description` (text with standard analyzer), `price` (float), `brand` (keyword for faceting), `category` (keyword for faceting, hierarchical: "Women > Dresses > Summer"), `color` (keyword for faceting), `size` (keyword for faceting), `rating` (float), and `created_at` (date). The search query is a `bool` query: `must` clause with `multi_match` on `name^3, description, tags^2` with `fuzziness: AUTO`, `filter` clause with `term` on brand, category, color, and `range` on price and rating. The `aggs` section returns facet counts for each filterable field. Facet counts use `filter` aggregations so they reflect the current query and applied filters (excluding the filter being computed). The results are displayed with a left sidebar showing active filters (with remove buttons), facet values with counts, and a price range slider. Sorting options include relevance (default), price ascending, price descending, newest, and customer rating. The search analytics track every query via Elasticsearch's slow logs and a custom index.

### Example 3: Implementing Autocomplete Suggestions with Debounced Search

A knowledge base with 10,000 articles implements autocomplete. The input field debounces at 150ms — when the user types "instal", after 150ms of no typing, a request is sent to `GET /api/suggest?q=instal`. The server queries Elasticsearch using `match_phrase_prefix` on the `title` field with `boost: 3`, a `match_bool_prefix` on `content` with `boost: 1`, and aggregates the top 8 suggestions from the `title` field using `significant_text` aggregation. Results are returned as `[{ text: "Installation Guide for Linux", category: "DevOps", url: "/docs/install-linux", highlight: "<strong>Instal</strong>lation Guide for Linux" }]`. The dropdown renders with keyboard navigation: Arrow Down/Up cycles through suggestions, Enter navigates to the selected suggestion, Escape closes the dropdown. The autocomplete also shows popular searches that match the prefix from the last 30 days (sourced from the search analytics table). Each suggestion selection is tracked as a search analytics event. The debounce prevents excessive requests — even rapid typing only triggers 2-3 requests for a 10-character query typed in 1 second.
