---
"esbuild-compress": minor
---

Simplify internal logic in `index.js`: always ensure callback
`contents` are made lazy by default and append '.js' to file paths
explicitly when required. This prepares the codebase for future
loader variations and clarifies intent.
