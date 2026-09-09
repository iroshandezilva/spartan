/**
 * Shared plumbing for the site checks: argument parsing, the origin to check,
 * and a production server when the caller has not started one.
 *
 * Every check runs against a served site rather than against the file system,
 * because that is what a reader gets. Next serves the built pages, the search
 * route, and the generated text files, and a check that read `.next` directly
 * would have to reimplement routing to know what a URL resolves to.
 *
 *   node scripts/<check>.mjs               serves the existing build on a free port
 *   node scripts/<check>.mjs --base URL    checks a site that is already running
 *
 * The build is never started here. `pnpm build:docs` from the workspace root
 * is the documented way to produce it, and a check that quietly rebuilt would
 * hide a stale build behind a passing result.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** `--base URL`, `--port N`, and everything else in `rest`. */
export function parseArgs(argv = process.argv.slice(2)) {
  const options = { base: undefined, port: undefined, rest: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base") {
      options.base = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--base=")) {
      options.base = arg.slice("--base=".length);
    } else if (arg === "--port") {
      options.port = Number(argv[i + 1]);
      i += 1;
    } else if (arg.startsWith("--port=")) {
      options.port = Number(arg.slice("--port=".length));
    } else {
      options.rest.push(arg);
    }
  }
  return options;
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

async function waitForServer(base, child, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`next start exited with code ${child.exitCode} before serving anything.`);
    }
    try {
      const response = await fetch(`${base}/`, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`next start did not answer on ${base} within ${timeoutMs / 1000}s.`);
}

/**
 * Runs `fn(base)` against a served site. With `--base`, that site. Without
 * it, a `next start` of the existing production build on a free port, which
 * is stopped again afterwards whatever `fn` does.
 */
export async function withSite(options, fn) {
  if (options.base) {
    return fn(options.base.replace(/\/+$/, ""));
  }

  if (!existsSync(resolve(appDirectory, ".next/BUILD_ID"))) {
    throw new Error(
      "No production build in apps/docs/.next. Run `pnpm build:docs` from the workspace root first, or pass --base URL to check a running site.",
    );
  }

  const port = options.port ?? (await freePort());
  const base = `http://localhost:${port}`;
  const require = createRequire(import.meta.url);
  const nextBin = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: appDirectory,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });

  try {
    await waitForServer(base, child);
    console.log(`Serving the production build at ${base}\n`);
    return await fn(base);
  } catch (error) {
    if (output.trim()) console.error(output.trim());
    throw error;
  } finally {
    child.kill("SIGTERM");
    await new Promise((r) => {
      if (child.exitCode !== null) return r();
      child.once("exit", r);
      setTimeout(() => {
        child.kill("SIGKILL");
        r();
      }, 3000).unref();
    });
  }
}

/** Prints an aligned table. `rows` is an array of arrays of strings. */
export function printTable(headers, rows) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => String(row[i] ?? "").length)),
  );
  const line = (cells) => cells.map((c, i) => String(c ?? "").padEnd(widths[i])).join("  ");
  console.log(line(headers));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of rows) console.log(line(row));
}

/**
 * Runs a check's `main` when the module is executed directly, so each check
 * is both a script and an importable module.
 */
export async function runIfMain(importMetaUrl, main) {
  if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(importMetaUrl)) {
    try {
      const ok = await main(parseArgs());
      process.exit(ok ? 0 : 1);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}
