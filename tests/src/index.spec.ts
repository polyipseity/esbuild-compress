import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { decompressFromBase64 } from "lz-string";
import esbuildCompress from "../../src/index.js";
import { createPluginBuildStub } from "../support/helpers";
import type { OnLoadArgs, OnLoadResult } from "esbuild";

type OnLoadHandler = (
  args: OnLoadArgs,
) => OnLoadResult | null | undefined | Promise<OnLoadResult | null | undefined>;
type OnLoadOptions = { filter: RegExp; namespace?: string };

describe("src/index.js", () => {
  it("throws for unknown loader", () => {
    const plugin = esbuildCompress({
      compressors: [
        {
          filter: /./,
          // @ts-expect-error - intentionally invalid loader to test error handling
          loader: "bad-loader",
        },
      ],
    });
    // Minimal build stub to satisfy onResolve registration
    const build = createPluginBuildStub();
    build.onResolve = () => {};
    expect(() => plugin.setup(build)).toThrow("bad-loader");
  });

  it("encodes and decodes text files (handles special chars)", async () => {
    const fixture = fileURLToPath(
      new globalThis.URL("./fixtures/special.txt", import.meta.url),
    );
    const original = fs.readFileSync(fixture, "utf8");

    const plugin = esbuildCompress({
      compressors: [
        {
          filter: /special\.txt$/,
          loader: "text",
        },
      ],
    });

    // let onLoadOpts;
    let onLoadHandler!: OnLoadHandler;
    const build = createPluginBuildStub();
    build.onResolve = () => {};
    build.onLoad = (opts, handler) => {
      onLoadHandler = handler;
    };

    plugin.setup(build);
    expect(onLoadHandler).toBeTypeOf("function");
    const result = await onLoadHandler({
      path: fixture,
      namespace: "",
      suffix: "",
      pluginData: undefined,
      with: {},
    });
    expect(result).toBeTruthy();
    if (!result) throw new Error("onLoad returned undefined");
    expect(result.loader).toBe("js");
    if (typeof result.contents !== "string")
      throw new Error("expected string contents");
    // extract base64 payload from dc(`...`)
    const m = result.contents.match(/dc\(`([^`]*)`\)/);
    expect(m).toBeTruthy();
    if (!m) throw new Error("payload not found");
    const base64 = m[1];
    expect(decompressFromBase64(base64)).toBe(original);
  });

  it("wraps default export when lazy=true", async () => {
    const fixture = fileURLToPath(
      new globalThis.URL("./fixtures/special.txt", import.meta.url),
    );

    const plugin = esbuildCompress({
      compressors: [
        {
          filter: /special\.txt$/,
          loader: "text",
          lazy: true,
        },
      ],
    });

    let onLoadHandler!: OnLoadHandler;
    const build = createPluginBuildStub();
    build.onResolve = () => {};
    build.onLoad = (opts, handler) => {
      onLoadHandler = handler;
    };

    plugin.setup(build);
    const result = await onLoadHandler({
      path: fixture,
      namespace: "",
      suffix: "",
      pluginData: undefined,
      with: {},
    });
    if (!result) throw new Error("onLoad returned undefined");
    if (typeof result.contents !== "string")
      throw new Error("expected string contents");
    expect(result.contents).toContain('import PL from"compress:p-lazy"');
    expect(result.contents).toContain("PL.from(()=>(");
    expect(result.loader).toBe("js");
  });

  it("normalizes JSON before compression (loader=json)", async () => {
    const fixture = fileURLToPath(
      new globalThis.URL("./fixtures/sample.json", import.meta.url),
    );
    const original = fs.readFileSync(fixture, "utf8");

    const plugin = esbuildCompress({
      compressors: [
        {
          filter: /sample\.json$/,
          loader: "json",
        },
      ],
    });

    let onLoadHandler!: OnLoadHandler;
    const build = createPluginBuildStub();
    build.onResolve = () => {};
    build.onLoad = (opts, handler) => (onLoadHandler = handler);

    plugin.setup(build);
    const result = await onLoadHandler({
      path: fixture,
      namespace: "",
      suffix: "",
      pluginData: undefined,
      with: {},
    });
    if (!result) throw new Error("onLoad returned undefined");
    if (typeof result.contents !== "string")
      throw new Error("expected string contents");
    const m = result.contents.match(/dc\(`([^`]*)`\)/);
    expect(m).toBeTruthy();
    if (!m) throw new Error("payload not found");
    const base64 = m[1];
    // The plugin JSON.stringify(JSON.parse(data)) makes spacing consistent
    expect(JSON.parse(decompressFromBase64(base64))).toEqual(
      JSON.parse(original),
    );
  });

  it("registers onLoad with namespace when provided", () => {
    const plugin = esbuildCompress({
      compressors: [
        {
          filter: /sample\.json$/,
          loader: "json",
          namespace: "custom-ns",
        },
      ],
    });

    let onLoadOpts: OnLoadOptions | undefined;
    const build = createPluginBuildStub();
    build.onResolve = () => {};
    build.onLoad = (opts) => (onLoadOpts = opts);

    plugin.setup(build);
    expect(onLoadOpts).toBeDefined();
    if (!onLoadOpts) throw new Error("onLoadOpts missing");
    expect(onLoadOpts.namespace).toBe("custom-ns");
    expect(onLoadOpts.filter).toBeInstanceOf(RegExp);
  });
});
