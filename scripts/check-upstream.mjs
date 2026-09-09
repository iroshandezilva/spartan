/**
 * Reports whether adopted upstream source has changed since it was adapted.
 *
 * Deliberately NOT part of `pnpm validate`: it needs the network, and a check
 * that fails because a third party shipped a release is not a check, it is an
 * interruption.
 *
 * It also never writes. The whole point of the adoption workflow is that an
 * upstream change is a prompt to review, not an event that overwrites local
 * decisions. Run it when you want to know, decide deliberately, and record the
 * decision in the provenance file.
 *
 * Provenance files are discovered, not listed. Every `upstream/provenance.json`
 * under the package source counts: the two HAUX-65 experiments, the components
 * audited in HAUX-69, and any component adopted from shadcn since. A component
 * that records its provenance in the shape `ADOPTING-SHADCN.md` describes joins
 * this report by existing, so nobody has to remember to register it here.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "packages/spartant/src";

function findProvenance(directory, found = []) {
  for (const entry of readdirSync(directory).sort()) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) {
      findProvenance(full, found);
    } else if (entry === "provenance.json" && directory.endsWith("upstream")) {
      found.push(full);
    }
  }
  return found;
}

const files = findProvenance(ROOT);
if (files.length === 0) {
  console.error(`No upstream/provenance.json found under ${ROOT}.`);
  process.exit(1);
}

const findings = [];

for (const file of files) {
  const { entries } = JSON.parse(readFileSync(file, "utf8"));
  console.log(relative(ROOT, file));

  for (const [name, record] of Object.entries(entries)) {
    process.stdout.write(`  ${name.padEnd(12)} `);
    let response;
    try {
      response = await fetch(record.source);
    } catch (error) {
      console.log(`could not reach upstream: ${error.message}`);
      continue;
    }
    if (!response.ok) {
      console.log(`upstream returned ${response.status}`);
      continue;
    }

    const entry = await response.json();
    const content = entry.files?.[0]?.content ?? "";
    const sha256 = createHash("sha256").update(content).digest("hex");
    const deps = entry.dependencies ?? [];

    if (sha256 === record.sha256) {
      console.log(`unchanged since ${record.fetchedOn}`);
      continue;
    }

    console.log("CHANGED");
    findings.push(
      [
        `${name} (${relative(ROOT, file)}) has changed upstream since ${record.fetchedOn}`,
        `  recorded ${record.sha256.slice(0, 12)}, upstream ${sha256.slice(0, 12)}`,
        `  dependencies then ${JSON.stringify(record.declaredDependencies)}, now ${JSON.stringify(deps)}`,
        "  Review the diff against the adaptation. Adopt only what is worth adopting,",
        "  then update the snapshot and sha256 in the provenance file.",
      ].join("\n"),
    );
  }
}

if (findings.length > 0) {
  console.log(`\n${findings.length} upstream change(s) to review:\n`);
  for (const finding of findings) console.log(`${finding}\n`);
  console.log("This is information, not a failure. Nothing has been changed for you.");
}
