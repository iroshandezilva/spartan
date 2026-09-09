/**
 * Builds the package stylesheets.
 *
 * Two entry points ship, because consumers arrive in two shapes:
 *
 *   styles.css  Precompiled and self-contained. One import, no Tailwind, no
 *               configuration. This is the default.
 *   theme.css   Tokens and the Tailwind theme mapping only, for a consumer who
 *               already runs Tailwind and wants Spartant's semantic roles as
 *               utilities beside their own.
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";

const OUT_DIR = "dist/styles";

mkdirSync(OUT_DIR, { recursive: true });

execFileSync(
  "tailwindcss",
  ["--input", "src/styles/index.css", "--output", `${OUT_DIR}/index.css`],
  { stdio: "inherit" },
);

// Shipped as source, not compiled, so the consumer's own Tailwind resolves them.
for (const file of ["theme.css", "tokens.css"]) {
  copyFileSync(`src/styles/${file}`, `${OUT_DIR}/${file}`);
  console.log(`Copied src/styles/${file} -> ${OUT_DIR}/${file}`);
}

// The resolved token JSON ships too. tsc does not copy JSON, and tooling that
// reads token values should read the published artefact rather than reach into
// the source tree.
mkdirSync("dist/tokens/generated", { recursive: true });
copyFileSync("src/tokens/generated/tokens.json", "dist/tokens/generated/tokens.json");
console.log("Copied src/tokens/generated/tokens.json -> dist/tokens/generated/tokens.json");
