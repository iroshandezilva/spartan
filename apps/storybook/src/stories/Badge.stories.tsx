import { Badge, type BadgeVariant } from "@iroshandezilva/spartant";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContractPanel } from "../lib/ContractPanel.js";
import type { StoryContract, WithStoryContract } from "../lib/contract.js";
import { StateCase, StateMatrix } from "../lib/StateMatrix.js";

/**
 * A compact label for a status or a category.
 *
 * The component with the smallest API in the system and the largest gap between
 * how easy it looks and how easy it is to get wrong: a badge is the place a
 * design system most often ends up encoding meaning in colour alone.
 */
const contract = {
  variants: ["neutral", "primary", "accent", "success", "warning", "danger", "information"],
  sizes: [],
  // A badge is inert, so almost every state in the standard is unreachable: it
  // cannot be hovered meaningfully, focused, pressed, disabled, or selected.
  // Long content is the one that does apply, and it is the one that breaks
  // chips in real layouts.
  states: ["long-content"],
  interactive: false,
  retriggerable: false,
  overlay: false,
  motion: {
    kind: "none",
    rationale:
      "A badge does not change state in response to the user. Its text can be replaced when the thing it labels changes, but that is a content change in someone else's component, and animating it here would mean this component owning a transition it cannot see the start or end of. The standard keeps static components still.",
  },
  accessibility: {
    role: 'None. A `span` with no role, because a badge is a run of text with a background rather than a widget. Giving it `role="status"` would make every category chip announce itself on render.',
    name: "Its own text content. This is why the label has to be self-sufficient: a red chip reading `3` names itself `3`, and the colour that carries the meaning reaches neither a screen reader nor a colour-blind reader.",
    keyboard: ["Not focusable. A badge is not a control and never enters the tab order."],
    focus:
      "Never receives focus. Composing a badge inside a button moves focus to the button, which is the intended way to make one interactive.",
    announcements:
      "None on its own. A badge whose value changes and must be announced belongs inside a live region owned by the component that changes it, not wrapped in one here.",
  },
  manual: [
    {
      step: "Open the Variants story in light theme, then switch to dark.",
      expect:
        "All seven tints stay distinguishable from the page background, and every label stays comfortably readable. No variant inverts into a heavier chip than its neighbours.",
    },
    {
      step: "Zoom the browser to 200% on the LongContent case.",
      expect:
        "The label wraps inside the chip, the pill radius stays circular at both ends, and nothing overflows the column.",
    },
    {
      step: "View the Composition story at a narrow window width.",
      expect:
        "Badges wrap with the running text and barely disturb it. The chip is 20.2px inside a 21px body-small line box, measured at 63.91px against a 63px three-line control, so it adds under a pixel across a paragraph rather than opening each line it appears on.",
    },
  ],
} satisfies StoryContract;

const VARIANTS = contract.variants as readonly BadgeVariant[];

/** What each variant is for, so the story is a usage guide and not a palette. */
const MEANING: Record<BadgeVariant, string> = {
  neutral: "A category, not a status. The default.",
  primary: "The thing the product is currently steering towards.",
  accent: "A secondary category that needs to be told apart from neutral.",
  success: "Something completed or healthy.",
  warning: "Something needing attention but not yet failing.",
  danger: "Something failed, blocked, or destructive.",
  information: "Context, not a state the user has to act on.",
};

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: { layout: "padded", spartant: contract },
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "What the badge means. Never chosen for its colour.",
    },
  },
  args: { variant: "neutral", children: "Draft" },
} satisfies Meta<typeof Badge> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

/** The declared contract, including why this component does not move. */
export const Contract: Story = {
  render: () => <ContractPanel contract={contract} />,
};

export const Default: Story = {};

/**
 * Every variant with the meaning it carries.
 *
 * The note under each is the point of the story. A reviewer choosing a badge
 * should be reading these sentences, not comparing swatches.
 */
export const Variants: Story = {
  render: () => (
    <StateMatrix>
      {VARIANTS.map((variant) => (
        <StateCase key={variant} label={variant} note={MEANING[variant]}>
          <Badge variant={variant}>{variant === "neutral" ? "Draft" : "In review"}</Badge>
        </StateCase>
      ))}
    </StateMatrix>
  ),
};

/**
 * The one state a badge actually has.
 *
 * `empty` is absent deliberately: a badge with no children renders an empty
 * pill with no accessible name, which is a bug in the caller rather than a
 * state worth designing for.
 */
export const States: Story = {
  render: () => (
    <StateMatrix>
      <StateCase
        label="long-content"
        note="Wraps inside the chip rather than overflowing. Constrained to a narrow column on purpose."
      >
        <div className="w-40">
          <Badge variant="warning">Awaiting security review from the platform team</Badge>
        </div>
      </StateCase>
      <StateCase label="long-content" note="A single unbroken token still has to stay inside.">
        <div className="w-40">
          <Badge variant="information">deployment-preview-a8f3c9e21b</Badge>
        </div>
      </StateCase>
      <StateCase label="with icon" note="Any decorative glyph must be aria-hidden.">
        <Badge variant="success">
          <span aria-hidden="true">&#9679;</span>
          Live
        </Badge>
      </StateCase>
    </StateMatrix>
  ),
};

/** Pinned to dark regardless of the toolbar. Every tint has to survive both. */
export const DarkTheme: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="flex flex-wrap gap-2">
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};

/**
 * A realistic composition.
 *
 * Two things this shows that a grid of chips cannot: a badge sitting inline
 * inside running text without disturbing the line, and the correct way to make
 * one interactive, which is to put it inside a real button rather than to add
 * a handler to the badge.
 */
export const Composition: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-svh bg-background p-section">
      <div className="mx-auto grid max-w-lg gap-stack">
        <section className="grid gap-3 rounded-surface border border-border bg-surface p-surface shadow-surface">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-heading-small font-semibold tracking-heading text-foreground">
              Checkout rewrite
            </h2>
            <Badge variant="warning">In review</Badge>
          </div>
          <p className="text-body-small text-foreground-muted">
            Merged into <Badge variant="neutral">main</Badge> yesterday, and now waiting on{" "}
            <Badge variant="danger">2 failing checks</Badge> before it can ship. The label says what
            happened, so the colour is reinforcement rather than the message.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">Design</Badge>
            <Badge variant="accent">Frontend</Badge>
            <Badge variant="information">Needs docs</Badge>
          </div>
        </section>

        <section className="grid gap-3 rounded-surface border border-border bg-surface p-surface shadow-surface">
          <h2 className="text-heading-small font-semibold tracking-heading text-foreground">
            Making one interactive
          </h2>
          <p className="text-body-small text-foreground-muted">
            The badge stays inert. The button around it brings focus, keyboard activation, and a hit
            area, none of which a span can be given by adding a handler.
          </p>
          <button
            type="button"
            className="inline-flex w-fit rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Badge variant="primary">Filter by: Frontend</Badge>
          </button>
        </section>
      </div>
    </div>
  ),
};

/**
 * The inertness contract, asserted rather than described.
 *
 * The acceptance criterion is that a badge is non-interactive unless composed
 * with an interactive element, and that is exactly the kind of claim that
 * quietly stops being true. These assertions fail the moment someone adds a
 * `tabIndex`, a role, or a handler to make one case convenient.
 */
export const BadgeIsInert: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge data-testid="badge">Draft</Badge>
      <button type="button" data-testid="wrapper">
        <Badge>Composed</Badge>
      </button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const badge = canvas.getByTestId("badge");

    await step("A badge is not a widget", async () => {
      await expect(badge.tagName).toBe("SPAN");
      await expect(badge).not.toHaveAttribute("role");
      await expect(badge).not.toHaveAttribute("tabindex");
    });

    await step("Tabbing reaches the wrapper button and never the badge", async () => {
      // Driven with a real Tab rather than by calling `focus()` on the badge.
      // `HTMLElement.focus()` is not a no-op on a non-focusable element in
      // happy-dom the way it is in a browser, so asserting on it would be
      // testing the test environment. Tab order is the thing being claimed
      // and it is what is exercised here.
      await userEvent.tab();
      await expect(canvas.getByTestId("wrapper")).toHaveFocus();
      await expect(badge).not.toHaveFocus();

      // And there is nothing after it: the badge adds no second stop.
      await userEvent.tab();
      await expect(canvas.getByTestId("wrapper")).not.toHaveFocus();
      await expect(badge).not.toHaveFocus();
    });
  },
};

/**
 * The label carries the meaning, not the colour.
 *
 * This is the one accessibility rule a badge can actually break, so it is
 * asserted: every variant's accessible name must be its own text, and that
 * text must not be empty.
 */
export const LabelIsTheName: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant} data-testid={`badge-${variant}`}>
          {`${variant} label`}
        </Badge>
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const { expect, within } = await import("storybook/test");
    const canvas = within(canvasElement);

    await step("Every variant names itself from its text", async () => {
      for (const variant of VARIANTS) {
        const badge = canvas.getByTestId(`badge-${variant}`);
        await expect(badge).toHaveTextContent(`${variant} label`);
      }
    });
  },
};
