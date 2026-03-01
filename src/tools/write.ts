import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { ToolDefinition, ToolResult } from "./types.js";

interface WriteArgs {
  file_path: string;
  content: string;
  create_dirs?: boolean;
}

export const writeTool: ToolDefinition<WriteArgs> = {
  name: "write",
  displayName: "Write File",
  riskLevel: "medium",
  doc: {
    description: "Writes content to a file, creating it if it doesn't exist.",
    parameters: [
      {
        name: "file_path",
        type: "string",
        required: true,
        description: "Absolute path to the file to write",
      },
      {
        name: "content",
        type: "string",
        required: true,
        description: "The content to write to the file",
      },
      {
        name: "create_dirs",
        type: "boolean",
        required: false,
        description: "Create parent directories if they don't exist",
        default: "true",
      },
    ],
    examples: [
      {
        title: "Write a new file",
        args: { file_path: "/tmp/hello.txt", content: "Hello, world!" },
      },
    ],
  },

  async execute(args: WriteArgs): Promise<ToolResult> {
    const { file_path, content, create_dirs = true } = args;

    if (!file_path) {
      return { ok: false, error: "file_path is required" };
    }
    if (content === undefined || content === null) {
      return { ok: false, error: "content is required" };
    }

    try {
      if (create_dirs) {
        await mkdir(dirname(file_path), { recursive: true });
      }

      await Bun.write(file_path, content);

      const lineCount = content.split("\n").length;
      return {
        ok: true,
        data: { path: file_path, bytes: content.length, lines: lineCount },
        display: `Wrote ${content.length} bytes (${lineCount} lines) to ${file_path}`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }
  },
};
