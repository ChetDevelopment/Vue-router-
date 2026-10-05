# Drag & Drop Engineering

## Purpose
Provide a comprehensive engineering framework for implementing drag-and-drop interactions in web applications — covering drag source and drop target design, touch and mouse input handling, visual feedback, constraints, list reordering, cross-container moves, data transfer models, and accessibility compliance.

## Responsibilities
- Design drag source components that correctly initiate drag operations, set the drag data and visual representation, and handle drag start/drag end events.
- Design drop target components that detect draggable items entering/leaving/over the target, validate the drop based on data type, and handle the drop event.
- Implement a custom drag preview (ghost element) that follows the cursor or touch point, reflects the dragged item's appearance, and updates as the drag state changes.
- Handle both mouse and touch input with a unified pointer abstraction, ensuring drag works on desktop (mouse) and mobile (touch) without code duplication.
- Provide drag feedback through visual indicators (highlighted drop zones, insertion lines, opacity changes on the dragged item) that communicate valid/invalid drop areas.
- Support constraints on drag behavior: lock movement to a single axis (horizontal or vertical), contain dragging within a bounding rectangle, and snap to grid.
- Implement reorder within lists: detect the insertion position between or within items, animate the rearrangement of sibling items, and commit the new order on drop.
- Support cross-container moves: drag an item from one list to another, updating both source and target containers' data models.
- Define a data transfer model that specifies what data is attached to the drag operation (item ID, source container ID, metadata) and how it is serialized between drag source and drop target.
- Ensure accessibility for drag and drop: provide keyboard alternatives (drag via Shift+Arrow keys, drop via Enter), announce drag state changes to screen readers, and allow users to opt out of drag interactions.

## Decision Process
1. Choose the drag-and-drop implementation approach: Native HTML5 Drag and Drop API (built-in, no library needed for simple cases), or a library (React DnD, dnd-kit, SortableJS, interact.js) for complex interactions, touch support, and accessibility. Prefer dnd-kit for React apps due to its accessibility features and unified pointer handling.
2. Define the drag data model: a plain object with at minimum `id` (unique identifier of the dragged item), `type` (discriminator for different draggable kinds, e.g., "task", "file", "field"), and `sourceContainerId`. For cross-container moves, also include `sourceIndex`.
3. Design the drag source: set `draggable="true"` on the element (for native API) or use the library's `useDraggable` hook. Define the drag preview: for native API use `setDragImage()` with a cloned element or a custom canvas; for libraries, the library handles preview rendering.
4. Design the drop target: use the library's `useDroppable` or native API's `ondragover`/`ondrop`. Determine what types of draggable items this target accepts (e.g., a "Completed" column accepts only items of type "task").
5. Implement unified pointer handling: if using native API, add `touchstart`/`touchmove`/`touchend` listeners to polyfill drag for touch devices. If using dnd-kit, it handles pointer unification automatically.
6. Define drag feedback: on `dragenter`, add a CSS class to the drop target (highlight border, background change). On `dragover`, show an insertion line at the computed position between items. On the dragged item, reduce opacity to indicate it is being dragged.
7. Implement constraints: for axis locking, intercept `drag` or `pointermove` and clamp the x or y coordinate. For containment, clamp the drag preview position within the container's bounding rect. For grid snapping, round the position to the nearest grid increment.
8. For list reordering, compute the insertion index based on the cursor/touch position relative to the list items. Use a threshold: if the cursor is in the top half of an item, insert before it; if in the bottom half, insert after it.
9. For cross-container moves, on drop: remove the item from the source container's data array and insert it into the target container's data array at the computed index. If the move fails (validation error), revert both arrays to their previous state.
10. Implement accessible keyboard reordering: when the user focuses a draggable item and presses Alt+Arrow Up/Down (or Shift+Arrow Up/Down), move the item within the list. Use `aria-roledescription="sortable"` and `aria-describedby` to communicate drag instructions to screen readers.

## Inputs
- Component hierarchy: which components are draggable (items, cards, rows) and which are droppable (lists, columns, zones, containers).
- Data model: the type system for draggable items (id, type, metadata), container types, and the action performed on drop.
- Visual design mockups: drag preview appearance, drop zone highlight style, insertion line position and animation, ghost element opacity.
- Accessibility requirements: WCAG 2.1 Level AA compliance for drag-and-drop, including keyboard alternatives and screen reader announcements.
- Performance requirements: target 60fps during drag operations, with no layout thrashing or jank.

## Outputs
- Drag-and-drop configuration: a centralized configuration object or provider that defines accepted drag types, collision detection algorithms (closest center, closest corners, pointer within), and sort strategies.
- Drag source components or hooks: `useDraggable(itemId, data)` that returns draggable props and state attributes.
- Drop target components or hooks: `useDroppable(containerId, config)` that returns droppable props and highlights state.
- Drag overlay component: renders the drag preview (ghost element) that follows the pointer, styled according to design specs.
- Insertion indicator component: a visual line or marker rendered at the computed insertion position within a list.
- Keyboard reordering handler: an event listener that processes Alt+Arrow keys, moves the item, and updates the data model.
- Screen reader announcement utility: a live region (aria-live) that announces drag start, drag end, reorder, and move operations.

## Rules
- Every draggable item MUST be focusable and have a visible focus indicator. A user who cannot use a mouse must be able to navigate to the item with the keyboard.
- Every draggable item MUST have an accessible name and role. Use `role="listitem"` or `role="treeitem"` as appropriate, and `aria-roledescription="draggable"`.
- The drag preview (ghost element) MUST NOT block pointer events on drop targets. The preview must have `pointer-events: none` so that the underlying drop targets receive the pointer events.
- Touch drag MUST be supported on all draggable items. Relying only on the native HTML5 Drag API (which does not work on touch devices) is insufficient.
- Drop targets MUST validate the dragged item's type before accepting it. A task item must not be droppable into a user avatar drop zone.
- Drag operations MUST NOT trigger default browser behaviors: text selection, image dragging, link navigation. Call `event.preventDefault()` on `dragstart` and `touchmove` as needed.
- The data model MUST be updated optimistically on drop, but a rollback to the previous state MUST occur if the server-side save fails.
- Screen readers MUST be notified of drag state changes: "Dragging task {name}", "Moved to position 3 in list {name}", "Moved to list {targetName}".

## Best Practices
- Use a single drag-and-drop library (dnd-kit for React, SortableJS for vanilla) rather than mixing native API with custom touch handling. Libraries handle cross-browser quirks, touch support, and accessibility better.
- Implement collision detection algorithms appropriate to the layout: `closestCenter` for grid layouts, `closestCorners` for free-form layouts, `pointerWithin` for lists.
- Use CSS `transform: translate()` for repositioning items during drag (avoid animating `top`/`left` or `margin` which trigger layout). `transform` only triggers compositing, staying at 60fps.
- Define a drag feedback duration: use CSS `transition` on the drop target highlight and insertion line so they appear smoothly rather than popping in.
- For long lists, use virtualization (react-window, react-virtuoso) with drag-and-drop. Ensure the library supports virtualized lists (dnd-kit does with `SortingStrategy` and `rectSorting`).
- Test drag-and-drop with real user sessions: record pointer coordinates, drag start/end events, and drop targets to identify patterns of failed drops or accidental moves.
- Provide a "drag handle" pattern: a specific grip area (a 6-dot icon) that initiates the drag, while the rest of the item is clickable for other actions (selection, opening). This prevents accidental drags when users intend to click.
- Use `will-change: transform` on draggable items to hint to the browser that the element will be animated, enabling GPU acceleration.

## Anti-patterns
- Implementing drag-and-drop with `mousedown`/`mouseup` listeners directly without a library. This duplicates work that battle-tested libraries have already solved (touch support, accessibility, collision detection, cross-browser quirks).
- Using the native HTML5 Drag and Drop API for complex interactions without polyfilling touch support. The native API does not work on mobile Safari or Chrome Android.
- Allowing drag and drop as the only way to rearrange items. Users who cannot use a mouse or touch input are excluded. Always provide a keyboard alternative and a menu option (e.g., "Move up", "Move down" buttons).
- Making the entire item draggable with no drag handle. Every click on the item becomes a potential drag start, frustrating users who want to click without moving the item.
- Showing the drag preview as a semi-transparent clone at the original position instead of following the cursor. Users cannot see where the item will land.
- Failing to update the data model synchronously on drop. If the data model update is debounced or async, the UI shows stale data until the update propagates.
- Ignoring `prefers-reduced-motion`: drag animations (insertion line sliding, item repositioning) must be disabled or simplified when the user has reduced motion enabled.
- Hard-coding drop zone accept rules in each drop target instead of centralizing them. When a new draggable type is added, every drop target must be updated individually.

## Edge Cases
- The user starts dragging but presses Escape before dropping. The drag must be cancelled, the drag preview removed, and the item returned to its original position. Both native API and dnd-kit handle this, but custom implementations often miss it.
- The user drags an item outside the browser window. On `dragend` (releasing outside), the item must remain in its original position — the drop never occurred. On touch devices, dragging outside and lifting the finger also cancels.
- The user drags an item over a drop target that is scrollable. If the user hovers near the edge of the scrollable container, the container should auto-scroll. Implement edge-scrolling: detect proximity to the edge and scroll the container by a small increment.
- Two items are dropped at the exact same position. The collision detection must deterministically resolve ties — usually by preferring the earlier item in the list or the item with the lower index.
- The user drags an item within a virtualized list where non-visible items are unmounted. The drag-and-drop library must handle dynamic measurements and correctly compute positions for unmounted items.
- The dropped item fails server validation (e.g., item type not allowed in target collection). The optimistic update must be rolled back, the item returned to its source position, and a descriptive error shown to the user.
- The user has a touch screen with a stylus. The pointer events API dispatches `pointerdown` with `pointerType: "pen"`. The drag implementation must handle pen input the same as touch or mouse.

## Validation Checklist
- [ ] A draggable item can be picked up, moved, and dropped into a valid drop target — verified by end-to-end drag test simulating mouse and touch events.
- [ ] The drag preview follows the cursor or touch point smoothly at 60fps — verified by analyzing DevTools performance tab during drag.
- [ ] Drop targets highlight correctly when a valid item is dragged over them, and do not highlight for invalid items — verified by dragging an invalid type over the target.
- [ ] Insertion line appears at the correct position between items — verified by dragging an item to various positions in a list and checking the visual indicator.
- [ ] Touch drag works on mobile devices — verified by testing on a physical mobile device or using Chrome DevTools device emulation.
- [ ] Keyboard reordering works: focusing a draggable item and pressing Alt+Arrow Up/Down moves the item — verified by keyboard-only interaction.
- [ ] Screen reader announces drag operations: "Dragging item X", "Item X moved to position Y" — verified using a screen reader (VoiceOver, NVDA, JAWS).
- [ ] Drag cancellation works: pressing Escape during drag returns the item to its original position — verified by starting a drag and pressing Escape.
- [ ] Cross-container move correctly updates source and target data models — verified by asserting both arrays have the expected items after the move.
- [ ] Auto-scroll works when dragging near the edge of a scrollable container — verified by scrolling a container with the dragged item held at the edge.
- [ ] `prefers-reduced-motion: reduce` disables drag animations — verified by enabling the OS setting and performing a drag operation.
- [ ] Drag preview has `pointer-events: none` and does not block drop target detection — verified by inspecting the preview element's styles during drag.

## Engineering Examples

### Example 1: Kanban board with drag-and-drop between columns
A project management app implemented a three-column Kanban board (To Do, In Progress, Done) using dnd-kit. Each column was a `useDroppable` container, and each task card was a `useDraggable` item. The drag data included `taskId`, `sourceColumnId`, and `sourceIndex`. The collision detection algorithm used `closestCenter` because items were stacked vertically. On `onDragEnd`, the handler removed the task from the source column's array and inserted it into the target column's array at the computed index. If the source and target columns were the same, it only reordered within the column. The drag overlay rendered a semi-transparent clone of the task card with `pointer-events: none`. Each column showed a subtle blue border when a valid draggable item was hovering over it. The insertion line (a 2px horizontal line with a 300ms CSS transition) appeared between cards to indicate the drop position. For accessibility, each task card had a drag handle button (6-dot icon) that, when focused, allowed Alt+Arrow Up/Down to reorder within the same column and Alt+Arrow Left/Right to move between columns. A screen reader live region announced "Moving task 'Design review' from column 'In Progress' to column 'Done'."

### Example 2: File upload zone with drag-and-drop
A cloud storage app implemented a file upload drop zone that covered the full page when the user dragged a file from their desktop (external drag). The team used the native HTML5 Drag and Drop API because it handles `DataTransfer` objects from external sources (files, text, URLs). On `dragover` on the document, the drop zone overlay appeared with a dashed border, "Drop files here" text, and a dark translucent background that covered the entire page. The `dataTransfer.effectAllowed` was set to `copy` and `dropEffect` to `copy` to indicate a copy operation. On `drop`, the handler read `event.dataTransfer.files`, validated each file against the allowed types and size limits, and uploaded them via a multipart POST request. For non-file drops (text, URLs), the handler extracted the URL and created a download task. The team also handled the `dragenter` event on child elements to prevent flickering due to event bubbling. Touch support was not needed for external drag-and-drop — mobile devices use the file picker input instead. For accessibility, a "Choose files" button was provided next to the drop zone as the primary interaction, and the drop zone had an `aria-label="File upload area. Drag files here or use the button below to select files."`.

### Example 3: Reorderable list with accessible keyboard reordering
A survey builder allowed users to reorder questions in a form. The team used SortableJS (vanilla JS, framework-agnostic) to implement the reorderable list. Each question item had a drag handle on the left side that was the only draggable area. The list used the `onSort` callback to update the questions array with the new order. The drag preview was a clone of the question item with `opacity: 0.8` and a subtle box shadow. The placeholder (where the item would land) was an empty dashed box that animated to its new position. For keyboard accessibility, each question item had a "Move Up" and "Move Down" button visible on focus. The buttons called the same `moveItem(index, direction)` function that the drag handler called, ensuring that the keyboard path produced the same result as the drag path. The list had `role="listbox"` and each item had `role="option"` with `aria-posinset` and `aria-setsize` attributes. A screen reader user could tab to the question list, arrow through items, and use the dedicated move buttons to reorder — entirely without drag-and-drop. The drag path was treated as a progressive enhancement on top of the keyboard-accessible baseline.
