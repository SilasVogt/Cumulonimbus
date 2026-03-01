import { describe, it, expect } from "bun:test";
import { join } from "node:path";
import { readTool } from "../../src/tools/read.js";
import { withTempDir } from "../helpers.js";

describe("read tool", () => {
  it("reads a full file with numbered lines", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.txt");
      await Bun.write(file, "line1\nline2\nline3\n");

      const result = await readTool.execute({ file_path: file });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.display).toContain("1\tline1");
      expect(result.display).toContain("2\tline2");
      expect(result.display).toContain("3\tline3");
    });
  });

  it("supports offset and limit", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.txt");
      await Bun.write(file, "a\nb\nc\nd\ne\n");

      const result = await readTool.execute({
        file_path: file,
        offset: 2,
        limit: 2,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.display).toContain("2\tb");
      expect(result.display).toContain("3\tc");
      expect(result.display).not.toContain("1\ta");
      expect(result.display).not.toContain("4\td");
    });
  });

  it("returns error for nonexistent file", async () => {
    const result = await readTool.execute({
      file_path: "/tmp/does-not-exist-12345.txt",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_FOUND");
  });

  it("handles empty file", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "empty.txt");
      await Bun.write(file, "");

      const result = await readTool.execute({ file_path: file });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.display).toContain("1\t");
    });
  });
});
