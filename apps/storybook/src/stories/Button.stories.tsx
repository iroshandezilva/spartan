import { Button } from "@iroshandezilva/spartant";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
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
 * The action control, and the worked example of the story template.
 *
 * Copy this file to start a new component. Every rule in
 * `../../STORY-TEMPLATE.md` is applied here.
 */
const contract = {
  variants: ["primary", "secondary", "danger", "ghost"] as const,
  sizes: ["sm", "md", "lg"] as const,
  states: ["hover", "focus-visible", "active", "disabled", "loading", "long-content"] as const,
  interactive: true,
  retriggerable: true,
  overlay: false,
  motion: {
    kind: "motion",
    purpose:
      "Press feedback, so a pointer or touch press is acknowledged before the action resolves, and a loading indicator while it does.",
    tokens: ["duration.press-feedback", "duration.indicator-loop", "easing.state", "scale.press"],
    pointer: "Scales to the press scale while held, over the press-feedback duration.",
    keyboard:
      "Focus styling and activation are immediate. The press scale does apply while Space or Enter is held, because `:active` covers both input paths and CSS cannot separate them. Nothing waits for it.",
    reduced:
      "No branch in the component. The stylesheet collapses the durations to 0ms and the scale to 1, so the press is instant and the spinner stops turning while `aria-busy` still carries the state.",
    interruption:
      "Transitions rather than keyframes, so a second press retargets from the current scale instead of queueing. The spinner is the one loop, and it is idempotent.",
  },
  accessibility: {
    role: "A native `button`, so activation, form participation, and disabled semantics come from the platform.",
    name: "The button's text content. An icon-only button must supply `aria-label`, and the suite fails it if not.",
    keyboard: [
      "Tab moves focus to the button.",
      "Space and Enter activate it.",
      "A disabled button is skipped by Tab and cannot be activated.",
      "A loading button keeps focus and stays in the tab order, but refuses activation.",
    ],
    focus:
      "A 2px focus-visible outline at 2px offset in the focus-ring colour, identical to every other focusable component.",
    announcements:
      "`aria-busy` while loading, alongside `aria-disabled`, so assistive technology reports the wait rather than a dead control.",
  },
  manual: [
    {
      step: "Tab to the button with a real keyboard, in light and dark.",
      expect: "A visible offset focus ring, readable against both the surface and the page.",
    },
    {
      step: "Press and hold with a pointer, then press repeatedly and quickly.",
      expect: "It scales while held, returns on release, and never sticks pressed.",
    },
    {
      step: "Press the small size on a touch device.",
      expect: "The 32px button is comfortable to hit, because the target is 44px.",
    },
    {
      step: "Turn on the OS reduce-motion setting and reload, then press and load.",
      expect:
        "The press is instant and the spinner does not turn, while the button still reports busy.",
    },
  ],
} satisfies StoryContract;

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered", spartant: contract },
  argTypes: {
    variant: {
      control: "select",
      options: [...contract.variants],
      description: "Emphasis, described by meaning rather than colour.",
    },
    size: { control: "select", options: [...contract.sizes], description: "Scale." },
    loading: {
      control: "boolean",
      description: "Shows a progress indicator and refuses activation, without losing focus.",
    },
    disabled: { control: "boolean", description: "Native disabled." },
  },
  args: {
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
    children: "Save changes",
  },
} satisfies Meta<typeof Button> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG = "Archive every selected conversation and notify the people watching them";

/**
 * One spy per story that needs one.
 *
 * Declared at module scope so each keeps its mock typing, which `args.onClick`
 * loses: the meta types it as the native handler, and a cast at every call site
 * would be noise. Each story clears its own before asserting, because the suite
 * runs every story twice, once for interactions and once for the audit.
 */
const clickSpies = {
  keyboard: fn(),
  pointer: fn(),
  loading: fn(),
  rapid: fn(),
};

/** The declared motion, accessibility, and manual-review contract. */
export const Contract: Story = {
  parameters: { layout: "padded" },
  render: () => <ContractPanel contract={contract} />,
};

export const Default: Story = {};

export const Variants: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <StateMatrix>
      {contract.variants.map((variant) => (
        <StateCase key={variant} label={variant}>
          <Button variant={variant}>Save changes</Button>
        </StateCase>
      ))}
    </StateMatrix>
  ),
};

export const Sizes: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <StateMatrix>
      {contract.sizes.map((size) => (
        <StateCase
          key={size}
          label={size}
          note={
            size === "sm"
              ? "32px tall, with the 44px target restored on coarse pointers."
              : size === "md"
                ? "44px, meeting the touch floor on its own."
                : "52px, for a primary action on a small screen."
          }
        >
          <Button size={size}>Save changes</Button>
        </StateCase>
      ))}
    </StateMatrix>
  ),
};

const staticStates: Record<
  Extract<(typeof contract.states)[number], StaticState>,
  { note: string; render: () => ReactNode }
> = {
  disabled: {
    note: "Native disabled. Skipped by Tab, and the press scale cannot fire.",
    render: () => <Button disabled>Save changes</Button>,
  },
  loading: {
    note: "Keeps focus and its place in the tab order, refuses activation, and does not resize.",
    render: () => <Button loading>Save changes</Button>,
  },
  "long-content": {
    note: "A label with no natural break, against the size scale.",
    render: () => <Button>{LONG}</Button>,
  },
};

/** States that only exist mid-interaction, and the story that proves each. */
const transientStates: Record<Extract<(typeof contract.states)[number], TransientState>, string> = {
  hover: "PointerPath",
  "focus-visible": "KeyboardPath",
  active: "PointerPath",
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
        . Rendering them here would mean restating the styles under test.
      </p>
    </div>
  ),
};

/** Pinned to dark regardless of the toolbar, because the toolbar is a global. */
export const DarkTheme: Story = {
  parameters: { layout: "padded", themes: { themeOverride: "dark" } },
  render: () => (
    <StateMatrix>
      {contract.variants.map((variant) => (
        <StateCase key={variant} label={variant}>
          <Button variant={variant}>Save changes</Button>
        </StateCase>
      ))}
    </StateMatrix>
  ),
};

/**
 * A realistic composition. Buttons almost never appear alone: they appear in a
 * row, in a priority order, next to a cancel that must not compete.
 */
export const Composition: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-svh bg-background p-section">
      <div className="mx-auto grid max-w-xl gap-stack rounded-surface border border-border bg-surface p-surface shadow-surface">
        <div className="grid gap-1">
          <h2 className="text-heading font-semibold tracking-heading text-foreground">
            Delete this workspace?
          </h2>
          <p className="text-body text-foreground-muted">
            Everything in it goes with it. This cannot be undone, which is why the destructive
            action is the one that looks destructive.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-control-gap">
          <Button variant="ghost">Cancel</Button>
          <Button variant="secondary">Export first</Button>
          <Button variant="danger">Delete workspace</Button>
        </div>
      </div>
    </div>
  ),
};

/**
 * The keyboard path.
 *
 * Focus movement is asserted; `:focus-visible` is not, because synthesised
 * events are untrusted and it reads false however correct the styling is. The
 * ring is a manual check, and the contract says so.
 */
export const KeyboardPath: Story = {
  args: { onClick: clickSpies.keyboard },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Save changes" });

    await step("Tab moves focus to the button", async () => {
      await userEvent.tab();
      await expect(button).toHaveFocus();
    });

    await step("Space and Enter activate it", async () => {
      clickSpies.keyboard.mockClear();
      await userEvent.keyboard(" ");
      await userEvent.keyboard("{Enter}");
      await expect(clickSpies.keyboard).toHaveBeenCalledTimes(2);
    });

    await step("Tab again moves focus on, so nothing traps it", async () => {
      await userEvent.tab();
      await expect(button).not.toHaveFocus();
    });
  },
};

/** The pointer path: a click that lands proves nothing is covering the control. */
export const PointerPath: Story = {
  args: { onClick: clickSpies.pointer },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Save changes" });

    await step("A pointer click reaches the button", async () => {
      clickSpies.pointer.mockClear();
      await userEvent.click(button);
      await expect(clickSpies.pointer).toHaveBeenCalledTimes(1);
      await expect(button).toBeEnabled();
    });
  },
};

/**
 * Loading refuses activation without losing focus.
 *
 * This is the behaviour most worth a test, because the obvious implementation
 * sets `disabled`, and a disabled element drops focus at the exact moment the
 * user is waiting for something.
 */
export const LoadingRefusesActivation: Story = {
  args: { loading: true, onClick: clickSpies.loading },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Save changes" });

    await step("It reports busy and disabled, but is not the disabled attribute", async () => {
      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(button).toHaveAttribute("aria-disabled", "true");
      await expect(button).toBeEnabled();
    });

    await step("It still takes focus, so the user keeps their place", async () => {
      await userEvent.tab();
      await expect(button).toHaveFocus();
    });

    await step("The consumer's handler never runs", async () => {
      // The contract is that the caller's onClick does not fire. A native
      // listener would still see the event, because React delegates from the
      // root and the component cannot stop a listener attached to the element
      // itself. What it can do, and does, is refuse to call the handler and
      // prevent the default, which is what stops a form submitting.
      clickSpies.loading.mockClear();
      await userEvent.click(button);
      await userEvent.keyboard("{Enter}");
      await expect(clickSpies.loading).not.toHaveBeenCalled();
    });
  },
};

/**
 * Rapid repeat.
 *
 * The press is a transition, so a second press retargets rather than queueing.
 * That is a property of transitions and is not asserted here, because it cannot
 * be: synthetic pointer events never set `:active`. What is asserted is that the
 * control survives, stays usable, and is still the same element.
 */
export const RapidRepeat: Story = {
  args: { onClick: clickSpies.rapid },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Save changes" });

    await step("Ten presses in quick succession", async () => {
      clickSpies.rapid.mockClear();
      for (let index = 0; index < 10; index += 1) {
        await userEvent.click(button, { delay: null });
      }
      await expect(clickSpies.rapid).toHaveBeenCalledTimes(10);
      await expect(button).toBeEnabled();
    });

    await step("It is still the same control, not a replaced one", async () => {
      await expect(canvas.getByRole("button", { name: "Save changes" })).toBe(button);
    });
  },
};

/** The same component with the motion tokens collapsed, spinner included. */
export const ReducedMotion: Story = {
  args: { loading: true },
  decorators: [withReducedMotion],
};

/**
 * The press curve at eight times its length, which is the only way to judge it.
 * 120ms is too short to see whether the easing is right.
 */
export const SlowMotion: Story = {
  decorators: [withSlowMotion],
};

/**
 * Not part of the required matrix. An icon-only button has no text, so it must
 * carry an `aria-label`, and the accessibility audit fails it if it does not.
 */
export const IconOnly: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex items-center gap-3">
      {contract.sizes.map((size) => (
        <Button
          key={size}
          size={size}
          variant="ghost"
          aria-label="Close"
          className="aspect-square px-0"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="none">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </Button>
      ))}
    </div>
  ),
};
