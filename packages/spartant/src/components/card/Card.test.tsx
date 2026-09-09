// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Card, CardActions, CardContent, CardDescription, CardHeader, CardTitle } from "./Card.js";

const DIR = "packages/spartant/src/components/card";
const upstream = readFileSync(`${DIR}/upstream/card.tsx.txt`, "utf8");
/**
 * The adapted source with comments stripped, so an assertion that a shadcn
 * construct is gone matches the code rather than the comment explaining why
 * it went.
 */
const adapted = readFileSync(`${DIR}/Card.tsx`, "utf8")
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

describe("ownership: the adaptation stayed adapted", () => {
  it("upstream is recorded with its provenance and declares no dependency", () => {
    const provenance = JSON.parse(readFileSync(`${DIR}/upstream/provenance.json`, "utf8")) as {
      entries: Record<string, { source: string; sha256: string; declaredDependencies: string[] }>;
    };
    const entry = provenance.entries.card;
    expect(entry?.source).toBe("https://ui.shadcn.com/r/styles/new-york/card.json");
    expect(entry?.sha256).toMatch(/^[0-9a-f]{64}$/);
    // Card is the one shadcn component in the first slice with nothing to
    // remove. Recorded so the dependency review is a fact rather than an
    // omission.
    expect(entry?.declaredDependencies).toEqual([]);
  });

  it("carries no shadcn import, alias, or forwardRef", () => {
    expect(upstream).toContain('from "@/lib/utils"');
    expect(upstream).toContain("React.forwardRef");
    expect(adapted).not.toContain('from "@/');
    expect(adapted).not.toContain("forwardRef");
    expect(adapted).not.toContain("@radix-ui");
  });

  it("replaces shadcn token names with semantic roles", () => {
    // `bg-card`, `text-card-foreground`, and `text-muted-foreground` are
    // shadcn's vocabulary; `rounded-xl`, `p-6`, `space-y-1.5`, and `text-sm`
    // are raw scale steps. All of them are upstream and none survive.
    for (const token of [
      "bg-card",
      "text-card-foreground",
      "text-muted-foreground",
      "rounded-xl",
      "p-6",
      "pt-0",
      "space-y-1.5",
      "text-sm",
    ]) {
      expect(upstream, `upstream lacks ${token}`).toContain(token);
      expect(adapted, `adaptation still uses ${token}`).not.toContain(token);
    }
    for (const role of [
      "bg-surface",
      "rounded-surface",
      "p-surface",
      "gap-stack",
      "shadow-surface",
    ]) {
      expect(adapted).toContain(role);
    }
  });

  it("is exported from the package entry point", () => {
    const index = readFileSync("packages/spartant/src/index.ts", "utf8");
    for (const name of [
      "Card",
      "CardActions",
      "CardContent",
      "CardDescription",
      "CardHeader",
      "CardTitle",
    ]) {
      expect(index).toMatch(new RegExp(`\\b${name}\\b`));
    }
  });
});

describe("Card", () => {
  it("renders a plain div with no role, tabindex, or handler", async () => {
    await render(<Card data-testid="card">Body</Card>);
    const card = container.querySelector<HTMLElement>("[data-testid=card]");
    expect(card?.tagName).toBe("DIV");
    expect(card?.hasAttribute("role")).toBe(false);
    expect(card?.hasAttribute("tabindex")).toBe(false);
  });

  it("forwards its ref to the outer surface", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Card ref={ref}>Body</Card>);
    expect(ref.current?.tagName).toBe("DIV");
    expect(ref.current?.textContent).toBe("Body");
  });

  it("defaults to raised and switches to flat", async () => {
    await render(
      <>
        <Card data-testid="raised">Raised</Card>
        <Card data-testid="flat" variant="flat">
          Flat
        </Card>
      </>,
    );
    const raised = container.querySelector("[data-testid=raised]")?.className ?? "";
    const flat = container.querySelector("[data-testid=flat]")?.className ?? "";
    expect(raised).toContain("shadow-surface");
    expect(raised).toContain("border-border-subtle");
    expect(flat).toContain("shadow-flat");
    expect(flat).toContain("border-border");
    expect(flat).not.toContain("border-border-subtle");
  });

  it("keeps every default class and lets the caller's className win", async () => {
    // The trap in the skill: `cn` drops a class it reads as a conflict. This
    // reads the rendered attribute rather than trusting the source.
    await render(
      <Card data-testid="card" className="max-w-sm p-0">
        Body
      </Card>,
    );
    const className = container.querySelector("[data-testid=card]")?.className ?? "";
    for (const expected of [
      "grid",
      // The pinned column is what stops a long word widening the surface, and
      // it is the class most likely to be read as redundant and deleted.
      "grid-cols-[minmax(0,1fr)]",
      "gap-stack",
      "rounded-surface",
      "border",
      "bg-surface",
      "text-foreground",
      "min-w-0",
      "break-words",
      "border-border-subtle",
      "shadow-surface",
      "max-w-sm",
    ]) {
      expect(className.split(" "), `missing ${expected}`).toContain(expected);
    }
    // The caller's padding replaced the default rather than sitting beside it.
    expect(className).toContain("p-0");
    expect(className).not.toContain("p-surface");
  });

  it("spreads native props onto the element", async () => {
    await render(
      <Card data-testid="card" aria-labelledby="t" id="c" lang="en">
        Body
      </Card>,
    );
    const card = container.querySelector("[data-testid=card]");
    expect(card?.getAttribute("aria-labelledby")).toBe("t");
    expect(card?.id).toBe("c");
    expect(card?.getAttribute("lang")).toBe("en");
  });
});

describe("CardTitle", () => {
  it("renders a real heading where upstream renders a div", async () => {
    expect(upstream).toMatch(/CardTitle = React\.forwardRef<\s*HTMLDivElement/);
    await render(<CardTitle>Title</CardTitle>);
    expect(container.querySelector("h3")?.textContent).toBe("Title");
    expect(container.querySelector("div")).toBeNull();
  });

  it.each([2, 3, 4, 5, 6] as const)("renders level %i as h%i", async (level) => {
    await render(<CardTitle level={level}>Title</CardTitle>);
    expect(container.querySelector(`h${level}`)?.textContent).toBe("Title");
  });

  it("forwards its ref to the heading", async () => {
    const ref = createRef<HTMLHeadingElement>();
    await render(
      <CardTitle ref={ref} level={2}>
        Title
      </CardTitle>,
    );
    expect(ref.current?.tagName).toBe("H2");
  });
});

describe("parts", () => {
  it("each renders its element, merges className last, and works without a Card", async () => {
    await render(
      <>
        <CardHeader data-testid="header" className="gap-0" />
        <CardDescription data-testid="description" className="text-foreground" />
        <CardContent data-testid="content" className="grid" />
        <CardActions data-testid="actions" className="justify-end" />
      </>,
    );
    const el = (id: string) => container.querySelector<HTMLElement>(`[data-testid=${id}]`);
    expect(el("header")?.tagName).toBe("DIV");
    expect(el("description")?.tagName).toBe("P");
    expect(el("content")?.tagName).toBe("DIV");
    expect(el("actions")?.tagName).toBe("DIV");

    // Conflicting caller classes replace the defaults; unrelated ones join.
    const header = el("header")?.className ?? "";
    expect(header).toContain("gap-0");
    expect(header).not.toContain("gap-control-gap");
    const description = el("description")?.className ?? "";
    expect(description).toContain("text-foreground");
    expect(description).not.toContain("text-foreground-muted");
    expect(description).toContain("text-body-small");
    expect(el("actions")?.className).toContain("justify-end");
    expect(el("actions")?.className).toContain("flex-wrap");
  });

  it("nothing in a full composition is focusable except the controls the caller adds", async () => {
    await render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardActions>
          <button type="button">One</button>
          <button type="button">Two</button>
        </CardActions>
      </Card>,
    );
    const focusable = container.querySelectorAll("[tabindex], button, a[href], input");
    expect([...focusable].map((node) => node.textContent)).toEqual(["One", "Two"]);
  });
});
