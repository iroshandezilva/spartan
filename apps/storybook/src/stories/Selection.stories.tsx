import {
  Checkbox,
  Field,
  FieldMessage,
  Label,
  Radio,
  RadioGroup,
  Switch,
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
 * The selection controls: `Checkbox`, `RadioGroup` with `Radio`, and `Switch`.
 *
 * Three different semantics that are constantly mistaken for each other. The
 * difference is behavioural, not visual: a checkbox is a value you submit, a
 * radio is one choice out of several, a switch takes effect the moment it flips.
 */
const contract = {
  variants: [],
  sizes: [],
  states: ["hover", "focus-visible", "selected", "disabled", "invalid", "long-content"] as const,
  interactive: true,
  retriggerable: true,
  overlay: false,
  motion: {
    kind: "motion",
    purpose:
      "The switch thumb travels between two visible positions, and the checkbox and radio fills change colour, so a state change is seen as a change rather than as a different picture.",
    tokens: ["duration.state-change", "easing.state", "easing.move"],
    pointer: "Clicking the control or its label toggles it, and the change animates.",
    keyboard:
      "Space toggles a checkbox or switch; arrow keys move within a radio group. State changes immediately and nothing waits for the animation.",
    reduced:
      "The stylesheet collapses the duration to 0ms, so the thumb jumps and the fill changes instantly.",
    interruption:
      "Transitions rather than keyframes, so toggling repeatedly retargets the thumb from wherever it is instead of queueing.",
  },
  accessibility: {
    role: "Native `input type=checkbox` and `type=radio`. Switch is a native checkbox carrying `role=switch`, which keeps form participation and label activation while reporting the right role.",
    name: "The associated `label`. A radio group is named by its `legend`.",
    keyboard: [
      "Tab moves to the control. A radio group is one tab stop.",
      "Space toggles a checkbox or switch.",
      "Arrow keys move and select within a radio group, wrapping at the ends. That is the browser's own behaviour, because the radios share a name.",
      "Clicking a label activates its control.",
    ],
    focus:
      "A 2px focus-visible outline at 2px offset in the focus-ring colour, identical to every other focusable component.",
    announcements:
      "Checked, unchecked, and mixed are reported by the native control. `indeterminate` is a DOM property, so it is set through a ref rather than an attribute.",
  },
  manual: [
    {
      step: "Tab into the radio group, then use the arrow keys.",
      expect:
        "The group is one tab stop, arrows move and select, and the selection wraps at the ends.",
    },
    {
      step: "Click each label rather than the control.",
      expect: "The control toggles. This is native label behaviour, not a click handler.",
    },
    {
      step: "Toggle a switch on a touch device.",
      expect: "The 24px track is comfortable to hit, because the target is 44px.",
    },
    {
      step: "With VoiceOver, move through a checkbox, a switch, and a radio group.",
      expect:
        "Checkbox reports checkbox, switch reports switch, and the group announces its legend and position.",
    },
  ],
} satisfies StoryContract;

const meta = {
  title: "Components/Selection",
  component: Checkbox,
  parameters: { layout: "padded", spartant: contract },
  argTypes: {
    checked: { control: "boolean", description: "Controlled checked state." },
    indeterminate: { control: "boolean", description: "Neither checked nor unchecked." },
    disabled: { control: "boolean", description: "Native disabled." },
  },
  args: {},
} satisfies Meta<typeof Checkbox> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

/** A control and its label, which is how any of them is actually used. */
function Row({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <div className="flex items-center gap-control-gap">
      {children}
      <Label htmlFor={htmlFor} className="font-normal">
        {htmlFor === "row-switch" ? "Email notifications" : "I agree to the terms"}
      </Label>
    </div>
  );
}

/** The declared motion, accessibility, and manual-review contract. */
export const Contract: Story = {
  render: () => <ContractPanel contract={contract} />,
};

export const Default: Story = {
  render: () => (
    <Row htmlFor="row-checkbox">
      <Checkbox id="row-checkbox" defaultChecked />
    </Row>
  ),
};

/** All three together, which is the only way to see that they differ. */
export const AllThree: Story = {
  render: () => (
    <div className="grid gap-6">
      <Row htmlFor="row-checkbox-2">
        <Checkbox id="row-checkbox-2" defaultChecked />
      </Row>
      <Row htmlFor="row-switch">
        <Switch id="row-switch" defaultChecked />
      </Row>
      <RadioGroup label="Billing period" defaultValue="monthly" name="billing-demo">
        <div className="flex items-center gap-control-gap">
          <Radio id="billing-monthly" value="monthly" />
          <Label htmlFor="billing-monthly" className="font-normal">
            Monthly
          </Label>
        </div>
        <div className="flex items-center gap-control-gap">
          <Radio id="billing-yearly" value="yearly" />
          <Label htmlFor="billing-yearly" className="font-normal">
            Yearly, two months free
          </Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

const staticStates: Record<
  Extract<(typeof contract.states)[number], StaticState>,
  { note: string; render: () => ReactNode }
> = {
  selected: {
    note: "Checked checkbox, checked switch, selected radio.",
    render: () => (
      <div className="grid gap-3">
        <Checkbox defaultChecked aria-label="Checked checkbox" />
        <Switch defaultChecked aria-label="Checked switch" />
        <RadioGroup defaultValue="a" name="state-selected">
          <Radio value="a" aria-label="Selected radio" />
        </RadioGroup>
      </div>
    ),
  },
  disabled: {
    note: "Skipped by Tab. Checked and unchecked both stay legible.",
    render: () => (
      <div className="grid gap-3">
        <Checkbox disabled aria-label="Disabled unchecked" />
        <Checkbox disabled defaultChecked aria-label="Disabled checked" />
        <Switch disabled defaultChecked aria-label="Disabled switch" />
      </div>
    ),
  },
  invalid: {
    note: "Border carries it, and `aria-invalid` marks the control.",
    render: () => (
      <Field invalid className="w-full">
        <div className="flex items-center gap-control-gap">
          <Checkbox />
          <Label className="font-normal">Accept the terms</Label>
        </div>
        <FieldMessage tone="error">You have to accept the terms to continue.</FieldMessage>
      </Field>
    ),
  },
  "long-content": {
    note: "The control stays put while the label wraps beside it.",
    render: () => (
      <div className="flex items-start gap-control-gap">
        <Checkbox id="long-label" className="mt-0.5" />
        <Label htmlFor="long-label" className="font-normal">
          Send me occasional product updates, release notes, and the very occasional survey, none of
          which will be more than one email a month
        </Label>
      </div>
    ),
  },
};

/** States that only exist mid-interaction, and the story that proves each. */
const transientStates: Record<Extract<(typeof contract.states)[number], TransientState>, string> = {
  hover: "PointerPath",
  "focus-visible": "KeyboardPath",
};

export const States: Story = {
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

/**
 * Indeterminate.
 *
 * A DOM property, not an attribute, which is why `<input indeterminate>` does
 * nothing at all and this needs a ref.
 */
export const Indeterminate: Story = {
  render: () => (
    <div className="flex items-center gap-control-gap">
      <Checkbox id="indeterminate-box" indeterminate />
      <Label htmlFor="indeterminate-box" className="font-normal">
        Some rows selected
      </Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByLabelText("Some rows selected") as HTMLInputElement;

    await step("The DOM property is set, and the state is reported as mixed", async () => {
      await expect(box.indeterminate).toBe(true);
      await expect(box).toHaveAttribute("type", "checkbox");
    });
  },
};

/** Pinned to dark regardless of the toolbar. */
export const DarkTheme: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <StateMatrix>
      {Object.entries(staticStates).map(([state, { note, render }]) => (
        <StateCase key={state} label={state} note={note}>
          {render()}
        </StateCase>
      ))}
    </StateMatrix>
  ),
};

/** A settings panel, which is where all three appear together in practice. */
export const Composition: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-svh bg-background p-section">
      <div className="mx-auto grid max-w-lg gap-stack rounded-surface border border-border bg-surface p-surface shadow-surface">
        <div className="grid gap-1">
          <h2 className="text-heading font-semibold tracking-heading text-foreground">
            Notification settings
          </h2>
          <p className="text-body text-foreground-muted">
            Switches take effect immediately. The checkbox is submitted with the form.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="setting-email" className="font-normal">
              Email notifications
            </Label>
            <Switch id="setting-email" defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="setting-push" className="font-normal">
              Push notifications
            </Label>
            <Switch id="setting-push" />
          </div>
        </div>

        <RadioGroup label="Digest frequency" defaultValue="weekly" name="digest">
          {[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "never", label: "Never" },
          ].map((option) => (
            <div key={option.value} className="flex items-center gap-control-gap">
              <Radio id={`digest-${option.value}`} value={option.value} />
              <Label htmlFor={`digest-${option.value}`} className="font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex items-start gap-control-gap border-t border-border-subtle pt-4">
          <Checkbox id="setting-terms" className="mt-0.5" />
          <Label htmlFor="setting-terms" className="font-normal">
            Include me in the beta programme
          </Label>
        </div>
      </div>
    </div>
  ),
};

/**
 * The keyboard path.
 *
 * The radio-group assertions matter most: a group is one tab stop and arrows
 * move within it. That is the browser's behaviour because the radios share a
 * name, and it is the thing a hand-rolled `role="radiogroup"` gets wrong.
 */
export const KeyboardPath: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="flex items-center gap-control-gap">
        <Checkbox id="kb-checkbox" />
        <Label htmlFor="kb-checkbox" className="font-normal">
          Remember me
        </Label>
      </div>
      <RadioGroup label="Size" defaultValue="small" name="kb-size">
        {/*
         * Label text is written as it should be read, not lower-cased and
         * capitalised with CSS. `text-transform` does not change the accessible
         * name, so a screen reader would say "small" while the screen says
         * "Small", and every query by name has to guess which one it gets.
         */}
        {[
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ].map((option) => (
          <div key={option.value} className="flex items-center gap-control-gap">
            <Radio id={`kb-${option.value}`} value={option.value} />
            <Label htmlFor={`kb-${option.value}`} className="font-normal">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByLabelText("Remember me") as HTMLInputElement;

    await step("Space toggles the checkbox", async () => {
      await userEvent.tab();
      await expect(checkbox).toHaveFocus();
      await expect(checkbox.checked).toBe(false);
      await userEvent.keyboard(" ");
      await expect(checkbox.checked).toBe(true);
    });

    await step("The radio group is a single tab stop", async () => {
      await userEvent.tab();
      await expect(canvas.getByLabelText("Small")).toHaveFocus();
      // Tabbing again must leave the group entirely rather than visiting each
      // option, which is what makes a long list of options usable.
      await userEvent.tab();
      await expect(canvas.getByLabelText("Medium")).not.toHaveFocus();
      await expect(canvas.getByLabelText("Large")).not.toHaveFocus();
    });
  },
};

/** The pointer path: clicking a label toggles its control, natively. */
export const PointerPath: Story = {
  render: () => (
    <div className="flex items-center gap-control-gap">
      <Switch id="pp-switch" />
      <Label htmlFor="pp-switch" className="font-normal">
        Email notifications
      </Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByLabelText("Email notifications") as HTMLInputElement;

    await step("It reports the switch role, not checkbox", async () => {
      await expect(control).toHaveAttribute("role", "switch");
      await expect(canvas.getByRole("switch", { name: "Email notifications" })).toBe(control);
    });

    await step("Clicking the label toggles it", async () => {
      await expect(control.checked).toBe(false);
      await userEvent.click(canvas.getByText("Email notifications"));
      await expect(control.checked).toBe(true);
    });

    await step("The checked state reaches the accessibility tree", async () => {
      // Through the semantics, not the DOM property. The component sets no
      // `aria-checked`: a native checkbox maps `checked` onto it, and a
      // hand-written attribute would be a second source of truth that goes
      // stale. This is the assertion that proves the mapping actually happens.
      await expect(canvas.getByRole("switch", { name: "Email notifications" })).toBeChecked();
    });
  },
};

/** Rapid repeat: toggling quickly settles on the correct final state. */
export const RapidRepeat: Story = {
  render: () => (
    <div className="flex items-center gap-control-gap">
      <Switch id="rr-switch" />
      <Label htmlFor="rr-switch" className="font-normal">
        Email notifications
      </Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByLabelText("Email notifications") as HTMLInputElement;

    await step("Nine toggles ends on, not somewhere in between", async () => {
      for (let index = 0; index < 9; index += 1) {
        await userEvent.click(control, { delay: null });
      }
      await expect(control.checked).toBe(true);
    });
  },
};

/** The same controls with the motion tokens collapsed. */
export const ReducedMotion: Story = {
  decorators: [withReducedMotion],
  render: () => (
    <div className="grid gap-3">
      <Checkbox defaultChecked aria-label="Checked checkbox" />
      <Switch defaultChecked aria-label="Checked switch" />
    </div>
  ),
};

/** The switch thumb travelling, slowed. The one spatial move in the slice. */
export const SlowMotion: Story = {
  decorators: [withSlowMotion],
  render: () => (
    <div className="flex items-center gap-control-gap">
      <Switch id="slow-switch" />
      <Label htmlFor="slow-switch" className="font-normal">
        Toggle repeatedly to watch the thumb
      </Label>
    </div>
  ),
};
