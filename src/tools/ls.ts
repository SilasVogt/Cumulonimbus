import { readdir } from "node:fs/promises";
import type { ToolDefinition, ToolResult } from "./types.js";

interface LsArgs {
  path: string;
  show_hidden?: boolean;
}

export const lsTool: ToolDefinition<LsArgs> = {
  name: "ls",
  displayName: "List Directory",
  riskLevel: "low",
  doc: {
    description:
      "Lists the contents of a directory, sorted with directories first then alphabetically.",
    parameters: [
      {
        name: "path",
        type: "string",
        required: true,
        description: "Absolute path to the directory to list",
      },
      {
        name: "show_hidden",
        type: "boolean",
        required: false,
        description: "Show hidden files (starting with .)",
        default: "false",
      },
    ],
    examples: [
      { title: "List current directory", args: { path: "." } },
      { title: "List with hidden files", args: { path: "/home", show_hidden: true } },
    ],
  },

  async execute(args: LsArgs): Promise<ToolResult> {
    const { path, show_hidden = false } = args;

    if (!path) {
      return { ok: false, error: "path is required" };
    }

    try {
      const entries = await readdir(path, { withFileTypes: true });

      let filtered = entries;
      if (!show_hidden) {
        filtered = entries.filter((e) => !e.name.startsWith("."));
      }

      // Sort: directories first, then alphabetical
      filtered.sort((a, b) => {
        const aIsDir = a.isDirectory() ? 0 : 1;
        const bIsDir = b.isDirectory() ? 0 : 1;
        if (aIsDir !== bIsDir) return aIsDir - bIsDir;
        return a.name.localeCompare(b.name);
      });

      const lines = filtered.map((e) => {
        const suffix = e.isDirectory() ? "/" : "";
        return `${e.name}${suffix}`;
      });

      return {
        ok: true,
        data: {
          entries: filtered.map((e) => ({
            name: e.name,
            isDirectory: e.isDirectory(),
          })),
        },
        display: lines.join("\n"),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("No such file") || msg.includes("ENOENT")) {
        return { ok: false, error: `Directory not found: ${path}`, code: "NOT_FOUND" };
      }
      return { ok: false, error: msg };
    }
  },
};
