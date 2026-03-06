# Commit Message Convention

This project enforces Conventional Commits for all commits. Your commit message **must** follow this format:

```text
type(scope): short summary

Optional body (wrap at 72 chars, hard wrap required)

Optional footer (BREAKING CHANGE, Refs, etc)
```

## Types

- feat:     A new feature
- fix:      A bug fix
- chore:    Maintenance, build, or tooling change
- docs:     Documentation only
- refactor: Code change that neither fixes a bug nor adds a feature
- test:     Adding or fixing tests
- style:    Formatting, missing semi colons, etc
- perf:     Performance improvement

## Scope

- Use the affected area, e.g. `settings`, `build`, `deps`, `dependabot`, etc.
- Omit if not applicable.

## Examples

```text
fix(dependabot): split update groups for github-actions and pnpm

- Change dependabot group name from 'all-dependencies' to 'github-actions'.
- Change dependabot group name from 'all-dependencies' to 'pnpm'.

Refs: dependabot config improvement
```

## Linting

- All commit messages are checked by `commitlint` and `husky`.
- **Tooling acceptance:** commitlint and related tools may accept up to **100 characters** for headers and body lines in practice.
- **Human target:** contributors and agents should **aim for ≤ 72 characters per line** as a buffer to improve readability and reduce rewrap churn.
- All agents and contributors must comply; see `AGENTS.md` for enforcement policy and rationale.
- Agents using the automated commit helper (`.github/prompts/commit-staged.prompt.md`) should attempt the 72-char target when composing messages; if commitlint rejects a message, the helper will retry and may rely on the tooling-allowed 100-char width to find an acceptable form.
- Example (compliant):

  ```text
  refactor(eslint): remove @eslint/compat, eslintrc, js; update Prettier rules
  
  - Removed @eslint/compat, @eslint/eslintrc, @eslint/js from config and lockfiles
  - Updated Prettier to v3 and adjusted markdownlint config for new plugin
  - Cleaned up ESLint overrides and Svelte linting comments
  
  Refs: lint config modernization
  ```

- See `.commitlintrc.js` for rules (if present) or `@commitlint/config-conventional` defaults.
- See `AGENTS.md` for agent compliance requirements.

## References

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [commitlint rules](https://commitlint.js.org/#/reference-rules)
