// @vitest-environment happy-dom
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "./Popover.js";

const DIR = "packages/spartant/src/components/popover";
const upstream = readFileSync(`${DIR}/upstream/popover.tsx.txt`, "utf8");
const source = readFileSync(`${DIR}/Popover.tsx`, "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

let container: HTMLDivElement;
let root: Root | null = null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
});

async function render(node: React.ReactNode) {
  await act(async () => {
    root = createRoot(container);
    root.render(node);
  });
}

const trigger = () => container.querySelector('[aria-haspopup="dialog"]') as HTMLButtonElement;
const dialog = () => container.querySelector('[role="dialog"]') as HTMLDivElement;
const isOpen = () => dialog().dataset.state === "open" && !dialog().hidden;

function click(target: Element) {
  act(() => {
    target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }));
    (target as HTMLElement).click();
  });
}

function key(target: Element, keyName: string) {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: keyName, bubbles: true, cancelable: true }),
    );
  });
}

function Example({ description = false }: { description?: boolean }) {
  return (
    <div>
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Filter results</PopoverTitle>
          {description ? <PopoverDescription>Narrow the list.</PopoverDescription> : null}
          <input aria-label="Search" />
          <PopoverClose>Done</PopoverClose>
        </PopoverContent>
      </Popover>
      <p>Outside</p>
    </div>
  );
}

describe("ownership: the platform replaced the primitive", () => {
  it("records upstream with its provenance and its Radix dependency", () => {
    const provenance = JSON.parse(readFileSync(`${DIR}/upstream/provenance.json`, "utf8")) as {
      entries: { popover: { source: string; sha256: string; declaredDependencies: string[] } };
    };
    const entry = provenance.entries.popover;
    expect(entry.source).toBe("https://ui.shadcn.com/r/styles/new-york/popover.json");
    expect(entry.declaredDependencies).toEqual(["@radix-ui/react-popover"]);
    expect(createHash("sha256").update(upstream).digest("hex")).toBe(entry.sha256);
  });

  it("upstream wraps a primitive in a portal; the component uses the top layer", () => {
    expect(upstream).toContain("@radix-ui/react-popover");
    expect(upstream).toContain("PopoverPrimitive.Portal");
    expect(source).not.toContain("@radix-ui");
    expect(source).not.toContain("Portal");
    expect(source).toContain('popover="auto"');
    expect(source).toContain("popoverTarget=");
  });

  it("upstream leaks the primitive's props and a Next.js directive; the component does neither", () => {
    expect(upstream).toContain("ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>");
    expect(upstream).toContain('"use client"');
    expect(source).not.toContain("typeof PopoverPrimitive");
    expect(source).not.toContain("use client");
    expect(source).not.toContain("forwardRef");
  });

  it("upstream uses shadcn's vocabulary; the component uses semantic roles", () => {
    for (const foreign of ["bg-popover", "text-popover-foreground", "shadow-md", "w-72", "z-50"]) {
      expect(upstream).toContain(foreign);
      expect(source).not.toContain(foreign);
    }
    expect(source).toContain("bg-surface-elevated");
  });
});

describe("open and close", () => {
  it("the trigger opens it, and it is a named dialog with an expanded trigger", async () => {
    await render(<Example />);
    expect(isOpen()).toBe(false);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("popovertarget")).toBe(dialog().id);

    click(trigger());
    expect(isOpen()).toBe(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    const labelledBy = dialog().getAttribute("aria-labelledby") ?? "";
    expect(document.getElementById(labelledBy)?.textContent).toBe("Filter results");
  });

  it("moves focus to the first focusable element on open", async () => {
    await render(<Example />);
    click(trigger());
    expect(document.activeElement).toBe(container.querySelector("input"));
  });

  it("prefers an autofocus element", async () => {
    await render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Two fields">
          <input aria-label="First" />
          {/* biome-ignore lint/a11y/noAutofocus: the behaviour under test is that a caller's autofocus wins over document order. */}
          <input aria-label="Second" autoFocus />
        </PopoverContent>
      </Popover>,
    );
    click(trigger());
    expect(document.activeElement).toBe(container.querySelector('[aria-label="Second"]'));
  });

  it("leaves focus on the trigger when there is nothing to focus", async () => {
    await render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Just text</PopoverTitle>
        </PopoverContent>
      </Popover>,
    );
    act(() => trigger().focus());
    click(trigger());
    expect(isOpen()).toBe(true);
    expect(document.activeElement).toBe(trigger());
    // Escape still reaches it from there.
    key(trigger(), "Escape");
    expect(isOpen()).toBe(false);
  });

  it("Escape inside closes it and returns focus to the trigger", async () => {
    await render(<Example />);
    click(trigger());
    const input = container.querySelector("input") as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    key(input, "Escape");
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });

  it("the close part closes it and returns focus to the trigger", async () => {
    await render(<Example />);
    click(trigger());
    click(container.querySelector('[role="dialog"] button') as HTMLButtonElement);
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });

  it("a press outside closes it", async () => {
    await render(<Example />);
    click(trigger());
    expect(isOpen()).toBe(true);
    act(() => {
      (container.querySelector("p") as HTMLElement).dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true }),
      );
    });
    expect(isOpen()).toBe(false);
  });

  it("a press inside does not close it", async () => {
    await render(<Example />);
    click(trigger());
    act(() => {
      (container.querySelector("input") as HTMLElement).dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true }),
      );
    });
    expect(isOpen()).toBe(true);
  });

  it("does not steal focus back when the user put it elsewhere", async () => {
    await render(
      <div>
        <Example />
        <button type="button">Elsewhere</button>
      </div>,
    );
    click(trigger());
    const elsewhere = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Elsewhere",
    ) as HTMLButtonElement;
    act(() => elsewhere.focus());
    act(() => {
      elsewhere.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(elsewhere);
  });

  it("a natively disabled trigger cannot open it", async () => {
    await render(
      <Popover>
        <PopoverTrigger disabled>Open</PopoverTrigger>
        <PopoverContent aria-label="Never">Never shown</PopoverContent>
      </Popover>,
    );
    click(trigger());
    expect(isOpen()).toBe(false);
  });

  it("survives rapid open and close", async () => {
    const onOpenChange = vi.fn();
    await render(
      <Popover onOpenChange={onOpenChange}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Rapid">
          <PopoverClose>Close</PopoverClose>
        </PopoverContent>
      </Popover>,
    );
    for (let index = 0; index < 5; index += 1) {
      click(trigger());
      click(container.querySelector('[role="dialog"] button') as HTMLButtonElement);
    }
    expect(isOpen()).toBe(false);
    expect(onOpenChange).toHaveBeenCalledTimes(10);
  });
});

describe("accessibility", () => {
  it("sets aria-describedby only when a description is rendered", async () => {
    await render(<Example />);
    expect(dialog().hasAttribute("aria-describedby")).toBe(false);
    act(() => root?.unmount());
    root = null;
    await render(<Example description />);
    const describedBy = dialog().getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy)?.textContent).toBe("Narrow the list.");
  });

  it("takes an aria-label as its name when there is no title", async () => {
    await render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Colour picker">Swatches</PopoverContent>
      </Popover>,
    );
    expect(dialog().getAttribute("aria-label")).toBe("Colour picker");
    expect(dialog().hasAttribute("aria-labelledby")).toBe(false);
  });

  it("names the anchor on the trigger and points the surface at it", async () => {
    await render(<Example />);
    const name = trigger().style.getPropertyValue("anchor-name") || trigger().style.anchorName;
    expect(name).toMatch(/^--spartant-anchor-/);
    const anchor =
      dialog().style.getPropertyValue("position-anchor") || dialog().style.positionAnchor;
    expect(anchor).toBe(name);
  });
});

describe("controlled and uncontrolled", () => {
  it("renders open when told to and reports a dismissal once", async () => {
    const onOpenChange = vi.fn();
    await render(
      <Popover open onOpenChange={onOpenChange}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Controlled">
          <PopoverClose>Close</PopoverClose>
        </PopoverContent>
      </Popover>,
    );
    expect(isOpen()).toBe(true);
    click(container.querySelector('[role="dialog"] button') as HTMLButtonElement);
    expect(isOpen()).toBe(true);
    expect(onOpenChange.mock.calls).toEqual([[false]]);
  });

  it("defaultOpen starts open and focused", async () => {
    await render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Default open">
          <input aria-label="Field" />
        </PopoverContent>
      </Popover>,
    );
    expect(isOpen()).toBe(true);
    expect(document.activeElement).toBe(container.querySelector("input"));
  });

  it("does not touch focus on a closed mount", async () => {
    await render(<Example />);
    expect(document.activeElement).toBe(document.body);
  });
});

describe("API", () => {
  it("forwards refs to the button and the surface", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    await render(
      <Popover>
        <PopoverTrigger ref={triggerRef}>Open</PopoverTrigger>
        <PopoverContent ref={contentRef} aria-label="Refs">
          Content
        </PopoverContent>
      </Popover>,
    );
    expect(triggerRef.current).toBe(trigger());
    expect(contentRef.current).toBe(dialog());
  });

  it("keeps every class through cn, and lets the caller's className win", async () => {
    await render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent placement="right" className="w-96" aria-label="Wide">
          Content
        </PopoverContent>
      </Popover>,
    );
    const classes = dialog().className.split(" ");
    for (const expected of [
      "fixed",
      "inset-auto",
      "m-control-gap",
      "bg-surface-elevated",
      "text-foreground",
      "border-border",
      "rounded-surface",
      "shadow-overlay",
      "text-body",
      "transition-discrete",
      "duration-overlay-exit",
      "ease-exit",
      "open:duration-overlay-enter",
      "open:ease-enter",
      "[position-area:right]",
      "w-96",
    ]) {
      expect(classes, `${expected} was merged away`).toContain(expected);
    }
    expect(classes).not.toContain("w-[var(--spartant-popover-width)]");
    expect(classes).not.toContain("[position-area:bottom]");
  });

  it("a part outside its Popover throws, naming both", async () => {
    await expect(
      act(async () => {
        root = createRoot(container);
        root.render(<PopoverTitle>Orphan</PopoverTitle>);
      }),
    ).rejects.toThrow("PopoverTitle must be rendered inside a Popover.");
  });
});
