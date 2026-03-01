# Cumulonimbus

Agentic engineering tool TUI built with the [Rezi](https://rezitui.dev/) TypeScript framework.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0

## Setup

```bash
bun install
```

## Build & Run

```bash
bun run build   # compile TypeScript
bun start       # run the compiled output
bun run dev     # build + run in one step
```

## Controls

- **Enter** - Send message
- **Shift+Enter** - New line in the input
- **Tab** / **Shift+Tab** - Navigate between UI elements (tree, tabs, buttons, input)
- **Arrow keys** - Navigate tree items, switch tabs
- **Ctrl+C** - Quit

## Layout

```
┌──────────────┬────────────────────────────────┐
│ Explorer     │ Scrollable Chat Area            │
│              │                                 │
│ Projects     │ You: ...                        │
│ ├─ web-app   │ Agent: ...                      │
│ │  ├─ Code…  │                                 │
│ │  └─ Test…  │                                 │
│ └─ api-srv   │                                 │
│ Chats        ├─────────────────────────────────┤
│ ├─ Auth…     │ Paste Bin  Processes  To Do  Sch│
│ └─ DB re…    │ [tab content here]              │
│              ├────────────────────── Send now  ─┤
│              │ Type a message...     Schedule   │
└──────────────┴─────────────────────────────────┘
```

- **Sidebar** - Tree with Projects (agents/subtasks) and Chats sections
- **Chat** - Scrollable message history
- **Tabs** - Paste Bin, Processes, To Do, Scheduled
- **Input** - Multiline textarea with Send now / Schedule buttons

## Agent Tool Roadmap

Tools the AI agent can invoke, organised by implementation priority.

### Tier 1 — Core (MVP)

Baseline capabilities every agentic coding tool needs.

- [x] **read** — Read file contents with optional line range (offset + limit)
- [x] **write** — Create or overwrite a file
- [x] **edit** — Targeted string replacement in an existing file (old → new)
- [x] **ls** — List files and directories at a path
- [x] **glob** — Find files by name/pattern (`**/*.ts`)
- [x] **grep** — Search file contents by regex (ripgrep-style)
- [x] **bash** — Execute shell commands (timeout, background mode, kill)

### Tier 2 — Essential UX

What separates a useful agent from a toy demo.

- [ ] **question** — Ask the user for clarification mid-task
- [ ] **todo** — Create and manage a task checklist for multi-step work
- [ ] **plan** — Switch between planning mode (read-only) and build mode (full access)
- [ ] **web_search** — Search the web for current information
- [ ] **web_fetch** — Fetch a URL, convert HTML to markdown

### Tier 3 — Power Features

Parallel work, efficient edits, and code intelligence.

- [ ] **task** — Spawn a subagent with its own session for parallel/delegated work
- [ ] **multiedit** — Apply multiple replacements to one file in a single call
- [ ] **apply_patch** — Apply unified diffs (add, update, delete, move files)
- [ ] **batch** — Execute up to N tool calls in parallel in one invocation
- [ ] **lsp** — Language server integration (go-to-definition, references, diagnostics)

### Tier 4 — Differentiators

Features that set Cumulonimbus apart.

- [ ] **memory** — Persist knowledge across sessions
- [ ] **browser** — Headless browser automation (navigate, click, screenshot)
- [ ] **semantic_search** — Embedding-based code search by meaning
- [ ] **codesearch** — Search external docs, APIs, and library references
- [ ] **skill** — Load domain-specific knowledge packs (SKILL.md + associated files)

## Rezi Notes

Rezi (`@rezi-ui/core` + `@rezi-ui/node`) is an alpha-stage terminal UI framework for TypeScript. Key things to know when working on this codebase:

### App lifecycle

```ts
const app = createNodeApp<AppState>({ initialState: { ... } });
app.view((state) => /* return VNode tree */);
app.keys({ ... });
await app.start();
```

State is updated via `app.update((prev) => newState)`. Views are pure functions of state.

### Layout primitives

- `ui.row({ flex, gap, items, justify, px })` - horizontal stack
- `ui.column({ flex, gap, items, justify, px })` - vertical stack
- `ui.box({ border, borderTop/Right/Bottom/Left, borderStyle, borderStyleSides, overflow, flex, px, py, p })` - container with optional borders
- `ui.divider({ direction, color, label })` - horizontal or vertical separator line
- `ui.spacer()` - flexible space filler

### Borders

`ui.box` supports per-side border toggles (`borderLeft: false`, etc.) and per-side color via `borderStyleSides: { left: { fg }, top: { fg }, ... }`. The `border` prop sets the line style: `"none" | "single" | "double" | "rounded" | "heavy"`.

### Widgets

- `ui.tree<T>({ id, data, getKey, getChildren, expanded, selected, onToggle, onSelect, renderNode, showLines })` - interactive tree
- `ui.button(id, label, { onPress, dsVariant, dsSize, px, style, intent })` - focusable button
  - `dsVariant`: `"solid" | "soft" | "outline" | "ghost"` (default `"soft"`)
  - `dsSize`: `"sm" | "md" | "lg"`
- `ui.input(id, value, { onInput, placeholder, focusConfig })` - single-line input
- `ui.textarea({ id, value, rows, wordWrap, onInput, placeholder, focusConfig })` - multiline input
- `ui.tabs({ id, activeTab, onChange, tabs, variant, position })` - tabbed panel (**renders tabs vertically** as a sidebar-style list; for horizontal tabs, build a custom `ui.row` of buttons)
- `ui.text(content, { fg, style })` - styled text

### Focus & key bindings

- `focusConfig: { indicator: "none" }` suppresses the default focus ring on inputs/buttons
- `app.keys({ "key": (ctx) => { ... } })` registers global key handlers
- `ctx` provides `{ state, update, focusedId }` so you can scope actions to the focused widget
- Key names: `enter`, `shift+enter`, `ctrl+c`, `tab`, `escape`, arrow keys, etc.

### Colors

`rgb(r, g, b)` returns an `Rgb24` number (not a string). Use it in `TextStyle.fg` / `TextStyle.bg`. For `ui.divider({ color })`, pass a hex string like `"#3a6a7a"` instead.

### Gotchas

- `ui.tabs` with `variant: "line"` still renders a vertical tab list. Use custom `ui.row` + `ui.button` for horizontal tab headers.
- `ui.box` without explicit `border: "none"` may render a focus ring when it contains focusable children or has `overflow: "scroll"`.
- Column children don't stretch to fill width by default. Set `items: "stretch"` on `ui.column` to make children full-width.
- `ui.textarea` `rows` is fixed per render. Compute it dynamically from content for auto-grow behavior.
