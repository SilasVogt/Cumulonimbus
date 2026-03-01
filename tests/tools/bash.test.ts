import { describe, it, expect } from "bun:test";
import { bashTool } from "../../src/tools/bash.js";
import { withTempDir } from "../helpers.js";

describe("bash tool", () => {
  it("runs a simple command and captures output", async () => {
    const result = await bashTool.execute({ command: "echo hello" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.display).toContain("hello");
  });

  it("returns error for nonzero exit code", async () => {
    const result = await bashTool.execute({ command: "exit 1" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("EXIT_1");
  });

  it("times out on long-running commands", async () => {
    const result = await bashTool.execute({
      command: "sleep 60",
      timeout_ms: 500,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("TIMEOUT");
  });

  it("respects cwd", async () => {
    await withTempDir(async (dir) => {
      const result = await bashTool.execute({ command: "pwd", cwd: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.display.trim()).toBe(dir);
    });
  });

  it("starts a background process", async () => {
    const result = await bashTool.execute({
      command: "sleep 0.1",
      run_in_background: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as { backgroundId: string; pid: number };
    expect(data.backgroundId).toMatch(/^bg-/);
    expect(data.pid).toBeGreaterThan(0);
  });
});
