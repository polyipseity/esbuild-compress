# esbuild-compress <!-- markdownlint-disable-file MD024 -->

## 2.2.0

### Minor Changes

- e7507e6: Combine the changes introduced in commits
  `6bee4f40ab45f69b7a3849a470a0462acd4dd76b` and
  `f609431f41e57334bafbb1a4c81490d1833ea083`.

  These changes include small enhancements and fixes — bump package as a
  minor release.

### Patch Changes

- 0c33562: Update tests and test helpers. Small fixes and refactors to test code — bump patch version.

## 2.1.0

### Minor Changes

- c2d1104: Simplify internal logic in `index.js`: always ensure callback
  `contents` are made lazy by default and append '.js' to file paths
  explicitly when required. This prepares the codebase for future
  loader variations and clarifies intent.

### Patch Changes

- 0e0b498: Add tests covering text and JSON compression behavior, lazy
  export wrapping, onEnd handling, and resolver behavior. This
  improves coverage and documents expected plugin behavior.
- ca92761: Apply semicolons and consistent formatting to `index.js`.

  Add trailing newlines to `.changeset` and `.markdownlint.jsonc`."

  Minor cleanup: use `globalThis.TextEncoder` and rewrap lines.

## 2.0.2

### Patch Changes

- 5719d84: Fix "not a valid Go regular expression".

## 2.0.1

### Patch Changes

- 08b4791: Update dependencies

## 2.0.0

### Major Changes

- f233907: Change `Options`.

### Minor Changes

- acc3578: Add `onEnd` option.

### Patch Changes

- 62f607c: Downgrade esbuild version.

## 1.3.1

### Patch Changes

- 41acda8: Change peer dependency `esbuild` version.

## 1.3.0

### Minor Changes

- 703f4aa: Update dependencies and peer dependencies.
- e0b98e8: Minify JSON before compressing it.

### Patch Changes

- b7e266c: Use changesets.
- cbf5ffd: Improve documentation.
- 35f7aae: Use pnpm.
- 6209ca4: Create changelog.

## 1.2.2

## 1.2.1

## 1.2.0

## 1.1.5

## 1.1.4

## 1.1.3

## 1.1.2

## 1.1.1

## 1.1.0

## 1.0.0
