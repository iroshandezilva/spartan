import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Label,
} from "@iroshandezilva/spartant";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";
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
 * A modal task, on the native `dialog` element.
 *
 * The hardest accessibility contract in the set, and the one most often got
 * wrong. `showModal()` gets it right for free, which is why HAUX-44 approved
 * the native element over a primitive library.
 */
const contract = {
  variants: [],
  sizes: [],
  states: ["focus-visible", "long-content", "empty"] as const,
  interactive: true,
  retriggerable: true,
  overlay: true,
  motion: {
    kind: "motion",
    purpose:
      "The surface and its backdrop fade and scale in together, so a modal reads as arriving over the page rather than replacing it.",
    tokens: ["duration.modal-enter", "easing.enter", "scale.overlay-enter"],
    pointer: "Clicking the backdrop dismisses, unless the dialog holds unsaved work.",
    keyboard:
      "Escape dismisses, from the platform. Focus enters the surface on open and returns to the trigger on close, and neither waits for the animation.",
    reduced:
      "The stylesheet collapses the duration to 0ms and the entry scale to 1, so the dialog simply appears.",
    interruption:
      "Opening and closing quickly retargets the transition. The close is never gated on it: `close()` is called immediately so focus restoration cannot be delayed.",
    origin:
      "Centre, which is what the standard specifies for a dialog rather than the trigger origin used by popovers. The backdrop shares the surface's duration and easing, so neither lands first.",
  },
  accessibility: {
    role: "A native `dialog` opened with `showModal()`, which carries the modal role, the focus trap, the top layer, and inertness of the page behind it.",
    name: "`DialogTitle`, referenced by `aria-labelledby`. Required: an unnamed modal announces only that something took over the page.",
    keyboard: [
      "Escape dismisses.",
      "Tab cycles within the dialog and cannot reach the page behind it.",
      "Focus returns to the trigger when the dialog closes.",
    ],
    focus:
      "The platform moves focus into the surface on open and restores it on close. The exit animation never gates the restore.",
    announcements:
      "The title is announced on open, then the description when one is present. `aria-describedby` is only set when a description is rendered.",
  },
  manual: [
    {
      step: "Open with the keyboard, Tab all the way round, then press Escape.",
      expect: "Focus never leaves the dialog, and it lands back on the trigger afterwards.",
    },
    {
      step: "Open the long-content dialog on a short window and scroll.",
      expect: "The dialog scrolls, the page behind it does not, and nothing is clipped.",
    },
    {
      step: "With VoiceOver, open the dialog.",
      expect: "It announces as a dialog with the title, then the description.",
    },
    {
      step: "Turn on the OS reduce-motion setting and reload, then open and close.",
      expect:
        "The dialog appears and disappears with no scaling or fade, and focus still moves correctly.",
    },
  ],
} satisfies StoryContract;

const meta = {
  title: "Components/Dialog",
  component: DialogContent,
  parameters: { layout: "centered", spartant: contract },
  argTypes: {
    dismissOnOutsideClick: {
      control: "boolean",
      description: "Whether a backdrop click dismisses. Turn off for unsaved work.",
    },
  },
  args: {},
} satisfies Meta<typeof DialogContent> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

/** The declared motion, accessibility, and manual-review contract. */
export const Contract: Story = {
  parameters: { layout: "padded" },
  render: () => <ContractPanel contract={contract} />,
};

/** The recommended composition. */
export const Default: Story = {
  render: (args) => (
    <Dialog>
      <DialogTrigger className="inline-flex h-[var(--spartant-button-height-md)] items-center rounded-control bg-primary px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
        Delete workspace
      </DialogTrigger>
      <DialogContent {...args}>
        <DialogTitle>Delete this workspace?</DialogTitle>
        <DialogDescription>Everything in it goes with it. This cannot be undone.</DialogDescription>
        <div className="flex justify-end gap-control-gap">
          <DialogClose className="inline-flex h-[var(--spartant-button-height-md)] items-center rounded-control px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
            Cancel
          </DialogClose>
          <Button variant="danger">Delete workspace</Button>
        </div>
      </DialogContent>
    </Dialog>
  ),
};

const staticStates: Record<
  Extract<(typeof contract.states)[number], StaticState>,
  { note: string; render: () => ReactNode }
> = {
  "long-content": {
    note: "The dialog scrolls; the page behind it does not.",
    render: () => (
      <Dialog>
        <DialogTrigger className="text-body underline">Open long dialog</DialogTrigger>
        <DialogContent className="max-h-[min(32rem,calc(100vh-4rem))] overflow-auto">
          <DialogTitle>Terms of service</DialogTitle>
          <DialogDescription>Twenty paragraphs, which is twenty too many.</DialogDescription>
          {Array.from({ length: 20 }, (_, index) => `paragraph-${index + 1}`).map((id, index) => (
            <p key={id} className="text-body text-foreground-muted">
              Paragraph {index + 1}. A dialog that cannot scroll its own content traps the reader at
              whatever the viewport happens to be, which is the failure this case exists to catch.
            </p>
          ))}
          <div className="flex justify-end">
            <DialogClose className="text-body underline">Close</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    ),
  },
  empty: {
    note: "A title and nothing else. Still named, still dismissible.",
    render: () => (
      <Dialog>
        <DialogTrigger className="text-body underline">Open minimal dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Saved</DialogTitle>
          <div className="flex justify-end">
            <DialogClose className="text-body underline">Close</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
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
    <div className="grid gap-4">
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

/** Pinned to dark regardless of the toolbar. */
export const DarkTheme: Story = {
  parameters: { layout: "padded", themes: { themeOverride: "dark" } },
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger className="text-body underline">Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete this workspace?</DialogTitle>
        <DialogDescription>Everything in it goes with it. This cannot be undone.</DialogDescription>
        <div className="flex justify-end gap-control-gap">
          <Button variant="danger">Delete workspace</Button>
        </div>
      </DialogContent>
    </Dialog>
  ),
};

/** A dialog holding a form, which is the case that must not dismiss on a stray click. */
export const Composition: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-svh bg-background p-section">
      <div className="mx-auto max-w-lg">
        <p className="mb-4 text-body text-foreground-muted">
          This dialog holds unsaved work, so a backdrop click does not discard it.
        </p>
        <Dialog>
          <DialogTrigger className="inline-flex h-[var(--spartant-button-height-md)] items-center rounded-control bg-primary px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
            Invite a teammate
          </DialogTrigger>
          <DialogContent dismissOnOutsideClick={false}>
            <DialogTitle>Invite a teammate</DialogTitle>
            <DialogDescription>
              They get access to this workspace and everything in it.
            </DialogDescription>
            <Field required>
              <Label>Email address</Label>
              <Input type="email" placeholder="you@example.com" />
            </Field>
            <div className="flex justify-end gap-control-gap">
              <DialogClose className="inline-flex h-[var(--spartant-button-height-md)] items-center rounded-control px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-foreground hover:bg-surface-muted">
                Cancel
              </DialogClose>
              <Button>Send invitation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  ),
};

/**
 * The keyboard path, and the whole reason for the native element.
 *
 * Focus entering the surface, being trapped, and returning to the trigger are
 * the three things a hand-built dialog gets wrong, and all three come from
 * `showModal()` rather than from anything written here.
 */
export const KeyboardPath: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger className="text-body underline">Open dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete this workspace?</DialogTitle>
        <DialogDescription>This cannot be undone.</DialogDescription>
        <DialogClose className="text-body underline">Cancel</DialogClose>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open dialog" });

    await step("It opens, and is named by its title", async () => {
      await userEvent.click(trigger);
      const dialog = canvas.getByRole("dialog");
      await expect(dialog).toHaveAttribute("open");
      await expect(dialog).toHaveAccessibleName("Delete this workspace?");
      await expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    });

    /*
     * Focus movement is deliberately not asserted here.
     *
     * The focus trap and the restore on close come from `showModal()`, and
     * happy-dom implements the element without them: a bare native dialog in
     * this environment leaves focus on the trigger when `showModal()` is
     * called. Measured, not assumed. Asserting focus would therefore fail on
     * code that is correct in every real browser, which is the mistake the
     * story template warns about. It is a browser check and a manual check,
     * and the contract lists it as both.
     */
    await step("Every dismissal path closes it and syncs the state", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
      await expect(canvas.queryByRole("dialog")).toBeNull();
      await expect(trigger).toBeVisible();
    });

    await step("The platform's own close path syncs the state too", async () => {
      /*
       * Escape cannot be pressed here: it is the platform's behaviour on a
       * trusted key, and a synthesised one does not trigger it. What Escape
       * actually does is call `close()` on the element, so calling it directly
       * exercises the same wiring: the `close` event fires, the component
       * syncs, and React unmounts the open dialog. That is the half worth
       * asserting. Pressing the key is a manual check, and the contract says so.
       */
      await userEvent.click(trigger);
      const dialog = canvas.getByRole("dialog") as HTMLDialogElement;
      dialog.close();
      await expect(canvas.queryByRole("dialog")).toBeNull();
    });
  },
};

/** The pointer path: a backdrop click dismisses, and only when it should. */
export const PointerPath: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger className="text-body underline">Open dialog</DialogTrigger>
      <DialogContent dismissOnOutsideClick={false}>
        <DialogTitle>Unsaved work</DialogTitle>
        <DialogDescription>A stray click must not discard this.</DialogDescription>
        <DialogClose className="text-body underline">Close</DialogClose>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A click on the surface never dismisses", async () => {
      await userEvent.click(canvas.getByText("Unsaved work"));
      await expect(canvas.getByRole("dialog")).toHaveAttribute("open");
    });

    await step("With dismissal off, a click on the dialog box does not either", async () => {
      await userEvent.click(canvas.getByRole("dialog"));
      await expect(canvas.getByRole("dialog")).toHaveAttribute("open");
    });

    await step("The close control still works", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Close" }));
      await expect(canvas.queryByRole("dialog")).toBeNull();
    });
  },
};

/** Rapid repeat: opening and closing quickly settles open or closed, never between. */
export const RapidRepeat: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger className="text-body underline">Open dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete this workspace?</DialogTitle>
        <DialogClose className="text-body underline">Cancel</DialogClose>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open dialog" });

    await step("Four open-and-close cycles end closed, not half open", async () => {
      for (let index = 0; index < 4; index += 1) {
        await userEvent.click(trigger);
        await expect(canvas.getByRole("dialog")).toHaveAttribute("open");
        await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
        await expect(canvas.queryByRole("dialog")).toBeNull();
      }
    });
  },
};

/**
 * Overlay origin and coordinated timing.
 *
 * A dialog comes from the centre, not from its trigger, which is what
 * distinguishes it from a popover. The backdrop runs the same duration and
 * easing as the surface so neither lands first.
 */
export const OverlayOrigin: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger className="text-body underline">Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Centre origin</DialogTitle>
        <DialogDescription>
          The surface scales from the centre while the backdrop fades, on one duration and one
          easing.
        </DialogDescription>
        <DialogClose className="text-body underline">Close</DialogClose>
      </DialogContent>
    </Dialog>
  ),
};

/** The same dialog with the motion tokens collapsed. */
export const ReducedMotion: Story = {
  decorators: [withReducedMotion],
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger className="text-body underline">Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>No entry animation</DialogTitle>
        <DialogDescription>It appears, rather than arriving.</DialogDescription>
        <DialogClose className="text-body underline">Close</DialogClose>
      </DialogContent>
    </Dialog>
  ),
};

/** A part outside its Dialog throws, naming both. */
export const PartOutsideDialog: Story = {
  parameters: { layout: "padded" },
  render: () => {
    let message = "no error, which is a bug";
    try {
      // Rendering is not needed: the hook throws when the context is missing,
      // and calling the component directly is the cheapest way to show it.
      DialogTitle({ children: "Orphan" });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    return <p className="font-mono text-caption text-foreground-muted">{message}</p>;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("The message names the part and the parent", async () => {
      await expect(
        canvas.getByText("DialogTitle must be rendered inside a Dialog."),
      ).toBeInTheDocument();
    });
  },
};

/**
 * The entry, slowed, so the backdrop and surface can be watched for whether
 * either lands before the other.
 */
export const SlowMotion: Story = {
  decorators: [withSlowMotion],
  render: () => (
    <Dialog>
      <DialogTrigger className="text-body underline">Open slowly</DialogTrigger>
      <DialogContent>
        <DialogTitle>Coordinated timing</DialogTitle>
        <DialogDescription>
          The backdrop fades while the surface scales, on one duration and one easing.
        </DialogDescription>
        <DialogClose className="text-body underline">Close</DialogClose>
      </DialogContent>
    </Dialog>
  ),
};
