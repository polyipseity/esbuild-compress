# esbuild-compress

[esbuild]: https://esbuild.github.io

Plugin for [esbuild] that compresses embedded data, which will be decompressed at runtime, to reduce bundle size.

## Usage

- Configuration:
```JavaScript
import { build } from "esbuild"
import esbuildCompress from "esbuild-compress"
import myBuildOptions from "./my-build-options.mjs"

await build({
	...myBuildOptions,
	loader: {
		".json": "compressed-json",
		".txt": "compressed-text",
	},
	plugins: [
		esbuildCompress({
			// see plugin options
			lazy: true,
		}),
	],
})
```
- Usage:
```JavaScript
import json from "./example.json"
import text0 from "./example.txt"

const text = await text0 // unnecessary if `lazy` is `false`

consumeJSON(json.key)
consumeText(text)
```
