# Internationalization (i18n)

## Purpose
Provide a comprehensive engineering framework for internationalizing web applications that handles locale detection, translation management, pluralization, date/number/currency formatting, RTL layout support, and automated translation extraction — enabling a single codebase to serve users in any language and region.

## Responsibilities
- Detect the user's preferred locale from the Accept-Language header, URL path, cookie, or user profile settings with a clear priority chain.
- Define a translation file structure that organizes messages by namespace, component, or domain with a consistent JSON schema.
- Implement ICU message format that supports variable interpolation, pluralization (zero, one, two, few, many, other), gender selection, and nested formatting.
- Apply correct number, date, time, and currency formatting per locale using the Unicode CLDR (Common Locale Data Repository) standard.
- Support RTL (right-to-left) layout using CSS logical properties and the `dir` attribute on `<html>`.
- Lazy-load translation files so a user only downloads the messages for their locale, keeping the initial bundle small.
- Enforce the use of translation keys over inline text in all user-facing strings so that every string is discoverable and translatable.
- Implement fallback locale chains so a missing translation in the target locale falls back to a parent locale (e.g., `es-MX` → `es` → `en`) rather than displaying a missing-key error.
- Build a translation extraction pipeline that scans source code for translation function calls, writes new keys to a master file, and flags unused or deleted keys for cleanup.
- Provide development tooling that shows translation keys inline during development so engineers can see which strings are untranslated at a glance.

## Decision Process
1. Determine the locale detection priority chain (URL path > cookie > user profile > Accept-Language header > default locale). The chain must be documented and implemented in a single middleware function.
2. Choose a translation file structure: single file per locale (`en.json`, `es.json`) for small apps, or namespace-per-domain (`en/common.json`, `en/checkout.json`, `en/errors.json`) for large apps to enable granular lazy-loading.
3. Select the message format: prefer ICU MessageFormat for its built-in pluralization, gender, and selectordinal support. Avoid simple key-value replace formats that do not handle plural rules.
4. Decide on the i18n library: use a battle-tested library (react-intl, i18next, Lingui) rather than building a custom solution. Ensure the library supports ICU, lazy-loading, TypeScript, and fallback locales.
5. Design the translation key naming convention: use dot-notation with domain and component qualifiers (`checkout.payment.creditCardLabel`) so keys are self-documenting and namespaced.
6. Implement RTL support by adding the `dir` attribute to `<html>` and using CSS logical properties (`margin-inline-start` instead of `margin-left`). Do not rely on flipping libraries like RTLCSS — write logical CSS from the start.
7. Build the lazy-loading strategy: split translation files by locale and namespace, load the primary locale on app bootstrap, and fetch additional namespaces on-demand as the user navigates.
8. Establish a translation extraction pipeline: a CLI script that parses AST (not regex) to find `t()` calls, extracts keys, compares against existing translation files, adds new keys, and reports unused keys for cleanup.
9. Set up fallback chains in the i18n configuration: `es-MX` falls back to `es`, which falls back to `en`. Ensure that missing keys log a warning in development but silently fall back in production.
10. Configure number, date, and currency formatting using `Intl` APIs (or library wrappers) with locale-aware options. Test with representative values for each locale (large numbers, different calendar systems, non-standard currencies).

## Inputs
- Product requirements specifying target locales, date formats, currency displays, and RTL language support.
- UX/design guidance on text expansion/contraction per locale (German text is ~30% longer than English; Japanese is often shorter) to prevent layout breakage.
- Legal requirements for supported locales (terms of service, privacy policy translations).
- Translation team workflow: PO files, JSON, or SaaS platform (Crowdin, Lokalise, Phrase) for translator collaboration.
- Existing codebase inventory of all hard-coded user-facing strings that must be extracted.

## Outputs
- Translation key architecture document describing the namespace hierarchy, key naming conventions, and fallback locale chains.
- Translation JSON files organized per locale and namespace with all extracted strings.
- i18n configuration module that initializes the library, configures detection, lazy-loading, and fallbacks.
- Lazy-loading integration: dynamic imports that fetch translation chunks on route change or component mount.
- Extraction CLI tool configuration (e.g., Lingui extract, i18next-scanner) integrated into the build pipeline.
- RTL CSS audit: all layout-affecting CSS properties reviewed and replaced with logical equivalents.

## Rules
- Every user-facing string MUST use a translation function — hard-coded inline text in JSX or templates is prohibited and caught by a lint rule.
- Translation keys MUST be unique across the entire application. Duplicate keys with different values in different namespaces cause subtle localization bugs.
- Pluralization MUST use the CLDR plural rules for the target locale, not English-centric (singular/plural) logic. Arabic has 6 plural forms; Japanese has 1.
- RTL layout MUST use CSS logical properties (`inset-inline-start`, `padding-inline-end`) not physical properties (`left`, `right`) — verified by removing the `dir` attribute during QA to catch hard-coded physical properties.
- Locale detection MUST be performed on the server for SSR applications so the initial HTML includes the correct `lang` and `dir` attributes.
- Translation files MUST be validated by a schema that checks for missing keys, extra keys, and invalid ICU syntax on every build.
- Date/time formatting MUST use the user's locale, not the server's locale. Always pass the user's locale string to `Intl.DateTimeFormat`.
- Currency formatting MUST include the currency code or symbol appropriate for the locale, not just a static symbol. `$` means different currencies in different locales.

## Best Practices
- Use `Intl` APIs for all locale-sensitive formatting (numbers, dates, currencies, lists, relative time) — they are built into every modern browser and eliminate the need for large formatting libraries.
- Write all text strings in the source code in the default locale (usually English) and extract them via the CLI tool. This keeps the code readable and avoids cryptic key names.
- Design layouts with text expansion in mind: avoid fixed-width buttons, single-line truncation of labels, and absolute positioning of text elements. Test with German, Finnish, and Arabic to stress-test layouts.
- Implement a translation debug mode that renders the translation key in place of the translated value during development. This makes missing or untranslated keys immediately visible.
- Cache loaded translations in memory and never reload them unless the locale changes. Use the library's built-in caching or a simple Map.
- Use `Intl.ListFormat` to format lists (items separated by commas with locale-appropriate conjunctions) rather than hard-coding `", "` joins.
- Create a locale unit test suite that renders every component with every locale and takes screenshots for visual comparison. Automate this in CI.
- Provide a locale switcher in the development environment that cycles through all supported locales so engineers can test translations without changing browser settings.

## Anti-patterns
- Using English plural rules (`item(s)`) instead of ICU `{count, plural, one {...} other {...}}`. This produces grammatically incorrect text in most languages.
- Concatenating translated strings with JavaScript: `t('hello') + ' ' + username`. The word order differs per language. Use ICU interpolation: `t('hello', { username })` with the template `Hello, {username}`.
- Building RTL support by flipping all CSS left/right values with a post-processing tool. This approach breaks when third-party components or dynamically injected styles are not flipped, and it adds a fragile build step.
- Storing full sentences as translation keys that include HTML markup. Instead, use ICU tags or split markup from text: `<Text>{t('welcomeMessage')}</Text>` where the translation contains only text.
- Loading all translations for all locales in the initial bundle. This increases the bundle size linearly with the number of locales and degrades the first-load experience.
- Using machine translation in production without human review. Machine translations should be clearly labeled or used only as fallbacks behind human-reviewed content.
- Hard-coding the date format as `MM/DD/YYYY` — this is ambiguous (is 04/05 June or April?) and is not the standard format in most locales. Use `Intl.DateTimeFormat` or a locale-aware pattern.
- Assuming all languages read left-to-right. Layout, alignment, and text direction must be fully parameterized by locale, with direction-specific CSS logical properties.

## Edge Cases
- A locale is requested that has incomplete translations (e.g., only 30% of keys are translated). The fallback chain must fill missing keys from the parent locale without showing raw keys to the user.
- The user switches from English to Arabic while filling out a multi-step form. The displayed text must update immediately, but the form field values and state must persist. Avoid unmounting the entire form during locale switch.
- A text string in German is 40% longer than its English counterpart and overflows its container. The layout must handle overflow gracefully with `overflow-wrap: break-word` and tested min-width constraints.
- The browser's `Intl` API formats a date differently on different operating systems (macOS vs Windows vs Linux). The application must use a consistent `Intl.DateTimeFormat` options object across all environments.
- A pluralized string contains a number that is formatted differently per locale (`1,234` vs `1.234`). The ICU message must use the formatter number, not the raw number, inside the plural select.
- A key that exists in translation files but is no longer used in the code must be flagged and optionally removed. The extraction pipeline must support a `--prune` flag that deletes orphaned keys.
- The user's browser does not support `Intl` (very old browsers). A polyfill must be loaded conditionally, or the i18n library's fallback formatting must be used.

## Validation Checklist
- [ ] Every user-facing string in the application's source code is wrapped in a `t()` or `<Trans>` function — verified by a lint rule or AST scan.
- [ ] Translation files for all target locales exist with no missing keys — verified by a comparison script in CI that compares each locale against the source locale.
- [ ] ICU messages with pluralization render correctly for all plural forms (zero, one, two, few, many, other) — verified by unit tests that call each form with appropriate numeric values.
- [ ] Date, time, number, and currency formatting match locale expectations — verified by rendering sample data for each locale and inspecting visually.
- [ ] RTL layout renders correctly with no hard-coded `left` or `right` CSS properties — verified by a grep for `\b(left|right)\b` in CSS files that should use logical properties.
- [ ] Translation lazy-loading works — switching to a locale loads only that locale's translation file (verified by network tab) and does not load all locales.
- [ ] Fallback chain works: a missing key in `es-MX` falls back to `es`, then to `en` — verified by temporarily removing a key from `es-MX.json` and confirming the `es` (or `en`) value displays.
- [ ] Locale detection priority chain is respected — setting a cookie overrides the Accept-Language header — verified by integration tests that set each detection source and check the active locale.
- [ ] No translation key appears as raw text in the UI in production — verified by an E2E test that checks that no text matching the key pattern (`^[a-z]+\.[a-z]+`) is visible in the DOM.
- [ ] Build-time extraction correctly identifies new keys and flags removed keys — verified by adding a new `t('test.key')` call, running extraction, and confirming the key appears in the JSON files.

## Engineering Examples

### Example 1: i18n with lazy-loaded translations for a React web app
A travel booking platform targets 15 locales including Arabic, Japanese, and German. The team chose react-intl with ICU MessageFormat. Translations are stored as JSON files in `src/translations/{locale}/{namespace}.json` (e.g., `src/translations/en/checkout.json`). The app loads the core namespace on bootstrap and lazy-loads per-page namespaces via dynamic `import()` as the user navigates. Locale detection runs on the server (Next.js): the middleware reads the `Accept-Language` header, checks for a `lang` cookie, and sets the locale in the URL path (`/es/checkout`, `/ar/checkout`). The SSR response includes the correct `lang` and `dir` attributes. For Arabic, the server sets `dir="rtl"` and the CSS uses logical properties throughout. The extraction pipeline uses `@lingui/extract` CLI run as a pre-commit hook, which scans JSX for `<Trans>` components and `t()` calls, updates the JSON files, and exits with an error if any locale is missing the new key. A translation debug mode is toggled by a URL parameter — it renders the key name in brackets next to each translated string so engineers can spot untranslated content during review.

### Example 2: Arabic RTL layout with CSS logical properties
A SaaS dashboard needed to support Arabic alongside English. Instead of using a CSS-flipping tool, the team rewrote all layout-affecting CSS to use logical properties: `margin-inline-start` instead of `margin-left`, `padding-inline-end` instead of `padding-right`, `border-inline-start` instead of `border-left`. Grid and flexbox naturally reorder content when `dir="rtl"` is set on the `<html>` element, but the team found that some third-party charting libraries rendered SVG with hard-coded `x` and `y` coordinates. For those, they implemented a locale-aware wrapper that reversed the data series order for RTL locales. They also discovered that some CSS animations used `translateX(-100%)` which breaks in RTL; they switched to `translateX(-100%)` in RTL is actually `translateX(100%)` — solved by using CSS custom properties: `--slide-out: -100%` in LTR, `--slide-out: 100%` in RTL, and the animation uses `translateX(var(--slide-out))`. The QA process includes a checklist item: "Remove the `dir` attribute and confirm the layout still looks intentional" to catch hard-coded physical properties.

### Example 3: Translation extraction pipeline
A content-heavy e-learning platform had accumulated 3,000+ user-facing strings across 200 components, many of which were hard-coded inline text. The engineering team built an extraction pipeline using a custom AST parser (based on Babel) that finds all `t()` calls and `<FormattedMessage>` components. The parser outputs a `messages.pot` file with all keys and their default English values. A GitHub Actions workflow runs extraction on every PR that touches source files, compares the new `messages.pot` against the existing translations, and posts a comment listing new, modified, and deleted keys. Missing translations in any of the 8 target locales cause the CI check to warn (but not fail on PRs — translations are handled separately by the localization team). The pipeline also detects ICU syntax errors (unbalanced braces, invalid plural forms) and reports them as build failures. Every night, a cron job runs `--prune` to remove keys that have not been referenced in the source code for 30 days and posts a report to Slack for the localization team to review before the keys are actually deleted.
