/**
 * Assertions that run inside the throwaway consumer project.
 *
 * By the time this runs, the packed tarball is installed and `src/usage.tsx`
 * has been compiled to `build/usage.js`. Everything here therefore exercises
 * the published artifact: the entry point, the subpath exports, and the markup
 * the components produce.
 *
 * Plain JavaScript on purpose. It uses `import.meta.resolve`, which needs Node
 * types to type check, and pulling `@types/node` into the consumer would let
 * the type check pass on APIs a real consumer's browser app never has.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PACKAGE = "@iroshandezilva/spartant";

/**
 * Every name the public entry point promises.
 *
 * A missing name here is a broken consumer contract, so the check names each
 * one rather than counting them. Extra exports are allowed: a component landing
 * is not a regression, and pinning the exact set would make this file conflict
 * with every component issue.
 */
const REQUIRED_EXPORTS = [
  "Badge",
  "Button",
  "Card",
  "CardActions",
  "CardContent",
  "CardDescription",
  "CardHeader",
  "CardTitle",
  "Checkbox",
  "Dialog",
  "DialogClose",
  "DialogContent",
  "DialogDescription",
  "DialogTitle",
  "DialogTrigger",
  "Field",
  "FieldMessage",
  "Input",
  "Label",
  "Popover",
  "PopoverClose",
  "PopoverContent",
  "PopoverDescription",
  "PopoverTitle",
  "PopoverTrigger",
  "Radio",
  "RadioGroup",
  "Select",
  "Separator",
  "Switch",
  "Tab",
  "Tabs",
  "TabsList",
  "TabsPanel",
  "Textarea",
  "THEME_ATTRIBUTE",
  "THEME_STORAGE_KEY",
  "ThemeProvider",
  "Tooltip",
  "TooltipContent",
  "TooltipTrigger",
  "applyTheme",
  "cn",
  "getSystemTheme",
  "packageName",
  "readAppliedTheme",
  "semanticTokens",
  "springs",
  "themeScript",
  "tokenVar",
  "useTheme",
];

/**
 * Subpath exports and the marker each file must contain.
 *
 * Resolution alone is not enough. An `exports` entry can point at a path that
 * builds an empty file, and a stylesheet with no tokens in it fails silently in
 * a consumer's app rather than at install time.
 */
const REQUIRED_SUBPATHS = [
  {
    specifier: `${PACKAGE}/styles.css`,
    why: "the no-Tailwind consumer path documented in README.md",
    markers: ["--spartant-", '[data-theme="dark"]', "bg-primary"],
  },
  {
    specifier: `${PACKAGE}/theme.css`,
    why: "the Tailwind consumer path documented in README.md",
    markers: ["@theme inline", "--spartant-"],
  },
  {
    specifier: `${PACKAGE}/tokens.json`,
    why: "the machine-readable token surface",
    markers: ['"semantic"', '"theme"', '"color.primary.default"'],
  },
];

const failures = [];

function check(description, assertion) {
  try {
    const problem = assertion();
    if (problem) {
      failures.push(`${description}\n    ${problem}`);
      return false;
    }
    console.log(`  ok  ${description}`);
    return true;
  } catch (error) {
    failures.push(`${description}\n    threw: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

function contains(haystack, needle, label) {
  return haystack.includes(needle) ? null : `${label} does not contain ${JSON.stringify(needle)}`;
}

console.log(`\nSmoke test: ${PACKAGE}\n`);

// 1. The entry point resolves and carries every promised export.
const api = await import(PACKAGE);

check("the package entry point exports every documented name", () => {
  const missing = REQUIRED_EXPORTS.filter((name) => api[name] === undefined);
  if (missing.length === 0) return null;
  return (
    `missing from the packed entry point: ${missing.join(", ")}\n` +
    "    Either the export was removed from packages/spartant/src/index.ts, or the\n" +
    "    build did not emit it. Update REQUIRED_EXPORTS in smoke/smoke.mjs only when\n" +
    "    the removal is a deliberate, documented public API change."
  );
});

check("the entry point reports its own published name", () =>
  api.packageName === PACKAGE ? null : `packageName is ${JSON.stringify(api.packageName)}`,
);

// 2. Every subpath export resolves and the file behind it has real content.
for (const { specifier, why, markers } of REQUIRED_SUBPATHS) {
  check(`${specifier} resolves and has content`, () => {
    let resolved;
    try {
      resolved = import.meta.resolve(specifier);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : "unknown";
      return (
        `did not resolve (${code}). This subpath is ${why}.\n` +
        `    Check the "exports" map in packages/spartant/package.json and that the\n` +
        "    build actually emits the file it points at."
      );
    }

    const contents = readFileSync(fileURLToPath(resolved), "utf8");
    if (contents.trim() === "") return `resolved to an empty file at ${resolved}`;

    for (const marker of markers) {
      const problem = contains(contents, marker, specifier);
      if (problem) return `${problem}. This subpath is ${why}.`;
    }
    return null;
  });
}

// 3. The compiled consumer code runs and produces the expected markup.
const { renderExamples } = await import("./build/usage.js");
const result = renderExamples();

check("a simple component renders every variant and its loading state", () => {
  for (const marker of ["<button", "bg-primary", "bg-danger", 'aria-busy="true"']) {
    const problem = contains(result.simple, marker, "the simple example markup");
    if (problem) return problem;
  }
  return contains(result.simple, 'role="separator"', "the simple example markup");
});

check("form components render with their invalid state and native semantics", () => {
  for (const marker of [
    "<label",
    'aria-invalid="true"',
    'type="checkbox"',
    'role="switch"',
    "<fieldset",
    "<legend",
    "<textarea",
    'type="radio"',
    "<select",
  ]) {
    const problem = contains(result.form, marker, "the form example markup");
    if (problem) return problem;
  }
  return null;
});

/*
 * `aria-describedby` is deliberately not asserted. A FieldMessage registers
 * itself with its Field in an effect, and effects do not run in a static
 * render, so the association appears on hydration rather than in this markup.
 * Asserting it here would fail for a correct package. The association itself is
 * covered by the Field unit tests and the Storybook interaction tests, which
 * run in a DOM.
 */
check("a Field points its label at the control it labels", () => {
  const label = result.form.match(/<label[^>]*\sfor="([^"]+)"/);
  if (!label?.[1]) return "no label with a `for` attribute was rendered";
  return result.form.includes(`id="${label[1]}"`)
    ? null
    : `the label targets ${label[1]}, and no control carries that id`;
});

check("an overlay component renders as a named native dialog", () => {
  for (const marker of ["<dialog", "aria-labelledby="]) {
    const problem = contains(result.overlay, marker, "the overlay example markup");
    if (problem) return problem;
  }

  const labelled = result.overlay.match(/aria-labelledby="([^"]+)"/);
  if (!labelled?.[1]) return "the dialog has no accessible name reference";
  return result.overlay.includes(`id="${labelled[1]}"`)
    ? null
    : `the dialog is named by ${labelled[1]}, and no element carries that id`;
});

check("a navigation component renders tabs with their relationships intact", () => {
  for (const marker of [
    'role="tablist"',
    'role="tab"',
    'aria-selected="true"',
    'role="tabpanel"',
  ]) {
    const problem = contains(result.navigation, marker, "the navigation example markup");
    if (problem) return problem;
  }

  /*
   * `aria-controls` is deliberately not asserted, for the reason `aria-describedby`
   * is not above: a panel registers with its Tabs in an effect, so a tab only
   * points at its panel after hydration. Every panel names its tab statically,
   * and that is the half a static render can prove.
   */
  const labelled = [...result.navigation.matchAll(/aria-labelledby="([^"]+)"/g)].map((m) => m[1]);
  if (labelled.length === 0) return "no panel is labelled by a tab";
  for (const tab of labelled) {
    if (!result.navigation.includes(`id="${tab}"`)) {
      return `a panel is labelled by ${tab}, and no element carries that id`;
    }
  }
  return null;
});

check("anchored overlays render as a tooltip description and a named non-modal dialog", () => {
  for (const marker of [
    'role="tooltip"',
    'popover="manual"',
    "aria-describedby=",
    'role="dialog"',
    'popover="auto"',
    "popovertarget=",
  ]) {
    const problem = contains(result.anchored, marker, "the anchored example markup");
    if (problem) return problem;
  }

  const described = result.anchored.match(/aria-describedby="([^"]+)"/);
  if (!described?.[1]) return "the tooltip trigger has no description reference";
  if (!result.anchored.includes(`id="${described[1]}"`)) {
    return `the trigger is described by ${described[1]}, and no element carries that id`;
  }

  const invoked = result.anchored.match(/popovertarget="([^"]+)"/);
  if (!invoked?.[1]) return "the popover trigger has no popovertarget";
  return result.anchored.includes(`id="${invoked[1]}"`)
    ? null
    : `the trigger invokes ${invoked[1]}, and no element carries that id`;
});

// 4. The documented theming and class-merging behaviour survives packing.
check("themeScript() returns an inlineable theme bootstrap", () =>
  contains(result.themeScript, "data-theme", "themeScript() output"),
);

check("cn lets the last class win", () =>
  result.mergedClass === "p-4 bg-danger"
    ? null
    : `cn returned ${JSON.stringify(result.mergedClass)}, expected "p-4 bg-danger"`,
);

check("tokenVar resolves a semantic role to its custom property", () =>
  result.primarySurfaceVar === "var(--spartant-color-primary)"
    ? null
    : `tokenVar returned ${JSON.stringify(result.primarySurfaceVar)}`,
);

check("the generated token surface is populated", () =>
  result.semanticTokenCount > 0 ? null : "semanticTokens is empty",
);

if (failures.length > 0) {
  console.error(`\n${failures.length} smoke check(s) failed:\n`);
  for (const failure of failures) {
    console.error(`  FAIL  ${failure}\n`);
  }
  console.error(
    "The packed package does not satisfy the consumer contract. Nothing should be\n" +
      "published until these pass. Re-run with `pnpm smoke:package --keep` to inspect\n" +
      "the installed consumer project.\n",
  );
  process.exit(1);
}

console.log(
  `\nAll ${REQUIRED_EXPORTS.length} exports and every subpath resolved. Smoke test passed.`,
);
