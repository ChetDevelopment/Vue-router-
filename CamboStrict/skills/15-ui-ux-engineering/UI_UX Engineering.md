# UI/UX Engineering

## Purpose

To provide a systematic approach for implementing user interfaces that are visually consistent, accessible, responsive, and resilient to every data and interaction state. This skill bridges design and engineering: it covers design system integration, component composition, responsive patterns, WCAG compliance, micro-interactions, loading skeletons, empty states, error states, edge case UI, and animation principles. The goal is to eliminate UI blind spots by ensuring every component considers and renders all possible states, not just the happy path.

## Responsibilities

- Integrate design system tokens into code: colors, typography, spacing, elevation, breakpoints, and motion durations must be consumed from a single source of truth (design tokens), not hard-coded in component styles.
- Build a component library that separates structure from style: base components (Button, Input, Card) accept visual variants through props and do not hard-code business-specific styling.
- Implement responsive patterns that work on mobile, tablet, and desktop using CSS Grid, Flexbox, container queries, and fluid typography.
- Ensure WCAG 2.2 AA compliance for every component: proper color contrast, keyboard operability, screen reader announcements, focus management, and touch target sizing.
- Design and implement micro-interactions: hover states, focus rings, press effects, transition animations, and skeleton loading. These must not violate reduced-motion preferences.
- Design loading skeletons that match the actual content layout: skeleton dimensions mirror the expected content, preventing layout shift and giving users a preview of the content structure.
- Design empty states for every data-driven component: what does the user see when there are no items, no results, or no data yet? Include a helpful message and a clear call to action.
- Design error states for every data-driven component: what does the user see when data fetching or mutation fails? Show an actionable error message with retry or alternative actions.
- Handle edge case UI: overflow (long text, many items), missing data (null/undefined fields), unusual input (extremely long strings, special characters, right-to-left text), and accessibility edge cases.
- Apply animation principles: use easing curves, staggered delays, and duration hierarchies that feel natural. Animations must have a purpose (guiding attention, providing feedback, indicating hierarchy) and must not be purely decorative.

## Decision Process

1. **Determine the component's state space.** For every component that displays data, list all possible states: loading (initial fetch), error (fetch failed), empty (fetch succeeded but no data), success (data available), refetching (background update). Each state must have a distinct visual representation.
2. **Check the design system first.** Before writing custom styles, verify whether the design system provides a token or component for the need. If a color, spacing, or typography value is not in the design system, add it there rather than hard-coding it in the component.
3. **Choose layout strategy by content type.** For linear content (articles, forms), use Flexbox. For two-dimensional layouts (dashboards, cards), use CSS Grid. For components that need to respond to their container rather than the viewport, use container queries.
4. **Select animation type by purpose.** Use CSS transitions for hover/focus/press micro-interactions (0.15–0.3s). Use CSS animations for loading skeletons (pulsing or shimmering). Use WAAPI or Framer Motion for complex orchestrated animations (staggered list entries, shared layout animations). Always respect `prefers-reduced-motion`.
5. **Design for the longest content.** Assume that a button label could be 3x longer than the design mockup. Assume that a table cell could contain a 200-character string. Ensure text truncation, wrapping, or overflow behavior is explicitly defined.
6. **Accessibility-check each interaction.** For every click event, ensure a keyboard equivalent exists (Enter or Space for buttons, Escape for modals). For every visual state change (disabled, selected, expanded), ensure the corresponding ARIA attribute updates.
7. **Plan for touch targets.** On mobile, all interactive elements must be at least 44x44px (WCAG 2.5.8). Increase padding or use larger hit areas. Ensure there is adequate spacing between adjacent touch targets (minimum 8px).
8. **Handle right-to-left (RTL) from the start.** Use logical CSS properties (`margin-inline-start` instead of `margin-left`, `inset-inline` instead of `left`/`right`). If RTL is a future requirement, still use logical properties to avoid a massive refactor later.
9. **Review micro-interaction timing.** Hover effects: 150ms ease. Expand/collapse: 200ms ease. Page transitions: 300ms ease-in-out. Modals: 200ms fade + 150ms scale. Keep durations consistent with the design system's motion tokens.
10. **Test every component with a screen reader.** Use NVDA (Windows) or VoiceOver (macOS) to verify that loading states, error messages, dynamic content updates, and focus changes are announced correctly.

## Inputs

- Design system tokens (JSON or CSS custom properties): colors, typography scale, spacing scale, breakpoints, elevation/shadow values, motion durations, easing curves.
- Component mockups from Figma/Sketch: all states (default, hover, focus, active, disabled, error, loading, empty, filled).
- User stories that describe edge cases: what happens when the list has 10,000 items? What happens when the user's name is 100 characters? What happens when the network is offline?
- Accessibility audit reports: WCAG violations, contrast ratio failures, missing ARIA attributes, keyboard trap issues.
- Analytics data: common screen sizes, input method distribution (mouse vs. touch vs. keyboard), and assistive technology usage.
- Internationalization requirements: supported languages, RTL scripts, text expansion factors.

## Outputs

- Component code with all states rendered: loading, error, empty, success, and edge case (overflow, truncation).
- Storybook stories (or equivalent) for every component state, including loading, error, empty, and edge case variants.
- CSS with design system tokens, responsive breakpoints, container queries, and reduced-motion overrides.
- Accessibility tree annotations: ARIA attributes, roles, and live regions documented in the component code.
- Motion tokens and animation definitions in the design system, with `prefers-reduced-motion` fallbacks.
- Responsive layout demos showing the component at mobile, tablet, and desktop widths.

## Rules

1. **Every component must render a meaningful state for loading, error, empty, and success.** Components that do not handle all four states are incomplete and must not be merged.
2. **Do not use `opacity: 0` or `visibility: hidden` to hide content that is still in the DOM for screen readers.** Use a visually-hidden utility class that clips the content while keeping it accessible, or conditionally render using React state.
3. **All interactive elements must have a visible focus indicator.** The default browser `outline` is acceptable if it meets 3:1 contrast. Custom focus rings must be applied with `:focus-visible` (not `:focus`), so they appear only for keyboard users.
4. **Skeleton loaders must match the content dimensions.** Do not use a uniform rectangle for a list of items if the items have variable heights. Use individual skeleton shapes that mirror the content structure (avatar circle, text lines of varying width, image rectangle).
5. **Animations must not cause seizures or vestibular disorders.** No flashing or strobing effects (more than 3 flashes per second). All animations must be disabled or reduced when `prefers-reduced-motion: reduce` is set.
6. **Color must not be the only visual means of conveying information.** Use icons, text labels, patterns, or underlines in addition to color. For example, error states must include an error icon and text, not just a red border.
7. **Touch targets must be at least 44x44 CSS pixels with adequate spacing.** If a small icon button cannot provide 44x44px of visible area, expand its hit area with `::before` pseudo-element padding.
8. **Long content must be handled explicitly.** Use CSS properties: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` for single-line truncation, or `-webkit-line-clamp` for multi-line truncation. Document the truncation behavior in the component's API.
9. **Empty states must not be silent.** If a data container has no items to display, render a centered message with an icon, a brief explanation, and a primary call to action (e.g., "No results found. Try adjusting your filters." or "Your inbox is empty. Start by sending a message.").
10. **Error states must provide recovery.** A generic "Something went wrong" is insufficient. Provide a "Retry" button that re-invokes the failed operation. If retry is not appropriate, provide navigation to an alternative view.

## Best Practices

1. **Use design tokens as the single source of truth.** Import tokens from a JSON file or consume CSS custom properties from a design token package. Never hard-code `color: #4A90D9` or `font-size: 14px`. Always reference the token: `var(--color-primary-500)` or `tokens.color.primary[500]`.
2. **Build a state machine for complex UI.** For a component that can be idle, loading, submitting, success, error, and validation-error, model it as a finite state machine (use XState or a simple enum). This makes all state transitions explicit and prevents impossible states.
3. **Test UI states in isolation with Storybook.** Create a story for each state of every component: `Loading`, `Error`, `Empty`, `Default`, `Selected`, `Disabled`, `LongText`, `Overflow`. This makes state review part of the development workflow.
4. **Prefer CSS for animation.** CSS transitions and animations are composited on the GPU and run on a separate thread from JavaScript. Use `transform` and `opacity` for animations; avoid animating `width`, `height`, `top`, `left` (trigger layout recalculations).
5. **Use the `picture` element for responsive images.** Provide multiple image resolutions and formats (WebP, AVIF) with fallback. Set explicit `width` and `height` on images to prevent layout shift. Use `aspect-ratio` CSS property for responsive containers.
6. **Respect the user's system font preferences.** Use `font-family` with the system font stack as the fallback. Do not force a custom font that significantly deviates from the system font unless it is a brand requirement.
7. **Implement container queries for reusable components.** A `Card` component should adjust its layout based on its container width, not the viewport width. Use `@container` queries to make truly reusable responsive components.
8. **Provide a consistent close mechanism for overlays.** Every modal, drawer, popover, and tooltip must be dismissable via Escape key, clicking the backdrop (if applicable), and a close button. Announce the close action to screen readers.
9. **Use `inert` attribute for off-screen content.** When a modal is open, the content behind it should be inert (not focusable, not interactive). The `inert` attribute (or a polyfill) removes elements from the tab order and accessibility tree.
10. **Preview components on real devices.** Before merging a UI change, view it on a physical phone and tablet. Check touch interactions, font rendering, and viewport scaling. Device emulation in DevTools misses real-device behavior like touch delay and pixel density.

## Anti-patterns

1. **Building UI without considering error states.** Shipping a component that renders perfectly with data but crashes to a white screen when the API returns an error. Fix: always assume the API can fail. Always render an error state.
2. **Using generic loading spinners that cause CLS.** A full-page spinner that is replaced by content of a different size, causing the entire layout to jump. Fix: use skeleton screens that match the final content dimensions. Reserve space for images with explicit aspect ratios.
3. **Hard-coding colors and spacing values.** Copy-pasting `color: #333` or `padding: 12px` across 50 components. When the design system updates, every file must be manually updated. Fix: use design tokens and CSS custom properties.
4. **Ignoring empty states.** A search page that shows a blank white area when no results match. The user doesn't know if the search failed, is still loading, or genuinely returned no results. Fix: always render an empty state message with a suggestion or action.
5. **Over-animating the UI.** Every element fades, slides, and bounces on page load. Users with motion sensitivity feel nauseous, and the page feels slow and gimmicky. Fix: animate with purpose (feedback, attention guidance). Keep animations subtle (150-300ms). Respect reduced-motion.
6. **Forgetting touch targets on mobile.** A 24x24 icon button with no padding that is impossible to tap accurately on a phone. Fix: make all touch targets at least 44x44px. Use padding or pseudo-elements to expand the hit area without changing the visible size.
7. **Building RTL support as an afterthought.** Using `float: left`, `margin-left`, `text-align: left` everywhere, then trying to override them when the app is mirrored. Fix: use logical CSS properties from day one. Test frequently with a dummy RTL locale.
8. **Creating monolith components.** A `UserProfileCard` that is specific to one use case and cannot be reused. It has hard-coded queries, specific layout assumptions, and no variant props. Fix: build small, generic components (`Avatar`, `Badge`, `TextRow`, `Card`) and compose them.
9. **Not using `prefers-reduced-motion`.** Animations play at full speed even for users who have set `prefers-reduced-motion: reduce` in their system settings. This can trigger vestibular disorders. Fix: wrap all non-essential animations in a `@media (prefers-reduced-motion: no-preference)` query.
10. **Accessibility overlays.** Third-party accessibility widgets that claim to fix accessibility issues with JavaScript overlays. These often break more than they fix and are not a substitute for building accessible UI properly. Fix: build accessibility into the component from the start.

## Edge Cases

1. **Extremely long unbreakable text.** A URL or code snippet that is 500 characters long without spaces. It overflows the container, breaking the layout. Fix: use `overflow-wrap: break-word` or `word-break: break-all` for code blocks. Use `text-overflow: ellipsis` for UI labels. Test with a long string in Storybook.
2. **Missing or null data in API responses.** The API returns a user object but `user.profile.bio` is `null`. The component renders "null" or crashes trying to access nested properties. Fix: use optional chaining (`?.`) and nullish coalescing (`??`). Render a placeholder (e.g., "No bio provided") instead of null.
3. **Zero items vs. loading confusion.** The component is fetching data, but the data structure is initialized as an empty array. The component renders "No items" for a split second before the data arrives. Fix: use a separate `isLoading` flag. Show the loading state before data arrives, even if the data initializes as empty.
4. **Window resize during animation.** An element is animating its width when the user resizes the browser. The animation completes with the wrong final value. Fix: use `transform: scaleX()` instead of animating `width`. Transform-based animations are not affected by layout changes.
5. **Multiple rapid state changes.** The user switches tabs quickly, each triggering a data fetch. The component flickers through loading → empty → data → loading → empty → data. Fix: debounce rapid navigation. Cancel in-flight requests when the component unmounts. Use stable loading states (do not reset to loading for background refetches).
6. **Focus management with nested overlays.** The user opens a modal, which opens a tooltip, which opens a dropdown. When the user presses Escape, which closes? Fix: implement an overlay stack. Escape closes the topmost overlay. When the dropdown closes, focus returns to the tooltip trigger. When the tooltip closes, focus returns to the modal trigger.
7. **Right-to-left text in left-to-right containers.** The user's name is in Arabic (RTL), but the UI is in English (LTR). The name renders with incorrect alignment or overlapping. Fix: set `dir="auto"` on user-generated content containers. This lets the browser determine the direction based on the first strong character.
8. **Accessibility of custom-styled checkboxes and radio buttons.** The native input is hidden with `opacity: 0` or `display: none`, but the custom visual does not properly communicate state to screen readers. Fix: use the `appearance: none` technique with a pseudo-element for the visual, while keeping the native input in the DOM (positions off-screen or with `position: absolute` and `opacity: 0`). The native input still handles focus and ARIA attributes.

## Validation Checklist

- [ ] Every data-driven component has visually distinct loading, error, empty, and success states.
- [ ] Skeleton loaders match the dimensions of the expected content (text lines, images, avatars).
- [ ] Empty states include an icon, a message, and a call to action.
- [ ] Error states include an error message and a retry action.
- [ ] All colors used in the component meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text and UI components).
- [ ] All interactive elements have a visible `:focus-visible` style with at least 3:1 contrast.
- [ ] Touch targets are at least 44x44px with adequate spacing between adjacent targets.
- [ ] Animations respect `prefers-reduced-motion: reduce` (disabled or reduced to essential movement only).
- [ ] No hard-coded color, spacing, or typography values; all styles reference design tokens.
- [ ] Long content is handled with truncation, wrapping, or overflow behavior explicitly defined and tested.
- [ ] The component uses logical CSS properties (not `left`/`right`/`margin-left`) to support RTL layouts.
- [ ] Image elements have explicit `width` and `height` attributes (or `aspect-ratio` CSS) to prevent layout shift.
- [ ] Custom form controls (checkboxes, radio buttons, switches) are accessible: keyboard operable, screen reader compatible, focus visible.
- [ ] Modals, drawers, and overlays have focus trapping, Escape-to-close, and a close button.
- [ ] ARIA live regions are used for dynamic content updates (loading state, error messages, search results count).
- [ ] The component is tested with a screen reader (NVDA or VoiceOver) for all states.

## Engineering Examples

### Example 1: Building a Design System Component Library (React + Storybook + Tailwind)

A team needs to implement a design system component library for a SaaS platform. The design tokens exist in a Figma file; the engineering team must translate them into code.

Implementation:

- **Design tokens**: Colors, typography, spacing, and shadows are exported from Figma as JSON via the Tokens Studio plugin. The JSON is consumed by a build step that generates both CSS custom properties and Tailwind CSS config. The token JSON is versioned in a separate package (`@company/tokens`).
- **Base components**: `Button`, `Input`, `Select`, `Checkbox`, `Radio`, `Toggle`, `Card`, `Badge`, `Avatar`, `Icon`. Each is a separate file in `packages/ui/src/`. Each component accepts variant props (`variant="primary|secondary|ghost"`, `size="sm|md|lg"`).
- **Every state covered**: The `Button` component has stories for `Default`, `Hover`, `Focus`, `Active`, `Loading`, `Disabled`, `IconOnly`. The `Input` component has stories for `Default`, `Focused`, `Error`, `Disabled`, `WithIcon`, `LongValue`. The `Card` component has `Default`, `Clickable`, `Selected`, `Loading` (skeleton), `Error`, `Empty`.
- **Accessibility built in**: Every form input has an associated `<label>` via `aria-labelledby` or `aria-label`. Error states use `aria-describedby` to link the input to the error message. Focus indicators use `:focus-visible` with a 2px ring that meets 3:1 contrast.
- **Testing**: Each component has a Playwright test that verifies keyboard operability (Tab, Enter, Escape) and screen reader announcements (using `page.evaluate` to query the accessibility tree).
- **Documentation**: Storybook is deployed to Chromatic. Every component's documentation page includes the list of props, accessibility notes, and a state matrix showing which states are implemented.

This library becomes the single source of truth for UI components across all products. Designers can verify that their Figma designs match the implemented components via Storybook reviews.

### Example 2: Implementing Accessible Modals and Tooltips

A web application needs a confirmation modal ("Are you sure you want to delete?") and a tooltip ("This field is required") that are fully accessible.

**Modal implementation:**
- The modal uses the `dialog` element (or a `<div>` with `role="dialog"` and `aria-modal="true"`). The title has `aria-labelledby`, the description has `aria-describedby`.
- When the modal opens, focus moves to the first focusable element inside the modal (the "Cancel" button). A focus trap keeps focus inside the modal: Tab cycles through modal elements, Shift+Tab cycles backwards, and the last element wraps to the first.
- Escape key closes the modal. Clicking the backdrop (semi-transparent overlay) also closes it, but the "Cancel" and "Confirm" buttons are the primary close paths.
- When the modal closes, focus returns to the element that triggered it (the "Delete" button).
- The modal is animated: it fades in (200ms) and scales slightly (from 0.95 to 1.0). When `prefers-reduced-motion: reduce` is set, no animation plays (instant open/close).
- Screen reader: When the modal opens, the screen reader announces the modal title and the fact that it is a dialog. Focus is moved, so the screen reader reads the focused element.

**Tooltip implementation:**
- The tooltip is built with the `tooltip` pattern from WAI-ARIA Authoring Practices. The trigger element has `aria-describedby` pointing to the tooltip element.
- On hover, the tooltip appears after 500ms (CSS transition delay). On focus, it appears immediately. On touch, it appears on first tap and disappears on the next tap.
- The tooltip is positioned using a floating UI library (Floating UI) that handles viewport edge detection (flips to the opposite side if it overflows).
- The tooltip content is limited to 280 characters. Longer content uses a popover instead (with focus management and dismiss behavior).
- `prefers-reduced-motion`: the fade-in animation (100ms) is disabled when reduced motion is preferred.

### Example 3: Handling Every UI State for a Data Table

A data table component shows paginated, sortable, filterable data from an API endpoint. Requirements: it must handle loading, error, empty, refetching, and edge case states.

Implementation:

- **Loading state**: On the initial fetch, the table shows skeleton rows. Each skeleton row mirrors the column structure: a small rectangle for checkbox, a circle for avatar, and variable-width lines for text columns. The skeleton does not animate if `prefers-reduced-motion` is set.
- **Error state**: If the API returns an error (network failure, 500), the table shows a centered error illustration, the error message from the API, and a "Retry" button. The table header remains visible to provide context.
- **Empty state**: If the API returns successfully with zero rows, the table shows an illustration (e.g., an empty inbox), a message ("No data to display"), and a contextual call to action ("Create a new record" or "Clear filters"). The table header may remain visible so the user can see which columns exist.
- **Refetching state**: When the user changes a filter or sorts a column, the existing rows remain visible but are overlaid with a subtle loading indicator at the top of the table. The rows do not disappear (preventing layout shift). A small text reads "Updating..." near the pagination. Once the new data arrives, the rows smoothly transition (cross-fade, 200ms).
- **Edge case: zero rows after filter**. The user applied a filter that returned no results. The empty state message changes to "No results match your filter. Try adjusting your search criteria." The "Clear filters" button resets all filters.
- **Edge case: extremely long cell content**. Any cell that contains a string longer than 200 characters is truncated with `text-overflow: ellipsis`. The full content is available in a tooltip on hover/focus. The column header includes a "Text is truncated" indicator or the column is user-resizable.
- **Edge case: row with all null values**. If a row has `null` for every column, the row renders with a muted "No data" badge in the first column instead of showing an empty row. The user is not confused by a blank row.
- **Edge case: 10,000 rows**. The table uses virtual scrolling (TanStack Virtual). Only 20-40 rows are rendered in the DOM, regardless of the dataset size. The scrollbar reflects the full dataset size. This prevents DOM bloat and keeps interaction smooth.
- **Accessibility**: The table uses native `<table>` markup (or `<div role="table">` with `role="rowgroup"`, `role="row"`, `role="columnheader"`, `role="cell"`). Sort buttons have `aria-sort` attributes. Row selection uses `aria-selected`. The "Updating..." message is announced via `aria-live="polite"`.

The result: a data table that gracefully handles every possible state, never shows a blank or broken UI, and is fully accessible to keyboard and screen reader users.
