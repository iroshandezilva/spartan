// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Field } from "../field/Field.js";
import { FieldMessage } from "../field/FieldMessage.js";
import { Label } from "../field/Label.js";
import { Select } from "./Select.js";

const DIR = import.meta.dirname;
const upstream = readFileSync(resolve(DIR, "upstream/select.tsx.txt"), "utf8");
/**
 * The owned source with comments stripped, so an assertion that a construct
 * is absent cannot be satisfied by the prose explaining why it was left out.
 */
const owned = readFileSync(resolve(DIR, "Select.tsx"), "utf8")
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

async function render(node: ReactNode) {
  await act(async () => {
    createRoot(container).render(node);
  });
}

function select(): HTMLSelectElement {
  const element = container.querySelector("select");
  if (!element) throw new Error("no select rendered");
  return element;
}

/** Picks an option the way a user would, dispatching the event React listens for. */
async function choose(value: string) {
  await act(async () => {
    const element = select();
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

const options = (
  <>
    <option value="gb">United Kingdom</option>
    <option value="lk">Sri Lanka</option>
    <option value="nz">New Zealand</option>
  </>
);

describe("decision: native select, no primitive", () => {
  it("upstream is a Radix listbox with a runtime dependency", () => {
    // The premise of the decision. If shadcn stopped shipping Select on a
    // primitive, the comparison in README.md would need rewriting.
    const provenance = JSON.parse(
      readFileSync(resolve(DIR, "upstream/provenance.json"), "utf8"),
    ) as {
      entries: Record<string, { declaredDependencies: string[] }>;
    };
    expect(provenance.entries.select?.declaredDependencies).toEqual(["@radix-ui/react-select"]);
    expect(upstream).toContain("SelectPrimitive.Root");
  });

  it("the owned source carries no primitive, icon library, or Next.js directive", () => {
    for (const marker of ["@radix-ui", "@base-ui", "lucide-react", '"use client"', 'from "@/']) {
      expect(owned, marker).not.toContain(marker);
    }
  });

  it("renders a native select rather than a button wearing a role", async () => {
    await render(<Select aria-label="Country">{options}</Select>);
    expect(select().tagName).toBe("SELECT");
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("[role]")).toBeNull();
  });

  it("reimplements no keyboard handling", () => {
    // Arrow keys, typeahead, Escape, and focus return are the platform's. The
    // usual way that gets broken is a keydown handler, so its absence is the
    // assertion.
    for (const handler of ["onKeyDown", "onKeyUp", "tabIndex"]) {
      expect(owned).not.toContain(handler);
    }
  });

  it("adds no dependency to the package manifest", () => {
    const manifest = JSON.parse(readFileSync(resolve(DIR, "../../../package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(manifest.dependencies)).toEqual(["clsx", "tailwind-merge"]);
  });
});

describe("styling: shadcn vocabulary became Spartant roles", () => {
  it("drops the shadcn token names and opacity shortcuts upstream uses", () => {
    expect(upstream).toContain("disabled:opacity-50");
    expect(upstream).toContain("border-input");
    expect(upstream).toContain("focus:ring-1");
    for (const marker of ["opacity-50", "border-input", "ring-ring", "bg-popover", "focus:ring"]) {
      expect(owned, marker).not.toContain(marker);
    }
  });

  it("names the properties it transitions", () => {
    // `transition-colors` would animate the focus ring. The shared control
    // styles name border and background only, and this file adds nothing.
    expect(owned).not.toMatch(/transition-(all|colors)\b/);
    expect(owned).not.toMatch(/(^|[\s"'`])transition([\s"'`]|$)/m);
  });

  it("keeps every class it wrote after merging, with the caller's last", async () => {
    await render(
      <Select aria-label="Country" className="max-w-xs bg-surface-muted">
        {options}
      </Select>,
    );
    const classes = select().className.split(/\s+/);
    for (const expected of [
      "appearance-none",
      "truncate",
      "h-[var(--spartant-field-height-md)]",
      "pr-[calc(var(--spartant-field-padding-x)*2+1rem)]",
      "has-[option[value='']:checked]:text-foreground-muted",
      "aria-invalid:border-danger",
      "focus-visible:outline-focus-ring",
      "max-w-xs",
      "bg-surface-muted",
    ]) {
      expect(classes, expected).toContain(expected);
    }
    // The caller's background replaced the default rather than sitting beside it.
    expect(classes).not.toContain("bg-surface");
    // A select is never `:read-write`, so `:read-only` always matches it and
    // the shared read-only tint has to be overridden, not merely outranked.
    // Measured in Chrome: without the override the surface read 0.95 L.
    expect(classes).toContain("read-only:bg-surface");
    expect(classes).not.toContain("read-only:bg-surface-muted");
  });
});

describe("placeholder", () => {
  it("renders as a first option with an empty value, selected by default", async () => {
    await render(
      <Select aria-label="Country" placeholder="Choose a country">
        {options}
      </Select>,
    );
    const first = select().options[0];
    expect(first?.value).toBe("");
    expect(first?.textContent).toBe("Choose a country");
    expect(first?.disabled).toBe(false);
    expect(select().value).toBe("");
  });

  it("is disabled, and still the initial selection, when the control is required", async () => {
    await render(
      <Select aria-label="Country" placeholder="Choose a country" required>
        {options}
      </Select>,
    );
    expect(select().options[0]?.disabled).toBe(true);
    // The selectedness algorithm would otherwise skip a disabled first option
    // and show "United Kingdom" as though it had been chosen.
    expect(select().value).toBe("");
  });

  it("does not override a default value the caller supplied", async () => {
    await render(
      <Select aria-label="Country" placeholder="Choose a country" defaultValue="lk">
        {options}
      </Select>,
    );
    expect(select().value).toBe("lk");
  });

  it("is absent when no placeholder is given", async () => {
    await render(<Select aria-label="Country">{options}</Select>);
    expect(select().options).toHaveLength(3);
    expect(select().value).toBe("gb");
  });
});

describe("controlled and uncontrolled", () => {
  it("uncontrolled: the DOM holds the value and both callbacks fire", async () => {
    const seen: string[] = [];
    const events: string[] = [];
    await render(
      <Select
        aria-label="Country"
        placeholder="Choose"
        onValueChange={(value) => seen.push(value)}
        onChange={(event) => events.push(event.currentTarget.value)}
      >
        {options}
      </Select>,
    );
    await choose("nz");
    expect(select().value).toBe("nz");
    expect(seen).toEqual(["nz"]);
    expect(events).toEqual(["nz"]);
  });

  it("controlled: the parent decides and the DOM does not drift", async () => {
    const seen: string[] = [];
    await render(
      <Select aria-label="Country" value="gb" onValueChange={(value) => seen.push(value)}>
        {options}
      </Select>,
    );
    await choose("lk");
    expect(seen).toEqual(["lk"]);
    expect(select().value).toBe("gb");
  });

  it("controlled with an empty value shows the placeholder", async () => {
    await render(
      <Select aria-label="Country" placeholder="Choose" value="" onChange={() => {}}>
        {options}
      </Select>,
    );
    expect(select().value).toBe("");
  });
});

describe("inside a Field", () => {
  it("reads id, invalid, described-by, required, and disabled from the field", async () => {
    await render(
      <Field invalid required disabled>
        <Label>Country</Label>
        <Select placeholder="Choose a country">{options}</Select>
        <FieldMessage>Where the invoice is addressed.</FieldMessage>
        <FieldMessage tone="error">Choose a country.</FieldMessage>
      </Field>,
    );
    const element = select();
    const label = container.querySelector("label");
    expect(label?.getAttribute("for")).toBe(element.id);
    expect(element.id).not.toBe("");
    expect(element.getAttribute("aria-invalid")).toBe("true");
    expect(element.required).toBe(true);
    expect(element.disabled).toBe(true);

    const ids = element.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(ids).toHaveLength(2);
    const texts = ids.map((id) => document.getElementById(id)?.textContent);
    expect(texts[0]).toContain("invoice");
    expect(texts[1]).toContain("Choose a country");
  });

  it("has no described-by at all when the field has no messages", async () => {
    await render(
      <Field>
        <Label>Country</Label>
        <Select>{options}</Select>
      </Field>,
    );
    expect(select().hasAttribute("aria-describedby")).toBe(false);
    expect(select().hasAttribute("aria-invalid")).toBe(false);
  });

  it("lets an explicit prop win over the field", async () => {
    await render(
      <Field disabled>
        <Label>Country</Label>
        <Select disabled={false}>{options}</Select>
      </Field>,
    );
    expect(select().disabled).toBe(false);
  });
});

describe("form participation", () => {
  it("submits under its name with the chosen value", async () => {
    await render(
      <form>
        <Select aria-label="Country" name="country" placeholder="Choose">
          {options}
        </Select>
      </form>,
    );
    const form = container.querySelector("form");
    if (!form) throw new Error("no form");
    expect(new FormData(form).get("country")).toBe("");
    await choose("lk");
    expect(new FormData(form).get("country")).toBe("lk");
  });

  it("a required select with only the placeholder chosen is invalid", async () => {
    await render(
      <Select aria-label="Country" name="country" placeholder="Choose" required>
        {options}
      </Select>,
    );
    expect(select().checkValidity()).toBe(false);
    await choose("gb");
    expect(select().checkValidity()).toBe(true);
  });
});

describe("chevron", () => {
  it("is decorative and lets a press through to the control", async () => {
    await render(<Select aria-label="Country">{options}</Select>);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.className.baseVal ?? svg?.getAttribute("class")).toContain("pointer-events-none");
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it("does not rotate or animate: nothing in the source reads an open state", () => {
    expect(owned).not.toMatch(/open|rotate/);
  });
});

describe("refs and native props", () => {
  it("forwards the ref to the select", async () => {
    let node: HTMLSelectElement | null = null;
    await render(
      <Select
        aria-label="Country"
        ref={(element) => {
          node = element;
        }}
      >
        {options}
      </Select>,
    );
    expect(node).toBe(select());
  });

  it("passes optgroup children through untouched", async () => {
    await render(
      <Select aria-label="Region">
        <optgroup label="Europe">
          <option value="gb">United Kingdom</option>
        </optgroup>
        <optgroup label="Asia">
          <option value="lk">Sri Lanka</option>
        </optgroup>
      </Select>,
    );
    expect(container.querySelectorAll("optgroup")).toHaveLength(2);
    expect(select().options).toHaveLength(2);
  });
});
