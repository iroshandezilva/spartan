import { Button, Field, FieldMessage, Input, Label, Select } from "@iroshandezilva/spartant";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
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
 * One choice from a list, on the native `select`.
 *
 * HAUX-52 decided native over a custom listbox. The list the user picks from
 * is therefore the platform's popup, which is why `overlay` is false below:
 * there is no positioned surface of ours to give an origin to, and an
 * `OverlayOrigin` story would show nothing Spartant owns.
 */
const contract = {
  variants: [],
  sizes: [],
  states: ["hover", "focus-visible", "disabled", "invalid", "empty", "long-content"] as const,
  interactive: true,
  // Opening the list is the platform's, and the only motion of ours is a
  // colour transition, which retargets by definition.
  retriggerable: false,
  overlay: false,
  motion: {
    kind: "motion",
    purpose:
      "Border and background colour change on hover, focus, and on becoming invalid, so a state change is noticed without the control moving. The list itself is the platform's popup and has no motion of ours: the decision to stay native means its entry is the operating system's, and adding a transition to the closed control to stand in for it would decorate without explaining.",
    tokens: ["duration.state-change", "easing.state"],
    pointer:
      "Hover strengthens the border, colour only and only where a pointer can hover. A press opens the platform picker.",
    keyboard:
      "Focus styling is immediate. Arrow keys, typeahead, Enter, Space, and Escape are handled by the browser and never wait for anything.",
    reduced: "The stylesheet collapses the duration to 0ms, so the colour change is instant.",
    interruption:
      "A transition rather than a keyframe animation, so tabbing quickly on and off retargets the colour from where it is. The popup cannot be interrupted mid-flight because it has no flight.",
  },
  accessibility: {
    role: "A native `select`, reported as a combo box or pop-up button by the platform. Options are native `option` and `optgroup` elements.",
    name: "The associated `label`, wired by `Field` through `htmlFor` and `id`. Standalone, pass `aria-label` or `id` and `htmlFor` yourself.",
    keyboard: [
      "Tab moves focus to the control.",
      "Space, Enter, Alt+Down, or Down opens the list. Which keys open it and which change the value without opening it is the platform's convention, and it differs between macOS and Windows.",
      "Up and Down move through the options. Typing letters jumps to the first option that starts with them.",
      "Enter chooses; Escape closes without changing the value. Focus returns to the control in both cases.",
      "A disabled select is skipped by Tab.",
    ],
    focus:
      "A 2px focus-visible outline at 2px offset in the focus-ring colour, identical to every other focusable component. Focus never leaves the control: the popup is rendered by the platform outside the document.",
    announcements:
      "The chosen option's label is the accessible value, and while nothing is chosen the placeholder is, which is honest. `aria-invalid` marks the control and `aria-describedby` names the description and then the error, exactly as for `Input`.",
  },
  manual: [
    {
      step: "Tab to the select, open it with the keyboard, move with the arrows, type a letter, choose with Enter, then open and press Escape.",
      expect:
        "The list opens, typeahead jumps, Enter chooses, Escape closes with the value unchanged, and focus is on the control throughout.",
    },
    {
      step: "Click the label, then click the chevron.",
      expect:
        "The label focuses the control. The chevron opens the list, because presses pass through it.",
    },
    {
      step: "Open the LongList story near the bottom of a short window, and the ConstrainedViewport story at 320px.",
      expect:
        "The list is repositioned by the platform so it stays on screen and scrolls. Nothing overflows the page horizontally.",
    },
    {
      step: "Zoom the browser to 200% and Tab to the control.",
      expect:
        "The focus ring is fully visible, the chevron stays inside the box, and a long value is clipped with an ellipsis.",
    },
    {
      step: "Submit the FormSubmission story with the placeholder still chosen, then choose an option and submit again.",
      expect:
        "The browser blocks the first submission as missing; the second submits the chosen value.",
    },
    {
      step: "Switch to dark theme and open the list.",
      expect:
        "The closed control uses the dark roles, and the platform popup is legible. On Chrome for Windows and Linux it follows the theme through color-scheme; on macOS it is the system picker.",
    },
  ],
} satisfies StoryContract;

const meta = {
  title: "Components/Select",
  component: Select,
  parameters: { layout: "padded", spartant: contract },
  argTypes: {
    placeholder: {
      control: "text",
      description:
        "Shown while nothing is chosen. Rendered as an empty-valued first option, disabled when the control is required.",
    },
    disabled: { control: "boolean", description: "Native disabled." },
    required: { control: "boolean", description: "Native required." },
  },
  args: { placeholder: "Choose a country", disabled: false, required: false },
} satisfies Meta<typeof Select> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG_LABEL =
  "United Kingdom of Great Britain and Northern Ireland, including the Crown Dependencies";

/** Enough options to force the platform popup to scroll and reposition. */
const MANY = Array.from({ length: 60 }, (_, index) => `Option ${index + 1}`);

function Countries() {
  return (
    <>
      <option value="gb">United Kingdom</option>
      <option value="lk">Sri Lanka</option>
      <option value="nz">New Zealand</option>
      <option value="jp">Japan</option>
    </>
  );
}

/**
 * One spy per story that needs one, at module scope so each keeps its mock
 * typing. Cleared before asserting, because the suite runs every story twice.
 */
const spies = {
  keyboard: fn(),
  pointer: fn(),
  submit: fn(),
};

/** The declared motion, accessibility, and manual-review contract. */
export const Contract: Story = {
  render: () => <ContractPanel contract={contract} />,
};

/** The recommended composition: everything wired by `Field`. */
export const Default: Story = {
  render: (args) => (
    <Field className="max-w-sm">
      <Label>Country</Label>
      <Select {...args}>
        <Countries />
      </Select>
      <FieldMessage>Where the invoice is addressed.</FieldMessage>
    </Field>
  ),
};

/**
 * Standalone, with the association made by hand.
 *
 * A bare `Select` is legitimate. It just stops wiring itself, and the caller
 * owns the `id` and the label.
 */
export const Standalone: Story = {
  render: () => (
    <div className="grid max-w-sm gap-1.5">
      <Label htmlFor="standalone-select">Country</Label>
      <Select id="standalone-select" placeholder="Choose a country">
        <Countries />
      </Select>
    </div>
  ),
};

/** Native `optgroup` children pass through, so grouping costs nothing. */
export const Groups: Story = {
  render: () => (
    <Field className="max-w-sm">
      <Label>Region</Label>
      <Select placeholder="Choose a region">
        <optgroup label="Europe">
          <option value="gb">United Kingdom</option>
          <option value="de">Germany</option>
        </optgroup>
        <optgroup label="Asia and Pacific">
          <option value="lk">Sri Lanka</option>
          <option value="nz">New Zealand</option>
          <option value="jp">Japan</option>
        </optgroup>
      </Select>
    </Field>
  ),
};

const staticStates: Record<
  Extract<(typeof contract.states)[number], StaticState>,
  { note: string; render: () => ReactNode }
> = {
  disabled: {
    note: "Skipped by Tab. The chevron dims with the text.",
    render: () => (
      <Field disabled className="w-full">
        <Label>Country</Label>
        <Select defaultValue="lk">
          <Countries />
        </Select>
        <FieldMessage>Set when the workspace was created.</FieldMessage>
      </Field>
    ),
  },
  invalid: {
    note: "Border and message carry it, and `aria-invalid` marks the control.",
    render: () => (
      <Field invalid required className="w-full">
        <Label>Country</Label>
        <Select placeholder="Choose a country">
          <Countries />
        </Select>
        <FieldMessage tone="error">Choose the country the invoice is addressed to.</FieldMessage>
      </Field>
    ),
  },
  empty: {
    note: "No options yet. The placeholder is the whole list, and the value is empty.",
    render: () => (
      <Field className="w-full">
        <Label>Project</Label>
        <Select placeholder="No projects yet" />
        <FieldMessage>Create a project to choose one here.</FieldMessage>
      </Field>
    ),
  },
  "long-content": {
    note: "A chosen label longer than the box is clipped with an ellipsis, under the chevron.",
    render: () => (
      <Field className="w-full">
        <Label>Country</Label>
        <Select defaultValue="gb-long">
          <option value="gb-long">{LONG_LABEL}</option>
          <Countries />
        </Select>
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

/** A realistic form, beside the text fields it has to line up with. */
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
            Billing address
          </h2>
          <p className="text-body text-foreground-muted">
            Used on invoices and to work out which taxes apply.
          </p>
        </div>

        <Field required>
          <Label>Company</Label>
          <Input placeholder="Haux Studio" />
        </Field>

        <div className="grid gap-stack sm:grid-cols-2">
          <Field required>
            <Label>Country</Label>
            <Select placeholder="Choose a country">
              <Countries />
            </Select>
          </Field>
          <Field>
            <Label>Postcode</Label>
            <Input placeholder="SW1A 1AA" />
          </Field>
        </div>

        <Field invalid>
          <Label>Tax status</Label>
          <Select placeholder="Choose a status">
            <option value="registered">VAT registered</option>
            <option value="exempt">Exempt</option>
            <option value="reverse">Reverse charge</option>
          </Select>
          <FieldMessage tone="error">Choose a tax status before saving.</FieldMessage>
        </Field>

        <div className="flex justify-end gap-control-gap">
          <Button variant="ghost" type="button">
            Cancel
          </Button>
          <Button type="submit">Save address</Button>
        </div>
      </form>
    </div>
  ),
};

/**
 * The keyboard path, and the association contract.
 *
 * `getByLabelText` resolves through the accessible name, so it only finds the
 * control if the label genuinely targets it. Arrow-key navigation is not
 * asserted: it is the browser's behaviour and happy-dom does not implement it.
 * `selectOptions` is the runner's stand-in for choosing, and the manual checks
 * cover the keys themselves.
 */
export const KeyboardPath: Story = {
  render: () => (
    <Field invalid required className="max-w-sm">
      <Label>Country</Label>
      <Select placeholder="Choose a country" onValueChange={spies.keyboard}>
        <Countries />
      </Select>
      <FieldMessage>Where the invoice is addressed.</FieldMessage>
      <FieldMessage tone="error">Choose a country.</FieldMessage>
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByLabelText(/^Country/) as HTMLSelectElement;

    await step("The label resolves to a native select", async () => {
      await expect(select.tagName).toBe("SELECT");
    });

    await step("The placeholder is the value until something is chosen", async () => {
      await expect(select).toHaveValue("");
      await expect(select).toHaveDisplayValue("Choose a country");
      await expect(select.checkValidity()).toBe(false);
    });

    await step("Tab reaches it and choosing an option changes the value", async () => {
      spies.keyboard.mockClear();
      await userEvent.tab();
      await expect(select).toHaveFocus();
      await userEvent.selectOptions(select, "lk");
      await expect(select).toHaveValue("lk");
      await expect(select).toHaveDisplayValue("Sri Lanka");
      await expect(spies.keyboard).toHaveBeenCalledWith("lk");
      await expect(select.checkValidity()).toBe(true);
    });

    await step("Description and error are both associated, in reading order", async () => {
      const describedBy = select.getAttribute("aria-describedby")?.split(" ") ?? [];
      await expect(describedBy).toHaveLength(2);
      const texts = describedBy.map(
        (id) => canvasElement.ownerDocument.getElementById(id)?.textContent,
      );
      await expect(texts[0]).toContain("invoice");
      await expect(texts[1]).toContain("Choose a country");
      await expect(select).toHaveAttribute("aria-invalid", "true");
    });

    await step("Tab again moves on, so nothing traps focus", async () => {
      await userEvent.tab();
      await expect(select).not.toHaveFocus();
    });
  },
};

/** The pointer path: a label click focuses the control, and a pick lands. */
export const PointerPath: Story = {
  render: () => (
    <Field className="max-w-sm">
      <Label>Country</Label>
      <Select placeholder="Choose a country" onValueChange={spies.pointer}>
        <Countries />
      </Select>
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByLabelText("Country") as HTMLSelectElement;

    await step("Clicking the label focuses the control", async () => {
      await userEvent.click(canvas.getByText("Country"));
      await expect(select).toHaveFocus();
    });

    await step("Picking an option with the pointer changes the value", async () => {
      spies.pointer.mockClear();
      await userEvent.selectOptions(select, canvas.getByRole("option", { name: "Japan" }));
      await expect(select).toHaveValue("jp");
      await expect(spies.pointer).toHaveBeenCalledWith("jp");
    });

    await step("An optional select can return to no choice", async () => {
      await userEvent.selectOptions(select, "");
      await expect(select).toHaveValue("");
      await expect(spies.pointer).toHaveBeenLastCalledWith("");
    });
  },
};

/**
 * Controlled: the parent owns the value.
 *
 * The reset button proves the value can be changed from outside, and the
 * assertion after picking proves the DOM follows the prop rather than itself.
 */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [value, setValue] = useState("");
    return (
      <div className="grid max-w-sm gap-stack">
        <Field>
          <Label>Country</Label>
          <Select placeholder="Choose a country" value={value} onValueChange={setValue}>
            <Countries />
          </Select>
          <FieldMessage>
            Current value: <code className="font-mono">{JSON.stringify(value)}</code>
          </FieldMessage>
        </Field>
        <div>
          <Button variant="secondary" size="sm" onClick={() => setValue("")}>
            Reset
          </Button>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByLabelText("Country") as HTMLSelectElement;

    await step("Picking updates the parent, and the parent updates the control", async () => {
      await userEvent.selectOptions(select, "nz");
      await expect(select).toHaveValue("nz");
      await expect(canvas.getByText('"nz"')).toBeVisible();
    });

    await step("Resetting from outside returns the placeholder", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
      await expect(select).toHaveValue("");
      await expect(select).toHaveDisplayValue("Choose a country");
    });
  },
};

/**
 * What a form receives.
 *
 * The one assertion a select exists for: the value under its name in the
 * submitted data. Native `required` blocks the placeholder from submitting,
 * which is asserted through validity because happy-dom does not run the
 * interactive validation that a real browser shows as a bubble.
 */
export const FormSubmission: Story = {
  render: () => (
    <form
      className="grid max-w-sm gap-stack"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        spies.submit(Object.fromEntries(data.entries()));
      }}
    >
      <Field required>
        <Label>Country</Label>
        <Select name="country" placeholder="Choose a country">
          <Countries />
        </Select>
        <FieldMessage>Required. The browser blocks submission until one is chosen.</FieldMessage>
      </Field>
      <div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByLabelText(/^Country/) as HTMLSelectElement;
    const form = select.form;
    if (!form) throw new Error("the select is not inside a form");

    await step("With the placeholder chosen the form is invalid", async () => {
      await expect(select).toBeRequired();
      await expect(form.checkValidity()).toBe(false);
      // A disabled selected option contributes nothing to form data, so a real
      // browser reports `null` here. happy-dom reports the empty string. Both
      // mean the same thing, nothing usable is submitted, and the browser
      // blocks submission either way. Measured in Chrome after the runner
      // passed with `""` alone.
      await expect([null, ""]).toContain(new FormData(form).get("country"));
    });

    await step("After choosing, submitting delivers the value under its name", async () => {
      spies.submit.mockClear();
      await userEvent.selectOptions(select, "lk");
      await expect(form.checkValidity()).toBe(true);
      await userEvent.click(canvas.getByRole("button", { name: "Save" }));
      await expect(spies.submit).toHaveBeenCalledWith({ country: "lk" });
    });
  },
};

/**
 * A select with no messages must not point at ids that do not exist.
 *
 * Same reason as the Field story of the same name: a dangling reference is
 * not caught by the audit and announces nothing while looking deliberate.
 */
export const NoDanglingDescribedBy: Story = {
  render: () => (
    <Field className="max-w-sm">
      <Label>Country</Label>
      <Select placeholder="Choose a country">
        <Countries />
      </Select>
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByLabelText("Country");

    await step("No describedby at all when there is nothing to describe", async () => {
      await expect(select).not.toHaveAttribute("aria-describedby");
    });
  },
};

/**
 * Sixty options, for the manual check that the platform popup scrolls and
 * repositions rather than running off the screen. Nothing to assert here
 * beyond rendering: the popup is outside the document.
 */
export const LongList: Story = {
  render: () => (
    <Field className="max-w-sm">
      <Label>Option</Label>
      <Select placeholder="Choose one of sixty">
        {MANY.map((label, index) => (
          <option key={label} value={String(index + 1)}>
            {label}
          </option>
        ))}
      </Select>
      <FieldMessage>Open this near the bottom of a short window.</FieldMessage>
    </Field>
  ),
};

/**
 * The narrowest viewport the manual checklist asks for, with a long chosen
 * label. The container is constrained here so the ellipsis is visible without
 * resizing; the manual check also confirms it at a real 320px document width.
 */
export const ConstrainedViewport: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div className="grid w-[16rem] gap-stack">
      <Field>
        <Label>Country</Label>
        <Select defaultValue="gb-long">
          <option value="gb-long">{LONG_LABEL}</option>
          <Countries />
        </Select>
        <FieldMessage>Clipped with an ellipsis, chevron still inside the box.</FieldMessage>
      </Field>
      <Field>
        <Label>Option</Label>
        <Select placeholder="Sixty options in a narrow column">
          {MANY.map((label, index) => (
            <option key={label} value={String(index + 1)}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("The long label is the value, not a truncated string", async () => {
      // Clipping is visual. The value and the accessible label are intact.
      const select = canvas.getByLabelText("Country") as HTMLSelectElement;
      await expect(select).toHaveValue("gb-long");
      await expect(select).toHaveDisplayValue(LONG_LABEL);
    });
  },
};

/** The same component with the motion tokens collapsed. */
export const ReducedMotion: Story = {
  decorators: [withReducedMotion],
  render: () => (
    <Field className="max-w-sm">
      <Label>Country</Label>
      <Select placeholder="Choose a country">
        <Countries />
      </Select>
      <FieldMessage>Focus this control; the border changes colour instantly.</FieldMessage>
    </Field>
  ),
};

/** The focus and hover colour change, slowed so the curve is visible. */
export const SlowMotion: Story = {
  decorators: [withSlowMotion],
  render: () => (
    <Field className="max-w-sm">
      <Label>Country</Label>
      <Select placeholder="Hover, focus, and blur this repeatedly">
        <Countries />
      </Select>
    </Field>
  ),
};
