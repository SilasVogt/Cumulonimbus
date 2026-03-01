export type {
  ToolParameterDoc,
  ToolExample,
  ToolDoc,
  ToolResult,
  ToolRiskLevel,
  ToolDefinition,
} from "./types.js";

export { ToolRegistry } from "./registry.js";
export { readTool } from "./read.js";
export { writeTool } from "./write.js";
export { editTool } from "./edit.js";
export { lsTool } from "./ls.js";
export { globTool } from "./glob.js";
export { grepTool } from "./grep.js";
export { bashTool, getBackgroundProcesses } from "./bash.js";
export { generateToolPrompt, generateToolSchemas } from "./prompt.js";
export { executeToolCall } from "./executor.js";
export type { ToolCall, ExecutorCallbacks } from "./executor.js";

import { ToolRegistry } from "./registry.js";
import { readTool } from "./read.js";
import { writeTool } from "./write.js";
import { editTool } from "./edit.js";
import { lsTool } from "./ls.js";
import { globTool } from "./glob.js";
import { grepTool } from "./grep.js";
import { bashTool } from "./bash.js";

export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(readTool);
  registry.register(writeTool);
  registry.register(editTool);
  registry.register(lsTool);
  registry.register(globTool);
  registry.register(grepTool);
  registry.register(bashTool);
  return registry;
}
