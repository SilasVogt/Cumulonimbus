import { describe, it, expect } from "bun:test";
import { ToolRegistry } from "../../src/tools/registry.js";
import type { ToolDefinition, ToolResult } from "../../src/tools/types.js";

function makeTool(name: string): ToolDefinition {
  return {
    name,
    displayName: name,
    riskLevel: "low",
    doc: { description: `${name} tool`, parameters: [], examples: [] },
    async execute(): Promise<ToolResult> {
      return { ok: true, data: null, display: "" };
    },
  };
}

describe("ToolRegistry", () => {
  it("registers and retrieves a tool", () => {
    const reg = new ToolRegistry();
    const tool = makeTool("test");
    reg.register(tool);
    expect(reg.get("test")).toBe(tool);
  });

  it("returns undefined for unknown tool", () => {
    const reg = new ToolRegistry();
    expect(reg.get("nope")).toBeUndefined();
  });

  it("getOrThrow throws for unknown tool", () => {
    const reg = new ToolRegistry();
    expect(() => reg.getOrThrow("nope")).toThrow('Tool "nope" not found');
  });

  it("throws on duplicate registration", () => {
    const reg = new ToolRegistry();
    reg.register(makeTool("dup"));
    expect(() => reg.register(makeTool("dup"))).toThrow(
      'Tool "dup" is already registered',
    );
  });

  it("all() returns all registered tools", () => {
    const reg = new ToolRegistry();
    reg.register(makeTool("a"));
    reg.register(makeTool("b"));
    expect(reg.all()).toHaveLength(2);
  });

  it("names() returns all tool names", () => {
    const reg = new ToolRegistry();
    reg.register(makeTool("x"));
    reg.register(makeTool("y"));
    expect(reg.names()).toEqual(["x", "y"]);
  });
});
