import type { ToolDefinition, ToolResult } from "./types.js";

interface EditArgs {
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

export const editTool: ToolDefinition<EditArgs> = {
  name: "edit",
  displayName: "Edit File",
  riskLevel: "medium",
  doc: {
    description:
      "Performs exact string replacement in a file. Finds old_string and replaces it with new_string.",
    parameters: [
      {
        name: "file_path",
        type: "string",
        required: true,
        description: "Absolute path to the file to edit",
      },
      {
        name: "old_string",
        type: "string",
        required: true,
        description: "The exact text to find and replace",
      },
      {
        name: "new_string",
        type: "string",
        required: true,
        description: "The replacement text",
      },
      {
        name: "replace_all",
        type: "boolean",
        required: false,
        description: "Replace all occurrences instead of requiring a unique match",
        default: "false",
      },
    ],
    examples: [
      {
        title: "Replace a unique string",
        args: {
          file_path: "/src/app.ts",
          old_string: 'const port = 3000;',
          new_string: 'const port = 8080;',
        },
      },
    ],
  },

  async execute(args: EditArgs): Promise<ToolResult> {
    const { file_path, old_string, new_string, replace_all = false } = args;

    if (!file_path) {
      return { ok: false, error: "file_path is required" };
    }
    if (old_string === undefined || old_string === null) {
      return { ok: false, error: "old_string is required" };
    }
    if (old_string === "") {
      return { ok: false, error: "old_string cannot be empty", code: "INVALID_INPUT" };
    }
    if (new_string === undefined || new_string === null) {
      return { ok: false, error: "new_string is required" };
    }

    try {
      const content = await Bun.file(file_path).text();

      // Count occurrences
      let count = 0;
      let searchFrom = 0;
      while (true) {
        const idx = content.indexOf(old_string, searchFrom);
        if (idx === -1) break;
        count++;
        searchFrom = idx + old_string.length;
      }

      if (count === 0) {
        return {
          ok: false,
          error: "old_string not found in file",
          code: "NOT_FOUND",
        };
      }

      if (count > 1 && !replace_all) {
        return {
          ok: false,
          error: `old_string found ${count} times — use replace_all to replace all occurrences`,
          code: "AMBIGUOUS_MATCH",
        };
      }

      let updated: string;
      if (replace_all) {
        updated = content.split(old_string).join(new_string);
      } else {
        // Replace only the first (and only) occurrence
        const idx = content.indexOf(old_string);
        updated =
          content.slice(0, idx) + new_string + content.slice(idx + old_string.length);
      }

      await Bun.write(file_path, updated);

      return {
        ok: true,
        data: { path: file_path, replacements: replace_all ? count : 1 },
        display: `Replaced ${replace_all ? count : 1} occurrence(s) in ${file_path}`,
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
