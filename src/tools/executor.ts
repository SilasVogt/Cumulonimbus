import type { ToolRegistry } from "./registry.js";
import type { ToolResult, ToolRiskLevel } from "./types.js";

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ExecutorCallbacks {
  onToolStarted?(call: ToolCall): void;
  onToolCompleted?(call: ToolCall, result: ToolResult): void;
  onApprovalRequired?(call: ToolCall, riskLevel: ToolRiskLevel): Promise<boolean>;
}

export async function executeToolCall(
  registry: ToolRegistry,
  call: ToolCall,
  callbacks: ExecutorCallbacks = {},
  sessionApprovedTools?: Set<string>,
): Promise<ToolResult> {
  const tool = registry.get(call.name);
  if (!tool) {
    return { ok: false, error: `Unknown tool: ${call.name}`, code: "UNKNOWN_TOOL" };
  }

  // Check if approval is needed
  const needsApproval =
    tool.riskLevel !== "low" &&
    !sessionApprovedTools?.has(tool.name);

  if (needsApproval && callbacks.onApprovalRequired) {
    const approved = await callbacks.onApprovalRequired(call, tool.riskLevel);
    if (!approved) {
      return { ok: false, error: "Tool execution denied by user", code: "DENIED" };
    }
  }

  callbacks.onToolStarted?.(call);

  try {
    const result = await tool.execute(call.args);
    callbacks.onToolCompleted?.(call, result);
    return result;
  } catch (err) {
    const result: ToolResult = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      code: "EXECUTION_ERROR",
    };
    callbacks.onToolCompleted?.(call, result);
    return result;
  }
}
