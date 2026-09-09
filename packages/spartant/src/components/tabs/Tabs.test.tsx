// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { act, Component, type ErrorInfo, type ReactNode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Tab, Tabs, TabsList, TabsPanel } from "./Tabs.js";

/**
 * Behaviour that must hold whatever the stories render, plus the assertions
 * that the shadcn adaptation stayed adapted. Interaction through real user
 * events lives in `apps/storybook/src/stories/Tabs.stories.tsx`; this file
 * covers the logic a story would only exercise by accident.
 */

const DIR = "packages/spartant/src/components/tabs";
const upstream = readFileSync(`${DIR}/upstream/tabs.tsx.txt`, "utf8");
/** The adapted source with comments stripped, so prose about a removal cannot match. */
const adapted = readFileSync(`${DIR}/Tabs.tsx`, "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  document.body.innerHTML = "";
});

async function render(node: React.ReactNode) {
  await act(async () => {
    root.render(node);
  });
}

const tabs = () => Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
const tab = (name: string) =>
  tabs().find((element) => element.textContent === name) as HTMLButtonElement;
const panels = () => Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

async function press(target: HTMLElement, key: string) {
  await act(async () => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}

async function focus(target: HTMLElement) {
  await act(async () => {
    target.focus();
  });
}

/**
 * A pointer click, as a browser sequences it: pointerdown, then focus, then
 * click, each a discrete event React commits before the next one fires. One
 * `act` per event reproduces that; putting all three in one would hold the
 * commit back and make the click see the state from before the focus.
 */
async function click(target: HTMLElement) {
  await act(async () => {
    target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
  await focus(target);
  await act(async () => {
    target.click();
  });
}

/** Catches a render-time throw so the message can be asserted. */
class Boundary extends Component<{ children: ReactNode }, { message: string | null }> {
  override state = { message: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }
  override componentDidCatch(_error: Error, _info: ErrorInfo) {}
  override render() {
    return this.state.message ? <p data-error>{this.state.message}</p> : this.props.children;
  }
}

let orphanKey = 0;

async function renderOrphan(node: ReactNode): Promise<string | null> {
  // React logs the caught error to the console. That is expected here, and
  // silencing it keeps the test output readable. The key gives every call a
  // fresh boundary rather than one that remembers the previous error.
  const original = console.error;
  console.error = () => {};
  try {
    orphanKey += 1;
    await render(<Boundary key={orphanKey}>{node}</Boundary>);
  } finally {
    console.error = original;
  }
  return container.querySelector("[data-error]")?.textContent ?? null;
}

function Example(props: Partial<React.ComponentProps<typeof Tabs>>) {
  return (
    <Tabs defaultValue="one" {...props}>
      <TabsList aria-label="Example">
        <Tab value="one">One</Tab>
        <Tab value="two">Two</Tab>
        <Tab value="three" disabled>
          Three
        </Tab>
        <Tab value="four">Four</Tab>
      </TabsList>
      <TabsPanel value="one">Panel one</TabsPanel>
      <TabsPanel value="two">Panel two</TabsPanel>
      <TabsPanel value="three">Panel three</TabsPanel>
      <TabsPanel value="four">Panel four</TabsPanel>
    </Tabs>
  );
}

describe("ownership: the adaptation stayed adapted", () => {
  it("upstream declares the Radix dependency this adaptation removed", () => {
    const provenance = JSON.parse(readFileSync(`${DIR}/upstream/provenance.json`, "utf8")) as {
      entries: Record<string, { declaredDependencies: string[] }>;
    };
    expect(provenance.entries["tabs"]?.declaredDependencies).toEqual(["@radix-ui/react-tabs"]);
    expect(upstream).toContain("@radix-ui/react-tabs");
  });

  it("carries no shadcn, Radix, or primitive import", () => {
    expect(adapted).not.toContain("@radix-ui");
    expect(adapted).not.toContain("@base-ui");
    expect(adapted).not.toContain('from "@/');
    expect(adapted).not.toContain("use client");
    expect(adapted).not.toContain("forwardRef");
  });

  it("adds no dependency to the package manifest", () => {
    const manifest = JSON.parse(readFileSync("packages/spartant/package.json", "utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(manifest.dependencies)).toEqual(["clsx", "tailwind-merge"]);
  });

  it("uses no shadcn token, opacity shortcut, or Radix state attribute", () => {
    // Each of these is in the upstream text, which is what makes the negative
    // assertion mean something. Upstream's broad transition utility is not
    // listed: `tooling/tokens/focus-immediacy.test.ts` already forbids it in
    // every component, and naming it here would trip that gate on this file.
    for (const token of [
      "bg-muted",
      "text-muted-foreground",
      "ring-ring",
      "ring-offset-background",
      "disabled:opacity-50",
      "data-[state=active]",
    ]) {
      expect(upstream, `upstream premise: ${token}`).toContain(token);
      expect(adapted, `adaptation still uses ${token}`).not.toContain(token);
    }
  });
});

describe("roles and relationships", () => {
  it("renders the tablist, tabs, and panels with matching ids", async () => {
    await render(<Example />);

    const list = container.querySelector('[role="tablist"]');
    expect(list?.getAttribute("aria-orientation")).toBe("horizontal");
    expect(tabs()).toHaveLength(4);
    expect(panels()).toHaveLength(4);

    for (const element of tabs()) {
      const panel = document.getElementById(element.getAttribute("aria-controls") ?? "");
      expect(panel, `panel for ${element.textContent}`).not.toBeNull();
      expect(panel?.getAttribute("role")).toBe("tabpanel");
      expect(panel?.getAttribute("aria-labelledby")).toBe(element.id);
    }
  });

  it("only claims to control a panel that exists", async () => {
    await render(
      <Tabs defaultValue="a">
        <TabsList>
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabsList>
        <TabsPanel value="a">A content</TabsPanel>
      </Tabs>,
    );
    expect(tab("A").getAttribute("aria-controls")).toBe(panels()[0]?.id);
    // A reference to an id that is not in the document is an invalid ARIA
    // value. Tabs rendered as navigation have no panels, and must not fail axe.
    expect(tab("B").hasAttribute("aria-controls")).toBe(false);
  });

  it("makes a value with whitespace into a valid id", async () => {
    await render(
      <Tabs defaultValue="all mail" id="mail">
        <TabsList>
          <Tab value="all mail">All mail</Tab>
        </TabsList>
        <TabsPanel value="all mail">Everything</TabsPanel>
      </Tabs>,
    );
    expect(tab("All mail").id).toBe("mail-tab-all-mail");
    expect(document.querySelector("#mail-panel-all-mail")?.getAttribute("aria-labelledby")).toBe(
      "mail-tab-all-mail",
    );
  });

  it("derives every id from the root id when one is supplied", async () => {
    await render(<Example id="project" />);
    expect(tab("One").id).toBe("project-tab-one");
    expect(tab("One").getAttribute("aria-controls")).toBe("project-panel-one");
    expect(document.getElementById("project-panel-one")?.getAttribute("aria-labelledby")).toBe(
      "project-tab-one",
    );
  });

  it("gives two instances distinct ids", async () => {
    await render(
      <>
        <Example />
        <Example />
      </>,
    );
    const ids = tabs().map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks the selected tab and hides the other panels", async () => {
    await render(<Example />);
    expect(tab("One").getAttribute("aria-selected")).toBe("true");
    expect(tab("Two").getAttribute("aria-selected")).toBe("false");
    const [one, two] = panels();
    expect(one?.hidden).toBe(false);
    expect(two?.hidden).toBe(true);
    // A hidden panel keeps its element, so aria-controls always resolves, and
    // drops its children, so it costs nothing until shown.
    expect(one?.textContent).toBe("Panel one");
    expect(two?.textContent).toBe("");
  });

  it("keeps a panel's children mounted on request", async () => {
    await render(
      <Tabs defaultValue="a">
        <TabsList>
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabsList>
        <TabsPanel value="a">A content</TabsPanel>
        <TabsPanel value="b" keepMounted>
          B content
        </TabsPanel>
      </Tabs>,
    );
    const [, b] = panels();
    expect(b?.hidden).toBe(true);
    expect(b?.textContent).toBe("B content");
  });

  it("throws with a message naming the part and the parent when used alone", async () => {
    expect(await renderOrphan(<Tab value="x">Orphan</Tab>)).toBe(
      "Tab must be rendered inside a Tabs.",
    );
    expect(await renderOrphan(<TabsList />)).toBe("TabsList must be rendered inside a Tabs.");
    expect(await renderOrphan(<TabsPanel value="x" />)).toBe(
      "TabsPanel must be rendered inside a Tabs.",
    );
  });
});

describe("roving tabindex", () => {
  it("makes the selected tab the only tab stop", async () => {
    await render(<Example />);
    expect(tabs().map((element) => element.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  it("falls back to the first enabled tab when nothing is selected", async () => {
    await render(<Example defaultValue={undefined} />);
    expect(tabs().map((element) => element.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(tabs().every((element) => element.getAttribute("aria-selected") === "false")).toBe(true);
  });

  it("falls back when the selected tab is disabled, and returns when it is not", async () => {
    await render(<Example defaultValue="three" />);
    // "three" is disabled, so it cannot hold the stop. "One" does instead.
    expect(tabs().map((element) => element.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(tab("Three").getAttribute("aria-selected")).toBe("true");

    await render(<Example defaultValue="three" value="two" />);
    expect(tabs().map((element) => element.tabIndex)).toEqual([-1, 0, -1, -1]);
  });

  it("moves the stop with the selection", async () => {
    await render(<Example />);
    await click(tab("Two"));
    expect(tabs().map((element) => element.tabIndex)).toEqual([-1, 0, -1, -1]);
  });
});

describe("keyboard", () => {
  it("moves and selects with the horizontal arrow keys, skipping disabled and wrapping", async () => {
    await render(<Example />);
    await focus(tab("One"));

    await press(tab("One"), "ArrowRight");
    expect(document.activeElement).toBe(tab("Two"));
    expect(tab("Two").getAttribute("aria-selected")).toBe("true");

    // "Three" is disabled and skipped.
    await press(tab("Two"), "ArrowRight");
    expect(document.activeElement).toBe(tab("Four"));
    expect(tab("Four").getAttribute("aria-selected")).toBe("true");

    // Wraps from the end to the start.
    await press(tab("Four"), "ArrowRight");
    expect(document.activeElement).toBe(tab("One"));

    // And from the start to the end, going the other way.
    await press(tab("One"), "ArrowLeft");
    expect(document.activeElement).toBe(tab("Four"));
  });

  it("jumps with Home and End", async () => {
    await render(<Example />);
    await focus(tab("One"));
    await press(tab("One"), "End");
    expect(document.activeElement).toBe(tab("Four"));
    await press(tab("Four"), "Home");
    expect(document.activeElement).toBe(tab("One"));
  });

  it("ignores the cross-axis arrows for the orientation", async () => {
    await render(<Example />);
    await focus(tab("One"));
    await press(tab("One"), "ArrowDown");
    expect(document.activeElement).toBe(tab("One"));
  });

  it("uses the vertical arrow keys when vertical", async () => {
    await render(<Example orientation="vertical" />);
    expect(container.querySelector('[role="tablist"]')?.getAttribute("aria-orientation")).toBe(
      "vertical",
    );
    await focus(tab("One"));
    await press(tab("One"), "ArrowDown");
    expect(document.activeElement).toBe(tab("Two"));
    await press(tab("Two"), "ArrowUp");
    expect(document.activeElement).toBe(tab("One"));
    await press(tab("One"), "ArrowRight");
    expect(document.activeElement).toBe(tab("One"));
  });

  it("consumes the navigation keys so the page does not scroll", async () => {
    await render(<Example />);
    await focus(tab("One"));
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    await act(async () => {
      tab("One").dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });

  it("does nothing for a key the caller already handled", async () => {
    await render(
      <Tabs defaultValue="a">
        <TabsList onKeyDown={(event) => event.preventDefault()}>
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabsList>
      </Tabs>,
    );
    await focus(tab("A"));
    await press(tab("A"), "ArrowRight");
    expect(document.activeElement).toBe(tab("A"));
  });
});

describe("activation", () => {
  it("manual: arrows move focus without selecting, and a click selects", async () => {
    await render(<Example activation="manual" />);
    await focus(tab("One"));
    await press(tab("One"), "ArrowRight");
    expect(document.activeElement).toBe(tab("Two"));
    expect(tab("One").getAttribute("aria-selected")).toBe("true");
    expect(tab("Two").getAttribute("aria-selected")).toBe("false");

    // Enter and Space on a native button dispatch a click; that is the path.
    await act(async () => {
      tab("Two").click();
    });
    expect(tab("Two").getAttribute("aria-selected")).toBe("true");
    expect(panels()[1]?.hidden).toBe(false);
  });

  it("automatic: focus alone selects", async () => {
    await render(<Example />);
    await focus(tab("Two"));
    expect(tab("Two").getAttribute("aria-selected")).toBe("true");
  });
});

describe("controlled and uncontrolled", () => {
  it("uncontrolled: selection changes and onValueChange reports it", async () => {
    const seen: string[] = [];
    await render(<Example onValueChange={(value) => seen.push(value)} />);
    await click(tab("Two"));
    expect(tab("Two").getAttribute("aria-selected")).toBe("true");
    expect(seen).toEqual(["two"]);
  });

  it("controlled: selection follows the prop and reports the request once per interaction", async () => {
    const seen: string[] = [];
    await render(<Example value="one" onValueChange={(value) => seen.push(value)} />);
    await click(tab("Two"));
    // The parent did not update, so the selection did not move. The click
    // arrived as focus then click, and the parent heard about it once.
    expect(tab("One").getAttribute("aria-selected")).toBe("true");
    expect(tab("Two").getAttribute("aria-selected")).toBe("false");
    expect(seen).toEqual(["two"]);

    // A second, separate click on the same tab asks again.
    await click(tab("Two"));
    expect(seen).toEqual(["two", "two"]);
  });

  it("controlled: a tab that lost the selection while focused can be re-selected by click", async () => {
    function Controlled() {
      const [value, setValue] = useState("one");
      return (
        <>
          <button type="button" onClick={() => setValue("four")}>
            Jump to four
          </button>
          <Example value={value} onValueChange={setValue} />
        </>
      );
    }
    await render(<Controlled />);
    await click(tab("Two"));
    expect(tab("Two").getAttribute("aria-selected")).toBe("true");
    // Something else moves the selection while focus stays on "Two".
    await act(async () => {
      container.querySelector("button")?.click();
    });
    expect(tab("Four").getAttribute("aria-selected")).toBe("true");
    // Clicking the focused tab must still select it: focus will not fire
    // again, so the click has to carry the request.
    await click(tab("Two"));
    expect(tab("Two").getAttribute("aria-selected")).toBe("true");
  });

  it("controlled: a parent that updates moves the selection and the panel", async () => {
    function Controlled() {
      const [value, setValue] = useState("one");
      return <Example value={value} onValueChange={setValue} />;
    }
    await render(<Controlled />);
    await click(tab("Four"));
    expect(tab("Four").getAttribute("aria-selected")).toBe("true");
    expect(panels()[3]?.hidden).toBe(false);
    expect(panels()[0]?.hidden).toBe(true);
  });

  it("does not report a click on the already selected tab", async () => {
    const seen: string[] = [];
    await render(<Example onValueChange={(value) => seen.push(value)} />);
    await click(tab("One"));
    expect(seen).toEqual([]);
  });

  it("a disabled tab cannot be selected by click", async () => {
    const seen: string[] = [];
    await render(<Example onValueChange={(value) => seen.push(value)} />);
    await act(async () => {
      tab("Three").click();
    });
    expect(tab("Three").getAttribute("aria-selected")).toBe("false");
    expect(seen).toEqual([]);
  });
});

describe("dynamic content", () => {
  it("navigates tabs that were added after mount, and survives removing the selected one", async () => {
    function Dynamic({ values }: { values: string[] }) {
      return (
        <Tabs defaultValue="a">
          <TabsList>
            {values.map((value) => (
              <Tab key={value} value={value}>
                {value.toUpperCase()}
              </Tab>
            ))}
          </TabsList>
          {values.map((value) => (
            <TabsPanel key={value} value={value}>
              {value}
            </TabsPanel>
          ))}
        </Tabs>
      );
    }

    await render(<Dynamic values={["a", "b"]} />);
    await render(<Dynamic values={["a", "b", "c"]} />);
    await focus(tab("B"));
    await press(tab("B"), "ArrowRight");
    expect(document.activeElement).toBe(tab("C"));
    expect(tab("C").getAttribute("aria-selected")).toBe("true");

    // The selected tab disappears. Nothing is selected, and the first tab
    // takes the tab stop so the list stays reachable.
    await render(<Dynamic values={["a", "b"]} />);
    expect(tabs().map((element) => element.getAttribute("aria-selected"))).toEqual([
      "false",
      "false",
    ]);
    expect(tabs().map((element) => element.tabIndex)).toEqual([0, -1]);
    expect(panels().every((panel) => panel.hidden)).toBe(true);
  });
});

describe("API conventions", () => {
  it("merges className last and keeps every default class", async () => {
    await render(
      <Tabs defaultValue="a" className="gap-0" data-testid="root">
        <TabsList className="p-0">
          <Tab value="a" className="text-heading">
            A
          </Tab>
        </TabsList>
        <TabsPanel value="a" className="p-surface">
          A content
        </TabsPanel>
      </Tabs>,
    );
    const rootElement = container.querySelector('[data-testid="root"]');
    expect(rootElement?.className).toContain("gap-0");
    expect(rootElement?.className).not.toContain("gap-stack");

    const list = container.querySelector('[role="tablist"]');
    expect(list?.className).toContain("p-0");
    expect(list?.className).not.toMatch(/(^|\s)p-1(\s|$)/);
    expect(list?.className).toContain("overflow-x-auto");

    // Every class the tab needs survived `cn`: the ones tailwind-merge could
    // have mistaken for one another are the ones asserted.
    const one = tab("A");
    for (const cls of [
      "text-heading",
      "text-foreground-muted",
      "aria-selected:text-foreground",
      "transition-[color,box-shadow]",
      "duration-state",
      "ease-state",
      "group-data-[source=keyboard]/tabs:transition-none",
      "[box-shadow:inset_0_calc(-1*var(--spartant-border-width-emphasis))_0_0_transparent]",
      "aria-selected:[box-shadow:inset_0_calc(-1*var(--spartant-border-width-emphasis))_0_0_var(--spartant-color-primary)]",
      "min-h-[var(--spartant-size-min-target)]",
      "focus-visible:outline-focus-ring",
      "pointer-coarse:after:content-['']",
    ]) {
      expect(one.className, cls).toContain(cls);
    }
    // The caller's font size replaced the default one rather than sitting beside it.
    expect(one.className).not.toMatch(/(^|\s)text-body(\s|$)/);

    expect(panels()[0]?.className).toContain("p-surface");
  });

  it("forwards refs to the rendered elements", async () => {
    const refs: Record<string, HTMLElement | null> = {};
    await render(
      <Tabs
        defaultValue="a"
        ref={(node) => {
          refs["root"] = node;
        }}
      >
        <TabsList
          ref={(node) => {
            refs["list"] = node;
          }}
        >
          <Tab
            value="a"
            ref={(node) => {
              refs["tab"] = node;
            }}
          >
            A
          </Tab>
        </TabsList>
        <TabsPanel
          value="a"
          ref={(node) => {
            refs["panel"] = node;
          }}
        >
          A content
        </TabsPanel>
      </Tabs>,
    );
    expect(refs["root"]?.tagName).toBe("DIV");
    expect(refs["list"]?.getAttribute("role")).toBe("tablist");
    expect(refs["tab"]?.getAttribute("role")).toBe("tab");
    expect(refs["panel"]?.getAttribute("role")).toBe("tabpanel");
  });

  it("records the input that produced the selection on the list", async () => {
    await render(<Example />);
    const list = container.querySelector('[role="tablist"]') as HTMLElement;
    expect(list.dataset["source"]).toBe("pointer");

    await focus(tab("One"));
    await press(tab("One"), "ArrowRight");
    expect(list.dataset["source"]).toBe("keyboard");

    await click(tab("Four"));
    expect(list.dataset["source"]).toBe("pointer");
  });
});
