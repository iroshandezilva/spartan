// @vitest-environment happy-dom
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip.js";

const DIR = "packages/spartant/src/components/tooltip";
const upstream = readFileSync(`${DIR}/upstream/tooltip.tsx.txt`, "utf8");
const source = readFileSync(`${DIR}/Tooltip.tsx`, "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

let container: HTMLDivElement;
let root: Root | null = null;

/**
 * A fake clock that only moves forward across tests.
 *
 * The sequential-tooltip window is measured on `Date.now()` at module level.
 * Each `vi.useFakeTimers()` would otherwise restart at the real time, which
 * can be earlier than where the previous test's fake clock ended, and a
 * clock that went backwards looks like a tooltip that just closed.
 */
let clock = Date.now();
function useFakeClock() {
  clock += 60_000;
  vi.useFakeTimers({ now: clock });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
  vi.useRealTimers();
});

async function render(node: React.ReactNode) {
  await act(async () => {
    root = createRoot(container);
    root.render(node);
  });
}

function pointer(type: string, target: Element, pointerType = "mouse") {
  act(() => {
    target.dispatchEvent(
      new PointerEvent(type, { bubbles: true, cancelable: true, pointerType, relatedTarget: null }),
    );
  });
}

/** React synthesises enter and leave from over and out, so those are what get dispatched. */
const hover = (target: Element) => pointer("pointerover", target);
const unhover = (target: Element) => pointer("pointerout", target);

const trigger = () => container.querySelector("button") as HTMLButtonElement;
/** Both triggers and both surfaces of a two-tooltip render, in document order. */
function pair() {
  const buttons = Array.from(container.querySelectorAll("button"));
  const tips = Array.from(container.querySelectorAll<HTMLElement>('[role="tooltip"]'));
  return {
    first: buttons[0] as HTMLButtonElement,
    second: buttons[1] as HTMLButtonElement,
    firstTip: tips[0] as HTMLElement,
    secondTip: tips[1] as HTMLElement,
  };
}
const tooltip = () => container.querySelector('[role="tooltip"]') as HTMLDivElement;
const isOpen = () => tooltip().dataset.state === "open" && !tooltip().hidden;

describe("ownership: the platform replaced the primitive", () => {
  it("records upstream with its provenance and its Radix dependency", () => {
    const provenance = JSON.parse(readFileSync(`${DIR}/upstream/provenance.json`, "utf8")) as {
      entries: { tooltip: { source: string; sha256: string; declaredDependencies: string[] } };
    };
    const entry = provenance.entries.tooltip;
    expect(entry.source).toBe("https://ui.shadcn.com/r/styles/new-york/tooltip.json");
    expect(entry.declaredDependencies).toEqual(["@radix-ui/react-tooltip"]);
    expect(createHash("sha256").update(upstream).digest("hex")).toBe(entry.sha256);
  });

  it("upstream wraps a primitive; the component does not", () => {
    expect(upstream).toContain("@radix-ui/react-tooltip");
    expect(upstream).toContain("TooltipPrimitive.Portal");
    expect(source).not.toContain("@radix-ui");
    expect(source).not.toContain("Portal");
    expect(source).toContain('popover="manual"');
  });

  it("upstream leaks the primitive's props and a Next.js directive; the component does neither", () => {
    expect(upstream).toContain("ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>");
    expect(upstream).toContain('"use client"');
    expect(source).not.toContain("typeof TooltipPrimitive");
    expect(source).not.toContain("use client");
    expect(source).not.toContain("forwardRef");
  });

  it("upstream uses shadcn's vocabulary; the component uses semantic roles", () => {
    for (const foreign of ["bg-primary", "text-xs", "rounded-md", "animate-in", "z-50"]) {
      expect(upstream).toContain(foreign);
      expect(source).not.toContain(foreign);
    }
    expect(source).toContain("bg-foreground text-foreground-inverse");
  });
});

describe("hover", () => {
  it("opens after the delay, not before, and closes when the pointer leaves", async () => {
    useFakeClock();
    await render(
      <Tooltip delay={500}>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    expect(isOpen()).toBe(false);

    hover(trigger());
    expect(isOpen()).toBe(false);
    act(() => vi.advanceTimersByTime(499));
    expect(isOpen()).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(isOpen()).toBe(true);
    expect(tooltip().hasAttribute("data-instant")).toBe(false);

    unhover(trigger());
    expect(isOpen()).toBe(false);
  });

  it("leaving before the delay elapses cancels the open", async () => {
    useFakeClock();
    await render(
      <Tooltip delay={500}>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    hover(trigger());
    act(() => vi.advanceTimersByTime(200));
    unhover(trigger());
    act(() => vi.advanceTimersByTime(1000));
    expect(isOpen()).toBe(false);
  });

  it("a second tooltip right after the first opens without the delay or the animation", async () => {
    useFakeClock();
    await render(
      <>
        <Tooltip delay={500}>
          <TooltipTrigger>Bold</TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>
        <Tooltip delay={500}>
          <TooltipTrigger>Italic</TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>
      </>,
    );
    const { first, second, firstTip, secondTip } = pair();

    hover(first);
    act(() => vi.advanceTimersByTime(500));
    expect(firstTip.getAttribute("data-state")).toBe("open");
    unhover(first);
    expect(firstTip.getAttribute("data-state")).toBe("closed");

    act(() => vi.advanceTimersByTime(100));
    hover(second);
    // No timer advanced: it is already open, and marked instant.
    expect(secondTip.getAttribute("data-state")).toBe("open");
    expect(secondTip.hasAttribute("data-instant")).toBe(true);
  });

  it("a second tooltip after the window has passed waits again", async () => {
    useFakeClock();
    await render(
      <>
        <Tooltip delay={500}>
          <TooltipTrigger>Bold</TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>
        <Tooltip delay={500}>
          <TooltipTrigger>Italic</TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>
      </>,
    );
    const { first, second, secondTip } = pair();

    hover(first);
    act(() => vi.advanceTimersByTime(500));
    unhover(first);
    act(() => vi.advanceTimersByTime(400));
    hover(second);
    expect(secondTip.getAttribute("data-state")).toBe("closed");
    act(() => vi.advanceTimersByTime(500));
    expect(secondTip.getAttribute("data-state")).toBe("open");
    expect(secondTip.hasAttribute("data-instant")).toBe(false);
  });

  it("ignores a touch pointer, which cannot hover", async () => {
    useFakeClock();
    await render(
      <Tooltip delay={500}>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    pointer("pointerover", trigger(), "touch");
    act(() => vi.advanceTimersByTime(1000));
    expect(isOpen()).toBe(false);
  });

  it("does not open from a timer that fires in a hidden tab", async () => {
    useFakeClock();
    await render(
      <Tooltip delay={500}>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    hover(trigger());
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    try {
      act(() => vi.advanceTimersByTime(500));
    } finally {
      Reflect.deleteProperty(document, "visibilityState");
    }
    expect(isOpen()).toBe(false);
    expect(document.visibilityState).toBe("visible");
  });
});

describe("focus and keyboard", () => {
  it("opens immediately on focus and closes on blur", async () => {
    useFakeClock();
    await render(
      <Tooltip delay={500}>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    act(() => trigger().focus());
    expect(isOpen()).toBe(true);
    act(() => trigger().blur());
    expect(isOpen()).toBe(false);
  });

  it("Escape closes it from anywhere, and consumes the key", async () => {
    await render(
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    act(() => trigger().focus());
    expect(isOpen()).toBe(true);
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    act(() => {
      document.body.dispatchEvent(event);
    });
    expect(isOpen()).toBe(false);
    expect(event.defaultPrevented).toBe(true);
  });

  it("a mouse press dismisses, and the focus that follows the press does not reopen", async () => {
    useFakeClock();
    await render(
      <Tooltip delay={500}>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    hover(trigger());
    act(() => vi.advanceTimersByTime(500));
    expect(isOpen()).toBe(true);

    pointer("pointerdown", trigger());
    expect(isOpen()).toBe(false);
    act(() => trigger().focus());
    expect(isOpen()).toBe(false);
    pointer("pointerup", trigger());

    // The next keyboard focus is not swallowed by the flag.
    act(() => trigger().blur());
    act(() => trigger().focus());
    expect(isOpen()).toBe(true);
  });

  it("a touch press does not swallow the focus that follows it", async () => {
    await render(
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    pointer("pointerdown", trigger(), "touch");
    act(() => trigger().focus());
    expect(isOpen()).toBe(true);
  });
});

describe("accessibility", () => {
  it("is the trigger's description, linked whether open or closed", async () => {
    await render(
      <Tooltip>
        <TooltipTrigger aria-label="Save">S</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    expect(tooltip().getAttribute("role")).toBe("tooltip");
    expect(trigger().getAttribute("aria-describedby")).toBe(tooltip().id);
    expect(tooltip().id).not.toBe("");
    // Not dangling: the description element is in the document while closed.
    expect(document.getElementById(tooltip().id)).toBe(tooltip());
  });

  it("a disabled trigger stays focusable, is aria-disabled, and still shows its tooltip", async () => {
    const onClick = vi.fn();
    await render(
      <Tooltip>
        <TooltipTrigger disabled onClick={onClick}>
          Publish
        </TooltipTrigger>
        <TooltipContent>Add a title first</TooltipContent>
      </Tooltip>,
    );
    expect(trigger().hasAttribute("disabled")).toBe(false);
    expect(trigger().getAttribute("aria-disabled")).toBe("true");
    act(() => trigger().focus());
    expect(isOpen()).toBe(true);
    act(() => trigger().click());
    expect(onClick).not.toHaveBeenCalled();
  });

  it("names the anchor on the trigger and points the surface at it", async () => {
    await render(
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    const name = trigger().style.getPropertyValue("anchor-name") || trigger().style.anchorName;
    expect(name).toMatch(/^--spartant-anchor-/);
    const anchor =
      tooltip().style.getPropertyValue("position-anchor") || tooltip().style.positionAnchor;
    expect(anchor).toBe(name);
  });
});

describe("controlled and uncontrolled", () => {
  it("renders open when told to, and reports each change once", async () => {
    const onOpenChange = vi.fn();
    await render(
      <Tooltip open onOpenChange={onOpenChange}>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    expect(isOpen()).toBe(true);
    // Focus reports nothing: it is already open. Blur reports the close.
    act(() => trigger().focus());
    act(() => trigger().blur());
    // Controlled: the state does not move on its own, but the change is reported.
    expect(isOpen()).toBe(true);
    expect(onOpenChange.mock.calls).toEqual([[false]]);
  });

  it("defaultOpen starts open", async () => {
    await render(
      <Tooltip defaultOpen>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    expect(isOpen()).toBe(true);
  });

  it("reports focus then blur as exactly two changes", async () => {
    const onOpenChange = vi.fn();
    await render(
      <Tooltip onOpenChange={onOpenChange}>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    act(() => trigger().focus());
    hover(trigger());
    act(() => trigger().blur());
    unhover(trigger());
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });
});

describe("API", () => {
  it("forwards refs to the button and the surface", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    await render(
      <Tooltip>
        <TooltipTrigger ref={triggerRef}>Save</TooltipTrigger>
        <TooltipContent ref={contentRef}>Saves the draft</TooltipContent>
      </Tooltip>,
    );
    expect(triggerRef.current).toBe(trigger());
    expect(contentRef.current).toBe(tooltip());
  });

  it("keeps every class through cn, and lets the caller's className win", async () => {
    await render(
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent placement="left" className="max-w-none">
          Saves the draft
        </TooltipContent>
      </Tooltip>,
    );
    const classes = tooltip().className.split(" ");
    for (const expected of [
      "fixed",
      "inset-auto",
      "m-control-gap",
      "bg-foreground",
      "text-foreground-inverse",
      "text-body-small",
      "rounded-control",
      "shadow-overlay",
      "pointer-events-none",
      "transition-discrete",
      "duration-press",
      "ease-exit",
      "open:duration-state",
      "open:ease-enter",
      "data-instant:transition-none",
      "[position-area:left]",
      "max-w-none",
    ]) {
      expect(classes, `${expected} was merged away`).toContain(expected);
    }
    expect(classes).not.toContain("max-w-[var(--spartant-tooltip-max-width)]");
    expect(classes).not.toContain("[position-area:top]");
  });

  it("a part outside its Tooltip throws, naming both", async () => {
    // The check has to happen during a render: React 19 refuses to read a
    // context anywhere else, and the message under test comes from the part.
    await expect(
      act(async () => {
        root = createRoot(container);
        root.render(<TooltipTrigger>Orphan</TooltipTrigger>);
      }),
    ).rejects.toThrow("TooltipTrigger must be rendered inside a Tooltip.");
  });
});
