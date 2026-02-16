/**
 * Tests for small test utilities in `tests/helpers.ts` — keep these fast and explicit.
 */
import { describe, it, expect } from "vitest";
import { tick, createPluginBuildStub } from "./helpers.js";

describe("tests/helpers.ts utilities", () => {
  it("tick waits for next macrotask (setImmediate)", async () => {
    let called = false;
    setImmediate(() => {
      called = true;
    });

    // not yet executed synchronously
    expect(called).toBe(false);

    // tick() resolves after the next macrotask (setImmediate)
    await tick();
    expect(called).toBe(true);
  });

  it("createPluginBuildStub returns a PluginBuild-like stub with expected hooks", () => {
    const build = createPluginBuildStub();

    expect(typeof build.onResolve).toBe("function");
    expect(typeof build.onLoad).toBe("function");
    expect(typeof build.onStart).toBe("function");
    expect(typeof build.onEnd).toBe("function");
    expect(typeof build.onDispose).toBe("function");
    expect(typeof build.resolve).toBe("function");
    expect(build.esbuild).toBeDefined();
  });

  it("resolve() returns a ResolveResult with the same path and arrays for errors/warnings", async () => {
    const build = createPluginBuildStub();
    const rr = await build.resolve("some/path.js");

    expect(rr.path).toBe("some/path.js");
    expect(Array.isArray(rr.errors)).toBe(true);
    expect(Array.isArray(rr.warnings)).toBe(true);
  });

  it("esbuild.transform / transformSync return results matching input", async () => {
    const build = createPluginBuildStub();

    const t = await build.esbuild.transform("console.log(1)");
    expect(t.code).toBe("console.log(1)");

    const ts = build.esbuild.transformSync("a+b");
    expect(ts.code).toBe("a+b");
  });

  it("esbuild.build and context produce BuildResult/BuildContext-shaped values", async () => {
    const build = createPluginBuildStub();

    const res = await build.esbuild.build({});
    expect(Array.isArray(res.errors)).toBe(true);
    expect(Array.isArray(res.warnings)).toBe(true);

    const ctx = await build.esbuild.context({});
    const rebuilt = await ctx.rebuild();
    expect(Array.isArray(rebuilt.outputFiles)).toBe(true);
  });

  it("onStart handlers are registered and run when triggered (supports async returns)", async () => {
    const build = createPluginBuildStub();

    let called = false;
    build.onStart(async () => {
      called = true;
      return { warnings: [{ text: "stub" }] };
    });

    // handlers are stored on registration — they run when triggered
    const results = await build.triggerOnStart();

    expect(called).toBe(true);
    expect(Array.isArray(results)).toBe(true);
    expect(results[0]).toBeDefined();
    expect(results[0] && Array.isArray(results[0].warnings)).toBe(true);
  });
});
