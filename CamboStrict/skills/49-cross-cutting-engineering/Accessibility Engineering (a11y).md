# Accessibility Engineering (a11y)

## Purpose
Establish a rigorous engineering framework for building web applications that meet WCAG 2.2 AA standards (and AAA where feasible) — covering semantic HTML, ARIA roles and properties, keyboard navigation, focus management, screen reader announcements, color contrast, reduced motion, zoom support, and automated accessibility testing integrated into the development pipeline.

## Responsibilities
- Implement the four WCAG 2.2 principles (Perceivable, Operable, Understandable, Robust) in every component and page, treating accessibility as a core requirement not a polish step.
- Use semantic HTML elements (`<button>`, `<nav>`, `<header>`, `<main>`, `<article>`, `<aside>`, `<footer>`, `<fieldset>`, `<legend>`, `<table>`) as the foundation, adding ARIA only when semantic HTML is insufficient.
- Apply ARIA roles, states, and properties correctly according to the WAI-ARIA Authoring Practices Guide, ensuring that custom interactive components (tabs, modals, accordions, comboboxes, sliders) are communicated correctly to assistive technology.
- Ensure complete keyboard operability: every interactive element must be reachable and operable via keyboard alone, with a visible focus indicator, logical tab order, and no keyboard traps.
- Manage focus programmatically: move focus to the correct element when content changes (opening a modal, navigating a route, updating a live region), and restore focus when the change is dismissed.
- Provide screen reader announcements using `aria-live` regions (polite, assertive) for dynamic content changes that are not communicated through normal focus movement.
- Maintain minimum color contrast ratios: 4.5:1 for normal text, 3:1 for large text (18px bold or 24px regular) and UI components, measured against the actual background.
- Respect the `prefers-reduced-motion` media query by disabling or simplifying non-essential animations and transitions.
- Support browser zoom up to 400% without content loss, horizontal scrolling, or overlapping elements. The layout must be fully responsive at all zoom levels.
- Implement automated accessibility testing in CI (axe-core, Lighthouse, Pa11y) with error thresholds that block merges on violations of WCAG A and AA criteria.

## Decision Process
1. Start with semantic HTML before adding ARIA. A `<button>` with native click handling is infinitely more accessible than a `<div>` with `role="button"`, ARIA attributes, and a JavaScript click handler. Review each component's template and replace non-semantic elements with their semantic equivalents.
2. For custom interactive widgets not natively available in HTML (tabs, accordions, tree views, comboboxes, sliders), consult the WAI-ARIA Authoring Practices Guide for the correct role, states, and keyboard interaction pattern. Implement exactly what the APG specifies — no deviations.
3. Design the focus management strategy: Route changes focus the `<h1>` or a skip-link target. Modals trap focus within the modal. Disclosure widgets focus the triggering button after collapse. Lists of actionable items support arrow key navigation (roving tabindex).
4. Define the skip-link placement: the very first focusable element on the page must be a "Skip to main content" link that targets `<main id="main-content">`. This is the highest-impact accessibility fix for keyboard and screen reader users.
5. Choose a color palette that meets WCAG AA contrast ratios. Use a contrast checker tool during design. If the brand color does not meet 4.5:1 for text, use it only for large decorative elements and choose a darker variant for text.
6. Implement `prefers-reduced-motion` support: identify all CSS animations, transitions, and JavaScript-driven animations. Wrap them in `@media (prefers-reduced-motion: no-preference)` for CSS, and check `window.matchMedia('(prefers-reduced-motion: reduce)')` for JS animations.
7. Set up the automated a11y testing pipeline: choose axe-core as the primary rule engine (most comprehensive, fewest false positives), run it in unit tests (for individual components) and E2E tests (for full pages), and fail the build on any violation of severity "critical" or "serious."
8. Perform manual testing with a screen reader (VoiceOver on macOS, NVDA on Windows) for the top 10 user flows. Automated tests catch ~30% of accessibility issues — the rest require human judgment.
9. Write accessibility documentation for each component: expected screen reader announcements, keyboard interactions, focus behavior, and known limitations. This documentation lives alongside the component in Storybook.
10. Establish a severity classification for a11y bugs: WCAG A violations (screen reader cannot complete a purchase) are P0 and block the release. WCAG AA violations (low contrast on non-essential text) are P1. WCAG AAA violations (7:1 contrast for all text) are P2.

## Inputs
- WCAG 2.2 success criteria checklist for the target compliance level (AA minimum, AAA preferred).
- Brand color palette with hex values for all text, background, border, and interactive element colors.
- Component inventory with interaction patterns: modals, dropdowns, tabs, accordions, tables, forms, drag-and-drop, data tables, carousels.
- User research feedback: known accessibility barriers reported by users, support tickets related to assistive technology, and analytics showing keyboard-only usage.
- Design system token values: font sizes, spacing, color roles, and animation durations that affect accessibility.

## Outputs
- Accessibility conformance report: an audit of every page and component against WCAG 2.2 AA criteria, with pass/fail status and remediation steps for failures.
- Keyboard interaction specification: a document detailing the tab order, arrow key navigation, escape key handling, and focus management for every interactive component.
- ARIA implementation guide: a per-component reference listing required roles, states, properties, and the expected screen reader announcements.
- Color contrast compliance matrix: every text/background combination in the design system with its contrast ratio and pass/fail status.
- Automated a11y test suite: axe-core configured in Jest/Cypress with custom rules and exception handling.
- Screen reader test scripts: step-by-step scripts for testing the top 10 user flows with VoiceOver and NVDA.
- Focus management implementation: a `useFocusTrap` hook, a `useFocusOnMount` hook, and a `useRestoreFocus` hook for modals, drawers, and navigation.

## Rules
- Every interactive element MUST be operable by keyboard. If a user cannot Tab to an element and activate it with Enter or Space, it fails WCAG 2.1.1 Keyboard.
- Every non-text element (image, icon, chart) MUST have a text alternative. Decorative images must have `alt=""` (empty alt). Functional images (icon buttons) must have `alt` text describing the action.
- Focus indicators MUST be visible with a minimum 2px outline offset by 2px from the element border. Using `outline: none` without a replacement focus style is a WCAG 2.4.7 failure.
- ARIA MUST NOT be used on semantic HTML elements. Do not add `role="button"` to a `<button>`, `role="heading"` to an `<h1>`, or `role="navigation"` to a `<nav>`. This causes conflicting announcements for screen readers.
- Dynamic content changes MUST be announced to screen readers via `aria-live` regions. Loading spinners, inline validation errors, toast notifications, and search results updates all require live regions.
- Modals and dialogs MUST trap focus within the dialog while open, and MUST restore focus to the triggering element when closed. Escape key MUST close the dialog.
- All form controls MUST have an associated `<label>` element that is programmatically linked via `for`/`id` or wrapping. Placeholder text is not a substitute for a label.
- `prefers-reduced-motion: reduce` MUST disable all non-essential animations, including parallax, auto-scrolling carousels, hover transitions, and loading spinners. Only essential animations (loading progress bar, skeleton screens) may remain.

## Best Practices
- Use a single source of truth for accessible labels: derive `aria-label` from the same data as the visible label, so they never get out of sync. If the visible label comes from a translation key, use the same key for `aria-label`.
- Build a custom `a11ySnapshot` testing utility that captures the accessibility tree of a component and asserts the expected roles, names, and states. This is more robust than checking DOM attributes.
- Add a "respects motion preference" section to the design system documentation: list every animation with its `prefers-reduced-motion` fallback, so developers know which animations are safe to use.
- Implement a "high contrast mode" theme that goes beyond WCAG AA to meet WCAG AAA (7:1 contrast ratio for all text). Offer this as an optional theme toggle for users who need it.
- Use `aria-current="page"` on the current navigation link so screen reader users know which page they are on without scanning the entire nav.
- For single-page applications, manage the document title on route change using a React Helmet or equivalent. Each page must have a unique, descriptive title that screen readers announce on navigation.
- Test with real assistive technology (VoiceOver, NVDA, JAWS) on a weekly basis. Automated tests miss issues like confusing announcement order, excessive verbosity, or missing context.
- Provide a keyboard shortcut cheatsheet: a button in the footer that opens a modal listing all keyboard shortcuts available in the application.

## Anti-patterns
- Using `<div>` or `<span>` as clickable elements with `onClick` instead of `<button>`. These elements are not focusable, not announced as interactive, and do not respond to Space/Enter by default.
- Adding `role="alert"` to a live region that is already present in the DOM. The alert role causes immediate interruption. Use `aria-live="assertive"` only for time-critical messages; use `aria-live="polite"` for most updates.
- Hiding focus indicators with `outline: none` and not providing an alternative focus style. Keyboard users cannot navigate the page without a visible focus indicator.
- Marking every image as decorative with `alt=""` because the team is too lazy to write descriptive alt text. Functional images (chart, infographic, diagram) require substantive alt text or a linked long description.
- Using color alone to convey information (red for errors, green for success). Always include an icon, text, or pattern in addition to color.
- Building custom form controls (select, checkbox, radio) without following the ARIA Authoring Practices. Custom controls that do not report their state to the accessibility tree are invisible to screen readers.
- Creating modals and dialogs without focus trapping. The user can Tab behind the modal and interact with the background page, losing context and potentially performing unintended actions.
- Adding `tabindex="0"` to non-interactive elements like `<p>` or `<div>`. Only interactive elements should be focusable. Non-interactive elements with tabindex confuse screen readers.

## Edge Cases
- A user navigates with a screen reader and a keyboard simultaneously. The focus must move to dynamically revealed content (e.g., after clicking "Show more details") so the screen reader reads the new content immediately without the user having to search for it.
- A user has both `prefers-reduced-motion: reduce` and `prefers-color-scheme: dark` enabled. The application must respect both simultaneously — dark theme with no animations.
- A user uses voice navigation software (Dragon NaturallySpeaking, Voice Control). Interactive elements must have visible labels that match voice command names. Icon-only buttons without `aria-label` are unreachable by voice.
- A laptop user connects an external monitor with different resolution and zooms the browser to 200%. The layout must not break, text must not overflow, and all interactive elements must remain usable.
- A screen reader user encounters a custom component that does not exist in the ARIA APG (e.g., a kanban board). Provide a separate accessible view (e.g., a table view or a list view) that conveys the same information.
- A component receives dynamic content after the initial render. Using `aria-live` with `role="status"` ensures the screen reader announces the new content, but the announcement must be concise — avoid dumping a long list of updates.
- A keyboard-only user Tabs through a page quickly. If a component traps focus (e.g., a modal), the user must not become stuck. The Escape key or a clearly labeled close button must always be available.

## Validation Checklist
- [ ] Every page passes axe-core scan with zero "critical" or "serious" violations — verified by running `@axe-core/playwright` or `jest-axe` in CI.
- [ ] Every interactive element is reachable and operable by keyboard — verified by Tab-ing through every focusable element on the page and activating each with Enter and Space.
- [ ] Focus indicator is visible on all focusable elements (minimum 2px outline, 2px offset, contrast ratio of at least 3:1 against the background) — verified by visual inspection.
- [ ] All form controls have an associated label — verified by checking `label[for]` matches `input[id]`, or input is wrapped in a label.
- [ ] All images have appropriate alt text (descriptive for content images, `alt=""` for decorative) — verified by axe-core and manual review.
- [ ] Color contrast meets WCAG AA minimum (4.5:1 normal text, 3:1 large text) — verified by a color contrast checker tool (axe-core, Lighthouse, or manual measurement).
- [ ] `prefers-reduced-motion: reduce` disables all non-essential animations — verified by enabling the OS setting and navigating the application.
- [ ] Modals correctly trap focus: Tab cycles within the modal, Escape closes it, and focus returns to the trigger on close — verified by keyboard-only interaction.
- [ ] Page zoom to 200% and 400% does not cause content loss, overlapping, or horizontal scrolling — verified by zooming in the browser.
- [ ] Screen reader can complete the primary user flow (e.g., purchase a product, submit a form) — verified by a manual test with VoiceOver (macOS) and NVDA (Windows).
- [ ] Heading hierarchy is correct: one `<h1>` per page, no skipped levels, and headings describe the content that follows — verified by heading audit extension or axe-core.
- [ ] Document title updates on every route change and is descriptive — verified by navigating the SPA and checking the `<title>` tag.

## Engineering Examples

### Example 1: Accessible modal dialogs with focus trapping
A SaaS application had modals for creating, editing, and deleting resources. The original implementation used a `<div>` overlay with `display: none`/`block` toggle and no focus management. Screen reader users could not detect the modal, and keyboard users could Tab behind it. The team implemented a `Modal` component with the following accessibility features: the modal container had `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the modal title. A `useFocusTrap` hook was called on mount: it stored the currently focused element (the button that opened the modal), focused the first focusable element inside the modal, and intercepted Tab/Shift+Tab to cycle focus within the modal. On close, focus was restored to the stored trigger element. The Escape key closed the modal. The overlay had `aria-hidden="true"` to remove the background content from the accessibility tree while the modal was open. The close button had `aria-label="Close modal"`. A live region with `role="status"` announced "Modal opened: Create new project" when the modal opened. The team wrote a Jest test using `jest-axe` that rendered the modal open and asserted no axe violations, and a Cypress test that Tab-ed through the modal and verified focus never left the modal container.

### Example 2: Keyboard-navigable data table
A financial dashboard displayed trading data in a large HTML table. The table had hundreds of rows with sortable columns, selectable rows, and inline action buttons. Keyboard users previously had to Tab through every cell, which was extremely tedious (200+ Tabs per row). The team implemented a "row navigation" pattern: the table had `role="grid"`, rows had `role="row"`, and cells had `role="gridcell"`. Arrow keys navigated between cells within the same row, and up/down arrows moved between rows. Tab entered and exited the grid — once focused inside the grid, arrow keys handled cell navigation. Each sortable column header was a `<button>` with `aria-sort="ascending"` or `aria-sort="descending"`. Row selection used `aria-selected="true"` on the row. The action buttons in each row had `aria-label="Edit trade {tradeId}"` to distinguish them. A "Skip to table" skip link was placed before the table for keyboard users who wanted to bypass navigation. The team also added `aria-rowcount` and `aria-colcount` to inform screen readers of the total size without reading every cell. The implementation was tested with a Cypress test that navigated through all cells using Arrow keys and verified focus position after each keypress.

### Example 3: Custom select component that passes WCAG AA
A design system needed a custom select dropdown that matched the brand's visual style because the native `<select>` was not stylable enough. The team followed the WAI-ARIA Authoring Practices Guide for the "Combobox" pattern. The component had: a text input with `role="combobox"`, `aria-expanded="true"/"false"`, `aria-controls` pointing to the listbox, and `aria-activedescendant` pointing to the currently highlighted option. The listbox had `role="listbox"` with `role="option"` children, each with `aria-selected`. Keyboard interactions: Arrow Up/Down moved the active descendant, Enter selected the highlighted option, Escape closed the listbox with the previous value restored, Tab selected the highlighted option and moved to the next field. Type-ahead: when the user typed a character while the listbox was open, focus jumped to the first option starting with that character. The selected option was visually indicated with a checkmark icon and `aria-selected="true"`. The component was tested with axe-core (zero violations), VoiceOver (announced "Combobox, expanded, {selected value}"), and NVDA (announced "Combobox, {selected value}, use Alt+Down to open"). The team also provided a native `<select>` fallback when JavaScript failed to load, ensuring the form remained usable without the custom component.
