import { suite, test, expect } from "vitest";
import fs from "node:fs";
import { decompressFromBase64, compressToBase64 } from "lz-string";
import esbuildCompress from "../../src/index.js";
import { createPluginBuildStub } from "../support/helpers";
import type {
  OnResolveArgs,
  OnResolveResult,
  BuildResult,
  OutputFile as EsbuildOutputFile,
  OnEndResult,
} from "esbuild";

type OnResolveHandler = (
  args: OnResolveArgs,
) =>
  | OnResolveResult
  | null
  | undefined
  | Promise<OnResolveResult | null | undefined>;

type OutputFile = EsbuildOutputFile;

type OnEndHandler = (
  result: BuildResult,
) => void | OnEndResult | Promise<void | OnEndResult | null> | null;

suite("src/index.js", () => {
  test("onResolve resolves compress: specifiers to file paths", async () => {
    const plugin = esbuildCompress();

    let onResolveHandler!: OnResolveHandler;
    const build = createPluginBuildStub();
    build.onResolve = (opts, handler) => (onResolveHandler = handler);

    plugin.setup(build);
    expect(onResolveHandler).toBeTypeOf("function");

    const rr = await onResolveHandler({
      path: "compress:lz-string",
      importer: "",
      namespace: "",
      resolveDir: "",
      kind: "import-statement",
      pluginData: undefined,
      with: {},
    });
    if (!rr || !rr.path) throw new Error("resolve failed");
    const resolved = rr.path;
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

    let onEndHandler!: OnEndHandler;
    const build = createPluginBuildStub();
    build.onResolve = () => {};
    build.onEnd = (handler) => (onEndHandler = handler);

    plugin.setup(build);
    expect(onEndHandler).toBeTypeOf("function");

    const outputFiles: OutputFile[] = [
      {
        path: "dist/output.txt",
        contents: new Uint8Array(),
        hash: "",
        text: "hello world",
      },
    ];
    await onEndHandler({
      errors: [],
      warnings: [],
      outputFiles,
      metafile: undefined,
      mangleCache: {},
    });

    const file = outputFiles[0];
    // extension should have been appended with .js
    expect(file.path.endsWith(".js")).toBe(true);

    expect(file.contents).toBeDefined();
    if (!file.contents) throw new Error("file.contents is undefined");

    const m = new globalThis.TextDecoder()
      .decode(file.contents)
      .match(/dc\(`([^`]*)`\)/);
    expect(m).toBeTruthy();
    if (!m) throw new Error("regex did not match");
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

    let onEndHandler!: OnEndHandler;
    const build = createPluginBuildStub();
    build.onResolve = () => {};
    build.onEnd = (handler) => (onEndHandler = handler);

    plugin.setup(build);

    const outputFiles: OutputFile[] = [
      {
        path: "dist/output.js",
        contents: new Uint8Array(),
        hash: "",
        text: "hello world",
      },
    ];
    await onEndHandler({
      errors: [],
      warnings: [],
      outputFiles,
      metafile: undefined,
      mangleCache: {},
    });

    const file = outputFiles[0];
    // extension should NOT have been appended
    expect(file.path).toBe("dist/output.js");

    expect(file.contents).toBeDefined();
    if (!file.contents) throw new Error("file.contents is undefined");
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

    let onEndHandler!: OnEndHandler;
    const build = createPluginBuildStub();
    build.onResolve = () => {};
    build.onEnd = (handler) => (onEndHandler = handler);

    plugin.setup(build);
    expect(() =>
      onEndHandler({
        errors: [],
        warnings: [],
        outputFiles: undefined,
        metafile: undefined,
        mangleCache: {},
      }),
    ).not.toThrow();
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

    let onEndHandler!: OnEndHandler;
    const build = createPluginBuildStub();
    build.onResolve = () => {};
    build.onEnd = (handler) => (onEndHandler = handler);

    plugin.setup(build);

    const outputFiles: OutputFile[] = [
      {
        path: "dist/other.txt",
        contents: new Uint8Array(),
        hash: "",
        text: "should stay",
      },
    ];
    await onEndHandler({
      errors: [],
      warnings: [],
      outputFiles,
      metafile: undefined,
      mangleCache: {},
    });

    const file = outputFiles[0];
    expect(file.path).toBe("dist/other.txt");
    expect(file.contents).toStrictEqual(new Uint8Array());
  });
});
