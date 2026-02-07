import { suite, test, expect } from "vitest";
import fs from "node:fs";
import lzString from "lz-string";
import esbuildCompress from "../index.js";

const { decompressFromBase64, compressToBase64 } = lzString;

suite("index.js", () => {
  test("onResolve resolves compress: specifiers to file paths", async () => {
    const plugin = esbuildCompress();

    let onResolveHandler;
    const build = {
      onResolve: (opts, handler) => (onResolveHandler = handler),
    };

    plugin.setup(build);
    expect(onResolveHandler).toBeTypeOf("function");

    const { path: resolved } = onResolveHandler({ path: "compress:lz-string" });
    expect(typeof resolved).toBe("string");
    expect(resolved).toContain("lz-string");
    expect(fs.existsSync(resolved)).toBe(true);
  });

  test("onEnd modifies outputFiles for compressors with onEnd=true", async () => {
    const plugin = esbuildCompress({
      compressors: [
        {
          filter: /output\.txt$/,
          loader: "text",
          onEnd: true,
        },
      ],
    });

    let onEndHandler;
    const build = {
      onResolve: () => {},
      onEnd: (handler) => (onEndHandler = handler),
    };

    plugin.setup(build);
    expect(onEndHandler).toBeTypeOf("function");

    const outputFiles = [{ path: "dist/output.txt", text: "hello world" }];
    await onEndHandler({ outputFiles });

    const file = outputFiles[0];
    // extension should have been appended with .js
    expect(file.path.endsWith(".js")).toBe(true);

    const m = new globalThis.TextDecoder()
      .decode(file.contents)
      .match(/dc\(`([^`]*)`\)/);
    expect(m).toBeTruthy();
    const base64 = m[1];

    expect(decompressFromBase64(base64)).toBe("hello world");
  });

  test("onEnd does not append when file already has .js extension", async () => {
    const plugin = esbuildCompress({
      compressors: [
        {
          filter: /output\.js$/,
          loader: "text",
          onEnd: true,
        },
      ],
    });

    let onEndHandler;
    const build = {
      onResolve: () => {},
      onEnd: (handler) => (onEndHandler = handler),
    };

    plugin.setup(build);

    const outputFiles = [{ path: "dist/output.js", text: "hello world" }];
    await onEndHandler({ outputFiles });

    const file = outputFiles[0];
    // extension should NOT have been appended
    expect(file.path).toBe("dist/output.js");

    const decoded = new globalThis.TextDecoder().decode(file.contents);
    expect(decoded).toContain(compressToBase64("hello world"));
  });

  test("onEnd handles undefined outputFiles gracefully", async () => {
    const plugin = esbuildCompress({
      compressors: [
        {
          filter: /./,
          loader: "text",
          onEnd: true,
        },
      ],
    });

    let onEndHandler;
    const build = {
      onResolve: () => {},
      onEnd: (handler) => (onEndHandler = handler),
    };

    plugin.setup(build);
    expect(() => onEndHandler({})).not.toThrow();
  });

  test("onEnd ignores files that don't match the filter", async () => {
    const plugin = esbuildCompress({
      compressors: [
        {
          filter: /output\.txt$/,
          loader: "text",
          onEnd: true,
        },
      ],
    });

    let onEndHandler;
    const build = {
      onResolve: () => {},
      onEnd: (handler) => (onEndHandler = handler),
    };

    plugin.setup(build);

    const outputFiles = [{ path: "dist/other.txt", text: "should stay" }];
    await onEndHandler({ outputFiles });

    const file = outputFiles[0];
    expect(file.path).toBe("dist/other.txt");
    expect(file.contents).toBeUndefined();
  });
});
