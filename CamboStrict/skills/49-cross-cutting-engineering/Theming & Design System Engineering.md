# Theming & Design System Engineering

## Purpose
Establish a repeatable engineering framework for designing, building, and maintaining design systems with multi-mode theming (light, dark, high-contrast) that scales across multiple applications, supports runtime switching without layout shifts or flicker, and ensures visual consistency through a centralized token architecture.

## Responsibilities
- Design a design token hierarchy (global, alias, component) that maps brand values to concrete style values and supports mode overrides at every level.
- Implement theme distribution using CSS custom properties for runtime mode switching and static preprocessor variables for build-time optimization.
- Build mode-dependent theming that supports light, dark, and high-contrast modes with seamless switching and no layout shifts.
- Enable component-level theme overrides so that a single component instance can deviate from the global theme without affecting siblings.
- Implement runtime theme switching that updates all visual properties synchronously without flicker, white flash, or jarring transitions.
- Persist the user's theme preference across sessions using localStorage, cookies, or server-side user profiles.
- Build and maintain design system documentation that serves as the single source of truth for designers and engineers.
- Package the component library as a distributable npm package with tree-shakeable CSS, TypeScript types, and per-component entry points.

## Decision Process
1. Audit the existing codebase to inventory all hard-coded color values, font sizes, spacing units, and breakpoints. Catalog them into a raw token list grouped by domain (color, typography, spacing, shadow, animation).
2. Define the global token tier — raw values like `--color-blue-500: #3B82F6`. These never change between modes and serve as the foundation.
3. Create alias tokens that give semantic meaning: `--color-primary: var(--color-blue-500)`. Aliases map global tokens to roles. In dark mode, override the alias: `--color-primary: var(--color-blue-300)`.
4. Build component tokens at the lowest tier: `--button-bg: var(--color-primary)`. Component tokens reference aliases so they automatically adapt when a mode override changes the alias.
5. Choose a distribution format: CSS custom properties for runtime theming (light/dark toggle), Sass/SCSS variables for build-time optimization (static exports), or both. Prefer CSS custom properties as the primary mechanism.
6. Implement mode switching by applying a `data-theme` attribute on `<html>` and redefining the alias tokens under `[data-theme="dark"]`. The browser applies the new values immediately with no JavaScript layout calculation.
7. Design component-level overrides by allowing consumers to pass a `themeOverrides` prop that sets inline CSS custom properties scoped to that component's subtree. Use React context or Web Component shadow DOM to isolate overrides.
8. Persist theme preference by writing to `localStorage` on toggle and reading on app bootstrap before the first paint (use a blocking `<script>` in `<head>` to prevent flash).
9. Build documentation using Storybook with addons for theme switching, token inspection, accessibility contrast reports, and responsive viewports. Keep documentation in sync with the source tokens via a token JSON file.
10. Package the library using Rollup with PostCSS, generating separate CSS files for each theme mode (`light.css`, `dark.css`) and per-component CSS so consumers can tree-shake unused styles.

## Inputs
- Brand guidelines document containing hex color values, font families, spacing rules, shadow definitions, and logo usage specifications.
- Accessibility compliance targets (WCAG 2.1 AA/AAA contrast ratios for normal text, large text, and UI components).
- Product requirements for theme modes: light, dark, high-contrast, and any brand-specific seasonal themes.
- Application architecture details: framework (React, Vue, Angular, Web Components), build tooling (Webpack, Vite, Rollup), and CSS approach (CSS Modules, styled-components, Tailwind).
- Consumer application list: which apps consume the design system, their versioning requirements, and their update cadence.

## Outputs
- Design token specification in JSON format with global, alias, and component tiers plus mode overrides for each token.
- CSS custom property output files (`tokens.css`, `tokens.dark.css`, `tokens.high-contrast.css`) that consumers import directly or compose into their own stylesheets.
- Component library npm package with named exports (`Button`, `Input`, `Modal`), per-component CSS, TypeScript type definitions, and a `ThemeProvider` for runtime mode switching.
- Storybook documentation site with interactive theme switching, token viewer, accessibility panel, and usage guidelines for each component.
- Theme persistence utility (`setTheme`, `getTheme`, `useTheme`) that handles localStorage read/write and prevents flash of unstyled content.

## Rules
- Every color MUST have a corresponding high-contrast override that meets WCAG AAA for normal text (7:1 contrast ratio).
- CSS custom properties MUST be used for any value that changes between modes. Preprocessor variables are only for build-time constants that never vary.
- Theme switching MUST be synchronous — the `data-theme` attribute change triggers CSS re-evaluation in the same frame. JavaScript-based theme switching that causes a repaint delay is unacceptable.
- Design tokens MUST be versioned and published as a separate package so that component library and consumer applications can update tokens independently.
- Component-level theme overrides MUST NOT leak outside the component's subtree. Use CSS scoping (shadow DOM, CSS Modules, or `:where` for zero-specificity overrides).
- The initial theme MUST be applied before the first render to prevent a flash of light theme on dark-mode-preference users. Use a blocking inline script in `<head>`.
- Token names MUST follow a documented naming convention (`{category}-{property}-{variant?}-{state?}`) so that any engineer can predict the token name for a given visual property.
- Deprecated tokens MUST be supported for at least one major version with a deprecation warning in the build logs before removal.

## Best Practices
- Store all design tokens in a single JSON file and generate CSS, SCSS, JS, and iOS/Android platform files from it using a token transformer (Style Dictionary or Diez). This ensures one source of truth.
- Use `:root` for light mode defaults, `[data-theme="dark"]` for dark overrides, and `@media (prefers-contrast: more)` for high-contrast overrides so the system respects OS-level settings automatically.
- Build a Figma plugin that reads the same token JSON file so designers use the exact same values as engineers — eliminating the design-to-development gap.
- Implement a theme preview tool that shows any component in all modes simultaneously so QA can verify contrast and appearance in a single view.
- Use CSS logical properties (`border-inline-start` instead of `border-left`) so theming automatically handles RTL layouts without additional overrides.
- Write a visual regression test suite (Chromatic or Percy) that captures each component in every theme mode and fails on pixel diffs.
- Expose a `useTheme` hook that returns the current mode, a `toggleTheme` function, and a set of resolved CSS custom property values for use in imperative styling scenarios.
- Document the token hierarchy with a visual map showing which component tokens reference which alias tokens, so engineers understand the dependency chain when overriding.

## Anti-patterns
- Defining colors directly in component CSS files instead of referencing tokens. This creates scattered color values that must be found and updated individually when the brand palette changes.
- Using JavaScript to compute theme values by reading CSS custom properties via `getComputedStyle` and then applying inline styles. This creates a double-render and defeats the purpose of CSS theming.
- Overriding tokens at the component level using global CSS with high specificity selectors instead of scoped CSS custom properties. This leaks overrides to sibling and child components.
- Shipping all theme CSS in a single bundle and toggling themes by class name toggling on the body. This prevents tree-shaking and forces every consumer to download all themes regardless of which they use.
- Hard-coding theme persistence logic inside each application instead of providing a shared utility from the design system package. This leads to inconsistent behavior across apps (some flash, some don't).
- Ignoring the `prefers-contrast` and `prefers-reduced-motion` media queries. Users who set OS-level accessibility preferences expect applications to respect them without manual configuration.
- Building theme switching that requires a full page reload or navigation. Theme switching must be instantaneous and purely client-side.
- Creating tokens for every possible CSS property — only tokenize values that are part of the brand system (colors, spacing, typography, shadows, radii). Tokenizing `overflow` or `display` adds unnecessary abstraction.

## Edge Cases
- The user has `prefers-color-scheme: dark` set in the OS but has manually toggled the app to light mode. The manual preference must take precedence and be persisted. The system must detect the OS preference on first visit but never override a saved preference.
- A component is rendered inside a third-party embed that sets its own `data-theme` on a parent element. A component-level override must re-scope the tokens to the component's root element to avoid inheriting the embed's theme.
- A new token is added in the design system but older versions of consumer applications do not include it. The token should have a sensible fallback using CSS `var(--new-token, fallback-value)`.
- The user toggles theme rapidly multiple times. Each toggle must apply the theme synchronously; debouncing or batching theme changes causes a visual stutter.
- A consumer application uses CSS Modules that hash class names. The design system's CSS custom properties are unaffected by hashing, so theme switching works correctly, but component-level overrides must be careful to target unhashed attribute selectors.
- A disabled user relies on Windows High Contrast Mode, which overrides all web page colors. The design system must not fight the OS setting — CSS should use `forced-colors: active` media query to defer to system colors when WM_HCM is active.
- The browser does not support CSS custom properties (IE11). The design system must provide a fallback SCSS build that compiles tokens to static values, or the supported browser matrix must exclude IE11.

## Validation Checklist
- [ ] Every color token has a corresponding dark-mode override and high-contrast override — verified by a script that parses the token JSON and checks for mode keys.
- [ ] Theme switching from light to dark completes within a single animation frame without JavaScript layout thrashing — verified by measuring `requestAnimationFrame` callbacks.
- [ ] The page renders correctly on first load with the user's persisted theme preference — no flash of light mode is visible when dark mode is saved — verified by setting `localStorage.theme=dark` and hard-refreshing.
- [ ] Component-level theme overrides are scoped and do not affect sibling or parent components — verified by rendering two instances of the same component with different overrides and inspecting the DOM.
- [ ] The design system's CSS is tree-shakeable — importing only `Button` does not include `Modal` styles — verified by bundle analyzer.
- [ ] All components pass WCAG AA contrast ratios in light, dark, and high-contrast modes — verified by automated contrast checking (axe-core, Lighthouse) in each mode.
- [ ] The `prefers-reduced-motion: reduce` media query disables all non-essential animations — verified by enabling the OS setting and navigating the app.
- [ ] Token JSON is the single source of truth — changing a value in the JSON file propagates to CSS output, Figma library, and documentation — verified by end-to-end update test.
- [ ] Deprecated tokens emit build warnings and are documented in a migration guide — verified by building with a consumer that uses a deprecated token.
- [ ] The theme persistence script runs synchronously in `<head>` and does not block rendering — verified by checking the critical rendering path with DevTools performance tab.

## Engineering Examples

### Example 1: Building a design token system with light and dark modes
A fintech startup needed a design system that supported light and dark modes because their users often work in low-light trading environments. The team organized tokens into three tiers using Style Dictionary: global colors (`color-blue-500`), semantic aliases (`color-surface-primary`), and component tokens (`card-bg`). The CSS output uses custom properties with `[data-theme="dark"]` overrides for alias tokens. The dark mode does not redefine every global color — only the semantic aliases change, so `color-surface-primary` maps to `color-gray-900` in dark mode while `color-text-primary` maps to `color-gray-100`. Component tokens like `card-bg` reference `var(--color-surface-primary)` so they update automatically. The team wrote a `ThemeProvider` React component that reads the saved preference from localStorage on mount, applies `data-theme` to `<html>`, and provides `setTheme` via context. A blocking `<script>` in `index.html` reads `localStorage.theme` and sets `document.documentElement.dataset.theme` before the CSS loads, eliminating any theme flash. The Figma library is connected to the same token JSON via the Figma Tokens plugin, ensuring parity between design and code.

### Example 2: Runtime theme switching without flicker
A news media site with millions of daily readers needed a dark mode that toggled instantly without any white flash. The team identified that the flash occurred because the React app bootstrapped, read localStorage, and then set the `data-theme` attribute — during the React hydration gap, the default light theme was visible. To fix this, they inserted a synchronous inline script as the very first element in `<head>`: `(function(){ var t = localStorage.getItem('theme'); if(t === 'dark') document.documentElement.classList.add('dark'); })()`. This runs before any CSS or JavaScript downloads. The CSS uses `.dark` class overrides for all alias tokens. When the user toggles the theme, the `ThemeToggle` component calls `localStorage.setItem('theme', mode)` and adds or removes the `dark` class on `<html>`. Because all visual properties are driven by CSS custom properties that change with the class, the theme updates in the same frame. The team also added `prefers-color-scheme: dark` detection for first-time visitors who have never saved a preference, but the explicit save always wins.

### Example 3: Creating a shared component library consumed by multiple apps
A large enterprise with a dozen web applications (marketing site, customer portal, admin dashboard, mobile web) decided to unify their UI under a single design system. The team packaged the component library as `@company/ui` using Rollup. Each component exports a React component and a CSS file. The token system outputs `tokens.css` and `tokens.dark.css`. Consumer applications install the package and import `@company/ui/styles/tokens.css` in their root stylesheet. The `ThemeProvider` component is re-exported so each app wraps its root with it. To support apps that use different frameworks (Angular, Vue), the team also published a vanilla Web Components version of each component using Lit, with the same token system. A shared CI pipeline builds the design system, deploys the Storybook documentation to a company URL, and publishes the npm package. When a design token changes, engineers update the token JSON, run `npx style-dictionary build`, which regenerates all CSS and platform files, and the CI publishes a new patch version. Each consumer app opts in to upgrades on their own schedule.
