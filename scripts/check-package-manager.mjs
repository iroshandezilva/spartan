/**
 * Fails the install when a package manager other than pnpm is used.
 *
 * pnpm is a confirmed architecture decision. Installing with npm or yarn would
 * produce a competing lockfile and a different dependency layout, so this guard
 * stops it at the point of failure rather than after the damage is committed.
 *
 * Runs as the root `preinstall` script and uses only Node builtins, because
 * node_modules does not exist yet when it runs.
 */

const agent = process.env.npm_config_user_agent ?? "";

// An unknown agent is allowed. The goal is to catch a wrong package manager,
// not to break unusual but legitimate environments such as a bare node call.
if (agent && !agent.startsWith("pnpm/")) {
  const detected = agent.split("/")[0];
  console.error(`
This repository requires pnpm, but the install was started with "${detected}".

  Use:  pnpm install

pnpm is pinned by the "packageManager" field in the root package.json.
If you do not have it, enable Corepack with:  corepack enable
`);
  process.exit(1);
}
