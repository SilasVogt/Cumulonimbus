import type { ToolDefinition, ToolResult } from "./types.js";

interface ReadArgs {
  file_path: string;
  offset?: number;
  limit?: number;
}

export const readTool: ToolDefinition<ReadArgs> = {
  name: "read",
  displayName: "Read File",
  riskLevel: "low",
  doc: {
    description: "Reads the contents of a file and returns numbered lines.",
    parameters: [
      {
        name: "file_path",
        type: "string",
        required: true,
        description: "Absolute path to the file to read",
      },
      {
        name: "offset",
        type: "number",
        required: false,
        description: "1-based line number to start reading from",
        default: "1",
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Maximum number of lines to return",
        default: "2000",
      },
    ],
    examples: [
      { title: "Read entire file", args: { file_path: "/src/index.ts" } },
      {
        title: "Read with offset and limit",
        args: { file_path: "/src/index.ts", offset: 10, limit: 50 },
      },
    ],
  },

  async execute(args: ReadArgs): Promise<ToolResult> {
    const { file_path, offset = 1, limit = 2000 } = args;

    if (!file_path) {
      return { ok: false, error: "file_path is required" };
    }

    try {
      const content = await Bun.file(file_path).text();
      const allLines = content.split("\n");
      const startIdx = Math.max(0, offset - 1);
      const sliced = allLines.slice(startIdx, startIdx + limit);

      const numbered = sliced
        .map((line, i) => {
          const lineNum = startIdx + i + 1;
          return `${String(lineNum).padStart(6, " ")}\t${line}`;
        })
        .join("\n");

      return {
        ok: true,
        data: { lines: sliced, totalLines: allLines.length },
        display: numbered,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("No such file") || msg.includes("ENOENT")) {
        return { ok: false, error: `File not found: ${file_path}`, code: "NOT_FOUND" };
      }
      return { ok: false, error: msg };
    }
  },
};
