/**
 * Installs the packed package into a clean consumer and proves it works.
 *
 * `pnpm inspect:package` answers "do the right files ship". This answers the
 * question after it: "does a consumer who installs that tarball get a working
 * package". Those fail differently. A tarball can contain exactly the right
 * files and still be unusable because an `exports` subpath points at a path the
 * build never emits, because a runtime dependency was declared as a dev
 * dependency, or because the type declarations resolve to `any`.
 *
 * The consumer is deliberately built outside the repository, in the system
 * temporary directory, and depends on the tarball through `file:`. There is no
 * `workspace:` protocol, no path alias, and no `pnpm-workspace.yaml` above it,
 * so every import resolves exactly the way a stranger's install resolves. That
 * constraint is the whole value of the check, and it is why the consumer is not
 * a workspace project: `examples/consumer` uses `workspace:*` and therefore
 * cannot prove anything about the published artifact.
 *
 * Steps:
 *   1. Pack the built package with pnpm.
 *   2. Create a throwaway pnpm project and install only that tarball.
 *   3. Prove the installed package is not a link back into this repository.
 *   4. Type check and build representative consumer code against the tarball.
 *   5. Prove invalid public usage fails the type check.
 *   6. Run the built code and assert the exports, subpaths, and rendered markup.
 *
 * Usage:
 *   pnpm smoke:package            build, pack, install, verify, clean up
 *   pnpm smoke:package --keep     leave the consumer project in place to inspect
 */

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE = "@iroshandezilva/spartant";
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const PACKAGE_DIR = join(REPO_ROOT, "packages", "spartant");
const FIXTURE_DIR = join(REPO_ROOT, "smoke");

/**
 * Error codes the invalid-usage file must produce.
 *
 * Asserting the codes, not just a non-zero exit, is what stops this check
 * passing for the wrong reason. A missing import or a broken tsconfig also
 * exits non-zero, and that would look identical to "the types caught the bug".
 * Keep this list and the comments in smoke/src/invalid-usage.tsx in step.
 */
const EXPECTED_TYPE_ERRORS = ["TS2322", "TS2345"];

const keepConsumer = process.argv.includes("--keep");

/**
 * A check that must stop the run.
 *
 * Thrown rather than exited on, so the throwaway consumer project is still
 * cleaned up by the `finally` below. `process.exit` skips `finally`, which is
 * how a check like this quietly fills a developer's temporary directory.
 */
class SmokeFailure extends Error {}

function fail(message) {
  throw new SmokeFailure(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: process.env,
  });

  if (result.error) fail(`Could not run ${command}: ${result.error.message}`);
  return result;
}

/**
 * Shared dependency versions, read from the workspace catalog.
 *
 * The consumer must install the same React and TypeScript the package is built
 * against, and hard-coding them here would let them drift the moment the
 * catalog moves. A small regex beats adding a YAML parser for five lines.
 */
function catalogVersion(name) {
  const workspace = readFileSync(join(REPO_ROOT, "pnpm-workspace.yaml"), "utf8");
  const keys = [`${name}:`, `"${name}":`];

  for (const line of workspace.split("\n")) {
    const trimmed = line.trim();
    const key = keys.find((candidate) => trimmed.startsWith(candidate));
    if (key) return trimmed.slice(key.length).trim();
  }

  fail(`No catalog entry for ${name} in pnpm-workspace.yaml.`);
}

let consumerDir = null;
let exitCode = 0;

try {
  // 1. Refuse to smoke test a package that was never built.
  if (!existsSync(join(PACKAGE_DIR, "dist", "index.js"))) {
    fail(
      `${PACKAGE} has not been built. There is no packages/spartant/dist/index.js.\n` +
        "Run `pnpm build:package` first, or use `pnpm smoke:package`, which builds it for you.",
    );
  }

  consumerDir = mkdtempSync(join(realpathSync(tmpdir()), "spartant-smoke-"));
  console.log(`\nConsumer project: ${consumerDir}`);

  // 2. Pack, exactly as the release job packs.
  console.log("\n1. Packing the package with pnpm\n");
  const packed = run("pnpm", ["--filter", PACKAGE, "pack", "--pack-destination", consumerDir], {
    cwd: REPO_ROOT,
  });
  if (packed.status !== 0) fail("pnpm pack failed. The package cannot be published in this state.");

  const tarball = readdirSync(consumerDir).find((file) => file.endsWith(".tgz"));
  if (!tarball) fail(`pnpm pack produced no tarball in ${consumerDir}.`);
  console.log(`\nTarball: ${tarball}`);

  // 3. Write the consumer manifest. The only Spartant reference is the tarball.
  cpSync(FIXTURE_DIR, consumerDir, { recursive: true });

  const rootManifest = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
  const manifest = {
    name: "spartant-smoke-consumer",
    version: "0.0.0",
    private: true,
    type: "module",
    packageManager: rootManifest.packageManager,
    dependencies: {
      [PACKAGE]: `file:./${tarball}`,
      react: catalogVersion("react"),
      "react-dom": catalogVersion("react-dom"),
    },
    devDependencies: {
      "@types/react": catalogVersion("@types/react"),
      "@types/react-dom": catalogVersion("@types/react-dom"),
      typescript: catalogVersion("typescript"),
    },
  };
  writeFileSync(join(consumerDir, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log("\n2. Installing the tarball into a clean pnpm project\n");
  const install = run(
    "pnpm",
    ["install", "--ignore-workspace", "--no-frozen-lockfile", "--prefer-offline"],
    { cwd: consumerDir },
  );
  if (install.status !== 0) {
    fail(
      "The packed package could not be installed.\n" +
        "This is the failure a consumer sees first. Check the package manifest's\n" +
        "dependencies, peerDependencies, and engines fields.",
    );
  }

  // 4. Prove there is no workspace alias. pnpm links every dependency through
  //    node_modules/.pnpm, so the test is not "is it a symlink" but "where does
  //    it really point". Anything inside this repository means the check is
  //    reading source rather than the published artifact, and proves nothing.
  const installed = join(consumerDir, "node_modules", PACKAGE);
  if (!existsSync(installed)) fail(`${PACKAGE} is not present in the consumer's node_modules.`);

  const realInstalled = realpathSync(installed);
  const repoReal = realpathSync(REPO_ROOT);
  if (!relative(repoReal, realInstalled).startsWith("..")) {
    fail(
      `The consumer resolved ${PACKAGE} to ${realInstalled}, which is inside this\n` +
        "repository. The smoke test would then be checking workspace source rather than\n" +
        "the packed artifact, so it cannot prove the published package works.",
    );
  }
  console.log(`\n  ok  ${PACKAGE} resolves to ${realInstalled}, outside the repository`);

  // 5. Type check and build the representative consumer code.
  console.log("\n3. Type checking and building representative consumer usage\n");
  const build = run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], { cwd: consumerDir });
  if (build.status !== 0) {
    fail(
      "Representative public usage does not type check against the packed package.\n" +
        "Either an export is missing from the published type declarations, or a public\n" +
        "API changed without smoke/src/usage.tsx being updated to match.",
    );
  }
  console.log("  ok  smoke/src/usage.tsx type checked and compiled");

  // 6. The inverted check: invalid usage must be rejected.
  console.log("\n4. Proving invalid public usage fails the type check\n");
  const invalid = run("pnpm", ["exec", "tsc", "-p", "tsconfig.invalid.json"], {
    cwd: consumerDir,
    capture: true,
  });
  const invalidOutput = `${invalid.stdout ?? ""}${invalid.stderr ?? ""}`;

  if (invalid.status === 0) {
    console.error(invalidOutput);
    fail(
      "smoke/src/invalid-usage.tsx type checked, and it must not.\n" +
        "The published type declarations are accepting invalid public usage, so a\n" +
        "consumer's typo reaches runtime. A prop was probably widened to `string`, or\n" +
        "the declarations resolved to `any` because a subpath or type export is missing.",
    );
  }

  const missingCodes = EXPECTED_TYPE_ERRORS.filter((code) => !invalidOutput.includes(code));
  if (missingCodes.length > 0) {
    console.error(invalidOutput);
    fail(
      `The invalid-usage type check failed, but not for the expected reasons.\n` +
        `Expected error codes not present: ${missingCodes.join(", ")}\n` +
        "A compile error unrelated to the invalid usage would pass this check for the\n" +
        "wrong reason, so the codes are asserted rather than the exit status alone.",
    );
  }
  console.log(
    `  ok  invalid usage rejected with ${EXPECTED_TYPE_ERRORS.join(" and ")} as expected`,
  );

  // 7. Run the consumer.
  console.log("\n5. Running the consumer smoke assertions");
  const smoke = run("node", ["smoke.mjs"], { cwd: consumerDir });
  if (smoke.status !== 0) {
    exitCode = smoke.status ?? 1;
    console.error("\nThe consumer smoke assertions failed. See the failures above.");
  }
} catch (error) {
  if (!(error instanceof SmokeFailure)) throw error;
  console.error(`\n${error.message}\n`);
  exitCode = 1;
} finally {
  if (consumerDir === null) {
    // Nothing was created yet.
  } else if (keepConsumer) {
    console.log(`\nConsumer project kept at ${consumerDir}`);
  } else {
    rmSync(consumerDir, { recursive: true, force: true });
  }
}

if (exitCode !== 0) process.exit(exitCode);

console.log(`\n${PACKAGE} installs and works from its packed artifact, outside the workspace.`);
