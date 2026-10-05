# User Flow Analysis: Mapping, Analyzing, and Optimizing User Journeys

## Purpose

This skill defines how the AI performs user flow analysis to understand, evaluate, and optimize the paths users take through a system. It exists to ensure that the AI can identify friction points, reduce unnecessary steps, handle error states gracefully, and design flows that are intuitive and efficient. Without this skill, the AI might build functionally correct interfaces that are confusing, error-prone, or frustrating to navigate, or it might miss critical error states and edge cases that cause user drop-off and support tickets.

## Responsibilities

1. **User journey mapping.** The AI must document the complete sequence of steps a user takes from trigger (what causes them to start) through outcome (what they are trying to achieve). Every step, decision point, and system interaction must be mapped.

2. **Entry point identification.** The AI must identify all the ways a user can enter a flow: direct navigation, search results, email links, notifications, referrals, bookmarks, deep links from other apps, and each must be evaluated for whether the flow handles that entry gracefully.

3. **Decision point analysis.** The AI must identify every point in the flow where the user must make a choice. Each decision point must be evaluated for: clarity of options, information needed to decide, consequence of each choice, and ability to change the decision later.

4. **Error state design.** The AI must map every possible error state in the flow: invalid input, network failure, server error, authorization failure, expired session, concurrent modification, and resource not found. Each error state must have a clear, helpful, and actionable user-facing message.

5. **Happy path and edge case mapping.** The AI must document both the ideal path (happy path) and all alternative paths (edge cases, error states, alternate choices). The happy path must be optimized for speed and simplicity; edge cases must be handled without breaking the flow.

6. **Friction identification.** The AI must systematically evaluate every step in the flow for potential friction: cognitive load (too many choices), data entry burden (too many fields), unclear expectations (not knowing what happens next), slow responses, broken affordances (elements that look clickable but are not), and trust barriers (asking for sensitive information without explanation).

## Decision Process

**Step 1: Define the flow scope.** What user goal does this flow serve? What is the trigger that starts the flow? What is the success outcome? What are the boundaries of the flow (where does it start, where does it end)?

**Step 2: Map the happy path.** Document the ideal sequence of steps from trigger to successful outcome. For each step, document: the user action, the system response, the screen or state the user sees, and the information the user needs at that point.

**Step 3: Identify all entry points.** List every possible way the user can enter this flow. For each entry point, evaluate: does the user have the necessary context? Is the first step appropriate for this entry point? Are there missing steps that need to be added for this entry?

**Step 4: Map decision points and branches.** For each point where the user makes a choice, document: the options, the criteria for choosing, the consequence of each choice, and whether the user can undo or change the choice later.

**Step 5: Map error states and edge cases.** For each step, ask: what can go wrong here? Consider: invalid data, network issues, server errors, authorization failures, expired state, concurrent access, missing data, and unexpected user behavior. For each error, document: the error condition, the user-visible message, the recovery path, and whether data is preserved.

**Step 6: Identify friction points.** For each step, evaluate: how many decisions does the user need to make? How many fields must they fill? How much do they need to remember from previous steps? Is there a clear indicator of progress? Is there a clear way to go back? Is the loading time acceptable?

**Step 7: Optimize the flow.** Based on the friction analysis, propose optimizations: remove unnecessary steps, combine steps, provide defaults, add progress indicators, pre-fill known information, clarify choices, add undo capabilities, reduce cognitive load, improve error messages, and add shortcuts for power users.

**Step 8: Validate the flow.** Test the proposed flow against: each entry point, the happy path, each error state, each decision branch, and edge cases from real user behavior. Verify that every path either leads to successful completion or provides a clear recovery path.

## Inputs

- The feature or interface design to be analyzed
- User research: personas, scenarios, task analysis, usability test results
- Analytics data: drop-off rates, time-on-task, error rates, path analysis
- Support ticket data: common user complaints, confusion points, error reports
- Existing interface specifications and wireframes
- Business rules and validation logic
- Technical constraints: API capabilities, data availability, performance characteristics

## Outputs

- Complete user flow map showing all paths, entry points, decision points, and error states
- Happy path documentation with step-by-step user actions and system responses
- Error state catalog with error conditions, user messages, and recovery paths
- Friction analysis identifying each point of user difficulty with severity ratings
- Flow optimization recommendations with estimated impact
- Validated flow design that handles entry points, edge cases, and error states gracefully

## Rules

1. **Every flow must have a clear entry point and exit point.** The user must know how they got into the flow and what constitutes successful completion. Flows that start without clear triggers or end without clear outcomes confuse users and increase drop-off.

2. **Every flow must have a clear progress indicator.** For multi-step flows, the user must always know: where they are in the sequence, how many steps remain, and what each step requires. Hidden steps and unpredictable progress increase anxiety and drop-off.

3. **Every error state must have a recovery path.** Showing an error message without telling the user how to fix it is insufficient. Every error must include: what went wrong, why it went wrong (in user terms), and exactly what the user should do next.

4. **The user must be able to go back without losing data.** For multi-step flows, the back action must preserve the user's previously entered data. Forcing users to re-enter data when correcting a mistake is a top source of user frustration.

5. **Entry points must preserve user context.** When a user enters a flow from a deep link, email notification, or referral, the flow must not assume they started at step one. Preserve any context the user brings: pre-selected options, authentication state, and referrer information.

6. **The happy path must require the minimum possible decisions.** Every choice the user must make on the happy path is a potential drop-off point. Defaults, pre-selections, and intelligent guesses should minimize the number of decisions required for the common case.

7. **Data entered must persist across session boundaries.** If the user leaves the flow and returns later, their partially completed data must still be available. Losing user data due to navigation away from the flow is unacceptable.

8. **Confirmation steps must be meaningful.** Asking users to confirm an action without showing them what they are confirming is pointless. Confirmation steps must summarize the key information the user has entered and the consequences of proceeding.

9. **Technical errors must not expose system internals.** Error messages must be written in user language, not developer language. Showing stack traces, database error codes, or internal server names to users is a security risk and a usability failure.

10. **Loading states must be informative.** When the system is processing, show a meaningful loading indicator with an estimate of remaining time when possible. Blank screens, frozen interfaces, and infinite spinners are unacceptable. Skeletons, progress bars, and step-by-step loading are preferred.

## Best Practices

1. **Sketch the flow before building it.** Before writing any code, draw the user flow on paper or in a diagramming tool. This reveals missing steps, confusing paths, and unnecessary complexity before any implementation investment.

2. **Identify the single most important action on each step.** Every screen or step in the flow should have one primary action the user should take. Make that action visually prominent. Secondary actions should be clearly subordinate.

3. **Use progressive disclosure.** Show users only the information and options they need at each step. Reveal additional options only when needed. This reduces cognitive load and keeps the user focused on the current task.

4. **Pre-fill everything you can.** If the system knows the user's country, pre-select it. If the user has used the service before, pre-fill their preferred options. If context is available from a previous step, carry it forward. Every pre-filled field is one less decision the user must make.

5. **Design for the most common error first.** When designing error handling, start with the most common error users encounter and make its recovery path as smooth as possible. The most common error in form flows is typically validation-related: incorrect format, missing required field, or mismatched values.

6. **Test flows with real users.** No amount of analysis can substitute for watching real users attempt to complete the flow. Five user tests will reveal more friction points than a week of expert analysis. Test early, test cheaply, test often.

7. **Add undo before adding confirmations.** Instead of asking the user to confirm every action, make actions reversible. Undo is faster, less intrusive, and more user-friendly than confirmation dialogs. Reserve confirmations for irreversible actions with significant consequences.

8. **Measure flow performance.** Track: entry rate (how many users start the flow), step completion rate (percentage completing each step), drop-off rate at each step, error rate at each step, time per step, and overall completion rate. Use this data to identify the steps with the highest drop-off and focus optimization efforts there.

9. **Design for mobile constraints.** If the flow will be used on mobile devices, design for mobile first: single-column layouts, thumb-friendly tap targets, minimal typing, and responsive error messages. Mobile flows must be even simpler than desktop flows due to smaller screens and interrupted usage patterns.

10. **Handle interrupted flows gracefully.** Users frequently start a flow, get interrupted, and return later. Save the user's progress automatically as they move through the flow. When they return, restore their previous state and allow them to continue from where they left off.

## Anti-patterns

1. **Dead-end error states.** Showing an error message with no way to proceed other than starting over. Every error must include a recovery action. If the user cannot proceed, they should not have been allowed to reach that state in the first place.

2. **Hidden steps.** Progress indicators that show 3 steps when there are actually 5 steps after the user starts. Users feel tricked and lose trust in the system. Be honest about the number and length of steps from the beginning.

3. **The wizard that asks everything upfront.** A multi-step flow that could have been a single page with well-organized sections. Wizards are useful for complex, conditional flows but are overused for simple data collection.

4. **Losing data on validation error.** The user fills out a 10-field form, submits it, gets a validation error on field 7, and returns to a blank form. All data is lost. Every field value must be preserved when returning from a validation error.

5. **Dark patterns.** Designing the flow to trick users into choices they would not make: hidden opt-outs, pre-checked subscriptions, confusing button labels that make the undesired option look like the desired one. These destroy user trust and often violate regulations.

6. **Over-optimizing the happy path while ignoring error states.** Making the ideal path very smooth while providing no guidance or recovery for users who deviate from it. Most users will hit at least one error state or edge case; ignoring these paths means most users have a bad experience.

7. **Assuming linear navigation.** Designing flows assuming users will always go forward step by step, when in reality they use browser back buttons, open links in new tabs, use bookmarks mid-flow, and share URLs of intermediate steps. The flow must handle all these navigation patterns.

8. **Making the user re-authenticate mid-flow.** If the user is already authenticated at the start of the flow, they should not be asked to authenticate again without a clear security reason (e.g., confirming a high-value transaction). Mid-flow authentication requests cause significant drop-off.

## Edge Cases

1. **The user enters the flow at an unexpected entry point.** A user bookmarks step 3 of an 8-step checkout flow and returns to it later. The system must recognize the incomplete state, validate that the preceding steps are still valid, and either continue from step 3 or gracefully guide the user to complete earlier steps.

2. **The user opens the flow in multiple browser tabs.** A user starts the checkout flow in one tab, then opens a second tab and starts again. Changes in one tab should be reflected in the other, or the system should detect the conflict and guide the user to one consistent state.

3. **The flow takes longer than the session timeout.** A user spends 30 minutes filling out a complex form and the authentication session expires on the server side. When they submit, they are redirected to a login page and lose all their data. The flow should warn users before the session expires, extend the session for active flows, or save draft data automatically.

4. **The user pastes invalid data into a field.** A user pastes their entire address into the city field. The system should gracefully handle this: validate the field, inform the user of the specific error, and ideally help the user fix it rather than just showing a generic validation error.

5. **The user is using a screen reader or assistive technology.** The flow must be fully navigable via keyboard, all form fields must have labels, error messages must be announced by screen readers, and the flow must not rely on visual-only cues (color, position, icons alone) for conveying information.

6. **The user has a slow or unreliable network connection.** The flow must handle network interruptions gracefully: show a clear offline indicator when connectivity is lost, preserve entered data, and automatically retry when connectivity returns. Do not lose user data due to temporary network issues.

7. **The flow involves multiple currencies, languages, or regional formats.** Date formats, currency symbols, number formatting, and language must match the user's locale throughout the flow. A user who enters a date as 03/04/2025 expects it to be interpreted according to their locale, not the developer's locale.

## Validation Checklist

- [ ] All entry points for the flow have been identified and tested
- [ ] The happy path is mapped step by step with user actions and system responses
- [ ] Every decision point has clear options, consequences, and undo capability
- [ ] Every error state has a specific, helpful, and actionable error message
- [ ] Every error state has a recovery path that preserves user data
- [ ] The back action at every step preserves previously entered data
- [ ] Progress indicators are present and accurate throughout multi-step flows
- [ ] The most common errors have the most polished recovery paths
- [ ] User data is saved across session boundaries (draft capability)
- [ ] The flow handles interrupted usage (timeout, tab close, navigation away)
- [ ] Loading states are informative and non-frustrating
- [ ] The flow is fully functional with keyboard navigation and screen readers
- [ ] Network interruptions are handled without data loss
- [ ] Locale-specific formatting is consistent throughout the flow
- [ ] Analytics instrumentation is in place to measure step-by-step drop-off

## Engineering Examples

### Example 1: Analyzing a checkout flow

**Scenario:** The e-commerce team reports a 70% cart abandonment rate. Analysis shows most users drop off between adding items to cart and completing the purchase.

**User flow analysis approach:** The AI maps the complete checkout flow: entry points (product page, cart page, wishlist, shared cart link, promotional email), steps (view cart, enter shipping address, select shipping method, enter payment information, review order, confirm purchase), decision points (guest vs. account checkout, shipping method selection, payment method selection, promo code application), error states (invalid address, declined payment, expired session, out-of-stock item during checkout, address validation failure). The AI identifies friction: the checkout flow opens as a full-page redirect rather than a slide-out panel, disrupting the browsing experience. The form requires 14 fields for shipping and billing. The user must create an account or enter all information as a guest with no indication they can check out as a guest. The payment page does not clearly indicate which card types are accepted. The promo code field is prominently placed but codes rarely work, causing frustration. The review page shows a small, blurry image of the product and does not show the estimated delivery date. The AI proposes optimizations: replace the full-page checkout with a slide-out panel that preserves browsing context. Reduce shipping fields from 14 to 6 by using address autocomplete. Make guest checkout the default with account creation offered after purchase. Clearly show accepted payment methods with card logos. Move the promo code field to a less prominent location and validate codes in real-time. Show a clear product image and estimated delivery date on the review page. Add a progress indicator showing the four steps. Save cart contents to the user's account so they can resume later. Each optimization is connected to the specific drop-off point it addresses. The AI estimates that these changes would reduce abandonment from 70% to 55% (a 15 percentage point improvement) based on industry benchmarks.

### Example 2: Identifying a confusing sign-up flow

**Scenario:** A SaaS product has a 14-day free trial. Analytics show that 40% of users who start the sign-up flow do not complete it. Customer support receives frequent complaints about the sign-up process being confusing.

**User flow analysis approach:** The AI maps the flow: entry points (marketing website, Google Ads, referral link, direct visit), steps (click "Start Free Trial" -> choose plan -> enter email -> verify email -> create password -> enter company name -> enter phone number -> answer "how did you hear about us?" -> set up first workspace -> import data -> invite team members -> complete onboarding checklist). The AI identifies multiple friction points. Step 2: showing pricing plans before the user has experienced the product forces a premature commitment decision. Step 7: requesting a phone number during the sign-up flow creates distrust — users think they will be called by sales. Step 8: the "how did you hear about us" field is mandatory and appears before the user has received any value. Step 9-12: the onboarding sequence requires the user to set up a workspace, import data, and invite team members before they can explore the product. The user has invested 10 minutes and still has not seen the core product experience. The AI identifies the core problem: the sign-up flow prioritizes the company's data collection needs over the user's desire to experience the product. The AI proposes: eliminate plan selection from sign-up (default to free trial). Remove phone number from required fields. Make the referral source optional and move it to a post-sign-up survey. Restructure onboarding: after email verification, immediately drop the user into a pre-configured demo workspace where they can explore the product. Add a guided tour overlay in the demo workspace. Move setup tasks (import, invite, configure) to optional steps that can be done later. The AI also flags a critical error state: email verification links that expire. The current flow sends a verification email with a 1-hour expiry but does not allow resending. If the user does not verify within an hour, they cannot complete sign-up and have no way to recover. The AI adds a resend verification email mechanism with clear instructions.

### Example 3: Optimizing a multi-step form for insurance applications

**Scenario:** An insurance company has an online application form that takes an average of 22 minutes to complete. Drop-off rate is 65%. The form collects personal information, medical history, coverage preferences, payment information, and beneficiary details across 8 pages.

**User flow analysis approach:** The AI maps the flow and identifies structural problems. The first page asks for 18 fields of personal information before the user understands what coverage options are available. The medical history section uses complex medical terminology without explanations. The coverage selection page presents 15 options with no guidance on what an "average" or "recommended" choice looks like. The review page requires the user to check a PDF-style summary and manually identify errors. Error handling is poor: validation errors are shown as red text at the top of the page with no indication of which field has the problem. The session timeout is 10 minutes, which is less than the average completion time, causing users to lose their progress. The AI proposes a restructured flow. Step 1: collect minimal information (name, age, ZIP code) and immediately show personalized coverage recommendations and estimated prices — giving the user a reason to continue. Step 2: collect medical history using plain language with tooltips explaining each term, and use conditional logic to show only relevant questions (a 30-year-old applicant does not need to answer geriatric health questions). Step 3: coverage selection with 3 pre-configured packages (basic, standard, premium) plus the ability to customize, with clear cost-benefit explanations for each option. Step 4: payment and beneficiary with pre-filled defaults where possible. The AI also addresses the timeout issue: auto-save every step to the server so users can return within 30 days and continue. Add a visible auto-save indicator. Replace the PDF-style review page with a structured summary showing each section in an expandable card format with inline edit capability. The AI estimates these changes would reduce average completion time from 22 minutes to 8 minutes and reduce drop-off from 65% to 35%. The engineering effort is estimated at 4 weeks for the frontend changes plus 2 weeks for the auto-save backend. The AI recommends A/B testing the new flow against the old flow with 20% of traffic for 2 weeks before committing to the full rollout.
