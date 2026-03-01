import { describe, it, expect } from "bun:test";
import { join } from "node:path";
import { editTool } from "../../src/tools/edit.js";
import { withTempDir } from "../helpers.js";

describe("edit tool", () => {
  it("replaces a unique match", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.ts");
      await Bun.write(file, 'const port = 3000;\nconsole.log("hi");\n');

      const result = await editTool.execute({
        file_path: file,
        old_string: "const port = 3000;",
        new_string: "const port = 8080;",
      });
      expect(result.ok).toBe(true);
      const content = await Bun.file(file).text();
      expect(content).toContain("const port = 8080;");
      expect(content).not.toContain("const port = 3000;");
    });
  });

  it("errors on ambiguous match", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.ts");
      await Bun.write(file, "foo\nfoo\nbar\n");

      const result = await editTool.execute({
        file_path: file,
        old_string: "foo",
        new_string: "baz",
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe("AMBIGUOUS_MATCH");
    });
  });

  it("errors when string not found", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.ts");
      await Bun.write(file, "hello world\n");

      const result = await editTool.execute({
        file_path: file,
        old_string: "not here",
        new_string: "nope",
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe("NOT_FOUND");
    });
  });

  it("errors on empty old_string", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.ts");
      await Bun.write(file, "hello world\n");

      const result = await editTool.execute({
        file_path: file,
        old_string: "",
        new_string: "something",
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe("INVALID_INPUT");
    });
  });

  it("errors when file does not exist", async () => {
    const result = await editTool.execute({
      file_path: "/tmp/nonexistent-edit-test-12345.ts",
      old_string: "foo",
      new_string: "bar",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_FOUND");
  });

  it("replaces all with replace_all flag", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "test.ts");
      await Bun.write(file, "foo bar foo baz foo\n");

      const result = await editTool.execute({
        file_path: file,
        old_string: "foo",
        new_string: "qux",
        replace_all: true,
      });
      expect(result.ok).toBe(true);
      const content = await Bun.file(file).text();
      expect(content).toBe("qux bar qux baz qux\n");
    });
  });
});
