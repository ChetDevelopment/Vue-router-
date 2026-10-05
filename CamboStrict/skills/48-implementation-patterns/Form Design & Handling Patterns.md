# Form Design & Handling Patterns

## Purpose

Define a systematic approach to building forms that are robust, accessible, user-friendly, and maintainable. This skill covers the complete lifecycle of form implementation — from choosing between controlled and uncontrolled components, through validation strategy selection, to submission handling with loading states and error recovery. The goal is forms that provide clear feedback, survive edge cases (network failures, rapid submissions, browser refreshes), and are easy to modify as requirements evolve.

## Responsibilities

- Choosing the appropriate form state management strategy: controlled components (React state on every keystroke) for complex validation and dynamic fields, uncontrolled components (ref-based, native form APIs) for simple, performance-sensitive forms.
- Implementing validation logic at the appropriate layer: inline validation for immediate field feedback (blur or change), summary validation on submit for overall form correctness, and async validation for server-dependent checks (email uniqueness, coupon validity).
- Handling cross-field validation where one field's validity depends on another's value (password confirmation, conditional required fields based on a dropdown selection).
- Supporting dynamic form fields that can be added, removed, and reordered by the user (e.g., line items on an invoice, team member email inputs).
- Implementing multi-step (wizard) forms with forward/back navigation, per-step validation, and state persistence when moving between steps.
- Persisting form state across sessions (draft recovery) using localStorage or IndexedDB so users don't lose data on accidental navigation or browser crashes.
- Implementing error display at multiple levels: inline errors per field, a summary error block at the top of the form, and toast notifications for submission failures.
- Managing submit lifecycle: disabling the submit button during submission, showing loading indicators, preventing double submissions, handling success and error responses.
- Integrating with external form libraries (React Hook Form, Formik, Final Form) when the form complexity exceeds what raw React state can handle cleanly.

## Decision Process

1. Assess form complexity: count the number of fields (simple: <10 fields with linear validation, complex: 10+ fields with cross-field validation, dynamic fields, or multi-step progression).
2. Choose controlled or uncontrolled: controlled (React state via useState/useReducer or form library) for complex forms with validation, dynamic fields, or conditional rendering; uncontrolled (refs or native form validation) for simple search forms, login forms with 2-3 fields.
3. Select validation strategy: inline validation on blur for required fields with immediate feedback, inline on change for fields with character limits or format requirements (credit card, phone), submit-only validation for simple forms where showing errors immediately is distracting.
4. Design async validation: debounce async checks (300ms minimum) to avoid flooding the server, show a loading spinner in the field while checking, cache results to avoid re-checking the same value, and display server-side validation errors inline.
5. Implement cross-field validation at the form level using a validation schema (Zod, Yup, Joi) that has access to the full form values, not at the individual field level.
6. Design dynamic field arrays with unique keys per row (UUID, not array index), add/remove handlers that respect array ordering, and validation schemas that validate each item in the array independently.
7. Structure multi-step forms: each step has its own validation schema, step state is stored in a shared context or state machine, navigation guards prevent advancing past an invalid step, and form data is accumulated across steps.
8. Implement draft persistence: serialize form state to localStorage on every significant change (debounced at 1s), restore on mount, clear on successful submission, and show a "resume draft" prompt on page load.
9. Build error display: field-level errors directly below the input for immediate association, a summary error box at the top for screen readers and overall status, and toast for submission failures that are not field-specific.
10. Handle submission: disable button immediately on click to prevent double-submit, show a spinner or progress indicator, use AbortController to cancel in-flight submissions on unmount, handle success with redirect or success message, handle failure by re-enabling the form and showing errors.

## Inputs

- Form requirements: list of fields with types, validation rules (required, min/max, pattern, custom), default values, and conditional visibility rules.
- API contract: endpoint URL, HTTP method, request body shape, expected response shape, and error response structure for validation errors.
- UX mockups: form layout, error display locations, loading state appearance, success flow, and any multi-step progression designs.
- Accessibility requirements: WCAG level (A, AA, AAA), screen reader announcements needed, keyboard navigation patterns.
- Existing form patterns: examples of how other forms in the application are built (which library, validation approach, error display style) to maintain consistency.
- Draft persistence requirement: whether form drafts should survive browser refreshes, how long they should be retained, and when they should be cleared.

## Outputs

- Form component(s): fully implemented form with all fields, validation, error display, and submission handling, following existing codebase patterns.
- Validation schemas: declarative validation rules using the team's chosen schema library (Zod, Yup, Joi) that match the API contract exactly.
- Error display components: reusable `FieldError`, `FormSummary`, and `FormErrorBoundary` components consistent with the design system.
- Loading state components: submit button with spinner, field-level async validation spinners, step transition loaders for multi-step forms.
- Draft persistence utilities: save/restore/clear draft functions using localStorage or IndexedDB, with debounced writes and expiration logic.
- Multi-step form orchestrator: a state machine or context provider that manages step navigation, per-step validation, and accumulated form data.
- Dynamic field array utilities: add/remove/reorder functions with stable keys, array-level validation, and accessible labeling.

## Rules

1. Never use a single `onSubmit` error alert for complex forms — always show field-level errors adjacent to their respective inputs so users can locate and fix issues quickly.
2. Always debounce async validation by at least 300ms — never send a server request on every keystroke, as this floods the server and may trigger rate limits.
3. Never use array index as the key for dynamic field rows — use a stable unique ID (UUID or timestamp) so that removing or reordering rows does not cause incorrect state reuse.
4. Always disable the submit button during submission — never allow double-submits that can create duplicate orders, messages, or database records.
5. Always validate on the client before sending to the server — never rely solely on server-side validation, as it wastes bandwidth and provides slower feedback.
6. Never show validation errors before the user has interacted with the field (touched/submitted) — showing errors on pristine fields is distracting and poor UX.
7. Always preserve form data when navigating between steps in a multi-step form — never reset or lose data that was entered in a previous step.
8. Always clear draft data from localStorage after successful submission — never leave stale drafts that could confuse users on their next visit.
9. Always provide a way to cancel or reset the form — never leave users trapped in a form with no escape besides completing or refreshing.
10. Never expose raw server validation error messages directly — map them to user-friendly, field-specific messages that match the application's tone.

## Best Practices

1. Use a schema-based validation library (Zod, Yup, Valibot) that generates TypeScript types from the schema — this keeps validation rules and TypeScript types in sync with zero duplication.
2. Structure form components using a form library (React Hook Form, Formik) for forms with more than 5 fields or any cross-field validation — these libraries handle field registration, dirty tracking, and error management with optimized re-renders.
3. Use `useMemo` and `useCallback` for validation schemas and submit handlers to prevent unnecessary re-renders of form fields, especially in large forms with 20+ fields.
4. Implement field-level memoization with `React.memo` for expensive form fields (rich text editors, image uploaders, complex custom inputs) to prevent re-renders when sibling fields change.
5. Use `AbortController` to cancel async validation requests when the field value changes again — prevents stale async results from overwriting newer validation states.
6. Implement form state persistence for any form that takes more than 2 minutes to complete — saves drafts to localStorage with a timestamp and restores with a "Resume where you left off?" prompt.
7. Group related fields in `<fieldset>` with `<legend>` for accessibility — screen readers announce the group context, helping users understand field relationships.
8. Use `aria-describedby` to associate each input with its error message — screen readers will announce the error when focusing the field.
9. Implement keyboard navigation: Tab moves between fields, Enter in a single-line field does not submit the form, Escape closes open suggestions or pickers.
10. Validate the full form schema on the server side and return structured error responses (`{ field: "email", message: "Email already in use" }`) that can be mapped directly to field-level errors on the client.

## Anti-patterns

1. Building every form from scratch with raw `useState` and `onChange` handlers instead of using or creating reusable form infrastructure — this leads to inconsistent behavior and duplicated validation logic across the application.
2. Validating only on submit and showing all errors at once with no inline feedback — users must fix multiple errors without knowing if each individual fix is correct.
3. Using a single generic error component at the top of the form without field-level associations — users must search through fields to find which ones have errors.
4. Re-fetching dependent data on every field change without caching — for example, fetching available time slots on every date picker change without debouncing or caching.
5. Storing the entire form state in a global state manager (Redux, Zustand) — form state is ephemeral UI state that should be local to the form, not global.
6. Making every field required by default — over-requiring fields increases form abandonment and frustrates users; distinguish optional fields with "(optional)" labeling.
7. Auto-saving drafts without user awareness — saving silently can confuse users who return to find partially filled forms; always show a "Draft saved" indicator.
8. Using browser-native validation (`required`, `pattern` attributes) as the sole validation layer — native validation messages cannot be styled consistently across browsers and do not support complex cross-field rules.

## Edge Cases

1. Browser tab crash: if the user's browser tab crashes mid-form, draft persistence in localStorage allows recovery on relaunch with a "Restore draft?" prompt.
2. Network timed out during submission: the form must remain in a "submitting" state with a clear timeout message after 30 seconds, giving the user the option to retry or save a draft.
3. Multiple tabs open: if the user has the same form open in two tabs, saving a draft in one tab should not overwrite the other's work — use tab-specific draft keys with timestamps.
4. Async validation race condition: user types "john@example.com", async check returns "not available", user quickly types "john@test.com" — the first async response must be ignored via AbortController or stale-check.
5. Dynamic field removal with dirty state: removing a row from a dynamic array while it has unsaved changes should prompt a confirmation dialog to prevent accidental data loss.
6. Keyboard shortcut conflicts: browser shortcuts (Cmd+D for bookmark, Cmd+F for find) should not interfere with form fields — test all common browser shortcuts when building custom input handlers.
7. Screen reader announcements: when a field is marked invalid after async validation, the error must be announced via `aria-live` region so screen reader users are aware without refocusing the field.
8. Mobile virtual keyboard overlapping: on mobile, the virtual keyboard can cover the currently focused field — use `scrollIntoView({ block: 'center' })` on focus to ensure the field remains visible.

## Validation Checklist

- [ ] Every field has a validation rule that matches the API contract — no client-side validation that differs from server expectations.
- [ ] Required fields are clearly marked with an asterisk or "(required)" label, and optional fields are labeled "(optional)".
- [ ] Inline validation errors appear on blur and/or change (per UX spec), with `aria-describedby` linking the input to its error.
- [ ] The submit button is disabled during submission, shows a loading indicator, and prevents double-submits.
- [ ] Async validation is debounced (300ms+), cached for repeated values, cancelable via AbortController, and shows a loading state per field.
- [ ] Cross-field validations (password confirmation, conditional required fields) are implemented at the form schema level, not with imperative onChange handlers.
- [ ] Dynamic field rows use stable unique keys (UUID), and add/remove operations preserve the values of sibling rows.
- [ ] Multi-step forms persist data between steps, validate each step before allowing navigation to the next, and allow returning to previous steps with data intact.
- [ ] Draft persistence saves to localStorage on significant changes (debounced), clears on successful submit, and prompts the user to restore on page load.
- [ ] The form is keyboard-navigable: Tab order matches visual order, all interactive elements are reachable, and Enter does not unintentionally submit.

## Engineering Examples

### Example 1: Building a Multi-Step Checkout Form with Validation Persistence

An e-commerce checkout form has three steps: Shipping Address, Payment Details, and Order Review. Each step has a Zod schema. Step 1 validates street, city, zip, country (required) and apartment (optional). Step 2 validates card number (Luhn check, formatted as groups of 4), expiry (future date), CVC (3-4 digits). Step 3 is read-only display of all data. Form state is managed by React Hook Form with a shared form context. `useForm` is initialized with all fields, and each step renders only its subset. Step navigation uses a `useReducer` state machine with states: `['shipping', 'payment', 'review', 'submitting', 'success', 'error']`. Validation is triggered on "Next" button click, and only the current step's fields are validated using `trigger()`. Form data is persisted to localStorage on every step change via `watch()` with a 1-second debounce. On mount, if localStorage contains a draft with a timestamp less than 24 hours old, a banner appears: "You have a saved draft. Continue where you left off?" On successful API submission, localStorage is cleared and the user is redirected to the order confirmation page. On network failure during submission, the form returns to the review step with all data intact and an error banner: "Submission failed. Please check your payment details and try again."

### Example 2: Implementing Async Username Availability Validation

A registration form has a username field that must be checked for availability against the server. The field uses Zod's `refine` with an async function. The async validation is debounced at 400ms — when the user stops typing, the request is sent. If the user types a new character before the response arrives, the previous request is aborted via AbortController. The field shows three states: idle (no input), checking (a small spinner inside the field), and resolved (green checkmark for available, red error for taken or invalid). The `refine` function calls `GET /api/check-username?q={value}` and returns `true` if available. The result is cached in a `Map<string, boolean>` so re-typing a previously checked value returns instantly. If the server returns an error (5xx), the validation passes silently (availability cannot be confirmed) but the server will catch duplicates on final submission. The field also has synchronous validation: 3-20 characters, alphanumeric and underscores only, checked on every keystroke for instant feedback.

### Example 3: Designing a Dynamic Form Builder with Variable Fields

A survey creation tool allows admins to build custom forms with dynamic fields. A "Question Bank" section lets users add, remove, and reorder questions. Each question has: type (text, multiple choice, checkbox, rating), title (required), required toggle, and options (required for multiple choice/checkbox, min 2). The dynamic field array uses UUIDs as keys: `<Question key={question.id} index={i} onRemove={handleRemove} onMove={handleMove} />`. Adding a question appends a new UUID-keyed object to the array. Removing a question removes it by UUID. Reordering uses drag-and-drop or move up/down buttons that swap array positions without recreating components. Each question's validation is self-contained: title is required, options array must have at least 2 items for choice types. The form schema is generated dynamically: Zod's `.array()` is wrapped around a discriminated union based on `type`. On submit, the entire form is validated. If validation fails, the first invalid question is scrolled into view. The dynamic array is fully accessible: keyboard reorder uses Alt+Arrow keys, remove button has a confirmation dialog, and screen readers announce "Question 3 of 5" as labels.
