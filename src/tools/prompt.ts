import type { ToolRegistry } from "./registry.js";
import type { ToolParameterDoc } from "./types.js";

function paramTypeToJsonSchema(type: ToolParameterDoc["type"]): object {
  switch (type) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "string[]":
      return { type: "array", items: { type: "string" } };
  }
}

export function generateToolPrompt(registry: ToolRegistry): string {
  const tools = registry.all();
  const sections: string[] = [];

  sections.push("# Available Tools\n");

  for (const tool of tools) {
    sections.push(`## ${tool.displayName} (\`${tool.name}\`)\n`);
    sections.push(`${tool.doc.description}\n`);

    if (tool.doc.parameters.length > 0) {
      sections.push("**Parameters:**\n");
      for (const param of tool.doc.parameters) {
        const req = param.required ? "(required)" : "(optional)";
        const def = param.default ? ` [default: ${param.default}]` : "";
        sections.push(
          `- \`${param.name}\` (${param.type}) ${req}${def}: ${param.description}`,
        );
      }
      sections.push("");
    }

    if (tool.doc.examples.length > 0) {
      sections.push("**Examples:**\n");
      for (const example of tool.doc.examples) {
        sections.push(`- ${example.title}: \`${JSON.stringify(example.args)}\``);
      }
      sections.push("");
    }
  }

  return sections.join("\n");
}

interface ToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, object>;
    required: string[];
  };
}

export function generateToolSchemas(registry: ToolRegistry): ToolSchema[] {
  return registry.all().map((tool) => {
    const properties: Record<string, object> = {};
    const required: string[] = [];

    for (const param of tool.doc.parameters) {
      properties[param.name] = {
        ...paramTypeToJsonSchema(param.type),
        description: param.description,
      };
      if (param.required) {
        required.push(param.name);
      }
    }

    return {
      name: tool.name,
      description: tool.doc.description,
      input_schema: {
        type: "object" as const,
        properties,
        required,
      },
    };
  });
}
