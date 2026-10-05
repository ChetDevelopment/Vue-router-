# Undo/Redo & History Patterns

## Purpose
Establish a comprehensive engineering framework for implementing undo/redo functionality in web applications using the command pattern and state snapshot approaches — covering memory management, non-linear selective undo, atomic group operations, optimistic updates with rollback, cross-session history persistence, and keyboard shortcut integration.

## Responsibilities
- Implement the command pattern that encapsulates each user action as a reversible command with `execute()` and `undo()` methods that know how to apply and revert the action.
- Choose between state snapshot (save the entire state at each step) and event log (save the sequence of commands) approaches based on state size and command complexity.
- Manage the history stack with bounded memory: limit the number of undo levels, compress snapshots, and discard the oldest entries when the limit is reached.
- Support selective undo (non-linear undo) that allows the user to undo a specific action in the middle of the history without undoing everything after it.
- Implement group/atomic operations that treat a sequence of commands as a single undoable unit (e.g., "paste text" is one undo even though it inserts multiple characters and updates formatting).
- Handle optimistic updates with proper rollback: when a server mutation fails, roll back the optimistic UI state and restore the previous valid state from the history.
- Persist the undo/redo history across sessions by serializing the command log or snapshots to localStorage, IndexedDB, or a server-side store.
- Integrate keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Cmd+Z, Cmd+Shift+Z) with proper browser event handling and prevent conflicts with native form undo.

## Decision Process
1. Determine the state granularity: if each state snapshot is small (under 10KB) and actions are relatively coarse (form field changes, canvas element moves), use state snapshots for simplicity. If actions are fine-grained (character-by-character text editing, pixel-by-pixel drawing) and snapshots would be large, use the command pattern with event logs.
2. For the command pattern, design the `Command` interface with `execute()`, `undo()`, `getDescription()`, and `getTimestamp()` methods. Each command stores the minimal data needed to reverse itself — the previous value and the new value.
3. Implement the history manager as a stack of commands (or snapshots) with a pointer to the current position. Undo moves the pointer back and calls `undo()` on the current command. Redo moves the pointer forward and calls `execute()` on the next command.
4. Set the maximum history depth based on memory constraints: a reasonable default is 100 commands or 50 snapshots. Expose this as a configurable parameter with a lower default for mobile devices.
5. For selective undo (non-linear), instead of a simple stack, use a tree structure or a list with activation flags. When the user selects a command in the history panel to undo, disable that command and all dependent commands, then replay all enabled commands in order to reconstruct the state.
6. Implement group operations (composite commands) by creating a `CompositeCommand` that holds an array of child commands. `execute()` runs all children in sequence, `undo()` runs them in reverse. This allows actions like "paste" or "auto-format" to be a single undo step.
7. For optimistic updates, after executing a command optimistically, store the command in a "pending" queue. If the server confirms success, move the command to the history stack. If the server rejects, call `undo()` on the pending command and notify the user.
8. Design cross-session persistence: serialize the command list (each command's type and parameters) to IndexedDB after every N commands. On app load, deserialize and rebuild the history stack. For state snapshots, serialize the last snapshot only (to limit storage usage) and store diffs for subsequent changes.
9. Implement keyboard shortcuts using a global event listener that checks for `event.ctrlKey` or `event.metaKey` plus `z` or `shift+z`. Prevent the default browser behavior for these combinations inside the application scope but not on native inputs unless overridden.
10. Build a history panel UI that shows the list of commands with descriptions, highlights the current position, and allows clicking any entry to undo/redo to that point (selective undo).

## Inputs
- State shape definition: the data structure that represents the application state to be undone/redone (document object, canvas elements array, form fields object).
- User action inventory: list of all user actions that should be undoable with their descriptions, side effects, and whether they are optimistically updated.
- Performance budget: maximum memory for history storage, maximum latency for undo/redo operations, and maximum serialization size for persistence.
- Server API idempotency guarantees: which mutations are idempotent and can be safely replayed during redo, and which require special handling.
- Keyboard shortcut conventions: application-specific shortcuts that may conflict with Ctrl+Z (e.g., Ctrl+Z for zoom) and must be resolved.

## Outputs
- Command interface and base command classes (`Command`, `CompositeCommand`, `EmptyCommand`) with typed generics for the state type.
- History manager class (`HistoryManager<State>`) with methods `execute(command)`, `undo()`, `redo()`, `undoTo(index)`, `redoTo(index)`, `clear()`, `canUndo`, `canRedo`, and observable state changes.
- Command implementations for each undoable user action, each with minimal data for reversal.
- Group operation utility: a `batch(commands)` function that wraps multiple commands in a `CompositeCommand`.
- Cross-session persistence module: serialize/deserialize the history stack to/from IndexedDB or localStorage with versioning.
- Keyboard shortcut integration: a `useUndoRedoShortcuts()` hook or listener that binds Ctrl+Z/Ctrl+Shift+Z to undo/redo.
- History panel component: a list view showing command descriptions with the current position highlighted and clickable entries for selective undo.

## Rules
- Every command MUST implement both `execute()` and `undo()`. A command that only stores state changes without the ability to reverse itself is a snapshot, not a command.
- The history stack MUST have a maximum depth to prevent unbounded memory growth. The default maximum MUST be 100 commands unless explicitly configured otherwise.
- Group operations MUST be atomic: if any child command in a `CompositeCommand` throws during `undo()`, the remaining children MUST still be undone to prevent partial rollback.
- Keyboard shortcuts for undo/redo MUST be disabled when the user is focused on a native input field (`<input>`, `<textarea>`, `contenteditable`) to avoid conflicting with the browser's native undo.
- Cross-session history persistence MUST NOT block the initial render. Deserialization happens asynchronously, and the UI shows an empty history until the persisted data is loaded.
- The history state MUST be immutable during undo/redo — each undo creates a new state object rather than mutating the previous state. This enables time-travel debugging and prevents stale references.
- Selective undo MUST compute dependencies between commands. If command B depends on the result of command A, undoing A without undoing B first produces an inconsistent state. Use a dependency graph to cascade.
- Optimistic commands that fail server validation MUST be rolled back immediately, and the user MUST be notified of the failure. Silently dropping a failed optimistic command leaves the UI in an inconsistent state.

## Best Practices
- State snapshots are the simplest approach for forms, settings panels, and small documents. Use `structuredClone()` or an immutable state library (Immer, Redux) to create snapshots efficiently.
- For the command pattern, store only the diff (old value, new value) not the entire state. This minimizes memory per command and makes serialization cheaper.
- Use a proxy or middleware on the state store (Redux middleware, Zustand middleware) to automatically capture commands as state changes, rather than manually creating commands in every event handler.
- Implement a `shouldMerge` method on commands: if the user types "a", "b", "c" in quick succession, merge these into a single "type text" command instead of three separate commands.
- Provide a `clear()` method on the history manager that is called on destructive actions (like "Save As" in a new file) to reset the history stack.
- Test undo/redo with property-based testing: generate random sequences of commands, execute them, undo all the way, and verify the state matches the initial state.
- Serialize commands by their constructor name and parameters, not by their closure. Closures capture scope that cannot be serialized. Use a command registry that maps type names to constructor functions.
- Use the Observer pattern or signals to notify the UI when the history stack changes (canUndo, canRedo, current description) so the undo/redo buttons can update their enabled state reactively.

## Anti-patterns
- Using a simple stack with no maximum depth. An undetected memory leak will crash the tab after enough undo operations, especially with large state snapshots.
- Storing the entire state in every snapshot for a large document (e.g., a 10MB canvas JSON). Use deltas, command pattern, or compress snapshots with a diff algorithm.
- Implementing undo as a mutation reversal (`previousState = currentState; currentState = newState;`). This breaks if the previous state is still referenced elsewhere in the application and gets mutated, corrupting the history.
- Allowing selective undo without tracking dependencies. Undoing a "delete paragraph" command without also undoing subsequent "insert image at paragraph X" commands will leave references to a deleted entity.
- Mixing optimistic commands and non-optimistic commands in the same stack without tracking their server status. A command that was rolled back by the server should show a visual error state in the history panel.
- Failing to disable Ctrl+Z on native input elements. The browser's own undo stack for text inputs will conflict with the application's undo, resulting in unexpected behavior.
- Persisting the entire command history as a single JSON blob in localStorage without a size limit. localStorage has a ~5MB limit, and a long editing session can easily exceed it.
- Implementing undo/redo as a generic library without considering the specific state shape. Generic undo libraries often produce incorrect results when the state has references that need special handling (Map, Set, Date, custom classes).

## Edge Cases
- The user performs 100 actions, then undoes 50, then performs a new action. The 51st–100th commands in the redo stack must be discarded. The new action branches the history — there is no "redo" past the branch point.
- The user undoes an action that involved a network request (e.g., "delete file"). Undoing must "undelete" the file on the server. This requires the delete command to store the file's data and the undo to make an API call to restore it.
- The user closes the tab and reopens it. The history must be restored from IndexedDB. If the deserialization fails (corrupt data, schema mismatch), the history is discarded and the app starts fresh with a warning.
- A command's `undo()` throws an error (e.g., network request fails during undo). The history manager must catch the error, mark the command as "failed to undo," and allow the user to retry or skip.
- The user performs a group operation (drag & drop 10 items), which creates a `CompositeCommand` with 10 child commands. Undoing once should undo all 10. Redoing once should redo all 10.
- The state includes non-serializable objects (functions, DOM elements, Promises). The command pattern must serialize only the data needed to reconstruct the state, not the runtime objects.
- Two users collaborate on the same document in real time. Undo/redo must be aware of remote operations. OT (Operational Transformation) or CRDT must be used to handle concurrent undo — a local undo should not revert another user's change.

## Validation Checklist
- [ ] Undoing a command correctly restores the state to exactly what it was before the command was executed — verified by deep-equality assertion between the state after undo and the state before execute.
- [ ] Redoing a command correctly re-applies the command and produces the same state as after the original execute — verified by deep-equality assertion.
- [ ] The history stack is bounded at the configured maximum depth — verified by executing more commands than the max and confirming the oldest entries are discarded.
- [ ] Group operations undo atomically: all child commands are undone in reverse order when undo is called once — verified by executing a group of 10 commands and calling undo once.
- [ ] Keyboard shortcuts Ctrl+Z and Ctrl+Shift+Z trigger undo and redo respectively — verified by simulating keypress events.
- [ ] Keyboard shortcuts do not trigger on native input elements (input, textarea) — verified by focusing an input field, pressing Ctrl+Z, and confirming the application's undo is not called.
- [ ] Cross-session persistence: the history stack survives a page reload — verified by executing a few commands, refreshing, and confirming the undo stack is available.
- [ ] Selective undo correctly reorders commands and produces a consistent state — verified by executing commands A, B, C, undoing only B, and confirming the state is equivalent to A + C.
- [ ] Optimistic command rollback: when a server rejects an optimistic mutation, the command is undone and the state returns to the previous valid state — verified by mocking a server failure.
- [ ] The history panel UI correctly shows the command descriptions, highlights the current position, and allows clicking an entry to undo/redo to that point — verified by manual interaction.

## Engineering Examples

### Example 1: Undo/redo for a document editor with command pattern
A rich text document editor implemented undo/redo using the command pattern. Each formatting action (bold, italic, insert text, delete text, change font size) was a class implementing `Command` with `execute()` and `undo()`. The `InsertTextCommand` stored the position and the inserted text; undo removed that text. The `FormatTextCommand` stored the old formatting and the new formatting for the selection range. The `CompositeCommand` handled "paste" operations: inserting text, applying formatting, and moving the cursor — all as a single undoable unit. The history manager used a stack of up to 200 commands with automatic merging: if the user typed a character within 500ms of the previous character, the keystrokes were merged into a single `InsertTextCommand` rather than creating one command per character. The editor state was serializable to a plain JSON object, and each command stored only the diff data (not the full document). Cross-session persistence serialized the command list to IndexedDB (not localStorage, because the document could exceed 5MB). On reload, the document state was reconstructed by replaying all commands from an initial empty state. If the serialized data was corrupt, the app loaded the last saved document version instead.

### Example 2: History persistence for a design tool across sessions
A vector graphic design tool allowed users to create complex illustrations with hundreds of shapes. The team chose a state snapshot approach because each shape was a small object, but the total state could be large. The history manager stored up to 50 snapshots (configurable). Each snapshot was created using Immer's `produce` to create an immutable copy efficiently. Every 5th snapshot was a full state copy; the intermediate snapshots stored only the diff using a structural diff algorithm. The history was persisted to IndexedDB in a dedicated object store: when the history stack changed, the entire stack (up to 50 snapshots) was written as a single record with a version number. On app load, the last persisted history was read and restored. The user could also name checkpoint states ("Before composition merge", "After color palette change") and jump directly to any checkpoint. A "time-travel" slider allowed the user to scrub through the history visually, seeing a thumbnail preview of the canvas at each step. Memory management automatically discarded snapshots older than 30 minutes of inactivity, keeping only the most recent 10 snapshots for long-running sessions.

### Example 3: Selective undo for a form builder
A drag-and-drop form builder allowed users to add, remove, and reorder form fields. The undo system needed to support selective undo: if a user added a text field, then a checkbox, then deleted the text field, they should be able to undo just the checkbox addition without restoring the deleted text field. The team implemented a non-linear undo using a command dependency graph. Each command tracked which form field IDs it created, modified, or deleted. When the user clicked "Undo checkbox" in the history panel, the system identified that the "deleted text field" command did not depend on the "added checkbox" command (they operated on different field IDs), so undoing only the checkbox was safe. If the user had added a checkbox and then modified the checkbox's label, undoing the "add checkbox" would also need to undo the "modify label" (dependent command). The system computed the transitive closure of dependencies, undone the dependent commands first, undone the target command, and then replayed the remaining commands to reconstruct the state. The history panel showed the dependency chains visually with indentation, making it clear which commands would be affected by undoing a specific entry.
