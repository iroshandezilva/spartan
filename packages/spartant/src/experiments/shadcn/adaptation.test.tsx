// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Badge } from "./Badge.js";
import { Switch } from "./Switch.js";

const DIR = "packages/spartant/src/experiments/shadcn";
const upstream = (name: string) => readFileSync(`${DIR}/upstream/${name}.tsx.txt`, "utf8");
/**
 * The adapted source with comments stripped.
 *
 * The comments name every upstream construct that was removed, so asserting
 * against the whole file would match the prose explaining the removal rather
 * than the code doing it.
 */
const adapted = (name: string) =>
  readFileSync(`${DIR}/${name}.tsx`, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.innerHTML = "";
});

async function render(node: React.ReactNode) {
  await act(async () => {
    createRoot(container).render(node);
  });
}

describe("ownership: no primitive library survives adoption", () => {
  it.each(["badge", "switch"])("%s upstream declares a runtime dependency", (name) => {
    // The premise of the experiment. If upstream stopped depending on Radix
    // these assertions would fail and the workflow would need rewriting.
    const provenance = JSON.parse(readFileSync(`${DIR}/upstream/provenance.json`, "utf8")) as {
      entries: Record<string, { declaredDependencies: string[] }>;
    };
    expect(provenance.entries[name]?.declaredDependencies.length).toBeGreaterThan(0);
  });

  it.each(["Badge", "Switch"])("%s carries no shadcn or Radix import", (name) => {
    const source = adapted(name);
    expect(source).not.toContain("@radix-ui");
    expect(source).not.toContain("class-variance-authority");
    expect(source).not.toContain('from "@/');
  });

  it("neither adaptation is exported from the package entry point", () => {
    // Experiment evidence must not become public API by accident. HAUX-45 and
    // HAUX-48 own the real components.
    const index = readFileSync("packages/spartant/src/index.ts", "utf8");
    expect(index).not.toContain("experiments");
  });

  it("adds no dependency to the package manifest", () => {
    const manifest = JSON.parse(readFileSync("packages/spartant/package.json", "utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(manifest.dependencies)).toEqual(["clsx", "tailwind-merge"]);
  });
});

describe("styling: raw values became semantic tokens", () => {
  it("drops the tokens Spartant does not have", () => {
    // `destructive`, `ring`, and `input` are shadcn role names. Keeping them
    // would leave two vocabularies in one codebase.
    for (const name of ["Badge", "Switch"]) {
      const source = adapted(name);
      for (const token of ["bg-destructive", "ring-ring", "bg-input", "text-destructive"]) {
        expect(source, `${name} still uses ${token}`).not.toContain(token);
      }
    }
  });

  it("replaces opacity shortcuts with hover and disabled roles", () => {
    // `bg-primary/80` renders differently on every surface and cannot be
    // contrast-checked. Upstream uses it; the adaptation must not.
    expect(upstream("badge")).toContain("bg-primary/80");
    expect(adapted("Badge")).not.toContain("/80");
    expect(adapted("Badge")).toContain("hover:bg-primary-hover");

    expect(upstream("switch")).toContain("disabled:opacity-50");
    expect(adapted("Switch")).not.toContain("opacity-50");
  });

  it("uses focus-visible rather than focus", () => {
    // Upstream's badge rings on mouse click, which teaches people to ignore it.
    expect(upstream("badge")).toContain("focus:ring-2");
    for (const name of ["Badge", "Switch"]) {
      expect(adapted(name), name).toContain("focus-visible:outline");
      expect(adapted(name), name).not.toMatch(/\bfocus:ring/);
    }
  });

  it("drives motion through tokens so reduced motion needs no per-component work", () => {
    expect(adapted("Switch")).toContain("--spartant-duration-state-change");
  });
});

describe("Badge behaviour", () => {
  it("renders a span, not a div", async () => {
    // Upstream renders a block element inside running text.
    expect(upstream("badge")).toContain("<div");
    await render(<Badge>New</Badge>);
    expect(container.querySelector("span")?.textContent).toBe("New");
    expect(container.querySelector("div")).toBeNull();
  });

  it.each(["primary", "secondary", "danger", "outline"] as const)(
    "renders the %s tone",
    async (tone) => {
      await render(<Badge tone={tone}>Label</Badge>);
      expect(container.querySelector("span")?.className).toBeTruthy();
    },
  );

  it("lets className override the default, merged last", async () => {
    await render(<Badge className="bg-success">Label</Badge>);
    const classes = (container.querySelector("span")?.className ?? "").split(/\s+/);
    expect(classes).toContain("bg-success");
    // Whole-class comparison: `bg-primary` is a substring of the hover class,
    // which a `toContain` on the raw string would match by accident.
    expect(classes).not.toContain("bg-primary");
  });
});

describe("Switch behaviour", () => {
  it("exposes switch semantics a screen reader understands", async () => {
    await render(<Switch aria-label="Notifications" />);
    const button = container.querySelector("button");
    expect(button?.getAttribute("role")).toBe("switch");
    expect(button?.getAttribute("aria-checked")).toBe("false");
    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.getAttribute("aria-label")).toBe("Notifications");
  });

  it("toggles uncontrolled", async () => {
    await render(<Switch aria-label="Toggle" />);
    const button = container.querySelector("button");
    await act(async () => button?.click());
    expect(button?.getAttribute("aria-checked")).toBe("true");
    await act(async () => button?.click());
    expect(button?.getAttribute("aria-checked")).toBe("false");
  });

  it("respects a controlled value and does not self-update", async () => {
    const seen: boolean[] = [];
    await render(<Switch checked={false} onCheckedChange={(v) => seen.push(v)} aria-label="C" />);
    const button = container.querySelector("button");
    await act(async () => button?.click());
    // Controlled means the parent decides. The DOM must not drift from the prop.
    expect(button?.getAttribute("aria-checked")).toBe("false");
    expect(seen).toEqual([true]);
  });

  it("honours defaultChecked", async () => {
    await render(<Switch defaultChecked aria-label="D" />);
    expect(container.querySelector("button")?.getAttribute("aria-checked")).toBe("true");
  });

  it("does not toggle or notify when disabled", async () => {
    const seen: boolean[] = [];
    await render(<Switch disabled onCheckedChange={(v) => seen.push(v)} aria-label="E" />);
    const button = container.querySelector("button");
    await act(async () => button?.click());
    expect(button?.getAttribute("aria-checked")).toBe("false");
    expect(seen).toEqual([]);
    expect(button?.hasAttribute("disabled")).toBe(true);
  });

  it("meets the 44px touch target the standard requires", async () => {
    // Upstream is 20x36. This is the defect most likely to survive a copy-paste,
    // because it looks correct.
    expect(upstream("switch")).toContain("h-5 w-9");
    await render(<Switch aria-label="F" />);
    const cls = container.querySelector("button")?.className ?? "";
    expect(cls).toContain("h-11");
    expect(cls).toContain("w-11");
  });

  it("keeps the visual smaller than the hit area", async () => {
    await render(<Switch aria-label="G" />);
    const track = container.querySelector('button > span[aria-hidden="true"]');
    expect(track?.className).toContain("h-5");
    expect(track?.className).toContain("w-9");
  });

  it("hides the decorative track from assistive technology", async () => {
    await render(<Switch aria-label="H" />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(1);
  });
});

describe("keyboard comes from the platform, not from us", () => {
  it("Switch reimplements no key handling", async () => {
    // The strongest evidence that Space and Enter work is that nothing here
    // interferes with them. A native button already activates on both, so the
    // check is that the adaptation did not replace that with a div and a
    // keydown handler, which is the usual way this gets broken.
    const source = adapted("Switch");
    expect(source).not.toContain("onKeyDown");
    expect(source).not.toContain("onKeyUp");
    expect(source).not.toContain("tabIndex");
    expect(source).toContain('type="button"');
  });

  it("Switch renders a real button, so it is focusable by default", async () => {
    await render(<Switch aria-label="K" />);
    const button = container.querySelector("button");
    expect(button?.tagName).toBe("BUTTON");
    // No tabindex at all is correct: a button is already in the tab sequence,
    // and any explicit value here would be a change for the worse.
    expect(button?.hasAttribute("tabindex")).toBe(false);
  });

  it("upstream relied on the primitive for the same behaviour", () => {
    // Worth pinning: upstream got keyboard support from Radix. The adaptation
    // gets it from the platform. If someone later reintroduces a primitive,
    // this test still passes, and that is fine; it is the div-with-handlers
    // regression this guards against.
    expect(upstream("switch")).toContain("SwitchPrimitives.Root");
  });
});
