import { escapeRegExp } from "lodash-es"
import { fileURLToPath } from "node:url"
import lzString from "lz-string"
import { readFile } from "node:fs/promises"
import { resolve } from "import-meta-resolve"

const { compressToBase64 } = lzString

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
		{ compressors } = options
	return {
		name,
		setup(build) {
			build.onResolve({
				filter: new RegExp(`^${escapeRegExp(name)}:`, "u"),
			}, ({ path }) => ({
				path: fileURLToPath(resolve(
					path.slice(`${name}:`.length),
					import.meta.url,
				)),
			}))
			for (const { filter, namespace, loader, lazy } of compressors ?? []) {
				let callback
				switch (loader) {
					case "json":
						callback = async ({ path }) => {
							const data = JSON.stringify(JSON.parse(
								await readFile(path, { encoding: "utf-8" }),
							))
							return {
								contents:
									`import{decompressFromBase64 as dc}from"${name}:lz-string"
export default JSON.parse(dc(${jsString(compressToBase64(data))}))`,
								loader: "js",
							}
						}
						break
					case "text":
						callback = async ({ path }) => {
							const data = await readFile(path, { encoding: "utf-8" })
							return {
								contents:
									`import{decompressFromBase64 as dc}from"${name}:lz-string"
export default dc(${jsString(compressToBase64(data))})`,
								loader: "js",
							}
						}
						break
					default:
						throw new Error(loader)
				}
				if (lazy) {
					const callback2 = callback
					callback = async (...args) => {
						const ret = await callback2(...args)
						if (lazy) { ret.contents = makeDefaultLazy(name, ret.contents) }
						return ret
					}
				}
				build.onLoad({ filter, namespace }, callback)
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

/**
 * Make the default export lazy.
 * 
 * @param {string} namespace import namespace
 * @param {string} code code with a default export
 * @returns code with a lazy default export
 */
function makeDefaultLazy(namespace, code) {
	return `import PL from"${namespace}:p-lazy"
${code.replace("export default", "export default PL.from(()=>(")}))`
}
