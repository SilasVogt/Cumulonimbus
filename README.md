# Cumulonimbus

Agentic engineering tool TUI built with the [Rezi](https://rezitui.dev/) TypeScript framework.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0

## Setup

```bash
bun install
```

## Build

```bash
bun run build
```

## Run

```bash
bun start
```

Or build and run in one step:

```bash
bun run dev
```

## Controls

- **Tab** / **Shift+Tab** - Navigate between UI elements
- **Arrow keys** - Navigate tree items
- **Enter** - Expand/collapse tree nodes
- **q** - Quit
- **Ctrl+C** - Quit

## Layout

```
┌──────────────┬────────────────────────────────┐
│  Sidebar     │  Scrollable Chat Area           │
│  (Tree)      │                                 │
│  Projects    │                                 │
│  ├─ Proj A   │                                 │
│  │ ├─ Agent1 │                                 │
│  │ └─ Agent2 │                                 │
│  └─ Proj B   ├────────────────────────────────┤
│    └─ Agent3 │  Paste Bin (pasted images)      │
│              ├────────────────────────────────┤
│              │  [Text Input         ] [Send]   │
└──────────────┴────────────────────────────────┘
```
