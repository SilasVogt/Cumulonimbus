import type { ToolDefinition, ToolResult } from "./types.js";

interface GlobArgs {
  pattern: string;
  path?: string;
}

const MAX_RESULTS = 10_000;

export const globTool: ToolDefinition<GlobArgs> = {
  name: "glob",
  displayName: "Glob Search",
  riskLevel: "low",
  doc: {
    description: "Finds files matching a glob pattern.",
    parameters: [
      {
        name: "pattern",
        type: "string",
        required: true,
        description: 'Glob pattern to match (e.g. "**/*.ts")',
      },
      {
        name: "path",
        type: "string",
        required: false,
        description: "Base directory to search from (defaults to cwd)",
      },
    ],
    examples: [
      { title: "Find all TypeScript files", args: { pattern: "**/*.ts" } },
      {
        title: "Find in specific directory",
        args: { pattern: "*.json", path: "/home/user/config" },
      },
    ],
  },

  async execute(args: GlobArgs): Promise<ToolResult> {
    const { pattern, path: basePath } = args;

    if (!pattern) {
      return { ok: false, error: "pattern is required" };
    }

    try {
      const glob = new Bun.Glob(pattern);
      const cwd = basePath || process.cwd();
      const results: string[] = [];

      for await (const match of glob.scan({ cwd, dot: false })) {
        results.push(match);
        if (results.length >= MAX_RESULTS) break;
      }

      results.sort();

      const truncated = results.length >= MAX_RESULTS;
      const display = truncated
        ? `${results.join("\n")}\n... (truncated at ${MAX_RESULTS} results)`
        : results.join("\n") || "(no matches)";

      return {
        ok: true,
        data: { matches: results, truncated },
        display,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }
  },
};
