import { describe, it, expect } from "bun:test";
import { ToolRegistry } from "../../src/tools/registry.js";
import { executeToolCall } from "../../src/tools/executor.js";
import type { ToolDefinition, ToolResult } from "../../src/tools/types.js";

function makeTool(
  name: string,
  riskLevel: "low" | "medium" | "high",
  impl?: () => Promise<ToolResult>,
): ToolDefinition {
  return {
    name,
    displayName: name,
    riskLevel,
    doc: { description: "", parameters: [], examples: [] },
    execute: impl ?? (async () => ({ ok: true, data: null, display: "ok" })),
  };
}

function makeRegistry(...tools: ToolDefinition[]): ToolRegistry {
  const reg = new ToolRegistry();
  for (const t of tools) reg.register(t);
  return reg;
}

describe("executeToolCall", () => {
  it("returns UNKNOWN_TOOL for missing tool", async () => {
    const reg = makeRegistry();
    const result = await executeToolCall(reg, { name: "nope", args: {} });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("UNKNOWN_TOOL");
  });

  it("executes low-risk tools without approval", async () => {
    const reg = makeRegistry(makeTool("safe", "low"));
    let approvalCalled = false;
    const result = await executeToolCall(reg, { name: "safe", args: {} }, {
      async onApprovalRequired() {
        approvalCalled = true;
        return true;
      },
    });
    expect(result.ok).toBe(true);
    expect(approvalCalled).toBe(false);
  });

  it("triggers approval for medium-risk tools", async () => {
    const reg = makeRegistry(makeTool("risky", "medium"));
    let approvalCalled = false;
    const result = await executeToolCall(reg, { name: "risky", args: {} }, {
      async onApprovalRequired() {
        approvalCalled = true;
        return true;
      },
    });
    expect(result.ok).toBe(true);
    expect(approvalCalled).toBe(true);
  });

  it("returns DENIED when approval is rejected", async () => {
    const reg = makeRegistry(makeTool("risky", "high"));
    const result = await executeToolCall(reg, { name: "risky", args: {} }, {
      async onApprovalRequired() {
        return false;
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("DENIED");
  });

  it("skips approval for session-approved tools", async () => {
    const reg = makeRegistry(makeTool("risky", "high"));
    let approvalCalled = false;
    const approved = new Set(["risky"]);
    const result = await executeToolCall(
      reg,
      { name: "risky", args: {} },
      {
        async onApprovalRequired() {
          approvalCalled = true;
          return true;
        },
      },
      approved,
    );
    expect(result.ok).toBe(true);
    expect(approvalCalled).toBe(false);
  });

  it("catches and wraps tool execution errors", async () => {
    const reg = makeRegistry(
      makeTool("broken", "low", async () => {
        throw new Error("kaboom");
      }),
    );
    const result = await executeToolCall(reg, { name: "broken", args: {} });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("EXECUTION_ERROR");
    expect(result.error).toContain("kaboom");
  });

  it("calls onToolStarted and onToolCompleted callbacks", async () => {
    const reg = makeRegistry(makeTool("tracked", "low"));
    let started = false;
    let completed = false;
    await executeToolCall(reg, { name: "tracked", args: {} }, {
      onToolStarted() { started = true; },
      onToolCompleted() { completed = true; },
    });
    expect(started).toBe(true);
    expect(completed).toBe(true);
  });
});
