import { describe, it, expect } from "bun:test";
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { globTool } from "../../src/tools/glob.js";
import { withTempDir } from "../helpers.js";

describe("glob tool", () => {
  it("matches files with a pattern", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, "a.ts"), "");
      await writeFile(join(dir, "b.ts"), "");
      await writeFile(join(dir, "c.js"), "");

      const result = await globTool.execute({ pattern: "*.ts", path: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const data = result.data as { matches: string[] };
      expect(data.matches).toContain("a.ts");
      expect(data.matches).toContain("b.ts");
      expect(data.matches).not.toContain("c.js");
    });
  });

  it("returns no matches gracefully", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, "file.txt"), "");

      const result = await globTool.execute({
        pattern: "*.xyz",
        path: dir,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const data = result.data as { matches: string[] };
      expect(data.matches).toHaveLength(0);
      expect(result.display).toBe("(no matches)");
    });
  });

  it("searches nested directories with **", async () => {
    await withTempDir(async (dir) => {
      await mkdir(join(dir, "sub"), { recursive: true });
      await writeFile(join(dir, "top.ts"), "");
      await writeFile(join(dir, "sub", "nested.ts"), "");

      const result = await globTool.execute({
        pattern: "**/*.ts",
        path: dir,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const data = result.data as { matches: string[] };
      expect(data.matches).toContain("top.ts");
      expect(data.matches).toContain("sub/nested.ts");
    });
  });
});
