import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import lzString from "lz-string";
import esbuildCompress from "../index.js";

const { decompressFromBase64 } = lzString;

describe("index.js", () => {
  it("throws for unknown loader", () => {
    const plugin = esbuildCompress({
      compressors: [
        {
          filter: /./,
          loader: "bad-loader",
        },
      ],
    });
    // Minimal build stub to satisfy onResolve registration
    const build = { onResolve: () => {} };
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
    let onLoadHandler;
    const build = {
      onResolve: () => {},
      onLoad: (opts, handler) => {
        // onLoadOpts = opts;
        onLoadHandler = handler;
      },
    };

    plugin.setup(build);
    expect(onLoadHandler).toBeTypeOf("function");
    const result = await onLoadHandler({ path: fixture });

    expect(result).toBeTruthy();
    expect(result.loader).toBe("js");
    // extract base64 payload from dc(`...`)
    const m = result.contents.match(/dc\(`([^`]*)`\)/);
    expect(m).toBeTruthy();
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

    let onLoadHandler;
    const build = {
      onResolve: () => {},
      onLoad: (opts, handler) => {
        onLoadHandler = handler;
      },
    };

    plugin.setup(build);
    const result = await onLoadHandler({ path: fixture });
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

    let onLoadHandler;
    const build = {
      onResolve: () => {},
      onLoad: (opts, handler) => (onLoadHandler = handler),
    };

    plugin.setup(build);
    const result = await onLoadHandler({ path: fixture });
    const m = result.contents.match(/dc\(`([^`]*)`\)/);
    expect(m).toBeTruthy();
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

    let onLoadOpts;
    const build = {
      onResolve: () => {},
      onLoad: (opts) => (onLoadOpts = opts),
    };

    plugin.setup(build);
    expect(onLoadOpts).toBeDefined();
    expect(onLoadOpts.namespace).toBe("custom-ns");
    expect(onLoadOpts.filter).toBeInstanceOf(RegExp);
  });
});
