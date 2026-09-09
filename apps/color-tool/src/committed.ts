/**
 * The committed ramps, read from the generated token JSON at build time.
 *
 * Comparing against what is actually in the repository is the point: a tool
 * that only shows what you just typed cannot tell you whether it differs from
 * what ships.
 */

import tokens from "@iroshandezilva/spartant/tokens.json" with { type: "json" };

// Values are mostly strings, but shadows are objects. Only colour paths are
// read here, so narrow at the point of use rather than lying about the type.
const resolved = tokens as { primitive: Record<string, unknown> };

export interface CommittedStep {
  step: number;
  css: string;
}

/** Committed steps for one family, ascending. Empty when the family is new. */
export function committedFamily(family: string): CommittedStep[] {
  const prefix = `color.${family}.`;
  return Object.entries(resolved.primitive)
    .filter(([path]) => path.startsWith(prefix))
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([path, css]) => ({ step: Number(path.slice(prefix.length)), css }))
    .filter((entry) => Number.isFinite(entry.step))
    .sort((a, b) => a.step - b.step);
}

export function committedFamilyNames(): string[] {
  const names = new Set<string>();
  for (const path of Object.keys(resolved.primitive)) {
    const match = path.match(/^color\.([a-z-]+)\.\d+$/);
    if (match?.[1]) names.add(match[1]);
  }
  return [...names].sort();
}
