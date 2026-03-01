// ── Tool System Core Types ──────────────────────────────────────────────────

export interface ToolParameterDoc {
  name: string;
  type: "string" | "number" | "boolean" | "string[]";
  required: boolean;
  description: string;
  default?: string;
}

export interface ToolExample {
  title: string;
  args: Record<string, unknown>;
}

export interface ToolDoc {
  description: string;
  parameters: readonly ToolParameterDoc[];
  examples: readonly ToolExample[];
}

export type ToolResult =
  | { ok: true; data: unknown; display: string }
  | { ok: false; error: string; code?: string };

export type ToolRiskLevel = "low" | "medium" | "high";

export interface ToolDefinition<TArgs = Record<string, unknown>> {
  name: string;
  displayName: string;
  riskLevel: ToolRiskLevel;
  doc: ToolDoc;
  execute(args: TArgs): Promise<ToolResult>;
}
