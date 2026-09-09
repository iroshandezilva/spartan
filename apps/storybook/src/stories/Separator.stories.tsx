import { Separator } from "@iroshandezilva/spartant";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContractPanel } from "../lib/ContractPanel.js";
import type { StoryContract, WithStoryContract } from "../lib/contract.js";
import { StateCase, StateMatrix } from "../lib/StateMatrix.js";

/**
 * A dividing line, horizontal or vertical, decorative or semantic.
 *
 * The smallest component in the system, and the one where the accessibility
 * decision is the entire design.
 */
const contract = {
  variants: [],
  sizes: [],
  // A line has no states. It is not hoverable, focusable, or selectable, and
  // saying otherwise to fill the matrix would be dishonest.
  states: [],
  interactive: false,
  retriggerable: false,
  overlay: false,
  motion: {
    kind: "none",
    rationale:
      "A separator never changes state, so there is nothing for motion to explain. Animating a static rule would be decoration in a component whose whole job is to be quiet, and the standard is explicit that static components stay still.",
  },
  accessibility: {
    role: 'None by default: a decorative line is `aria-hidden` and removed from the accessibility tree. With `decorative={false}` it is `role="separator"` with `aria-orientation`.',
    name: "None, and deliberately. A separator that announced a name would be describing itself rather than the content it divides.",
    keyboard: ["Not focusable in either mode. A separator is not a control."],
    focus: "Never receives focus.",
    announcements:
      "A decorative separator announces nothing at all. A semantic one is reported as a separator with its orientation, which is how a screen-reader user learns that two groups are distinct.",
  },
  manual: {
    notRequired:
      "No motion, no interaction, no state. The two things worth checking are the role and the orientation, and both are asserted in the story suite and audited by axe.",
  },
} satisfies StoryContract;

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: { layout: "padded", spartant: contract },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Which way the line runs.",
    },
    decorative: {
      control: "boolean",
      description: "Whether the line carries meaning. Decorative by default.",
    },
  },
  args: { orientation: "horizontal", decorative: true },
} satisfies Meta<typeof Separator> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

/** The declared contract, including why this component does not move. */
export const Contract: Story = {
  render: () => <ContractPanel contract={contract} />,
};

export const Default: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <p className="text-body text-foreground">Above the line.</p>
      <Separator {...args} className="my-4" />
      <p className="text-body text-foreground">Below it.</p>
    </div>
  ),
};

/**
 * The contract declares no states, so this shows the two axes that do vary:
 * orientation, and whether the line means anything.
 */
export const States: Story = {
  render: () => (
    <StateMatrix>
      <StateCase label="horizontal" note="Full width, one border-width tall.">
        <div className="w-full">
          <Separator />
        </div>
      </StateCase>
      <StateCase label="vertical" note="Full height, one border-width wide.">
        <div className="flex h-16 items-stretch gap-4">
          <span className="text-body-small text-foreground-muted">Left</span>
          <Separator orientation="vertical" />
          <span className="text-body-small text-foreground-muted">Right</span>
        </div>
      </StateCase>
      <StateCase label="decorative" note="Hidden from assistive technology.">
        <div className="w-full">
          <Separator />
        </div>
      </StateCase>
      <StateCase label="semantic" note="Reported as a separator with its orientation.">
        <div className="w-full">
          <Separator decorative={false} />
        </div>
      </StateCase>
    </StateMatrix>
  ),
};

/** Pinned to dark regardless of the toolbar. */
export const DarkTheme: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <div className="max-w-sm">
      <p className="text-body text-foreground">The line has to stay visible.</p>
      <Separator className="my-4" />
      <p className="text-body text-foreground">On both grounds.</p>
    </div>
  ),
};

/**
 * A realistic composition.
 *
 * Both uses appear here: the rule inside the card is decorative, because the
 * heading already separates the sections; the rule between the two cards is
 * semantic, because nothing else says they are different things.
 */
export const Composition: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-svh bg-background p-section">
      <div className="mx-auto grid max-w-lg gap-stack">
        <section className="rounded-surface border border-border bg-surface p-surface shadow-surface">
          <h2 className="text-heading-small font-semibold tracking-heading text-foreground">
            Workspace
          </h2>
          <Separator className="my-3" />
          <dl className="grid gap-2 text-body-small">
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Plan</dt>
              <dd className="text-foreground">Studio</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Members</dt>
              <dd className="text-foreground">4</dd>
            </div>
          </dl>
        </section>

        <Separator decorative={false} />

        <section className="rounded-surface border border-border bg-surface p-surface shadow-surface">
          <h2 className="text-heading-small font-semibold tracking-heading text-foreground">
            Billing
          </h2>
          <Separator className="my-3" />
          <p className="text-body-small text-foreground-muted">Next invoice on 1 October.</p>
        </section>
      </div>
    </div>
  ),
};

/**
 * The accessibility contract, asserted rather than described.
 *
 * These two cases are the whole component: a decorative line must be absent
 * from the accessibility tree, and a semantic one must be present with its
 * orientation. Both look identical on screen, which is exactly why a story
 * checks them.
 */
export const SemanticsAreCorrect: Story = {
  render: () => (
    <div className="grid gap-4">
      <Separator data-testid="decorative" />
      <Separator data-testid="semantic" decorative={false} orientation="horizontal" />
      <Separator data-testid="semantic-vertical" decorative={false} orientation="vertical" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const { expect, within } = await import("storybook/test");
    const canvas = within(canvasElement);

    await step("A decorative separator is not in the accessibility tree", async () => {
      const decorative = canvas.getByTestId("decorative");
      await expect(decorative).toHaveAttribute("aria-hidden", "true");
      await expect(canvas.queryAllByRole("separator")).toHaveLength(2);
    });

    await step("A semantic separator reports its role and orientation", async () => {
      const horizontal = canvas.getByTestId("semantic");
      await expect(horizontal).toHaveAttribute("role", "separator");
      await expect(horizontal).toHaveAttribute("aria-orientation", "horizontal");
      await expect(canvas.getByTestId("semantic-vertical")).toHaveAttribute(
        "aria-orientation",
        "vertical",
      );
    });
  },
};
