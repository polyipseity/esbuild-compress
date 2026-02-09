# AI Agent Instructions — esbuild-compress

This short file contains focused guidance for AI contributors working in this repository. Keep changes small, clearly tested, and easy for humans to review.

- ✅ Purpose: Make minimal, well-tested edits that match project conventions.
- ✅ Tests: Add unit tests under `tests/` using the existing patterns. Use `*.spec.js` for small units and `*.test.js` for integration-like scenarios.

Examples (use these as templates):

- Stubbing `onLoad` in tests:

```js
let onLoadHandler;
const build = { onResolve: () => {}, onLoad: (opts, handler) => (onLoadHandler = handler) };
plugin.setup(build);
const result = await onLoadHandler({ path: fixture });
expect(result.loader).toBe('js');
expect(result.contents).toMatch(/dc\(`[^`]*`\)/);
```

- Stubbing `onEnd` in tests:

```js
let onEndHandler;
const build = { onResolve: () => {}, onEnd: (handler) => (onEndHandler = handler) };
plugin.setup(build);
await onEndHandler({ outputFiles });
// assert file.path and decoded file.contents
```

Practical rules for AI agents:

- Use `pnpm` scripts for checks (`pnpm run check`, `pnpm test`). Do not run `pnpm install` or change global state without permission.
- Follow `Conventional Commits`; see `.github/instructions/commit-message.instructions.md` for examples.
- When changing behavior, add tests which demonstrate the new behavior and any relevant edge cases (special chars, JSON normalization, lazy exports, `onEnd` path logic).
- Update `AGENTS.md` and `.github/instructions/*` when you change project conventions.
- If a code change requires dependency changes or CI updates, open a draft PR and request human review before running installs or publishing.

If anything in these instructions is unclear, add a short question in your PR so a maintainer can clarify. Keep your PR descriptions precise and cite the tests that validate your change.
