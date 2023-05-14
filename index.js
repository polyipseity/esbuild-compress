import lzString from "lz-string"

/**
 * @typedef {object} Options
 * @property {boolean=} lazy whether decompression is lazy
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
	return {
		name: "compress",
		setup(build) {
			function str(string) {
				if (typeof string !== "string") {
					throw new TypeError(string)
				}
				return `\`${string.replace(/(?<char>`|\\|\$)/ug, "\\$<char>")}\``
			}
			const loaders = build.initialOptions.loader ?? {}
			for (const [ext, loader] of Object.entries(loaders)) {
				const filter = () => new RegExp(`${escapeRegExp(ext)}$`, "u")
				if (loader === "compressed-text") {
					build.onLoad({ filter: filter() }, async ({ path }) => {
						const data = await readFile(path, { encoding: "utf-8" })
						return {
							contents: options.lazy ? `
import PLazy from "p-lazy"
import { decompressFromBase64 as decompress } from "lz-string"
export default PLazy.from(() =>
	decompress(${str(lzString.compressToBase64(data))}))
` : `
import { decompressFromBase64 as decompress } from "lz-string"
export default decompress(${str(lzString.compressToBase64(data))})
`,
							loader: "js",
						}
					})
				} else if (loader === "compressed-json") {
					build.onLoad({ filter: filter() }, async ({ path }) => {
						const data = await readFile(path, { encoding: "utf-8" })
						JSON.parse(data)
						return {
							contents: `
import { decompressFromBase64 as decompress } from "lz-string"
export default JSON.parse(decompress(${str(lzString.compressToBase64(data))}))
`,
							loader: "js",
						}
					})
				} else {
					continue
				}
				loaders[ext] = "empty"
			}
		},
	}
}
