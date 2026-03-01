import { describe, it, expect } from "bun:test";
import { join } from "node:path";
import { writeTool } from "../../src/tools/write.js";
import { withTempDir } from "../helpers.js";

describe("write tool", () => {
  it("creates a new file", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "new.txt");
      const result = await writeTool.execute({
        file_path: file,
        content: "hello world",
      });
      expect(result.ok).toBe(true);
      expect(await Bun.file(file).text()).toBe("hello world");
    });
  });

  it("overwrites an existing file", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "existing.txt");
      await Bun.write(file, "old content");

      const result = await writeTool.execute({
        file_path: file,
        content: "new content",
      });
      expect(result.ok).toBe(true);
      expect(await Bun.file(file).text()).toBe("new content");
    });
  });

  it("creates parent directories", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "a", "b", "c", "deep.txt");
      const result = await writeTool.execute({
        file_path: file,
        content: "deep",
      });
      expect(result.ok).toBe(true);
      expect(await Bun.file(file).text()).toBe("deep");
    });
  });

  it("handles empty content", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "empty.txt");
      const result = await writeTool.execute({
        file_path: file,
        content: "",
      });
      expect(result.ok).toBe(true);
      expect(await Bun.file(file).text()).toBe("");
    });
  });
});
