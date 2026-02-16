/**
 * tests/helpers.ts
 *
 * Lightweight, documented test helpers used across unit tests.
 * Goals:
 *  - Reduce duplication by centralizing mock creation
 *  - Provide strongly typed factories to avoid `as` casts in individual tests
 *  - Keep implementations minimal and easy to stub / spy on
 */

import type {
  PluginBuild,
  OnResolveOptions,
  OnResolveArgs,
  OnResolveResult,
  OnLoadOptions,
  OnLoadArgs,
  OnLoadResult,
  OnStartResult,
  BuildOptions,
  BuildResult,
  BuildContext,
  TransformOptions,
  TransformResult,
  PartialMessage,
  FormatMessagesOptions,
  Metafile,
  AnalyzeMetafileOptions,
  InitializeOptions,
  WatchOptions,
  ServeResult,
  ServeOptions,
} from "esbuild";

/**
 * Wait for the next macrotask tick — useful to await scheduled IIFEs or setImmediate usage
 * in the library code under test.
 */
export function tick(): Promise<void> {
  return new Promise((r) => setImmediate(r));
}

/**
 * Create a minimal, strongly-typed PluginBuild stub for tests.
 * Tests override the specific hook implementations they need.
 */
export function createPluginBuildStub(): PluginBuild & {
  triggerOnStart: () => Promise<Array<OnStartResult | null | void>>;
} {
  const onStartHandlers: Array<
    () => OnStartResult | null | void | Promise<OnStartResult | null | void>
  > = [];

  const stub: PluginBuild = {
    initialOptions: {},
    onStart: (handler) => {
      // store handlers (do not execute on registration — matches esbuild semantics)
      onStartHandlers.push(handler);
    },
    onResolve: (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _opts: OnResolveOptions,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _handler: (args: OnResolveArgs) => OnResolveResult | null | undefined,
    ) => {
      // no-op; tests will replace this on the returned object when needed
    },
    onLoad: (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _opts: OnLoadOptions,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _handler: (args: OnLoadArgs) => OnLoadResult | null | undefined,
    ) => {
      // no-op; tests will replace this on the returned object when needed
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onEnd: (_handler) => {
      // no-op; tests will replace this on the returned object when needed
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDispose: (_cb: () => void) => {
      // no-op
    },
    resolve: async (path: string) => ({
      errors: [],
      warnings: [],
      path,
      external: false,
      sideEffects: false,
      namespace: "",
      suffix: "",
      pluginData: undefined,
    }),
    esbuild: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: async (_options: BuildOptions) => {
        const ctx: BuildContext = {
          async rebuild() {
            const res: BuildResult = {
              errors: [],
              warnings: [],
              outputFiles: [],
              metafile: undefined,
              mangleCache: {},
            };
            return res;
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          async watch(_options?: WatchOptions) {
            return;
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          async serve(_options?: ServeOptions) {
            const res: ServeResult = { port: 0, hosts: [] };
            return res;
          },
          async cancel() {},
          async dispose() {},
        };
        return ctx;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async build(_options: BuildOptions) {
        const res: BuildResult = {
          errors: [],
          warnings: [],
          outputFiles: [],
          metafile: undefined,
          mangleCache: {},
        };
        return res;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      buildSync(_options: BuildOptions) {
        const res: BuildResult = {
          errors: [],
          warnings: [],
          outputFiles: [],
          metafile: undefined,
          mangleCache: {},
        };
        return res;
      },
      async transform(
        input: string | Uint8Array,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options?: TransformOptions,
      ) {
        const code =
          typeof input === "string" ? input : new TextDecoder().decode(input);
        const res: TransformResult = {
          code,
          map: "",
          warnings: [],
          mangleCache: {},
          legalComments: "",
        };
        return res;
      },
      transformSync(
        input: string | Uint8Array,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options?: TransformOptions,
      ) {
        const code =
          typeof input === "string" ? input : new TextDecoder().decode(input);
        const res: TransformResult = {
          code,
          map: "",
          warnings: [],
          mangleCache: {},
          legalComments: "",
        };
        return res;
      },
      async formatMessages(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _messages: PartialMessage[],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options: FormatMessagesOptions,
      ) {
        return [];
      },
      formatMessagesSync(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _messages: PartialMessage[],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options: FormatMessagesOptions,
      ) {
        return [];
      },
      async analyzeMetafile(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _metafile: Metafile | string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options?: AnalyzeMetafileOptions,
      ) {
        return "";
      },
      analyzeMetafileSync(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _metafile: Metafile | string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options?: AnalyzeMetafileOptions,
      ) {
        return "";
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async initialize(_options?: InitializeOptions) {},
      version: "0.0.0",
    },
  };

  const extended = Object.assign(stub, {
    async triggerOnStart() {
      const results = await Promise.all(
        onStartHandlers.map((h) => Promise.resolve(h())),
      );
      return results;
    },
  });

  return extended;
}
