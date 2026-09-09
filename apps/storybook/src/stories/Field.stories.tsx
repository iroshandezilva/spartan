import { Button, Field, FieldMessage, Input, Label, Textarea } from "@iroshandezilva/spartant";
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
 * The text-field family: `Field`, `Label`, `Input`, `Textarea`, `FieldMessage`.
 *
 * One story file because they are one contract. A Label that does not target its
 * Input, or an error no `aria-describedby` reaches, is not a partial success.
 */
const contract = {
  // The family has no visual variants. Emphasis in a form comes from layout and
  // copy, not from a coloured input.
  variants: [],
  sizes: [],
  states: [
    "hover",
    "focus-visible",
    "disabled",
    "invalid",
    "read-only",
    "empty",
    "long-content",
  ] as const,
  interactive: true,
  // Typing is not a retriggerable transition. The only motion is a colour
  // change on focus, which a transition retargets by definition.
  retriggerable: false,
  overlay: false,
  motion: {
    kind: "motion",
    purpose:
      "Border and background colour change on focus and on becoming invalid, so a state change is noticed without the field moving under the cursor.",
    tokens: ["duration.state-change", "easing.state"],
    pointer: "Hover and focus change colour only.",
    keyboard:
      "Focus styling is immediate. Nothing waits for the transition, and typing is never delayed.",
    reduced: "The stylesheet collapses the duration to 0ms, so the colour change is instant.",
    interruption:
      "A transition rather than a keyframe animation, so tabbing quickly through a form retargets each colour from where it is.",
  },
  accessibility: {
    role: "Native `label`, `input`, and `textarea`. The wrapper is a plain container with no role of its own.",
    name: "The `label`, associated by `htmlFor` and `id`. Ids come from `useId`, so two fields on a page cannot collide.",
    keyboard: [
      "Tab moves focus between controls in document order.",
      "Clicking the label focuses its control, which is native label behaviour rather than anything added.",
      "A disabled control is skipped by Tab. A read-only control is not: its value is still selectable and copyable.",
    ],
    focus:
      "A 2px focus-visible outline at 2px offset in the focus-ring colour, identical to every other focusable component.",
    announcements:
      "`aria-describedby` names the description and then the error, in that order. The error is a polite live region, so it announces when it appears without interrupting mid-word. `aria-invalid` marks the control itself.",
  },
  manual: [
    {
      step: "Tab through the composition story and type into each control.",
      expect: "Focus is visible, and no field moves or resizes while being typed into.",
    },
    {
      step: "With VoiceOver, move to an invalid field.",
      expect:
        "The label, then the description, then the error are announced, and the field reports invalid.",
    },
    {
      step: "Let the browser autofill a saved value.",
      expect:
        "The autofilled background does not hide the text. Chrome overrides background-color on autofill, which no stylesheet can fully prevent.",
    },
    {
      step: "Zoom the browser to 200% and reflow to 320px.",
      expect: "Labels, controls, and messages stay readable and nothing is clipped.",
    },
  ],
} satisfies StoryContract;

const meta = {
  title: "Components/Field",
  component: Input,
  parameters: { layout: "padded", spartant: contract },
  argTypes: {
    placeholder: { control: "text", description: "Native placeholder." },
    disabled: { control: "boolean", description: "Native disabled." },
    readOnly: { control: "boolean", description: "Native read-only." },
    required: { control: "boolean", description: "Native required." },
  },
  args: { placeholder: "you@example.com" },
} satisfies Meta<typeof Input> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG =
  "A description long enough to wrap over more than one line, because help text usually is, and because a single line hides every wrapping bug there is.";

/** The declared motion, accessibility, and manual-review contract. */
export const Contract: Story = {
  render: () => <ContractPanel contract={contract} />,
};

/** The recommended composition: everything wired by `Field`. */
export const Default: Story = {
  render: (args) => (
    <Field className="max-w-sm">
      <Label>Email address</Label>
      <Input type="email" {...args} />
      <FieldMessage>We only use this to send receipts.</FieldMessage>
    </Field>
  ),
};

/**
 * Each part alone.
 *
 * A bare control is a legitimate thing to render, so the parts do not throw
 * outside a `Field`. They just stop wiring themselves, and the caller owns the
 * `id` and the association.
 */
export const StandaloneParts: Story = {
  render: () => (
    <div className="grid max-w-sm gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="standalone-input">Label and Input, wired by hand</Label>
        <Input id="standalone-input" placeholder="No Field around this" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="standalone-textarea">Textarea</Label>
        <Textarea id="standalone-textarea" placeholder="Two field heights tall by default" />
      </div>
      <FieldMessage id="standalone-message">
        A message with no field. It renders, and it describes nothing.
      </FieldMessage>
    </div>
  ),
};

const staticStates: Record<
  Extract<(typeof contract.states)[number], StaticState>,
  { note: string; render: () => ReactNode }
> = {
  disabled: {
    note: "Skipped by Tab. Value not selectable.",
    render: () => (
      <Field disabled className="w-full">
        <Label>Workspace</Label>
        <Input defaultValue="haux-studio" />
        <FieldMessage>Set when the workspace was created.</FieldMessage>
      </Field>
    ),
  },
  invalid: {
    note: "Border and message carry it, and `aria-invalid` marks the control.",
    render: () => (
      <Field invalid className="w-full">
        <Label>Email address</Label>
        <Input type="email" defaultValue="not-an-address" />
        <FieldMessage tone="error">Enter an address in the form name@example.com.</FieldMessage>
      </Field>
    ),
  },
  "read-only": {
    note: "Still focusable, still copyable. Quieter, not dead.",
    render: () => (
      <Field className="w-full">
        <Label>Workspace id</Label>
        <Input readOnly defaultValue="ws_8f21c40a" />
      </Field>
    ),
  },
  empty: {
    note: "Placeholder only. Never the label.",
    render: () => (
      <Field className="w-full">
        <Label>Display name</Label>
        <Input placeholder="How your name appears to others" />
      </Field>
    ),
  },
  "long-content": {
    note: "Wrapping description, and a value longer than the box.",
    render: () => (
      <Field className="w-full">
        <Label>Notes</Label>
        <Input defaultValue="A value considerably longer than the control that holds it" />
        <FieldMessage>{LONG}</FieldMessage>
      </Field>
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

/** Required shows a marker in the label and sets the attribute on the control. */
export const Required: Story = {
  render: () => (
    <Field required className="max-w-sm">
      <Label>Full name</Label>
      <Input placeholder="Ada Lovelace" />
      <FieldMessage>The asterisk is decorative; screen readers hear the word.</FieldMessage>
    </Field>
  ),
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

/** A realistic form, which is the only context these components ever appear in. */
export const Composition: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-svh bg-background p-section">
      <form
        className="mx-auto grid max-w-lg gap-stack rounded-surface border border-border bg-surface p-surface shadow-surface"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid gap-1">
          <h2 className="text-heading font-semibold tracking-heading text-foreground">
            Invite a teammate
          </h2>
          <p className="text-body text-foreground-muted">
            They get access to this workspace and everything in it.
          </p>
        </div>

        <Field required>
          <Label>Email address</Label>
          <Input type="email" placeholder="you@example.com" />
          <FieldMessage>
            They will receive an invitation link that expires in seven days.
          </FieldMessage>
        </Field>

        <Field invalid>
          <Label>Display name</Label>
          <Input defaultValue="  " />
          <FieldMessage tone="error">A display name cannot be only spaces.</FieldMessage>
        </Field>

        <Field>
          <Label>Message</Label>
          <Textarea placeholder="Optional note for the invitation" />
        </Field>

        <div className="flex justify-end gap-control-gap">
          <Button variant="ghost" type="button">
            Cancel
          </Button>
          <Button type="submit">Send invitation</Button>
        </div>
      </form>
    </div>
  ),
};

/**
 * The keyboard path, and the association contract.
 *
 * `getByLabelText` is the assertion that matters most here: it resolves through
 * the accessible name, so it only finds the control if the label genuinely
 * targets it. A visually adjacent label that associates with nothing fails.
 */
export const KeyboardPath: Story = {
  render: () => (
    <Field invalid className="max-w-sm">
      <Label>Email address</Label>
      <Input type="email" defaultValue="not-an-address" />
      <FieldMessage>We only use this to send receipts.</FieldMessage>
      <FieldMessage tone="error">Enter an address in the form name@example.com.</FieldMessage>
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Email address");

    await step("The label resolves to the control", async () => {
      await expect(input.tagName).toBe("INPUT");
    });

    await step("Tab reaches it and typing works", async () => {
      await userEvent.tab();
      await expect(input).toHaveFocus();
      await userEvent.clear(input);
      await userEvent.type(input, "ada@example.com");
      await expect(input).toHaveValue("ada@example.com");
    });

    await step("Description and error are both associated, in reading order", async () => {
      const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];
      await expect(describedBy).toHaveLength(2);
      // Every id must resolve. Pointing at a missing id announces nothing while
      // looking correct in the markup, which is the failure worth catching.
      const texts = describedBy.map(
        (id) => canvasElement.ownerDocument.getElementById(id)?.textContent,
      );
      await expect(texts[0]).toContain("receipts");
      await expect(texts[1]).toContain("name@example.com");
      await expect(input).toHaveAttribute("aria-invalid", "true");
    });
  },
};

/** The pointer path: a label click focuses its control, which is native behaviour. */
export const PointerPath: Story = {
  render: () => (
    <Field className="max-w-sm">
      <Label>Display name</Label>
      <Input placeholder="Ada Lovelace" />
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Display name");

    await step("Clicking the label focuses the control", async () => {
      await userEvent.click(canvas.getByText("Display name"));
      await expect(input).toHaveFocus();
    });
  },
};

/**
 * A field with no messages must not point at ids that do not exist.
 *
 * This is the whole reason messages register themselves, and the reason it is
 * asserted here rather than left to the audit: injecting a dangling reference
 * leaves every accessibility check green. axe does not catch it. A screen
 * reader announces nothing, and the markup looks deliberate.
 */
export const NoDanglingDescribedBy: Story = {
  render: () => (
    <Field className="max-w-sm">
      <Label>Display name</Label>
      <Input placeholder="Ada Lovelace" />
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Display name");

    await step("No describedby at all when there is nothing to describe", async () => {
      await expect(input).not.toHaveAttribute("aria-describedby");
    });
  },
};

/** The same family with the motion tokens collapsed. */
export const ReducedMotion: Story = {
  decorators: [withReducedMotion],
  render: () => (
    <Field className="max-w-sm">
      <Label>Email address</Label>
      <Input type="email" placeholder="you@example.com" />
      <FieldMessage>Focus this field; the border changes colour instantly.</FieldMessage>
    </Field>
  ),
};

/** The focus and validation colour change, slowed so the curve is visible. */
export const SlowMotion: Story = {
  decorators: [withSlowMotion],
  render: () => (
    <Field className="max-w-sm">
      <Label>Email address</Label>
      <Input type="email" placeholder="Focus and blur this repeatedly" />
    </Field>
  ),
};
