/**
 * Serves a built static site over HTTP, so a CI artifact can be reviewed.
 *
 * This exists because the obvious thing does not work. A Storybook build loads
 * its runtime as an ES module and fetches `index.json` at startup, and browsers
 * block both over `file://`. Opening `index.html` from a downloaded artifact
 * therefore produces a blank page with a console error rather than a workbench,
 * which is exactly the kind of friction that ends with nobody reviewing
 * anything.
 *
 * Deliberately dependency-free. A review tool that needs an install is one more
 * reason to skip the review.
 *
 *   node scripts/serve-static.mjs [directory] [--port 6099]
 */

import { createReadStream, existsSync, realpathSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const DEFAULT_DIRECTORY = "apps/storybook/storybook-static";
const DEFAULT_PORT = 6099;

/** Only what a static site build actually emits. */
const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
  [".txt", "text/plain; charset=utf-8"],
]);

function parseArguments(argv) {
  const positional = [];
  let port = DEFAULT_PORT;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--port") {
      const value = Number.parseInt(argv[index + 1] ?? "", 10);
      if (!Number.isInteger(value) || value < 1 || value > 65535) {
        throw new Error(`--port needs a port number, got ${argv[index + 1]}`);
      }
      port = value;
      index += 1;
    } else if (argument !== undefined) {
      positional.push(argument);
    }
  }

  return { directory: positional[0] ?? DEFAULT_DIRECTORY, port };
}

const { directory, port } = parseArguments(process.argv.slice(2));
const root = resolve(directory);

if (!existsSync(root) || !statSync(root).isDirectory()) {
  console.error(`No such directory: ${root}`);
  console.error("Build it first with `pnpm build:storybook`, or pass the path to");
  console.error("an unzipped CI artifact.");
  process.exit(1);
}

if (!existsSync(join(root, "index.html"))) {
  console.error(`No index.html in ${root}. That does not look like a built site.`);
  process.exit(1);
}

/** Compared against, so a symlink cannot serve a file from outside the root. */
const realRoot = realpathSync(root);

const server = createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);

  // `normalize` on an absolute path collapses leading `..` segments, so
  // `/../../.env` becomes `/.env` and resolves inside the root rather than
  // above it. That is what actually stops traversal.
  const candidate = resolve(root, `.${normalize(requestPath)}`);

  const target =
    existsSync(candidate) && statSync(candidate).isDirectory()
      ? join(candidate, "index.html")
      : candidate;

  if (!existsSync(target) || !statSync(target).isFile()) {
    response.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    return;
  }

  // The remaining way out is a symlink inside the served directory pointing
  // somewhere else, which a downloaded and unzipped artifact could contain.
  // `resolve` does not follow links, so check the real path before reading.
  const real = realpathSync(target);
  if (real !== realRoot && !real.startsWith(realRoot + sep)) {
    response.writeHead(403, { "content-type": "text/plain" }).end("Forbidden");
    return;
  }

  response.writeHead(200, {
    "content-type": CONTENT_TYPES.get(extname(target)) ?? "application/octet-stream",
    // A review server should never hand back yesterday's build.
    "cache-control": "no-store",
  });
  createReadStream(target).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root}`);
  console.log(`  http://127.0.0.1:${port}/`);
  console.log("Stop with Ctrl+C.");
});
