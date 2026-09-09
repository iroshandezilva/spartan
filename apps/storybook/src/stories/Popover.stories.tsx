import {
  Button,
  Checkbox,
  Field,
  Input,
  Label,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@iroshandezilva/spartant";
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
 * Interactive content anchored to a trigger, on the Popover API and CSS anchor
 * positioning.
 *
 * HAUX-53 decided platform over primitive. `popover="auto"` gives the top
 * layer, light dismiss, Escape, and focus restoration; `position-area` gives
 * placement and collision handling. This is also the first component whose
 * exit animates, because the platform keeps the surface painted through the
 * exit without gating anything on it.
 */
const contract = {
  variants: [],
  sizes: [],
  states: ["focus-visible", "disabled", "empty", "long-content"] as const,
  interactive: true,
  retriggerable: true,
  overlay: true,
  motion: {
    kind: "motion",
    purpose:
      "The surface fades and scales in from its trigger's side and back out again, so it reads as opening from the control that owns it rather than appearing over the page. The exit is faster than the entry: leaving is in the way.",
    tokens: [
      "duration.overlay-enter",
      "duration.overlay-exit",
      "easing.enter",
      "easing.exit",
      "scale.overlay-enter",
    ],
    pointer:
      "A click on the trigger toggles it. A press anywhere outside dismisses it, from the platform's light dismiss on a trusted pointer and from an owned listener otherwise. Touch behaves the same way: tap to open, tap outside to close.",
    keyboard:
      "Enter or Space on the trigger opens it and focus moves to the first focusable element inside at once; the surface animates around a focus that has already moved. Escape closes it and focus returns to the trigger immediately. Tab moves through the surface and then on into the page, because the page behind is not inert.",
    reduced:
      "The stylesheet collapses both durations to 0ms and the entry scale to 1, so the surface appears and disappears in place.",
    interruption:
      "Closing mid-entry retargets the same transition from wherever it is, and the state, focus, and events have already changed. Nothing queues.",
    origin:
      "The side of the trigger the surface actually landed on, read back after the browser resolves placement and collision fallbacks, so a flipped popover still grows from and shrinks toward its trigger. Nothing is paired with it: there is no backdrop, because the page behind stays live.",
  },
  accessibility: {
    role: 'A `div` with `role="dialog"`, non-modal, shown through `popover="auto"`. The page behind it stays live, which is what separates it from Dialog.',
    name: "`PopoverTitle`, through `aria-labelledby`, or an `aria-label` on `PopoverContent`. One of the two is required, and the audit fails a popover with neither. `aria-describedby` is set only when a `PopoverDescription` is rendered.",
    keyboard: [
      "Enter or Space on the trigger opens it.",
      "Escape closes it, whether focus is inside the surface or still on the trigger.",
      "Tab moves through the surface and then back into the page. Nothing is trapped.",
    ],
    focus:
      "On open, focus moves to the first focusable element inside, or to the element marked `autofocus`, and stays on the trigger when the surface holds nothing focusable. On close, it returns to the trigger unless the user already put it somewhere else, which an outside click does and the popover must not undo.",
    announcements:
      "The title is announced on open, then the description when there is one. The trigger reports its expanded state through `aria-expanded`.",
  },
  manual: [
    {
      step: "Open the Default popover with the keyboard, Tab through it and out the other side, then reopen and press Escape.",
      expect:
        "Focus lands on the first field on open, leaves the surface into the page on Tab, and returns to the trigger on Escape. Nothing waits for the animation.",
    },
    {
      step: "Open it with the mouse, then click the page behind it.",
      expect: "It closes. Clicking the trigger while it is open closes it too, without reopening.",
    },
    {
      step: "Open ViewportEdges and click each corner trigger in turn.",
      expect:
        "Each surface flips or slides to stay in view, and the animation grows from the trigger it belongs to. Opening one closes the previous one: the platform allows one auto popover at a time.",
    },
    {
      step: "Zoom to 200% and repeat the edge check.",
      expect: "Same result.",
    },
    {
      step: "Watch SlowMotion open and close.",
      expect: "The exit is visibly faster than the entry, and both run from the trigger's side.",
    },
    {
      step: "With VoiceOver, open the Default popover.",
      expect:
        "It announces as a dialog with the title, then the description, then the focused field.",
    },
  ],
} satisfies StoryContract;

const placements = ["top", "bottom", "left", "right"] as const;

const meta = {
  title: "Components/Popover",
  component: PopoverContent,
  parameters: { layout: "centered", spartant: contract },
  argTypes: {
    placement: {
      control: "select",
      options: [...placements],
      description:
        "Which side of the trigger to prefer. The browser flips it when there is no room.",
    },
  },
  args: { placement: "bottom" },
} satisfies Meta<typeof PopoverContent> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

/** The look of a secondary Button, for triggers that are not the component under test. */
const triggerClass =
  "inline-flex h-[var(--spartant-button-height-md)] items-center justify-center gap-control-gap rounded-control bg-secondary px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-secondary-foreground hover:bg-secondary-hover disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-foreground-disabled focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const closeClass =
  "inline-flex h-[var(--spartant-button-height-sm)] items-center rounded-control px-[var(--spartant-button-padding-x-sm)] font-sans text-body-small font-medium text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** The declared motion, accessibility, and manual-review contract. */
export const Contract: Story = {
  parameters: { layout: "padded" },
  render: () => <ContractPanel contract={contract} />,
};

/** The recommended composition: a small form that does not need the whole page. */
export const Default: Story = {
  render: (args) => (
    <Popover>
      <PopoverTrigger className={triggerClass}>Share</PopoverTrigger>
      <PopoverContent {...args}>
        <div className="grid gap-stack">
          <div className="grid gap-1">
            <PopoverTitle>Share this document</PopoverTitle>
            <PopoverDescription>Anyone with the link can view.</PopoverDescription>
          </div>
          <Field>
            <Label>Link</Label>
            <Input readOnly defaultValue="https://example.com/d/4f2a" />
          </Field>
          <div className="flex justify-end gap-control-gap">
            <PopoverClose className={closeClass}>Done</PopoverClose>
            <Button size="sm">Copy link</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

/**
 * Every placement, opened on demand.
 *
 * One at a time, by platform design: an `auto` popover light-dismisses any
 * other `auto` popover that is not its ancestor when it opens, so four cannot
 * be open at once. Click each trigger to compare the positions.
 */
export const Placements: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid grid-cols-2 gap-section p-section">
      {placements.map((placement) => (
        <div key={placement} className="flex min-h-40 items-center justify-center">
          <Popover>
            <PopoverTrigger className={triggerClass}>{placement}</PopoverTrigger>
            <PopoverContent placement={placement}>
              <PopoverTitle>Placed {placement}</PopoverTitle>
              <PopoverDescription>Flips when there is no room.</PopoverDescription>
            </PopoverContent>
          </Popover>
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
    note: "A natively disabled trigger cannot invoke. Unlike a tooltip, a popover has nothing to say about why.",
    render: () => (
      <Popover>
        <PopoverTrigger className={triggerClass} disabled>
          Share
        </PopoverTrigger>
        <PopoverContent aria-label="Never opens">Never shown</PopoverContent>
      </Popover>
    ),
  },
  empty: {
    note: "A title and nothing else. Focus stays on the trigger; Escape still closes it from there. Click to open: only one auto popover can be open at a time.",
    render: () => (
      <Popover>
        <PopoverTrigger className={triggerClass}>Status</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>All systems normal</PopoverTitle>
        </PopoverContent>
      </Popover>
    ),
  },
  "long-content": {
    note: "The caller bounds the height and scrolls, as with Dialog. The surface keeps its width. Click to open.",
    render: () => (
      <Popover>
        <PopoverTrigger className={triggerClass}>Changelog</PopoverTrigger>
        <PopoverContent className="max-h-64 overflow-auto">
          <div className="grid gap-stack">
            <PopoverTitle>What changed</PopoverTitle>
            {Array.from({ length: 8 }, (_, index) => `entry-${index + 1}`).map((id, index) => (
              <p key={id} className="text-body-small text-foreground-muted">
                Entry {index + 1}. A popover that cannot scroll its own content grows past the
                viewport, and anchor positioning cannot save a surface taller than the space on
                either side of its trigger.
              </p>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    ),
  },
};

/** States that only exist mid-interaction, and the story that proves each. */
const transientStates: Record<Extract<(typeof contract.states)[number], TransientState>, string> = {
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
        . Rendering it here would mean restating the styles under test.
      </p>
    </div>
  ),
};

/** Pinned to dark regardless of the toolbar. Elevation leans on the border here. */
export const DarkTheme: Story = {
  parameters: { layout: "padded", themes: { themeOverride: "dark" } },
  render: () => (
    <div className="flex justify-center py-section">
      <Popover defaultOpen>
        <PopoverTrigger className={triggerClass}>Share</PopoverTrigger>
        <PopoverContent>
          <div className="grid gap-stack">
            <div className="grid gap-1">
              <PopoverTitle>Share this document</PopoverTitle>
              <PopoverDescription>Anyone with the link can view.</PopoverDescription>
            </div>
            <Field>
              <Label>Link</Label>
              <Input readOnly defaultValue="https://example.com/d/4f2a" />
            </Field>
            <div className="flex justify-end gap-control-gap">
              <PopoverClose className={closeClass}>Done</PopoverClose>
              <Button size="sm">Copy link</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

/** A filter control in a list header, which is the popover's natural habitat. */
export const Composition: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-svh bg-background p-section">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between rounded-surface border border-border bg-surface p-[var(--spartant-space-control-gap)] pl-[var(--spartant-space-control-padding-x)] shadow-surface">
          <span className="text-body font-medium text-foreground">Projects</span>
          <Popover>
            <PopoverTrigger className={triggerClass}>Filter</PopoverTrigger>
            <PopoverContent placement="bottom">
              <div className="grid gap-stack">
                <PopoverTitle>Filter projects</PopoverTitle>
                <Field>
                  <Label>Owner</Label>
                  <Input placeholder="Anyone" />
                </Field>
                <div className="grid gap-control-gap">
                  {["Active", "Archived"].map((status) => (
                    <Field key={status}>
                      <div className="flex items-center gap-control-gap">
                        <Checkbox defaultChecked={status === "Active"} />
                        <Label>{status}</Label>
                      </div>
                    </Field>
                  ))}
                </div>
                <div className="flex justify-end gap-control-gap">
                  <PopoverClose className={closeClass}>Cancel</PopoverClose>
                  <Button size="sm">Apply</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <ul className="mt-4 grid gap-control-gap">
          {["Atlas", "Spartant", "Fieldbook"].map((name) => (
            <li
              key={name}
              className="rounded-control border border-border-subtle bg-surface px-[var(--spartant-space-control-padding-x)] py-[var(--spartant-space-control-padding-y)] text-body text-foreground"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  ),
};

/**
 * The keyboard path, and everything the platform and the component share.
 *
 * Focus moving into the surface, Escape closing it, and focus returning are
 * all asserted here, because unlike a native `dialog` they are done by
 * `element.focus()` calls happy-dom does implement.
 */
export const KeyboardPath: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger className={triggerClass}>Share</PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-stack">
          <PopoverTitle>Share this document</PopoverTitle>
          <PopoverDescription>Anyone with the link can view.</PopoverDescription>
          <Field>
            <Label>Link</Label>
            <Input readOnly defaultValue="https://example.com/d/4f2a" />
          </Field>
          <PopoverClose className={closeClass}>Done</PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Share" });
    const dialog = canvas.getByRole("dialog", { hidden: true });

    await step("Closed, and the trigger says so", async () => {
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("Enter opens it, named and described, and focus moves in at once", async () => {
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(dialog).toHaveAccessibleName("Share this document");
      await expect(dialog).toHaveAccessibleDescription("Anyone with the link can view.");
      await expect(canvas.getByLabelText("Link")).toHaveFocus();
    });

    await step("Tab moves on through the surface; nothing traps", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Done" })).toHaveFocus();
    });

    await step("Escape closes it and focus returns to the trigger", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(dialog).not.toBeVisible());
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  },
};

/** The pointer path: the trigger toggles, the close part closes, and outside dismisses. */
export const PointerPath: Story = {
  render: () => (
    <div className="grid gap-stack">
      <p className="text-body text-foreground-muted">Somewhere outside the popover.</p>
      <Popover>
        <PopoverTrigger className={triggerClass}>Share</PopoverTrigger>
        <PopoverContent>
          <div className="grid gap-stack">
            <PopoverTitle>Share this document</PopoverTitle>
            <Field>
              <Label>Link</Label>
              <Input readOnly defaultValue="https://example.com/d/4f2a" />
            </Field>
            <PopoverClose className={closeClass}>Done</PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Share" });
    const dialog = canvas.getByRole("dialog", { hidden: true });

    await step("A click opens it", async () => {
      await userEvent.click(trigger);
      await waitFor(() => expect(dialog).toBeVisible());
    });

    await step("A click inside does not close it", async () => {
      await userEvent.click(canvas.getByText("Share this document"));
      await expect(dialog).toBeVisible();
    });

    await step("The close part closes it and focus returns to the trigger", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Done" }));
      await waitFor(() => expect(dialog).not.toBeVisible());
      await expect(trigger).toHaveFocus();
    });

    await step("A press outside dismisses it", async () => {
      await userEvent.click(trigger);
      await waitFor(() => expect(dialog).toBeVisible());
      await userEvent.click(canvas.getByText("Somewhere outside the popover."));
      await waitFor(() => expect(dialog).not.toBeVisible());
    });
  },
};

/** Rapid repeat: opening and closing quickly settles open or closed, never between. */
export const RapidRepeat: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger className={triggerClass}>Share</PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-stack">
          <PopoverTitle>Share this document</PopoverTitle>
          <PopoverClose className={closeClass}>Done</PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Share" });
    const dialog = canvas.getByRole("dialog", { hidden: true });

    await step("Four open-and-close cycles end closed, with focus on the trigger", async () => {
      for (let index = 0; index < 4; index += 1) {
        await userEvent.click(trigger);
        await waitFor(() => expect(dialog).toBeVisible());
        await userEvent.click(canvas.getByRole("button", { name: "Done" }));
        await waitFor(() => expect(dialog).not.toBeVisible());
      }
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  },
};

/**
 * Overlay origin. The transform origin follows the side the surface landed
 * on, so every popover grows from its trigger. No paired surface: there is no
 * backdrop, because the page behind stays live.
 *
 * Opened one at a time, because the platform allows one `auto` popover at a
 * time; the play function walks through all four.
 */
export const OverlayOrigin: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid grid-cols-2 gap-section p-section">
      {placements.map((placement) => (
        <div key={placement} className="flex min-h-40 items-center justify-center">
          <Popover>
            <PopoverTrigger className={triggerClass}>{placement}</PopoverTrigger>
            <PopoverContent placement={placement}>
              <PopoverTitle>Grows from the {placement}</PopoverTitle>
              <PopoverClose className={closeClass}>Close</PopoverClose>
            </PopoverContent>
          </Popover>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    for (const placement of placements) {
      await step(`Opened from the ${placement}, the surface records that side`, async () => {
        await userEvent.click(canvas.getByRole("button", { name: placement }));
        const dialog = canvas.getByRole("dialog", { name: `Grows from the ${placement}` });
        await waitFor(() => expect(dialog).toBeVisible());
        await expect(dialog).toHaveAttribute("data-side", placement);
        await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
        await waitFor(() => expect(dialog).not.toBeVisible());
      });
    }
  },
};

/** The same popover with the motion tokens collapsed. */
export const ReducedMotion: Story = {
  decorators: [withReducedMotion],
  render: () => (
    <div className="flex justify-center py-section">
      <Popover defaultOpen>
        <PopoverTrigger className={triggerClass}>Share</PopoverTrigger>
        <PopoverContent>
          <div className="grid gap-stack">
            <PopoverTitle>No entry animation</PopoverTitle>
            <PopoverDescription>It appears, rather than arriving.</PopoverDescription>
            <PopoverClose className={closeClass}>Done</PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

/**
 * Viewport edges. Every trigger is in a corner and asks for the placement
 * that would leave the viewport, so the browser's fallbacks have to answer.
 * Click each trigger in turn: one `auto` popover is open at a time.
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
          <Popover>
            <PopoverTrigger className={triggerClass}>{placement}</PopoverTrigger>
            <PopoverContent placement={placement}>
              <PopoverTitle>{label}</PopoverTitle>
              <PopoverDescription>
                The browser flipped or slid this to keep it in view.
              </PopoverDescription>
            </PopoverContent>
          </Popover>
        </div>
      ))}
    </div>
  ),
};

/** A part outside its Popover throws, naming both. */
export const PartOutsidePopover: Story = {
  parameters: { layout: "padded" },
  render: () => {
    let message = "no error, which is a bug";
    try {
      PopoverTitle({ children: "Orphan" });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    return <p className="font-mono text-caption text-foreground-muted">{message}</p>;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("The message names the part and the parent", async () => {
      await expect(
        canvas.getByText("PopoverTitle must be rendered inside a Popover."),
      ).toBeInTheDocument();
    });
  },
};

/** The entry and the exit, slowed, so the origin and the faster exit can be watched. */
export const SlowMotion: Story = {
  decorators: [withSlowMotion],
  render: () => (
    <div className="flex justify-center py-section">
      <Popover>
        <PopoverTrigger className={triggerClass}>Open slowly</PopoverTrigger>
        <PopoverContent>
          <div className="grid gap-stack">
            <PopoverTitle>Origin and exit</PopoverTitle>
            <PopoverDescription>
              Grows from the trigger on the entry duration; shrinks back on the shorter exit.
            </PopoverDescription>
            <PopoverClose className={closeClass}>Close</PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
