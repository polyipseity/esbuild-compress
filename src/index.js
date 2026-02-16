import { escapeRegExp } from "lodash-es";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import lzString from "lz-string";
import { readFile } from "node:fs/promises";
import { resolve } from "import-meta-resolve";

const { compressToBase64 } = lzString;

/**
 * @typedef {object} Options
 * @property {readonly Compressor[]=} compressors
 */

/**
 * @typedef {object} Compressor
 * @property {RegExp} filter path filter
 * @property {string=} namespace namespace filter
 * @property {"json" | "text"} loader compression mode
 * @property {boolean=} lazy whether decompression is lazy
 * @property {boolean=} onEnd whether to compress on `onEnd`
 */

/**
 * Creates a compression plugin.
 *
 * Lazy decompression returns a {@link PromiseLike}.
 *
 * @param {Options} options plugin options
 * @returns {import("esbuild").Plugin} an esbuild plugin
 */
export default function esbuildCompress(options = {}) {
  const name = "compress",
    { compressors } = options;
  return {
    name,
    setup(build) {
      build.onResolve(
        {
          filter: new RegExp(`^${escapeRegExp(name)}:`), // https://github.com/evanw/esbuild/issues/4128
        },
        ({ path }) => ({
          path: fileURLToPath(
            resolve(path.slice(`${name}:`.length), import.meta.url),
          ),
        }),
      );
      for (const { filter, namespace, loader, lazy, onEnd } of compressors ??
        []) {
        let callback;
        switch (loader) {
          case "json":
            callback = (data) => {
              data = JSON.stringify(JSON.parse(data));
              return {
                contents: `import{decompressFromBase64 as dc}from"${name}:lz-string"
export default JSON.parse(dc(${jsString(compressToBase64(data))}))`,
                loader: "js",
              };
            };
            break;
          case "text":
            callback = (data) => ({
              contents: `import{decompressFromBase64 as dc}from"${name}:lz-string"
export default dc(${jsString(compressToBase64(data))})`,
              loader: "js",
            });
            break;
          default:
            throw new Error(loader);
        }
        if (lazy) {
          const callback2 = callback;
          callback = (...args) => {
            const ret = callback2(...args);
            ret.contents = makeDefaultLazy(name, ret.contents);
            return ret;
          };
        }
        if (onEnd) {
          build.onEnd(({ outputFiles }) => {
            for (const file of (outputFiles ?? []).filter(({ path }) =>
              filter.test(path),
            )) {
              const { contents } = callback(file.text);
              file.contents = new globalThis.TextEncoder().encode(contents);
              // We explicitly append '.js' here. Currently every callback returns
              // `loader: "js"`, so checking for '.js' is sufficient and avoids
              // a more complex expression. If in the future other `loader`
              // values (e.g. 'css') are supported, replace this check with
              // `if (extname(file.path) !== `.${loader ?? "js"}`) {` to preserve
              // the original intention and append the correct extension.
              if (extname(file.path) !== ".js") {
                file.path += ".js";
              }
            }
          });
        } else {
          build.onLoad({ filter, namespace }, async ({ path }) =>
            callback(await readFile(path, { encoding: "utf-8" })),
          );
        }
      }
    },
  };
}

/**
 * Escapes a string for embedding in JavaScript.
 *
 * @param {string} string a string
 * @returns {string} a JavaScript string
 */
function jsString(string) {
  return `\`${string.replace(/(?<char>`|\\|\$)/gu, "\\$<char>")}\``;
}

/**
 * Make the default export lazy.
 *
 * @param {string} namespace import namespace
 * @param {string} code code with a default export
 * @returns code with a lazy default export
 */
function makeDefaultLazy(namespace, code) {
  return `import PL from"${namespace}:p-lazy"
${code.replace("export default", "export default PL.from(()=>(")}))`;
}
