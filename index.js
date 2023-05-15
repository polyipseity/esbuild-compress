import { escapeRegExp } from "lodash-es"
import { fileURLToPath } from "node:url"
import lzString from "lz-string"
import { readFile } from "node:fs/promises"
import { resolve } from "import-meta-resolve"

const { compressToBase64 } = lzString

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
	const
		name = "compress",
		{ lazy } = options
	return {
		name,
		setup(build) {
			const
				{ initialOptions: { loader } } = build,
				loaders = loader ?? {}

			build.onResolve({
				filter: new RegExp(`^${escapeRegExp(name)}:`, "u"),
			}, ({ path }) => ({
				path: fileURLToPath(resolve(
					path.slice(`${name}:`.length),
					import.meta.url,
				)),
			}))

			for (const [ext, loader] of Object.entries(loaders)) {
				const filter = new RegExp(`${escapeRegExp(ext)}$`, "u")
				if (loader === "compressed-text") {
					build.onLoad({ filter }, async ({ path }) => {
						const data = await readFile(path, { encoding: "utf-8" })
						return {
							contents: lazy ? `
import PLazy from "${name}:p-lazy"
import { decompressFromBase64 as decompress } from "${name}:lz-string"
export default PLazy.from(() =>
	decompress(${jsString(compressToBase64(data))}))
` : `
import { decompressFromBase64 as decompress } from "${name}:lz-string"
export default decompress(${jsString(compressToBase64(data))})
`,
							loader: "js",
						}
					})
				} else if (loader === "compressed-json") {
					build.onLoad({ filter }, async ({ path }) => {
						const data = await readFile(path, { encoding: "utf-8" })
						JSON.parse(data)
						return {
							contents: `
import { decompressFromBase64 as decompress } from "${name}:lz-string"
export default JSON.parse(decompress(${jsString(compressToBase64(data))}))
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

/**
 * Escapes a string for embedding in JavaScript.
 * 
 * @param {string} string a string
 * @returns {string} a JavaScript string
 */
function jsString(string) {
	return `\`${string.replace(/(?<char>`|\\|\$)/ug, "\\$<char>")}\``
}
