import type { ToolDefinition, ToolResult } from "./types.js";

interface BashArgs {
  command: string;
  timeout_ms?: number;
  cwd?: string;
  run_in_background?: boolean;
}

interface BackgroundProcess {
  pid: number;
  command: string;
  startedAt: number;
}

const backgroundProcesses = new Map<string, BackgroundProcess>();

const DEFAULT_TIMEOUT = 120_000;
const MAX_TIMEOUT = 600_000;
const MAX_OUTPUT_BYTES = 50_000;

function truncateOutput(output: string): string {
  if (output.length <= MAX_OUTPUT_BYTES) return output;
  return (
    output.slice(0, MAX_OUTPUT_BYTES) +
    `\n... (output truncated at ${MAX_OUTPUT_BYTES} bytes)`
  );
}

export function getBackgroundProcesses(): Map<string, BackgroundProcess> {
  return backgroundProcesses;
}

export const bashTool: ToolDefinition<BashArgs> = {
  name: "bash",
  displayName: "Run Command",
  riskLevel: "high",
  doc: {
    description:
      "Executes a bash command. Supports foreground (with timeout) and background execution.",
    parameters: [
      {
        name: "command",
        type: "string",
        required: true,
        description: "The bash command to execute",
      },
      {
        name: "timeout_ms",
        type: "number",
        required: false,
        description: "Timeout in milliseconds (max 600000)",
        default: "120000",
      },
      {
        name: "cwd",
        type: "string",
        required: false,
        description: "Working directory for the command",
      },
      {
        name: "run_in_background",
        type: "boolean",
        required: false,
        description: "Run the command in the background",
        default: "false",
      },
    ],
    examples: [
      { title: "Run a simple command", args: { command: "echo hello" } },
      {
        title: "Run with timeout",
        args: { command: "npm test", timeout_ms: 30000 },
      },
      {
        title: "Run in background",
        args: { command: "npm run dev", run_in_background: true },
      },
    ],
  },

  async execute(args: BashArgs): Promise<ToolResult> {
    const {
      command,
      timeout_ms = DEFAULT_TIMEOUT,
      cwd,
      run_in_background = false,
    } = args;

    if (!command) {
      return { ok: false, error: "command is required" };
    }

    const effectiveTimeout = Math.min(timeout_ms, MAX_TIMEOUT);

    try {
      const proc = Bun.spawn(["bash", "-c", command], {
        cwd: cwd || process.cwd(),
        stdout: "pipe",
        stderr: "pipe",
      });

      if (run_in_background) {
        const id = `bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        backgroundProcesses.set(id, {
          pid: proc.pid,
          command,
          startedAt: Date.now(),
        });

        return {
          ok: true,
          data: { backgroundId: id, pid: proc.pid },
          display: `Background process started: ${id} (PID ${proc.pid})`,
        };
      }

      // Foreground: race against timeout
      let timeoutId: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          proc.kill();
          reject(new Error(`Command timed out after ${effectiveTimeout}ms`));
        }, effectiveTimeout);
      });

      const exitCode = await Promise.race([proc.exited, timeoutPromise]);
      clearTimeout(timeoutId!);

      const stdout = truncateOutput(await new Response(proc.stdout).text());
      const stderr = truncateOutput(await new Response(proc.stderr).text());

      const output = [stdout, stderr].filter(Boolean).join("\n");

      if (exitCode !== 0) {
        return {
          ok: false,
          error: `Command exited with code ${exitCode}\n${output}`.trim(),
          code: `EXIT_${exitCode}`,
        };
      }

      return {
        ok: true,
        data: { exitCode, stdout, stderr },
        display: output || "(no output)",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("timed out")) {
        return { ok: false, error: msg, code: "TIMEOUT" };
      }
      return { ok: false, error: msg };
    }
  },
};
