import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { ToolDefinition, ToolResult } from "./types.js";

interface GrepArgs {
  pattern: string;
  path: string;
  glob_filter?: string;
  case_insensitive?: boolean;
  max_results?: number;
  context_lines?: number;
}

interface GrepMatch {
  file: string;
  line: number;
  content: string;
  context_before: string[];
  context_after: string[];
}

const DEFAULT_MAX_RESULTS = 200;

async function collectFiles(
  dir: string,
  globFilter?: Bun.Glob,
): Promise<string[]> {
  const files: string[] = [];

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (!globFilter || globFilter.match(entry.name)) {
        files.push(full);
      }
    }
  }

  await walk(dir);
  return files;
}

function searchFile(
  content: string,
  regex: RegExp,
  contextLines: number,
): Omit<GrepMatch, "file">[] {
  const lines = content.split("\n");
  const matches: Omit<GrepMatch, "file">[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
      const beforeStart = Math.max(0, i - contextLines);
      const afterEnd = Math.min(lines.length - 1, i + contextLines);
      matches.push({
        line: i + 1,
        content: lines[i],
        context_before: contextLines > 0 ? lines.slice(beforeStart, i) : [],
        context_after:
          contextLines > 0 ? lines.slice(i + 1, afterEnd + 1) : [],
      });
    }
  }

  return matches;
}

export const grepTool: ToolDefinition<GrepArgs> = {
  name: "grep",
  displayName: "Search Content",
  riskLevel: "low",
  doc: {
    description:
      "Searches file contents using a regex pattern. Can search a single file or recursively through a directory.",
    parameters: [
      {
        name: "pattern",
        type: "string",
        required: true,
        description: "Regular expression pattern to search for",
      },
      {
        name: "path",
        type: "string",
        required: true,
        description: "File or directory path to search in",
      },
      {
        name: "glob_filter",
        type: "string",
        required: false,
        description:
          'Only search files matching this glob (e.g. "*.ts"). Only applies to directory searches.',
      },
      {
        name: "case_insensitive",
        type: "boolean",
        required: false,
        description: "Case insensitive search",
        default: "false",
      },
      {
        name: "max_results",
        type: "number",
        required: false,
        description: "Maximum number of matches to return",
        default: "200",
      },
      {
        name: "context_lines",
        type: "number",
        required: false,
        description: "Number of context lines to show before and after each match",
        default: "0",
      },
    ],
    examples: [
      {
        title: "Search for a function",
        args: { pattern: "function\\s+handleClick", path: "/src" },
      },
      {
        title: "Case insensitive search in TS files",
        args: {
          pattern: "todo",
          path: "/src",
          glob_filter: "*.ts",
          case_insensitive: true,
        },
      },
    ],
  },

  async execute(args: GrepArgs): Promise<ToolResult> {
    const {
      pattern,
      path,
      glob_filter,
      case_insensitive = false,
      max_results = DEFAULT_MAX_RESULTS,
      context_lines = 0,
    } = args;

    if (!pattern) {
      return { ok: false, error: "pattern is required" };
    }
    if (!path) {
      return { ok: false, error: "path is required" };
    }

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, case_insensitive ? "i" : "");
    } catch (err) {
      return {
        ok: false,
        error: `Invalid regex: ${err instanceof Error ? err.message : String(err)}`,
        code: "INVALID_REGEX",
      };
    }

    try {
      const pathStat = await stat(path);
      let files: string[];

      if (pathStat.isFile()) {
        files = [path];
      } else {
        const globObj = glob_filter ? new Bun.Glob(glob_filter) : undefined;
        files = await collectFiles(path, globObj);
        files.sort();
      }

      const allMatches: GrepMatch[] = [];
      let truncated = false;

      for (const file of files) {
        if (allMatches.length >= max_results) {
          truncated = true;
          break;
        }

        try {
          const content = await Bun.file(file).text();
          const fileMatches = searchFile(content, regex, context_lines);

          for (const match of fileMatches) {
            allMatches.push({ file, ...match });
            if (allMatches.length >= max_results) {
              truncated = true;
              break;
            }
          }
        } catch {
          // Skip files that can't be read (binary, permissions, etc.)
        }
      }

      const displayLines: string[] = [];
      for (const m of allMatches) {
        for (const ctx of m.context_before) {
          displayLines.push(`  ${ctx}`);
        }
        displayLines.push(`${m.file}:${m.line}: ${m.content}`);
        for (const ctx of m.context_after) {
          displayLines.push(`  ${ctx}`);
        }
        if (m.context_before.length > 0 || m.context_after.length > 0) {
          displayLines.push("--");
        }
      }

      if (truncated) {
        displayLines.push(`... (truncated at ${max_results} results)`);
      }

      return {
        ok: true,
        data: { matches: allMatches, truncated },
        display:
          displayLines.join("\n") || `No matches found for pattern: ${pattern}`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("No such file") || msg.includes("ENOENT")) {
        return { ok: false, error: `Path not found: ${path}`, code: "NOT_FOUND" };
      }
      return { ok: false, error: msg };
    }
  },
};
