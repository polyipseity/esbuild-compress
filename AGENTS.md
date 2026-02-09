# AGENTS.md — AI Agent & Contributor Guide 🔧

This guide documents repository conventions, developer workflows, and instructions for AI agents and contributors working in the `esbuild-compress` codebase. This project is a small JavaScript package (entry: `index.js`) providing an esbuild compression plugin. **Localization is not used in this repository — do not add localization files.**

---

## 1. Architecture Overview 🏗️

- **Entry point:** `index.js` — exports the plugin API (default export) used by consumers.
- **Core concept:** The plugin compresses source files (JSON or text) into base64 payloads that are decompressed at runtime using `lz-string`.
- **Compressor shape:** A compressor is an object:
  - `filter: RegExp` — file path matcher
  - `namespace?: string` — optional namespace used for `onLoad`
  - `loader: "json" | "text"` — compression mode
  - `lazy?: boolean` — wrap default export with `p-lazy` for deferred decompression
  - `onEnd?: boolean` — if true, compression happens during `onEnd` for build output files
- **Key implementation notes:**
  - `json` loader normalizes JSON via `JSON.stringify(JSON.parse(data))` before compression.
  - `compress:` import namespace is resolved via `import-meta-resolve` in `onResolve` (e.g. `compress:lz-string`).
  - `onLoad` handlers return `{ contents, loader: 'js' }` containing an import of `decompressFromBase64` and a `dc(<payload>)` call.
  - `onEnd` mutates `outputFiles` entries and appends `.js` when the existing extension is not `.js` (see `extname` check in `index.js`).
  - `jsString` carefully escapes backticks, backslashes, and `$` for safe embedding in template literals.
  - `makeDefaultLazy` wraps a default export using `p-lazy` (see `import PL from "compress:p-lazy"`).
- **Dependencies & environment:** ESM package (`type: module`); uses `lz-string`, `p-lazy`, `import-meta-resolve`, and `lodash-es`.

---

## 2. Developer Workflows 🚀

- **Install:** `pnpm install` (preferred). Avoid running installs without explicit instruction from the repo owner or maintainer.
- **Prepare:** `pnpm run prepare` installs Husky hooks (`.husky/*`).
- **Build:** `pnpm run build` runs checks and a no-op message (the package ships `index.js` directly).
- **Test:** `pnpm test` runs the full test suite with coverage (`vitest run --coverage`). For interactive runs: `pnpm run test:watch`.
- **Format & lint:** `pnpm run format` / `pnpm run check`.

---

## 3. Scripts (quick reference) 📋

- `build` — runs checks then prints a message; no transpilation step.
- `check` — `check:eslint`, `check:md`, and `check:prettier`.
- `check:eslint` — `eslint --cache --max-warnings=0`.
- `check:md` — `markdownlint-cli2`.
- `check:prettier` — `prettier --cache --check "**/*.{astro,cjs,css,csv,gql,graphql,hbs,html,js,jsx,json,json5,jsonc,jsonl,less,mjs,pcss,sass,scss,svelte,styl,ts,tsx,vue,xml,yaml,yml}"`.
- `format` — runs fixers and formatters.
- `prepare` — `husky`.
- `test` — `pnpm run test:vitest` (alias); `test:vitest`: `vitest run --coverage`.

> Tip: Tests and CI assume `pnpm` is available; do not change package manager without updating `AGENTS.md` and CI configs.

---

## 4. Testing & Development Patterns ✅

- **Test runner:** Vitest. Config: `vitest.config.mts`.
- **Fixtures:** Add small fixtures under `tests/fixtures` (e.g., `sample.json`, `special.txt`).
- **Stubbing build hooks:** Tests frequently construct minimal `build` stubs that capture handlers:
  - `onResolve: (opts, handler) => (onResolveHandler = handler)`
  - `onLoad: (opts, handler) => (onLoadHandler = handler)`
  - `onEnd: (handler) => (onEndHandler = handler)`
  Example assertions:
    - For `onLoad`, call `await onLoadHandler({ path: fixture })` and assert `result.loader === 'js'` and that `result.contents` contains ``dc(`<base64>`)``.
    - For `onEnd`, call `await onEndHandler({ outputFiles })` and assert `file.path` was appended with `.js` when needed and `file.contents` decodes to the original text.
- **Test types:** Unit tests use `*.spec.js` for isolated behavior and `*.test.js` for broader integration scenarios.
- **Edge cases to cover when changing compression logic:** special character handling (see `special.txt`), JSON normalization, lazy exports, namespace filtering, and `onEnd` path extension behavior.

---

## 5. Linting, Formatting & Pre-commit Hooks ✨

(unchanged — see above)

---

## 6. CI & GitHub Actions 🔁

(unchanged — CI uses `pnpm`, vitest, and runs commitlint on push)

---

## 7. Versioning & Releases 📦

(unchanged — uses `changesets`)

---

## 8. PR Checklist for Agents & Contributors ✅

1. Add or update targeted tests (see `tests/` and examples above).
2. Run `pnpm run format` and `pnpm run check` locally before pushing.
3. Keep changes small and reviewable; update tests and `AGENTS.md` when changing conventions.
4. Use Conventional Commits (see `.github/instructions/commit-message.instructions.md`).
5. If you changed tooling, update `AGENTS.md` and corresponding `.github/instructions/*`.

---

## 9. Agent Instructions (for AI contributors) 🤖

- **Primary goal:** Make minimal, well-tested changes. Prefer small PRs that change one behavior at a time.
- **Commit policy:** Use Conventional Commits for all changes and ensure messages pass `commitlint`.
  - **Readability target:** Contributors and agents should **aim for a 72-character line wrap** as a human-friendly buffer; tooling (commitlint/CI) may accept up to 100 characters when necessary.
- **Automation & safety:** Do not run global installs or change system settings without explicit permission. If a change requires installing or upgrading dependencies, outline the steps in the PR and ask maintainers for approval.
- **When adding behavior:** Add tests that follow existing patterns, add fixtures as needed, and include an explanation in the PR body referencing the relevant tests.
- **Common patterns to reuse:** `onResolve` specifier resolution, `onLoad` returns with `loader: 'js'` and `contents` that import `decompressFromBase64`, `onEnd` mutates `outputFiles`.
- **If unsure, ask:** Provide a concise question in the PR or as a comment; include code snippets and a proposed test so maintainers can quickly evaluate.

---

If anything in this guide becomes out-of-date, update it and add a short rationale for the change. Keep entries concise and practical.
