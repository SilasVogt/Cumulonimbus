import type { ToolDefinition } from "./types.js";

export class ToolRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tools = new Map<string, ToolDefinition<any>>();

  register(tool: ToolDefinition<any>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getOrThrow(name: string): ToolDefinition {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }
    return tool;
  }

  all(): ToolDefinition[] {
    return [...this.tools.values()];
  }

  names(): string[] {
    return [...this.tools.keys()];
  }
}
