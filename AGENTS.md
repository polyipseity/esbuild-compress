# AGENTS.md — AI Agent & Contributor Guide 🔧

This guide documents repository conventions, developer workflows, and instructions for AI agents and contributors working in the `esbuild-compress` codebase. This project is a small JavaScript package (entry: `index.js`) providing an esbuild compression plugin. **Localization is not used in this repository — do not add localization files.**

---

## 1. Architecture Overview 🏗️

- **Entry point:** `index.js` — exports the plugin API used by consumers.
- **Build & helper scripts:** `build/` contains scripts used for packaging and release workflows (for example, `build/version-post.mjs`).
- **Tests:** Live under `tests/` and mirror source layout where practical.
- **Package manager & lockfile:** `pnpm` is the preferred package manager; use `pnpm-lock.yaml`.

---

## 2. Developer Workflows 🚀

- **Install:** `pnpm install` (preferred). Avoid running installs without explicit instruction.
- **Prepare:** `pnpm run prepare` installs Husky hooks (if not already installed by the package manager).
- **Build:** `pnpm run build` (runs checks and build-related steps).
- **Test:** `pnpm test` runs the full test suite with coverage (`vitest run --coverage`). For interactive runs: `pnpm run test:watch`.
- **Format & lint:** `pnpm run format` / `pnpm run check` (see Scripts below).

---

## 3. Scripts (quick reference) 📋

- `build` — intentionally a no-op in this repository. The package ships `index.js` directly and is importable without a build; the script prints a short message and runs checks only.
- `check` — runs `check:eslint`, `check:md`, and `check:prettier`.
- `check:eslint` — `eslint --cache --max-warnings=0`.
- `check:md` — `markdownlint-cli2`.
- `check:prettier` — `prettier --cache --check "**/*.{js,mjs,cjs,ts,tsx,json,md,css,scss,html,yml,yaml}"`.
- `format` — `format:eslint`, `format:md`, `format:prettier`.
- `prepare` — `husky install` (installs git hooks).
- `test` — `pnpm run test:vitest` (alias); `test:vitest`: `vitest run --coverage`.
- `test:watch` — run interactive vitest watcher.
- `postversion` — project-specific version lifecycle hook (if present).

> Tip: When running scripts in hooks or CI, prefer invoking `pnpm run <script>` to guarantee pnpm's behavior.

---

## 4. Testing Guidance ✅

- **Test runner:** Vitest. Config lives in `vitest.config.mts`.
- **Conventions:**
  - Unit tests: `*.spec.js` (BDD-style) — keep small and hermetic.
  - Integration tests: `*.test.js` — for longer-running or integration-level checks.
  - Place tests under `tests/` mirroring the `src/` layout when applicable.
- **Run locally:** `pnpm test` for coverage or `pnpm run test:watch` for interactive development.

---

## 5. Linting, Formatting & Pre-commit Hooks ✨

- **ESLint** (`eslint.config.mjs`) — project-level lint rules; run via `pnpm run check:eslint`.
- **Prettier** (`.prettierrc.mjs`) — formatting; run via `pnpm run format:prettier`.
- **Markdown linting** via `markdownlint-cli2` (config in `.markdownlint.json`).
- **Husky hooks**:
  - `.husky/pre-commit` runs `pnpm dlx --no-install lint-staged` (ensures staged files are linted/fixed).
  - `.husky/pre-push` runs `pnpm test` to block pushes with failing tests.
  - `.husky/commit-msg` runs commit linting via `pnpm dlx --no-install commitlint`.
- **lint-staged** runs formatters/linters on staged files using the globs from `eslint.config.mjs` and `.markdownlint-cli2.mjs`.

---

## 6. CI & GitHub Actions 🔁

- CI workflow: `.github/workflows/ci.yml` runs the test and build jobs using `pnpm` on `ubuntu-slim` (smaller runner for cost savings).
- Commit message linting workflow: `.github/workflows/commitlint.yml` runs on `ubuntu-latest` due to Docker-based action requirements.
- Dependabot: `.github/dependabot.yml` is configured to update workflow dependencies and package manifests — groups are named to reflect `pnpm` focus.

---

## 7. Versioning & Releases 📦

- We use `changesets` for release/version management. See `@changesets/cli` in `devDependencies`.
- Lifecycle hooks (for example `postversion`) call repository-specific scripts in `build/`.

---

## 8. PR Checklist for Agents & Contributors ✅

1. Add or update tests for behavior changes; follow `*.spec.js` / `*.test.js` conventions.
2. Run `pnpm run format` and `pnpm run check` locally before pushing.
3. Ensure CI passes on your branch (CI uses `pnpm`).
4. Commit messages must follow Conventional Commits; `commitlint` will enforce header/body rules.
5. If you changed tooling, update `AGENTS.md` and any relevant instruction files.

---

## 9. Agent Instructions (for AI contributors) 🤖

- **Commit policy:** Use Conventional Commits for all changes and ensure messages pass `commitlint`.
- **Automation:** Do not run `pnpm install` or make global system changes without explicit user permission.
- **Edits:** When changing infra or conventions, update `AGENTS.md` and the corresponding `.github/instructions/*` files.
- **No localization work:** Ignore localization-related templates and instructions — this repository does not use localization.

---

If anything in this guide becomes out-of-date, update it and add a short rationale for the change. Keep entries concise and practical.
