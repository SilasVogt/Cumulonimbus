import { describe, it, expect } from "bun:test";
import { createDefaultRegistry } from "../../src/tools/index.js";
import {
  generateToolPrompt,
  generateToolSchemas,
} from "../../src/tools/prompt.js";

describe("generateToolPrompt", () => {
  it("includes all tool names", () => {
    const registry = createDefaultRegistry();
    const prompt = generateToolPrompt(registry);

    for (const name of registry.names()) {
      expect(prompt).toContain(`\`${name}\``);
    }
  });

  it("includes parameter documentation", () => {
    const registry = createDefaultRegistry();
    const prompt = generateToolPrompt(registry);

    expect(prompt).toContain("file_path");
    expect(prompt).toContain("(required)");
  });
});

describe("generateToolSchemas", () => {
  it("generates valid schemas for all tools", () => {
    const registry = createDefaultRegistry();
    const schemas = generateToolSchemas(registry);

    expect(schemas).toHaveLength(registry.names().length);

    for (const schema of schemas) {
      expect(schema).toHaveProperty("name");
      expect(schema).toHaveProperty("description");
      expect(schema).toHaveProperty("input_schema");
      expect(schema.input_schema.type).toBe("object");
      expect(schema.input_schema).toHaveProperty("properties");
      expect(schema.input_schema).toHaveProperty("required");
      expect(Array.isArray(schema.input_schema.required)).toBe(true);
    }
  });

  it("has correct required params for read tool", () => {
    const registry = createDefaultRegistry();
    const schemas = generateToolSchemas(registry);
    const readSchema = schemas.find((s) => s.name === "read")!;

    expect(readSchema.input_schema.required).toContain("file_path");
    expect(readSchema.input_schema.required).not.toContain("offset");
    expect(readSchema.input_schema.required).not.toContain("limit");
  });
});
