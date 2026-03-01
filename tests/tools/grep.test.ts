import { describe, it, expect } from "bun:test";
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { grepTool } from "../../src/tools/grep.js";
import { withTempDir } from "../helpers.js";

describe("grep tool", () => {
  it("searches a single file", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.ts");
      await writeFile(file, "function hello() {}\nconst x = 1;\nfunction bye() {}\n");

      const result = await grepTool.execute({
        pattern: "function",
        path: file,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const data = result.data as { matches: { line: number }[] };
      expect(data.matches).toHaveLength(2);
      expect(data.matches[0].line).toBe(1);
      expect(data.matches[1].line).toBe(3);
    });
  });

  it("searches a directory recursively", async () => {
    await withTempDir(async (dir) => {
      await mkdir(join(dir, "sub"));
      await writeFile(join(dir, "a.ts"), "hello world\n");
      await writeFile(join(dir, "sub", "b.ts"), "hello again\ngoodbye\n");

      const result = await grepTool.execute({
        pattern: "hello",
        path: dir,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const data = result.data as { matches: { file: string }[] };
      expect(data.matches).toHaveLength(2);
    });
  });

  it("filters with glob_filter", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, "a.ts"), "hello\n");
      await writeFile(join(dir, "b.js"), "hello\n");

      const result = await grepTool.execute({
        pattern: "hello",
        path: dir,
        glob_filter: "*.ts",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const data = result.data as { matches: { file: string }[] };
      expect(data.matches).toHaveLength(1);
      expect(data.matches[0].file).toContain("a.ts");
    });
  });

  it("supports case insensitive search", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.txt");
      await writeFile(file, "Hello\nhello\nHELLO\n");

      const result = await grepTool.execute({
        pattern: "hello",
        path: file,
        case_insensitive: true,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const data = result.data as { matches: unknown[] };
      expect(data.matches).toHaveLength(3);
    });
  });

  it("includes context lines", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.txt");
      await writeFile(file, "before\ntarget\nafter\n");

      const result = await grepTool.execute({
        pattern: "target",
        path: file,
        context_lines: 1,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.display).toContain("before");
      expect(result.display).toContain("target");
      expect(result.display).toContain("after");
    });
  });

  it("handles no matches", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.txt");
      await writeFile(file, "nothing here\n");

      const result = await grepTool.execute({
        pattern: "xyz123",
        path: file,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const data = result.data as { matches: unknown[] };
      expect(data.matches).toHaveLength(0);
    });
  });

  it("errors on invalid regex", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.txt");
      await writeFile(file, "test\n");

      const result = await grepTool.execute({
        pattern: "[invalid",
        path: file,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe("INVALID_REGEX");
    });
  });
});
