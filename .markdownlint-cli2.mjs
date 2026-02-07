import config from "./.markdownlint.json" with { type: "json" };

export const FILE_GLOBS = [
  "**/*.md",
  "**/*.mdoc",
  "**/*.mdown",
  "**/*.mdx",
  "**/*.mkd",
  "**/*.mkdn",
  "**/*.markdown",
  "**/*.rmd",
];

export default {
  config,
  globs: FILE_GLOBS,
  gitignore: true,
};
