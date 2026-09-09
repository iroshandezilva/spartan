import {
  Badge,
  Button,
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type CardVariant,
} from "@iroshandezilva/spartant";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContractPanel } from "../lib/ContractPanel.js";
import type { StaticState, StoryContract, WithStoryContract } from "../lib/contract.js";
import { StateCase, StateMatrix } from "../lib/StateMatrix.js";

/**
 * A surface that groups related content.
 *
 * The default container in a prototype, and the component that proves the
 * surface, elevation, radius, and spacing roles against real content rather
 * than a swatch.
 */
const contract = {
  variants: ["raised", "flat"],
  sizes: [],
  // A card is inert, so hover, focus, active, disabled, selected, invalid,
  // loading, and read-only do not exist for it. The two that do are the two
  // where containers actually fail: nothing inside, and too much inside.
  states: ["empty", "long-content"],
  interactive: false,
  retriggerable: false,
  overlay: false,
  motion: {
    kind: "none",
    rationale:
      "A card does not change state in response to the user. It has no open, selected, or pressed condition of its own, so there is nothing for motion to explain; the standard names Card as no-motion by default. An interactive card would take the same press rules as any pressable control, and that is a separate decision, not a default. The controls inside a card keep their own motion contracts.",
  },
  accessibility: {
    role: 'None. A `div` with no role: a card is a generic container, not a landmark or a widget. Giving every card `role="region"` would fill the landmark list of a page of twenty cards with twenty entries.',
    name: "None on its own. `CardTitle` renders a real heading (`h3` by default, `level` overrides it), so the card is findable by heading navigation, which is how a screen-reader user scans a page of cards. Pass `aria-labelledby` pointing at the title if a specific card should also be a named region.",
    keyboard: [
      "Not focusable. The card never enters the tab order; only the controls the caller puts inside it do, in document order.",
    ],
    focus:
      "Never receives focus. Focus rings on nested controls are not clipped: the card sets no `overflow` and its padding keeps the ring inside the surface.",
    announcements:
      "None. A card that must announce a change belongs inside a live region owned by the component that changes it.",
  },
  manual: [
    {
      step: "Open Variants in light theme, then switch to dark.",
      expect:
        "In light the raised card separates from the page by shadow and a faint border; in dark by its lighter fill. The flat card shows a visible border in both. Neither disappears into the page.",
    },
    {
      step: "Open NestedControls, click the canvas background, and press Tab through the card.",
      expect:
        "Focus lands on the input, then each button in order, with a visible ring inside the card's edge each time. The card itself is never a stop.",
    },
    {
      step: "Open NarrowWidth with the viewport at 320px and the page zoomed to 200%.",
      expect:
        "The long token wraps inside the surface, the actions wrap onto a second row, and nothing scrolls horizontally or clips.",
    },
  ],
} satisfies StoryContract;

const VARIANTS = contract.variants as readonly CardVariant[];

/** What each variant is for, so the story is a usage guide rather than two swatches. */
const MEANING: Record<CardVariant, string> = {
  raised: "On the page background. Elevation paired with the subtle border. The default.",
  flat: "Inside another surface, or one of many in a dense list. A border and no shadow.",
};

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: { layout: "padded", spartant: contract },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description:
        "How the card separates from its ground. Raised on the page, flat inside another surface.",
    },
  },
  args: { variant: "raised" },
} satisfies Meta<typeof Card> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

/** A full composition, reused by several stories so they compare like with like. */
function ProjectCard({ variant }: { variant?: CardVariant }) {
  return (
    <Card variant={variant} className="max-w-md">
      <CardHeader>
        <CardTitle>Checkout rewrite</CardTitle>
        <CardDescription>Replaces the three-step flow with a single page.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body">
          Merged into main yesterday and waiting on two failing checks before it can ship.
        </p>
      </CardContent>
      <CardActions>
        <Button size="sm">Open</Button>
        <Button size="sm" variant="secondary">
          Share
        </Button>
      </CardActions>
    </Card>
  );
}

/** The declared contract, including why this component does not move. */
export const Contract: Story = {
  render: () => <ContractPanel contract={contract} />,
};

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="max-w-md">
      <CardHeader>
        <CardTitle>Checkout rewrite</CardTitle>
        <CardDescription>Replaces the three-step flow with a single page.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body">
          Merged into main yesterday and waiting on two failing checks before it can ship.
        </p>
      </CardContent>
      <CardActions>
        <Button size="sm">Open</Button>
        <Button size="sm" variant="secondary">
          Share
        </Button>
      </CardActions>
    </Card>
  ),
};

/**
 * Both variants on the page background, which is the ground that decides
 * whether elevation reads. The note under each is the reason to pick it.
 */
export const Variants: Story = {
  render: () => (
    <StateMatrix>
      {VARIANTS.map((variant) => (
        <StateCase key={variant} label={variant} note={MEANING[variant]}>
          <div className="w-full">
            <ProjectCard variant={variant} />
          </div>
        </StateCase>
      ))}
    </StateMatrix>
  ),
};

/**
 * The state matrix, typed as a total record over the declared states so
 * declaring one and not rendering it is a compile error.
 */
const staticStates: Record<
  Extract<(typeof contract.states)[number], StaticState>,
  { note: string; render: () => React.ReactNode }
> = {
  empty: {
    note: "No children. The padding alone holds a sensible shape rather than collapsing to a line.",
    render: () => <Card className="w-full" />,
  },
  "long-content": {
    note: "A long title, a paragraph, and an unbroken token, in a narrow column. Everything wraps inside the radius and padding.",
    render: () => (
      <Card className="w-64">
        <CardHeader>
          <CardTitle>A title long enough to wrap onto a second and then a third line</CardTitle>
          <CardDescription>
            Supporting text with one unbroken token, checkout-rewrite-canary-rollout-3f9a2b7c1d4e,
            that has to break inside the header rather than widen it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body">
            deployment-preview-a8f3c9e21b-eu-west-1-canary-rollout-3f9a2b7c1d4e
          </p>
        </CardContent>
        <CardActions>
          <Button size="sm">Approve</Button>
          <Button size="sm" variant="secondary">
            Request changes
          </Button>
          <Button size="sm" variant="ghost">
            Dismiss
          </Button>
        </CardActions>
      </Card>
    ),
  },
};

export const States: Story = {
  render: () => (
    <StateMatrix>
      {(Object.keys(staticStates) as Array<keyof typeof staticStates>).map((state) => (
        <StateCase key={state} label={state} note={staticStates[state].note}>
          {staticStates[state].render()}
        </StateCase>
      ))}
      <StateCase
        label="only content"
        note="No header or actions. Every part is optional and nothing leaves a hole."
      >
        <Card className="w-full">
          <CardContent>
            <p className="text-body">Just a paragraph on a surface.</p>
          </CardContent>
        </Card>
      </StateCase>
      <StateCase
        label="nested"
        note="A flat card inside a raised one. Containers are rounder than the controls inside them, and a nested surface keeps the same radius."
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <Card variant="flat">
            <CardHeader>
              <CardTitle level={4}>Delete workspace</CardTitle>
              <CardDescription>Removes every project. This cannot be undone.</CardDescription>
            </CardHeader>
            <CardActions>
              <Button size="sm" variant="danger">
                Delete
              </Button>
            </CardActions>
          </Card>
        </Card>
      </StateCase>
    </StateMatrix>
  ),
};

/** Pinned to dark regardless of the toolbar. Both variants have to survive it. */
export const DarkTheme: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="grid gap-stack bg-background p-surface">
      {VARIANTS.map((variant) => (
        <ProjectCard key={variant} variant={variant} />
      ))}
    </div>
  ),
};

/**
 * A realistic composition: a page of cards, with neighbours, a section
 * heading above them, and a nested surface. Cards fail in company: a shadow
 * that reads against white can vanish against another card, and spacing that
 * looks generous alone reads as cramped in a grid.
 */
export const Composition: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-svh bg-background p-section">
      <div className="mx-auto grid max-w-3xl gap-stack">
        <h2 className="text-heading font-semibold tracking-heading text-foreground">Projects</h2>
        <div className="grid gap-stack sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-control-gap">
                <CardTitle>Checkout rewrite</CardTitle>
                <Badge variant="warning">In review</Badge>
              </div>
              <CardDescription>Replaces the three-step flow with a single page.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-body-small">
                <div className="flex justify-between">
                  <dt className="text-foreground-muted">Owner</dt>
                  <dd className="text-foreground">Priya</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground-muted">Checks</dt>
                  <dd className="text-foreground">2 failing</dd>
                </div>
              </dl>
            </CardContent>
            <CardActions>
              <Button size="sm">Open</Button>
              <Button size="sm" variant="ghost">
                Share
              </Button>
            </CardActions>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-control-gap">
                <CardTitle>Billing portal</CardTitle>
                <Badge variant="success">Live</Badge>
              </div>
              <CardDescription>Self-serve invoices and plan changes.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body-small text-foreground-muted">
                Shipped on Monday. No open incidents.
              </p>
            </CardContent>
            <CardActions>
              <Button size="sm" variant="secondary">
                View
              </Button>
            </CardActions>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workspace settings</CardTitle>
            <CardDescription>Changes here apply to every member.</CardDescription>
          </CardHeader>
          <Card variant="flat">
            <CardHeader>
              <CardTitle level={4}>Delete workspace</CardTitle>
              <CardDescription>Removes every project. This cannot be undone.</CardDescription>
            </CardHeader>
            <CardActions>
              <Button size="sm" variant="danger">
                Delete workspace
              </Button>
            </CardActions>
          </Card>
        </Card>
      </div>
    </div>
  ),
};

/**
 * A card in a 320px column, which is the narrowest viewport the manual review
 * uses. The long token, the wrapped title, and the three actions all have to
 * stay inside the surface.
 */
export const NarrowWidth: Story = {
  render: () => (
    <div className="w-full max-w-80 bg-background p-4">
      <Card>
        <CardHeader>
          <CardTitle>Deployment preview for the checkout rewrite branch</CardTitle>
          <CardDescription>Built 4 minutes ago from commit a8f3c9e.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body-small">
            https://deployment-preview-a8f3c9e21b-eu-west-1-canary.example.app
          </p>
        </CardContent>
        <CardActions>
          <Button size="sm">Approve</Button>
          <Button size="sm" variant="secondary">
            Request changes
          </Button>
          <Button size="sm" variant="ghost">
            Dismiss
          </Button>
        </CardActions>
      </Card>
    </div>
  ),
};

/**
 * Focusable controls inside a card, asserted.
 *
 * The acceptance criterion is that the card stays a container: the controls
 * inside it are reached in document order and the card itself is never a
 * stop. Both halves are checked, because either can regress independently.
 */
export const NestedControls: Story = {
  render: () => (
    <Card data-testid="card" className="max-w-md">
      <CardHeader>
        <CardTitle>Invite a teammate</CardTitle>
        <CardDescription>They get access to every project in this workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="grid gap-1 text-body-small text-foreground">
          Email
          <input
            type="email"
            name="email"
            className="rounded-control border border-border bg-surface px-control-x py-control-y text-body text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          />
        </label>
      </CardContent>
      <CardActions>
        <Button>Send invite</Button>
        <Button variant="ghost">Cancel</Button>
      </CardActions>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const card = canvas.getByTestId("card");

    await step("The card is not a widget", async () => {
      await expect(card.tagName).toBe("DIV");
      await expect(card).not.toHaveAttribute("role");
      await expect(card).not.toHaveAttribute("tabindex");
    });

    await step("Tab reaches each control in document order and never the card", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("textbox", { name: "Email" })).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Send invite" })).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Cancel" })).toHaveFocus();
      await expect(card).not.toHaveFocus();
    });

    await step("Tabbing out of the last control leaves the card entirely", async () => {
      await userEvent.tab();
      await expect(card.contains(document.activeElement)).toBe(false);
    });
  },
};

/**
 * The title is a real heading, at the level the caller asks for.
 *
 * Upstream's title is a `div`, which is why this is asserted rather than
 * assumed: the one thing a card contributes to the accessibility tree is a
 * heading a screen-reader user can jump to.
 */
export const HeadingLevels: Story = {
  render: () => (
    <div className="grid gap-stack">
      <Card>
        <CardHeader>
          <CardTitle>Default level</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle level={2}>Page-level card</CardTitle>
        </CardHeader>
        <Card variant="flat">
          <CardHeader>
            <CardTitle level={3}>Nested under it</CardTitle>
          </CardHeader>
        </Card>
      </Card>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const { expect, within } = await import("storybook/test");
    const canvas = within(canvasElement);

    await step("Titles are headings at their declared levels", async () => {
      await expect(canvas.getByRole("heading", { level: 3, name: "Default level" })).toBeVisible();
      await expect(
        canvas.getByRole("heading", { level: 2, name: "Page-level card" }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("heading", { level: 3, name: "Nested under it" }),
      ).toBeVisible();
    });
  },
};
