/**
 * Packs the publishable package and inspects the resulting tarball.
 *
 * This is the local form of the package-contents check named in the CI plan.
 * It fails when a file that should never ship appears in the tarball, which is
 * how source, tsconfig, or build info leaking into a release gets caught before
 * publishing rather than after.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const PACKAGE = "@iroshandezilva/spartant";
const OUT_DIR = ".artifacts";

/** Paths allowed inside the tarball. Everything else fails the check. */
const ALLOWED = ["package/dist/", "package/package.json", "package/README.md", "package/LICENSE"];

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

execFileSync("pnpm", ["--filter", PACKAGE, "pack", "--pack-destination", OUT_DIR], {
  stdio: "inherit",
});

const tarball = readdirSync(OUT_DIR).find((file) => file.endsWith(".tgz"));
if (!tarball) {
  console.error(`No tarball was produced in ${OUT_DIR}.`);
  process.exit(1);
}

const tarballPath = join(OUT_DIR, tarball);
const contents = execFileSync("tar", ["-tzf", tarballPath], { encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line !== "" && !line.endsWith("/"))
  .sort();

console.log(`\nPackage: ${PACKAGE}`);
console.log(`Tarball: ${tarballPath}`);
console.log(`Files:   ${contents.length}`);
for (const file of contents) {
  console.log(`  ${file}`);
}

const unexpected = contents.filter(
  (file) => !ALLOWED.some((allowed) => file === allowed || file.startsWith(allowed)),
);

if (unexpected.length > 0) {
  console.error("\nUnexpected files in the package tarball:");
  for (const file of unexpected) {
    console.error(`  ${file}`);
  }
  console.error(
    "\nEither narrow the `files` field in the package manifest, or add the path to\n" +
      "ALLOWED in scripts/inspect-package.mjs when the addition is intended.",
  );
  process.exit(1);
}

if (!contents.includes("package/dist/index.d.ts")) {
  console.error("\nThe tarball has no type declarations at package/dist/index.d.ts.");
  process.exit(1);
}

/**
 * The metadata contract from HAUX-61, checked against the manifest inside the
 * tarball rather than the one in the working tree. pnpm rewrites `catalog:`
 * and `workspace:` ranges at pack time, so only the packed manifest shows what
 * a consumer's install will actually resolve.
 *
 * Each entry is the whole of the contract for that field. Adding an export, a
 * dependency, or a peer means changing this list in the same commit, which is
 * the point: the public surface is not allowed to grow by accident.
 */
const EXPECTED = {
  name: "@iroshandezilva/spartant",
  license: "MIT",
  type: "module",
  sideEffects: false,
  files: ["dist"],
  exports: [".", "./package.json", "./styles.css", "./theme.css", "./tokens.json"],
  peerDependencies: ["react"],
  dependencies: ["clsx", "tailwind-merge"],
  engines: ["node"],
  publishAccess: "public",
  repository: {
    type: "git",
    url: "git+https://github.com/iroshandezilva/spartan.git",
    directory: "packages/spartant",
  },
  homepage: "https://github.com/iroshandezilva/spartan#readme",
  bugs: "https://github.com/iroshandezilva/spartan/issues",
};

const manifest = JSON.parse(
  execFileSync("tar", ["-xzOf", tarballPath, "package/package.json"], { encoding: "utf8" }),
);

const problems = [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const keys = (o) => Object.keys(o ?? {}).sort();

if (manifest.name !== EXPECTED.name) problems.push(`name is ${manifest.name}`);
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(manifest.version ?? "")) {
  problems.push(`version "${manifest.version}" is not a semver version`);
}
if (manifest.license !== EXPECTED.license) problems.push(`license is ${manifest.license}`);
if (manifest.type !== EXPECTED.type) problems.push(`type is ${manifest.type}`);
if (manifest.sideEffects !== EXPECTED.sideEffects) {
  problems.push(`sideEffects is ${manifest.sideEffects}; must be false for tree shaking`);
}
if (!same(manifest.files, EXPECTED.files))
  problems.push(`files is ${JSON.stringify(manifest.files)}`);
if (!same(keys(manifest.exports), [...EXPECTED.exports].sort())) {
  problems.push(`exports keys are ${JSON.stringify(keys(manifest.exports))}`);
}
if (!same(keys(manifest.peerDependencies), [...EXPECTED.peerDependencies].sort())) {
  problems.push(`peerDependencies are ${JSON.stringify(keys(manifest.peerDependencies))}`);
}
if (!same(keys(manifest.dependencies), [...EXPECTED.dependencies].sort())) {
  problems.push(`dependencies are ${JSON.stringify(keys(manifest.dependencies))}`);
}
if (!same(keys(manifest.engines), EXPECTED.engines)) {
  problems.push(`engines are ${JSON.stringify(keys(manifest.engines))}`);
}
if (manifest.publishConfig?.access !== EXPECTED.publishAccess) {
  problems.push(`publishConfig.access is ${manifest.publishConfig?.access}`);
}
if (!contents.includes("package/LICENSE")) problems.push("LICENSE is not in the tarball");
// npm provenance verifies the repository field against the repository that
// ran the publish, so a typo here fails at publish time, not here.
if (!same(manifest.repository, EXPECTED.repository)) {
  problems.push(`repository is ${JSON.stringify(manifest.repository)}`);
}
if (manifest.homepage !== EXPECTED.homepage) problems.push(`homepage is ${manifest.homepage}`);
if (manifest.bugs !== EXPECTED.bugs) problems.push(`bugs is ${manifest.bugs}`);

// Every export target must be a real file in the tarball. A key that points at
// a path the build no longer emits resolves fine here and fails in a consumer.
for (const [key, target] of Object.entries(manifest.exports ?? {})) {
  const paths = typeof target === "string" ? [target] : Object.values(target);
  for (const path of paths) {
    const inTarball = `package/${path.replace(/^\.\//, "")}`;
    if (!contents.includes(inTarball)) problems.push(`export "${key}" points at missing ${path}`);
  }
}

// A published range must be a real range. pnpm replaces catalog: and
// workspace: on pack; if one survives, the consumer's install fails.
for (const field of ["dependencies", "peerDependencies"]) {
  for (const [name, range] of Object.entries(manifest[field] ?? {})) {
    if (/^(catalog|workspace|link|file):/.test(range)) {
      problems.push(`${field}.${name} is "${range}", an unpublishable range`);
    }
  }
}

if (problems.length > 0) {
  console.error("\nThe packed manifest does not match the metadata contract:");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    "\nThe contract is EXPECTED in scripts/inspect-package.mjs and is explained in\n" +
      "packages/spartant/VERSIONING.md. Change both when the change is intended.",
  );
  process.exit(1);
}

console.log("\nPackage metadata matches the contract.");
console.log("Package contents are correct.");
