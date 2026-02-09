---
name: TypeScript Coding Standards
applyTo: "src/**/*.ts"
description: Guidelines for TypeScript files in esbuild-compress
---

# TypeScript Coding Standards — esbuild-compress

> Note: This repository currently does not contain TypeScript source files. These rules are provided as guidance for future TypeScript additions. If you are adding TypeScript files, follow the guidance below and update `AGENTS.md` to reflect any repository-wide TypeScript decisions.

## Core Rules

- Use the strictest TypeScript configuration (`tsconfig.json`).
- Validate and normalize all settings objects with `.fix()` methods where applicable.
- Prefer type-safe patterns; **never** use `any` unless absolutely unavoidable.
- Keep TypeScript-specific logic small and well-documented; prefer minimal surface area changes.

## Do / Don't

- **Do:**
  - Use explicit types everywhere possible
  - Keep code modular and maintainable
  - Add focused tests that demonstrate the type-level behavior when appropriate
- **Don't:**
  - Use `any` or unsafe casts
  - Introduce large architectural TypeScript changes without a design note and tests

## When to add these rules to `AGENTS.md`

- If you add TypeScript sources (e.g., a `src/` folder), update `AGENTS.md` to include TypeScript-specific developer workflow details (build/test changes, `tsc` checks, and any CI adjustments).

## References

- See `AGENTS.md` for agent workflow and testing patterns.
