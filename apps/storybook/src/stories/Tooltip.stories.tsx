import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@iroshandezilva/spartant";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ContractPanel } from "../lib/ContractPanel.js";
import type {
  StaticState,
  StoryContract,
  TransientState,
  WithStoryContract,
} from "../lib/contract.js";
import { withReducedMotion, withSlowMotion } from "../lib/decorators.js";
import { StateCase, StateMatrix } from "../lib/StateMatrix.js";

/**
 * Brief supplemental text for a control, on the Popover API and CSS anchor
 * positioning.
 *
 * HAUX-53 decided platform over primitive: the top layer, placement, and
 * collision handling come from the browser, and only the timing, which is the
 * whole of a tooltip's behaviour, is owned here.
 */
const contract = {
  variants: [],
  sizes: [],
  states: ["hover", "focus-visible", "disabled", "long-content"] as const,
  interactive: true,
  retriggerable: true,
  overlay: true,
  motion: {
    kind: "motion",
    purpose:
      "The tooltip fades and scales in from its trigger's side, so it reads as belonging to the control under the pointer rather than appearing somewhere near it. Fast timing: a tooltip is glanced at, not watched.",
    tokens: [
      "duration.state-change",
      "duration.press-feedback",
      "easing.enter",
      "easing.exit",
      "scale.overlay-enter",
    ],
    pointer:
      "Opens after a 500ms rest on the trigger, closes the moment the pointer leaves or presses. A second tooltip within 300ms of the first closing opens at once, with no delay and no animation. Touch cannot hover: a touch user gets the tooltip on focus where the platform focuses a tapped button, and otherwise not at all, which is why the tooltip is never the only place the information lives.",
    keyboard:
      "Focus opens it immediately, with no delay. The state and the aria-describedby link are already there; only the surface animates. Escape dismisses from anywhere, and blur dismisses.",
    reduced:
      "The stylesheet collapses the durations to 0ms and the entry scale to 1, so the tooltip simply appears and disappears. The delay is unaffected: it is timing, not motion.",
    interruption:
      "Hover and unhover retarget the same transition, so a sweep across the trigger never queues a second entry. Leaving before the delay elapses cancels the open entirely.",
    origin:
      "The side of the trigger the surface actually landed on, read back after the browser resolves the placement and its collision fallbacks, so a flipped tooltip still grows from the trigger. Nothing is paired with it.",
  },
  accessibility: {
    role: 'A `div` with `role="tooltip"`, shown through `popover="manual"` so it sits in the top layer above every `z-index` without a portal.',
    name: "The tooltip has no name of its own and needs none. It is the trigger's description, through `aria-describedby`, set whether open or closed so the description is always available. The trigger, a native `button`, must carry its own accessible name: an icon-only trigger needs `aria-label`.",
    keyboard: [
      "Tab to the trigger opens the tooltip immediately.",
      "Escape dismisses it, from anywhere on the page.",
      "Tab away dismisses it.",
    ],
    focus:
      "Focus never enters the tooltip. It holds no interactive content, and the pointer passes through it, so it can neither take focus nor take a click.",
    announcements:
      "A screen reader announces the tooltip text as the trigger's description when the trigger receives focus, before the tooltip is visually open and whether or not it ever opens.",
  },
  manual: [
    {
      step: "Rest the mouse on the Default trigger, then move it off.",
      expect:
        "Nothing for about half a second, then the tooltip grows in from the trigger's side. It vanishes the moment the pointer leaves.",
    },
    {
      step: "Sweep the pointer across the Composition toolbar without pausing.",
      expect:
        "The first tooltip waits for the delay; each one after it appears at once, with no delay and no animation, until you pause for longer than 300ms.",
    },
    {
      step: "Tab to a trigger, press Escape, then Tab on.",
      expect: "The tooltip opens with no delay, Escape closes it, and Tab away closes it too.",
    },
    {
      step: "Open ViewportEdges and shrink the window until a trigger is near an edge.",
      expect:
        "Each tooltip flips or slides to stay in view. It never clips, and it never covers its trigger.",
    },
    {
      step: "Zoom the browser to 200% and repeat the edge check.",
      expect:
        "Same result. Anchor positioning is evaluated in CSS pixels, so zoom changes nothing.",
    },
    {
      step: "With VoiceOver, Tab to an icon-only trigger in the Composition story.",
      expect: "The button's own name is announced, then the tooltip text as its description.",
    },
  ],
} satisfies StoryContract;

const placements = ["top", "bottom", "left", "right"] as const;

const meta = {
  title: "Components/Tooltip",
  component: TooltipContent,
  parameters: { layout: "centered", spartant: contract },
  argTypes: {
    placement: {
      control: "select",
      options: [...placements],
      description:
        "Which side of the trigger to prefer. The browser flips it when there is no room.",
    },
  },
  args: { placement: "top" },
} satisfies Meta<typeof TooltipContent> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

/** The look of a secondary Button, for triggers that are not the component under test. */
const triggerClass =
  "inline-flex h-[var(--spartant-button-height-md)] items-center justify-center gap-control-gap rounded-control bg-secondary px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-secondary-foreground hover:bg-secondary-hover aria-disabled:cursor-not-allowed aria-disabled:bg-surface-disabled aria-disabled:text-foreground-disabled focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** A square icon-only trigger, for the toolbar composition. */
const iconTriggerClass =
  "inline-flex size-[var(--spartant-button-height-md)] items-center justify-center rounded-control bg-transparent text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

function Glyph({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

/** The declared motion, accessibility, and manual-review contract. */
export const Contract: Story = {
  parameters: { layout: "padded" },
  render: () => <ContractPanel contract={contract} />,
};

/** The recommended composition: a named control with supplemental text. */
export const Default: Story = {
  render: (args) => (
    <Tooltip>
      <TooltipTrigger className={triggerClass}>Save draft</TooltipTrigger>
      <TooltipContent {...args}>Saves without publishing. Cmd+S</TooltipContent>
    </Tooltip>
  ),
};

/** Every placement, open, so the four positions can be compared at once. */
export const Placements: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid grid-cols-2 gap-section p-section">
      {placements.map((placement) => (
        <div key={placement} className="flex justify-center">
          <Tooltip defaultOpen>
            <TooltipTrigger className={triggerClass}>{placement}</TooltipTrigger>
            <TooltipContent placement={placement}>Placed {placement}</TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  ),
};

const staticStates: Record<
  Extract<(typeof contract.states)[number], StaticState>,
  { note: string; render: () => ReactNode }
> = {
  disabled: {
    note: "aria-disabled, still focusable, so the tooltip can say why. Activation is swallowed.",
    render: () => (
      <Tooltip defaultOpen>
        <TooltipTrigger className={triggerClass} disabled>
          Publish
        </TooltipTrigger>
        <TooltipContent>Add a title before publishing</TooltipContent>
      </Tooltip>
    ),
  },
  "long-content": {
    note: "Wraps at the max width. A tooltip longer than this is a paragraph, and belongs in a Popover.",
    render: () => (
      <Tooltip defaultOpen>
        <TooltipTrigger className={triggerClass}>Archive</TooltipTrigger>
        <TooltipContent placement="bottom">
          Moves the project out of the active list. Archived projects keep their history and can be
          restored from the archive at any time, by anyone with edit access.
        </TooltipContent>
      </Tooltip>
    ),
  },
};

/** States that only exist mid-interaction, and the story that proves each. */
const transientStates: Record<Extract<(typeof contract.states)[number], TransientState>, string> = {
  hover: "PointerPath",
  "focus-visible": "KeyboardPath",
};

export const States: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid gap-4 py-section">
      <StateMatrix>
        {Object.entries(staticStates).map(([state, { note, render }]) => (
          <StateCase key={state} label={state} note={note}>
            {render()}
          </StateCase>
        ))}
      </StateMatrix>
      <p className="text-caption text-foreground-muted">
        {Object.entries(transientStates)
          .map(([state, story]) => `${state} is proved in ${story}`)
          .join(", ")}
        . Rendering them here would mean restating the styles under test.
      </p>
    </div>
  ),
};

/** Pinned to dark regardless of the toolbar. The surface inverts with the theme. */
export const DarkTheme: Story = {
  parameters: { layout: "padded", themes: { themeOverride: "dark" } },
  render: () => (
    <div className="flex justify-center py-section">
      <Tooltip defaultOpen>
        <TooltipTrigger className={triggerClass}>Save draft</TooltipTrigger>
        <TooltipContent>Saves without publishing. Cmd+S</TooltipContent>
      </Tooltip>
    </div>
  ),
};

/** A toolbar of icon-only buttons, which is where tooltips earn their place. */
export const Composition: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-svh bg-background p-section">
      <div className="mx-auto max-w-lg">
        <p className="mb-4 text-body text-foreground-muted">
          Each button has its own name through <code className="font-mono">aria-label</code>. The
          tooltip repeats it with the shortcut, so nothing is lost if the tooltip never opens.
        </p>
        <div
          role="toolbar"
          aria-label="Formatting"
          className="inline-flex gap-control-gap rounded-surface border border-border bg-surface p-[var(--spartant-space-control-gap)] shadow-surface"
        >
          {[
            {
              label: "Bold",
              shortcut: "Cmd+B",
              d: "M6 4h5a3 3 0 0 1 0 6H6zM6 10h6a3 3 0 0 1 0 6H6z",
            },
            { label: "Italic", shortcut: "Cmd+I", d: "M8 4h6M6 16h6M12 4l-4 12" },
            {
              label: "Link",
              shortcut: "Cmd+K",
              d: "M8 12l4-4M6 14a3 3 0 0 1 0-4l2-2M14 6a3 3 0 0 1 0 4l-2 2",
            },
            {
              label: "Attach file",
              shortcut: "Cmd+Shift+A",
              d: "M13 7l-5 5a2 2 0 1 0 3 3l5-5a4 4 0 0 0-6-6l-5 5",
            },
          ].map(({ label, shortcut, d }) => (
            <Tooltip key={label}>
              <TooltipTrigger className={iconTriggerClass} aria-label={label}>
                <Glyph d={d} />
              </TooltipTrigger>
              <TooltipContent placement="bottom">
                {label} {shortcut}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * The keyboard path. Focus opens immediately, with no delay; Escape and blur
 * close. The description link is there whether or not the tooltip is open.
 */
export const KeyboardPath: Story = {
  render: () => (
    <div className="flex gap-control-gap">
      <Tooltip>
        <TooltipTrigger className={triggerClass}>Save draft</TooltipTrigger>
        <TooltipContent>Saves without publishing</TooltipContent>
      </Tooltip>
      <Button variant="ghost">Next control</Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Save draft" });
    const tooltip = canvas.getByRole("tooltip", { hidden: true });

    await step("The trigger is described by the tooltip before anything opens", async () => {
      await expect(tooltip).not.toBeVisible();
      await expect(trigger).toHaveAccessibleDescription("Saves without publishing");
    });

    await step("Tab opens it at once, with no delay", async () => {
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      // A short timeout: the default delay is 500ms, so a tooltip that waited
      // for it would fail here rather than pass by accident.
      await waitFor(() => expect(tooltip).toBeVisible(), { timeout: 150 });
    });

    await step("Escape closes it and focus stays put", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(tooltip).not.toBeVisible());
      await expect(trigger).toHaveFocus();
    });

    await step("Focus again reopens it; Tab away closes it", async () => {
      await userEvent.tab({ shift: true });
      await userEvent.tab();
      await waitFor(() => expect(tooltip).toBeVisible(), { timeout: 150 });
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Next control" })).toHaveFocus();
      await waitFor(() => expect(tooltip).not.toBeVisible());
    });
  },
};

/**
 * The pointer path: the delay, the close on leave, and the sequential open.
 *
 * The delay is the story's own, and the checks straddle it: not open well
 * before it elapses, open after. Asserting a frame count would be flaky;
 * asserting the state on either side of the boundary is not.
 */
export const PointerPath: Story = {
  render: () => (
    <div className="flex gap-control-gap">
      <Tooltip delay={400}>
        <TooltipTrigger className={triggerClass}>Bold</TooltipTrigger>
        <TooltipContent>Bold Cmd+B</TooltipContent>
      </Tooltip>
      <Tooltip delay={400}>
        <TooltipTrigger className={triggerClass}>Italic</TooltipTrigger>
        <TooltipContent>Italic Cmd+I</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole("button", { name: "Bold" });
    const italic = canvas.getByRole("button", { name: "Italic" });
    const [boldTip, italicTip] = canvas.getAllByRole("tooltip", { hidden: true });

    await step("Any earlier tooltip's sequential window lapses first", async () => {
      // The skip-delay window is page-level state: a tooltip closed by the
      // previous story within 300ms would make this first hover instant, which
      // is the component working, not the delay failing.
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    await step("Hover waits for the delay before opening", async () => {
      await userEvent.hover(bold);
      await new Promise((resolve) => setTimeout(resolve, 40));
      await expect(boldTip).not.toBeVisible();
      await waitFor(() => expect(boldTip).toBeVisible(), { timeout: 1000 });
    });

    await step("Leaving closes it", async () => {
      await userEvent.unhover(bold);
      await waitFor(() => expect(boldTip).not.toBeVisible());
    });

    await step("The next tooltip opens at once, and instantly", async () => {
      await userEvent.hover(italic);
      // 150ms is well under the 400ms delay: a tooltip that waited would fail.
      await waitFor(() => expect(italicTip).toBeVisible(), { timeout: 150 });
      await expect(italicTip).toHaveAttribute("data-instant");
      await userEvent.unhover(italic);
      await waitFor(() => expect(italicTip).not.toBeVisible());
    });

    await step("A press dismisses, and the focus it causes does not reopen", async () => {
      await userEvent.hover(bold);
      await waitFor(() => expect(boldTip).toBeVisible(), { timeout: 1000 });
      await userEvent.click(bold);
      await waitFor(() => expect(boldTip).not.toBeVisible());
      await expect(bold).toHaveFocus();
      await userEvent.unhover(bold);
    });
  },
};

/** Rapid repeat: sweeping on and off never leaves it stuck part-way. */
export const RapidRepeat: Story = {
  render: () => (
    <Tooltip delay={200}>
      <TooltipTrigger className={triggerClass}>Save draft</TooltipTrigger>
      <TooltipContent>Saves without publishing</TooltipContent>
    </Tooltip>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Save draft" });
    const tooltip = canvas.getByRole("tooltip", { hidden: true });

    await step("Six sweeps faster than the delay never open it", async () => {
      for (let index = 0; index < 6; index += 1) {
        await userEvent.hover(trigger);
        await userEvent.unhover(trigger);
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(tooltip).not.toBeVisible();
    });

    await step("It still opens and closes cleanly afterwards", async () => {
      await userEvent.tab();
      await waitFor(() => expect(tooltip).toBeVisible(), { timeout: 150 });
      await userEvent.tab();
      await waitFor(() => expect(tooltip).not.toBeVisible());
      await expect(canvas.getByRole("tooltip", { hidden: true })).toBe(tooltip);
    });
  },
};

/**
 * Overlay origin: the transform origin follows the side the surface landed
 * on, so every tooltip grows from its trigger.
 */
export const OverlayOrigin: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid grid-cols-2 gap-section p-section">
      {placements.map((placement) => (
        <div key={placement} className="flex justify-center">
          <Tooltip defaultOpen>
            <TooltipTrigger className={triggerClass}>{placement}</TooltipTrigger>
            <TooltipContent placement={placement}>Grows from the {placement}</TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Each surface records the side it sits on", async () => {
      for (const placement of placements) {
        const tooltip = canvas.getByText(`Grows from the ${placement}`);
        await expect(tooltip).toHaveAttribute("data-side", placement);
      }
    });
  },
};

/** The same tooltip with the motion tokens collapsed. The delay remains. */
export const ReducedMotion: Story = {
  decorators: [withReducedMotion],
  render: () => (
    <div className="flex justify-center py-section">
      <Tooltip defaultOpen>
        <TooltipTrigger className={triggerClass}>Save draft</TooltipTrigger>
        <TooltipContent>Appears rather than arriving</TooltipContent>
      </Tooltip>
    </div>
  ),
};

/**
 * Viewport edges. Every trigger is in a corner and asks for the placement
 * that would leave the viewport, so the browser's fallbacks have to answer.
 */
export const ViewportEdges: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="relative h-svh bg-background">
      {(
        [
          ["top-2 left-2", "top", "Top left, asks for top"],
          ["top-2 right-2", "right", "Top right, asks for right"],
          ["bottom-2 left-2", "left", "Bottom left, asks for left"],
          ["bottom-2 right-2", "bottom", "Bottom right, asks for bottom"],
        ] as const
      ).map(([position, placement, label]) => (
        <div key={position} className={`absolute ${position}`}>
          <Tooltip defaultOpen>
            <TooltipTrigger className={triggerClass}>{placement}</TooltipTrigger>
            <TooltipContent placement={placement}>{label}</TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  ),
};

/** A part outside its Tooltip throws, naming both. */
export const PartOutsideTooltip: Story = {
  parameters: { layout: "padded" },
  render: () => {
    let message = "no error, which is a bug";
    try {
      TooltipContent({ children: "Orphan" });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    return <p className="font-mono text-caption text-foreground-muted">{message}</p>;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("The message names the part and the parent", async () => {
      await expect(
        canvas.getByText("TooltipContent must be rendered inside a Tooltip."),
      ).toBeInTheDocument();
    });
  },
};

/** The entry and exit, slowed, so the origin and the faster exit can be watched. */
export const SlowMotion: Story = {
  decorators: [withSlowMotion],
  render: () => (
    <div className="flex justify-center py-section">
      <Tooltip>
        <TooltipTrigger className={triggerClass}>Hover or focus me</TooltipTrigger>
        <TooltipContent>Grows from the trigger, shrinks back faster</TooltipContent>
      </Tooltip>
    </div>
  ),
};
