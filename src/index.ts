import { ui, rgb } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";

// ── Colors ─────────────────────────────────────────────────────────────────────

const colors = {
  cyan: rgb(0, 255, 255),
  blue: rgb(80, 140, 255),
  green: rgb(100, 255, 100),
  yellow: rgb(255, 220, 80),
  magenta: rgb(255, 100, 255),
  white: rgb(255, 255, 255),
  gray: rgb(128, 128, 128),
  dimWhite: rgb(200, 200, 200),
};

// ── Mock Data ──────────────────────────────────────────────────────────────────

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

const treeData: TreeNode[] = [
  {
    id: "sec-projects",
    label: "Projects",
    children: [
      {
        id: "p1",
        label: "web-app",
        children: [
          {
            id: "a1",
            label: "\u25B6 CodeAgent",
            children: [
              { id: "s1", label: "search: auth utils" },
              { id: "s2", label: "edit: login.ts" },
            ],
          },
          {
            id: "a2",
            label: "\u25B6 TestAgent",
            children: [{ id: "s3", label: "run: npm test" }],
          },
        ],
      },
      {
        id: "p2",
        label: "api-server",
        children: [
          {
            id: "a3",
            label: "\u23F8 RefactorAgent",
            children: [{ id: "s4", label: "read: db.ts" }],
          },
        ],
      },
    ],
  },
  {
    id: "sec-chats",
    label: "Chats",
    children: [
      { id: "c1", label: "Auth setup" },
      { id: "c2", label: "DB refactor" },
      { id: "c3", label: "Deploy pipeline" },
    ],
  },
];

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  hasImage?: boolean;
}

const initialMessages: ChatMessage[] = [
  {
    role: "user",
    content: "How do I set up authentication in the web app?",
  },
  {
    role: "agent",
    content:
      "I found the auth utilities in src/utils/auth.ts. The app uses JWT-based authentication with refresh tokens. Let me walk you through the setup.",
  },
  {
    role: "user",
    content: "Can you show me the login flow diagram?",
  },
  {
    role: "agent",
    content: "Here's the login flow:",
    hasImage: true,
  },
  {
    role: "user",
    content: "That makes sense. Can you update login.ts to add rate limiting?",
  },
  {
    role: "agent",
    content:
      'I\'ve edited src/pages/login.ts to add rate limiting using a sliding window algorithm. The limit is set to 5 attempts per 15-minute window. I also added proper error messages for the "too many attempts" case.',
  },
  {
    role: "user",
    content: "Run the tests to make sure nothing is broken.",
  },
  {
    role: "agent",
    content:
      "All 47 tests passed. The new rate limiting tests (3 added) also pass. No regressions detected.",
  },
  {
    role: "user",
    content: "Great work! Now let's look at the API server.",
  },
  {
    role: "agent",
    content:
      "Switching to the api-server project. I can see the RefactorAgent is paused on reading db.ts. Want me to resume it or start a new task?",
  },
];

interface PasteItem {
  name: string;
  type: "image";
}

const initialPasteItems: PasteItem[] = [
  { name: "login-flow.png", type: "image" },
  { name: "schema-v2.png", type: "image" },
  { name: "error-screenshot.png", type: "image" },
];

interface ProcessItem {
  id: string;
  command: string;
  status: "running" | "done" | "failed";
  timestamp: string;
}

const initialProcesses: ProcessItem[] = [
  { id: "proc1", command: "npm test", status: "done", timestamp: "12:01" },
  { id: "proc2", command: "tsc --watch", status: "running", timestamp: "12:03" },
  { id: "proc3", command: "eslint src/", status: "done", timestamp: "12:05" },
  { id: "proc4", command: "npm run build", status: "failed", timestamp: "12:07" },
];

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

const initialTodos: TodoItem[] = [
  { id: "t1", text: "Add rate limiting to login", done: true },
  { id: "t2", text: "Write integration tests", done: false },
  { id: "t3", text: "Update API docs", done: false },
  { id: "t4", text: "Review DB migration", done: false },
];

// ── App State ──────────────────────────────────────────────────────────────────

interface ScheduledItem {
  id: string;
  text: string;
  timestamp: string;
}

interface AppState {
  selectedNode: string;
  expandedNodes: string[];
  messages: ChatMessage[];
  inputValue: string;
  pasteItems: PasteItem[];
  activeTab: string;
  processes: ProcessItem[];
  todos: TodoItem[];
  scheduled: ScheduledItem[];
}

// ── App Setup ──────────────────────────────────────────────────────────────────

const app = createNodeApp<AppState>({
  initialState: {
    selectedNode: "p1",
    expandedNodes: ["sec-projects", "p1", "a1", "sec-chats"],
    messages: [...initialMessages],
    inputValue: "",
    pasteItems: [...initialPasteItems],
    activeTab: "paste-bin",
    processes: [...initialProcesses],
    todos: [...initialTodos],
    scheduled: [],
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function sendMessage() {
  app.update((prev) => {
    const text = prev.inputValue.trim();
    if (!text) return prev;
    return {
      ...prev,
      inputValue: "",
      messages: [
        ...prev.messages,
        { role: "user" as const, content: text },
        {
          role: "agent" as const,
          content: "I'm working on that. Let me look into it...",
        },
      ],
    };
  });
}

function scheduleMessage() {
  app.update((prev) => {
    const text = prev.inputValue.trim();
    if (!text) return prev;
    const now = new Date();
    const ts = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    return {
      ...prev,
      inputValue: "",
      scheduled: [
        ...prev.scheduled,
        { id: `sched-${Date.now()}`, text, timestamp: ts },
      ],
    };
  });
}

// ── View ───────────────────────────────────────────────────────────────────────

app.view((state) => {
  // ── Tab content (conditional) ──
  const tabContent =
    state.activeTab === "paste-bin"
      ? ui.row({ gap: 2, items: "center" },
          state.pasteItems.length > 0
            ? state.pasteItems.map((item, i) =>
                ui.text(`[img] ${item.name}`, {
                  key: `paste-${i}`,
                  style: { fg: colors.yellow },
                }),
              )
            : [ui.text("No pasted items", { style: { fg: colors.gray } })],
        )
      : state.activeTab === "processes"
        ? ui.column({ gap: 0 },
            state.processes.map((proc) => {
              const icon =
                proc.status === "done" ? "\u2713" : proc.status === "running" ? "\u27F3" : "\u2717";
              const color =
                proc.status === "done"
                  ? colors.green
                  : proc.status === "running"
                    ? colors.yellow
                    : colors.magenta;
              return ui.text(`${icon} ${proc.command}  ${proc.timestamp}`, {
                key: proc.id,
                style: { fg: color },
              });
            }),
          )
        : state.activeTab === "todo"
          ? ui.column({ gap: 0 },
              state.todos.map((todo) =>
                ui.text(`${todo.done ? "[x]" : "[ ]"} ${todo.text}`, {
                  key: todo.id,
                  style: { fg: todo.done ? colors.gray : colors.dimWhite },
                }),
              ),
            )
          : ui.column({ gap: 0 },
              state.scheduled.length > 0
                ? state.scheduled.map((item) =>
                    ui.text(`${item.timestamp}  ${item.text}`, {
                      key: item.id,
                      style: { fg: colors.yellow },
                    }),
                  )
                : [ui.text("No scheduled messages", { style: { fg: colors.gray } })],
            );

  const tabBtn = (id: string, key: string, label: string) =>
    ui.button(id, label, {
      onPress: () => app.update((prev) => ({ ...prev, activeTab: key })),
      dsVariant: "ghost",
      dsSize: "sm",
      px: 0,
      style: { fg: state.activeTab === key ? colors.white : colors.gray },
    });

  return ui.box(
    {
      flex: 1,
      border: "single",
      borderStyle: { fg: colors.blue },
      borderStyleSides: { left: { fg: colors.cyan }, bottom: { fg: colors.cyan } },
    },
    [
      ui.row({ flex: 1 }, [
        // ── Sidebar (no box, just content) ──
        ui.column({ width: 26, px: 1 }, [
          ui.text("Explorer", { style: { fg: colors.cyan, bold: true } }),
          ui.tree<TreeNode>({
            id: "project-tree",
            data: treeData,
            getKey: (node) => node.id,
            getChildren: (node) => node.children,
            expanded: state.expandedNodes,
            selected: state.selectedNode,
            onToggle: (node, expanded) =>
              app.update((prev) => ({
                ...prev,
                expandedNodes: expanded
                  ? [...prev.expandedNodes, node.id]
                  : prev.expandedNodes.filter((id) => id !== node.id),
              })),
            onSelect: (node) =>
              app.update((prev) => ({ ...prev, selectedNode: node.id })),
            renderNode: (node, depth) =>
              ui.text(node.label, {
                style: {
                  fg: depth === 0 ? colors.cyan : depth === 1 ? colors.green : colors.dimWhite,
                },
              }),
            showLines: true,
            indentSize: 2,
          }),
        ]),

        // ── Vertical divider ──
        ui.divider({ direction: "vertical", color: "#3a6a7a" }),

        // ── Main Area ──
        ui.column({ flex: 1, items: "stretch" }, [
          // ── Chat messages ──
          ui.box(
            { flex: 1, overflow: "scroll", border: "none", px: 1 },
            state.messages.map((msg, i) =>
              ui.column({ key: `msg-${i}`, gap: 0 }, [
                ui.text(
                  `${msg.role === "user" ? "You" : "Agent"}: ${msg.content}`,
                  { fg: msg.role === "user" ? colors.white : colors.green },
                ),
                ...(msg.hasImage
                  ? [ui.text("  [image: login-flow.png]", { fg: colors.yellow })]
                  : []),
                ui.text(" "),
              ]),
            ),
          ),

          // ── Divider ──
          ui.divider({ color: "#3a6a7a" }),

          // ── Tab headers ──
          ui.row({ gap: 2, px: 1 }, [
            tabBtn("tab-paste-bin", "paste-bin", "Paste Bin"),
            tabBtn("tab-processes", "processes", "Processes"),
            tabBtn("tab-todo", "todo", "To Do"),
            tabBtn("tab-scheduled", "scheduled", "Scheduled"),
          ]),

          // ── Tab content ──
          ui.column({ height: 2, px: 1 }, [tabContent]),

          // ── Divider ──
          ui.divider({ color: "#3a6a7a" }),

          // ── Input area (textarea left, buttons right) ──
          ui.row({ px: 1, gap: 1, items: "center" }, [
            ui.box({ flex: 1, border: "none" }, [
              ui.textarea({
                id: "chat-input",
                value: state.inputValue,
                rows: Math.max(1, Math.min(6, (state.inputValue.match(/\n/g) || []).length + 1)),
                wordWrap: true,
                placeholder: "Type a message...",
                focusConfig: { indicator: "none" },
                onInput: (value: string) =>
                  app.update((prev) => ({ ...prev, inputValue: value })),
              }),
            ]),
            ui.column({ gap: 0, justify: "center" }, [
              ui.button("send-btn", "Send now", {
                dsVariant: "soft",
                dsSize: "sm",
                px: 1,
                intent: "primary",
                onPress: sendMessage,
              }),
              ui.button("schedule-btn", "Schedule", {
                dsVariant: "ghost",
                dsSize: "sm",
                px: 1,
                onPress: scheduleMessage,
              }),
            ]),
          ]),
        ]),
      ]),
    ],
  );
});

// ── Key Bindings ───────────────────────────────────────────────────────────────

app.keys({
  enter: ({ focusedId }) => {
    if (focusedId === "chat-input") sendMessage();
  },
  "ctrl+c": () => app.stop(),
});

// ── Start ──────────────────────────────────────────────────────────────────────

await app.start();
