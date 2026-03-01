import { describe, it, expect } from "bun:test";
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { lsTool } from "../../src/tools/ls.js";
import { withTempDir } from "../helpers.js";

describe("ls tool", () => {
  it("lists directory contents", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, "file.txt"), "");
      await mkdir(join(dir, "subdir"));

      const result = await lsTool.execute({ path: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.display).toContain("subdir/");
      expect(result.display).toContain("file.txt");
    });
  });

  it("filters hidden files by default", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, ".hidden"), "");
      await writeFile(join(dir, "visible.txt"), "");

      const result = await lsTool.execute({ path: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.display).not.toContain(".hidden");
      expect(result.display).toContain("visible.txt");
    });
  });

  it("shows hidden files when requested", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, ".hidden"), "");
      await writeFile(join(dir, "visible.txt"), "");

      const result = await lsTool.execute({ path: dir, show_hidden: true });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.display).toContain(".hidden");
    });
  });

  it("handles empty directory", async () => {
    await withTempDir(async (dir) => {
      const result = await lsTool.execute({ path: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.display).toBe("");
    });
  });

  it("errors for nonexistent path", async () => {
    const result = await lsTool.execute({ path: "/tmp/nonexistent-dir-12345" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_FOUND");
  });

  it("sorts directories first", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, "zebra.txt"), "");
      await mkdir(join(dir, "alpha"));
      await writeFile(join(dir, "apple.txt"), "");

      const result = await lsTool.execute({ path: dir });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const lines = result.display.split("\n");
      expect(lines[0]).toBe("alpha/");
      expect(lines[1]).toBe("apple.txt");
      expect(lines[2]).toBe("zebra.txt");
    });
  });
});
