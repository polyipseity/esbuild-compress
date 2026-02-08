import { FILE_GLOBS as ESLINT_FILE_GLOBS } from "./eslint.config.mjs";
import { FILE_GLOBS as MD_FILE_GLOBS } from "./.markdownlint-cli2.mjs";

/**
 * Convert ESLint `FILE_GLOBS` into a brace-style combined pattern.
 */
const ESLINT_GLOB_KEY = `**/*.{${ESLINT_FILE_GLOBS.map((g) =>
  g.replace("**/*.", ""),
).join(",")}}`;

/**
 * Convert `FILE_GLOBS` into a brace-style combined pattern.
 */
const MD_GLOB_KEY = `**/*.{${MD_FILE_GLOBS.map((g) =>
  g.replace("**/*.", ""),
).join(",")}}`;

const ORIGINAL_PRETTIER_GLOB =
  "**/*.{astro,cjs,css,csv,gql,graphql,hbs,html,js,jsx,json,json5,jsonc,jsonl,less,mjs,pcss,sass,scss,svelte,styl,ts,tsx,vue,xml,yaml,yml}";
/**
 * Compute the Prettier-only glob by parsing the original lint-staged glob
 * and excluding extensions handled by ESLint (to avoid race conditions).
 */
const PRETTIER_GLOB_KEY = (() => {
  const eslintExts = new Set(
    ESLINT_FILE_GLOBS.map((g) => g.replace("**/*.", "")),
  );
  const m = ORIGINAL_PRETTIER_GLOB.match(/\{([^}]+)\}/);
  const exts = m ? m[1].split(",").filter((e) => !eslintExts.has(e)) : [];
  return `**/*.{${exts.join(",")}}`;
})();

export default {
  [MD_GLOB_KEY]: ["markdownlint-cli2 --fix --no-globs"],
  [ESLINT_GLOB_KEY]: ["eslint --fix", "prettier --write"],
  [PRETTIER_GLOB_KEY]: ["prettier --write"],
};
