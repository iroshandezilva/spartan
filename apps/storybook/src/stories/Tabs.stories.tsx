import {
  Button,
  Field,
  Input,
  Label,
  Tab,
  Tabs,
  TabsList,
  TabsPanel,
} from "@iroshandezilva/spartant";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
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
 * Switching between related panels.
 *
 * Owned source on native buttons following the WAI-ARIA tabs pattern, adapted
 * from shadcn's Tabs with its Radix dependency removed. The list is one tab
 * stop and the arrow keys move within it; that roving tabindex is the thing
 * this component exists to get right.
 */
const contract = {
  variants: [],
  sizes: [],
  states: ["hover", "focus-visible", "selected", "disabled", "empty", "long-content"] as const,
  interactive: true,
  retriggerable: true,
  overlay: false,
  motion: {
    kind: "motion",
    purpose:
      "The selected tab's indicator and label colour fade in on pointer selection, so the selection reads as a change rather than as a different picture. The indicator is an inset shadow, so nothing around it moves.",
    tokens: ["duration.state-change", "easing.state"],
    pointer: "Clicking a tab selects it and the indicator fades in over the state duration.",
    keyboard:
      "Arrow keys move focus and, in automatic activation, select. The list records that the input was a key and paints the new state immediately: the keyboard path never waits for the fade.",
    reduced:
      "The stylesheet collapses the duration to 0ms, so the indicator appears at once on every path.",
    interruption:
      "Transitions rather than keyframes, so clicking through tabs quickly retargets each indicator from wherever its fade currently is instead of queueing.",
  },
  accessibility: {
    role: "`tablist` on a `div`, `tab` on native `button` elements, `tabpanel` on a `div`. Enter, Space, focus, and `disabled` come from the button.",
    name: "Each tab is named by its own text. Each panel is named by its tab through `aria-labelledby`, and each tab points at its panel through `aria-controls`. Give the list an `aria-label` so the group itself is named.",
    keyboard: [
      "Tab moves to the selected tab, or to the first enabled tab when nothing selected can take focus. The list is a single tab stop. Tab again moves into the panel, which is focusable.",
      "ArrowRight and ArrowLeft move to the next or previous enabled tab when horizontal; ArrowDown and ArrowUp when vertical. Disabled tabs are skipped and the ends wrap.",
      "Home and End move to the first and last enabled tab.",
      "With automatic activation, the focused tab is selected. With manual activation, Enter or Space selects the focused tab.",
    ],
    focus:
      "A 2px focus-visible outline at 2px offset in the focus-ring colour, identical to every other focusable component. The list carries 4px of padding so the ring is never clipped by its own scroll container.",
    announcements:
      "Selecting a tab announces it as selected with its position in the list. Ids are generated from the root's id and each tab's value, so the relationships hold with no coordination.",
  },
  manual: [
    {
      step: "Click the canvas, press Tab, then use ArrowRight, ArrowLeft, Home, and End.",
      expect:
        "The selected tab takes focus. Arrows move and select, skipping the disabled tab and wrapping at the ends. The panel changes instantly, with no fade.",
    },
    {
      step: "Click a tab with the mouse, then watch the indicator.",
      expect: "The underline fades in over 160ms and nothing around it shifts.",
    },
    {
      step: "Open the Overflow story and Tab into the list, then press End.",
      expect: "The list scrolls to reveal the focused tab and the focus ring is not clipped.",
    },
    {
      step: "Zoom the browser to 200% on the LongLabels story.",
      expect:
        "Horizontal labels scroll rather than clip; vertical labels wrap and stay aligned to the indicator.",
    },
    {
      step: "With VoiceOver, move through the list and select a tab.",
      expect:
        "Each tab announces as a tab with its position, the selected one as selected, and the panel is named by its tab.",
    },
  ],
} satisfies StoryContract;

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: { layout: "padded", spartant: contract },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Which way the list runs, and which arrow keys move through it.",
    },
    activation: {
      control: "inline-radio",
      options: ["automatic", "manual"],
      description: "Whether focusing a tab selects it, or Enter and Space do.",
    },
    defaultValue: { control: "text", description: "Uncontrolled initial selection." },
  },
  args: { orientation: "horizontal", activation: "automatic", defaultValue: "overview" },
} satisfies Meta<typeof Tabs> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three panels, which is what a tab set usually is. */
function ProjectPanels() {
  return (
    <>
      <TabsPanel value="overview">
        <p className="text-body text-foreground-muted">
          Overview. Fourteen open tasks across three milestones, two of them due this week.
        </p>
      </TabsPanel>
      <TabsPanel value="activity">
        <p className="text-body text-foreground-muted">
          Activity. Twelve changes today, the last one four minutes ago.
        </p>
      </TabsPanel>
      <TabsPanel value="settings">
        <p className="text-body text-foreground-muted">
          Settings. Visibility, members, and the things that are hard to undo.
        </p>
      </TabsPanel>
    </>
  );
}

/** The declared motion, accessibility, and manual-review contract. */
export const Contract: Story = {
  render: () => <ContractPanel contract={contract} />,
};

export const Default: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Project">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="settings">Settings</Tab>
      </TabsList>
      <ProjectPanels />
    </Tabs>
  ),
};

const staticStates: Record<
  Extract<(typeof contract.states)[number], StaticState>,
  { note: string; render: () => ReactNode }
> = {
  selected: {
    note: "The indicator and the foreground label mark it. The others read muted.",
    render: () => (
      <Tabs defaultValue="b" className="w-full">
        <TabsList aria-label="Selected example">
          <Tab value="a">First</Tab>
          <Tab value="b">Selected</Tab>
          <Tab value="c">Third</Tab>
        </TabsList>
      </Tabs>
    ),
  },
  disabled: {
    note: "Skipped by the arrow keys and by Tab. Carried by the attribute, not only by colour.",
    render: () => (
      <Tabs defaultValue="a" className="w-full">
        <TabsList aria-label="Disabled example">
          <Tab value="a">Enabled</Tab>
          <Tab value="b" disabled>
            Disabled
          </Tab>
          <Tab value="c">Enabled</Tab>
        </TabsList>
      </Tabs>
    ),
  },
  empty: {
    note: "No selection and no panel. The first tab holds the tab stop so the list is still reachable.",
    render: () => (
      <Tabs className="w-full">
        <TabsList aria-label="Empty example">
          <Tab value="a">First</Tab>
          <Tab value="b">Second</Tab>
        </TabsList>
        <TabsPanel value="a">First panel</TabsPanel>
        <TabsPanel value="b">Second panel</TabsPanel>
      </Tabs>
    ),
  },
  "long-content": {
    note: "Long labels stay on one line and the list scrolls. A long panel wraps below it.",
    render: () => (
      <Tabs defaultValue="a" className="w-full max-w-xs">
        <TabsList aria-label="Long content example">
          <Tab value="a">Quarterly revenue by region and product line</Tab>
          <Tab value="b">Headcount</Tab>
        </TabsList>
        <TabsPanel value="a">
          <p className="text-body text-foreground-muted">
            A panel that runs long enough to wrap several times inside a narrow container, which is
            where padding and radius assumptions usually break.
          </p>
        </TabsPanel>
        <TabsPanel value="b">Headcount</TabsPanel>
      </Tabs>
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

/** The list runs down the side. Up and Down move through it. */
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Project" className="w-48">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="settings">Settings</Tab>
      </TabsList>
      <ProjectPanels />
    </Tabs>
  ),
};

/**
 * Manual activation: the arrows move focus, and only Enter or Space selects.
 *
 * For panels that are expensive to show. A keyboard user moving through the
 * list to reach the third tab should not have to load the second.
 */
export const ManualActivation: Story = {
  args: { activation: "manual" },
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Project">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="settings">Settings</Tab>
      </TabsList>
      <ProjectPanels />
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Arrow keys move focus without selecting", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("tab", { name: "Overview" })).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("tab", { name: "Activity" })).toHaveFocus();
      await expect(canvas.getByRole("tab", { name: "Overview" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(canvas.getByRole("tab", { name: "Activity" })).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    await step("Enter selects the focused tab and shows its panel", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(canvas.getByRole("tab", { name: "Activity" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(canvas.getByRole("tabpanel")).toHaveAccessibleName("Activity");
    });

    await step("Space selects too", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard(" ");
      await expect(canvas.getByRole("tab", { name: "Settings" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  },
};

/** More tabs than fit. The list scrolls; nothing wraps or clips. */
export const Overflow: Story = {
  render: () => (
    <div className="w-80 rounded-surface border border-border-subtle p-4">
      <Tabs defaultValue="inbox">
        <TabsList aria-label="Mailboxes">
          {[
            "Inbox",
            "Starred",
            "Snoozed",
            "Sent",
            "Drafts",
            "Scheduled",
            "Archive",
            "Spam",
            "Trash",
            "All mail",
          ].map((label) => (
            <Tab key={label} value={label.toLowerCase()}>
              {label}
            </Tab>
          ))}
        </TabsList>
        <TabsPanel value="inbox">
          <p className="text-body text-foreground-muted">
            Ten tabs in a 320px container. Press End to reach the last one and watch the list scroll
            it into view.
          </p>
        </TabsPanel>
      </Tabs>
    </div>
  ),
};

/** Labels that run long, in both orientations. */
export const LongLabels: Story = {
  render: () => (
    <div className="grid gap-8">
      <Tabs defaultValue="revenue" className="max-w-md">
        <TabsList aria-label="Reports, horizontal">
          <Tab value="revenue">Quarterly revenue by region and product line</Tab>
          <Tab value="headcount">Headcount and open requisitions by department</Tab>
        </TabsList>
        <TabsPanel value="revenue">
          Horizontal: labels stay on one line and the list scrolls.
        </TabsPanel>
        <TabsPanel value="headcount">Headcount</TabsPanel>
      </Tabs>
      <Tabs defaultValue="revenue" orientation="vertical" className="max-w-md">
        <TabsList aria-label="Reports, vertical" className="w-48">
          <Tab value="revenue">Quarterly revenue by region and product line</Tab>
          <Tab value="headcount">Headcount and open requisitions by department</Tab>
        </TabsList>
        <TabsPanel value="revenue">Vertical: labels wrap inside the list's width.</TabsPanel>
        <TabsPanel value="headcount">Headcount</TabsPanel>
      </Tabs>
    </div>
  ),
};

/** Tabs added and removed at runtime, including the selected one. */
function DynamicExample() {
  const [values, setValues] = useState(["one", "two"]);
  const [value, setValue] = useState("one");
  const add = () => setValues((current) => [...current, `tab-${current.length + 1}`]);
  const removeSelected = () => setValues((current) => current.filter((item) => item !== value));

  return (
    <div className="grid gap-4">
      <div className="flex gap-control-gap">
        <Button variant="secondary" size="sm" onClick={add}>
          Add tab
        </Button>
        <Button variant="secondary" size="sm" onClick={removeSelected}>
          Remove selected tab
        </Button>
      </div>
      <Tabs value={value} onValueChange={setValue}>
        <TabsList aria-label="Dynamic tabs">
          {values.map((item) => (
            <Tab key={item} value={item}>
              {item}
            </Tab>
          ))}
        </TabsList>
        {values.map((item) => (
          <TabsPanel key={item} value={item}>
            Panel {item}
          </TabsPanel>
        ))}
      </Tabs>
    </div>
  );
}

export const DynamicPanels: Story = {
  render: () => <DynamicExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A tab added after mount joins the keyboard order", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Add tab" }));
      await expect(canvas.getAllByRole("tab")).toHaveLength(3);
      await userEvent.click(canvas.getByRole("tab", { name: "two" }));
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("tab", { name: "tab-3" })).toHaveFocus();
      await expect(canvas.getByRole("tab", { name: "tab-3" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Panel tab-3");
    });

    await step("Removing the selected tab leaves the list reachable", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Remove selected tab" }));
      const tabs = canvas.getAllByRole("tab");
      await expect(tabs).toHaveLength(2);
      for (const tab of tabs) await expect(tab).toHaveAttribute("aria-selected", "false");
      // Exactly one tab stop, on the first tab.
      await expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1]);
      await expect(canvas.queryByRole("tabpanel")).toBeNull();
    });
  },
};

/** A controlled set, driven from outside as well as from the tabs. */
function ControlledExample() {
  const [value, setValue] = useState("overview");
  return (
    <div className="grid gap-4">
      <p className="text-caption text-foreground-muted">
        Selected: <code className="font-mono">{value}</code>
      </p>
      <Tabs value={value} onValueChange={setValue}>
        <TabsList aria-label="Project">
          <Tab value="overview">Overview</Tab>
          <Tab value="activity">Activity</Tab>
          <Tab value="settings">Settings</Tab>
        </TabsList>
        <ProjectPanels />
      </Tabs>
      <div>
        <Button variant="secondary" size="sm" onClick={() => setValue("settings")}>
          Jump to settings
        </Button>
      </div>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("An outside change moves the selection and the panel", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Jump to settings" }));
      await expect(canvas.getByRole("tab", { name: "Settings" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(canvas.getByRole("tabpanel")).toHaveAccessibleName("Settings");
    });
  },
};

/** A settings page, which is where tabs hold real forms. */
export const Composition: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-svh bg-background p-section">
      <div className="mx-auto grid max-w-2xl gap-stack">
        <div className="grid gap-1">
          <h2 className="text-heading font-semibold tracking-heading text-foreground">
            Workspace settings
          </h2>
          <p className="text-body text-foreground-muted">
            The form in each panel keeps its state while you look at another, because these panels
            are kept mounted.
          </p>
        </div>
        <Tabs defaultValue="general">
          <TabsList aria-label="Workspace settings">
            <Tab value="general">General</Tab>
            <Tab value="members">Members</Tab>
            <Tab value="billing" disabled>
              Billing
            </Tab>
            <Tab value="danger">Danger zone</Tab>
          </TabsList>
          <TabsPanel value="general" keepMounted>
            <div className="grid gap-stack rounded-surface border border-border bg-surface p-surface shadow-surface">
              <Field>
                <Label>Workspace name</Label>
                <Input defaultValue="Spartant" />
              </Field>
              <Field>
                <Label>Slug</Label>
                <Input defaultValue="spartant" />
              </Field>
              <div>
                <Button>Save changes</Button>
              </div>
            </div>
          </TabsPanel>
          <TabsPanel value="members" keepMounted>
            <div className="grid gap-stack rounded-surface border border-border bg-surface p-surface shadow-surface">
              <Field>
                <Label>Invite by email</Label>
                <Input type="email" placeholder="you@example.com" />
              </Field>
              <div>
                <Button variant="secondary">Send invitation</Button>
              </div>
            </div>
          </TabsPanel>
          <TabsPanel value="billing">Billing</TabsPanel>
          <TabsPanel value="danger">
            <div className="grid gap-stack rounded-surface border border-border bg-surface p-surface shadow-surface">
              <p className="text-body text-foreground-muted">
                Deleting the workspace removes every project in it.
              </p>
              <div>
                <Button variant="danger">Delete workspace</Button>
              </div>
            </div>
          </TabsPanel>
        </Tabs>
      </div>
    </div>
  ),
};

/**
 * The keyboard path, and the whole point of owning the roving tabindex.
 *
 * Everything here is asserted through resulting focus and state. The focus
 * ring itself is a browser check, because `:focus-visible` needs trusted input.
 */
export const KeyboardPath: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Project">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="billing" disabled>
          Billing
        </Tab>
        <Tab value="settings">Settings</Tab>
      </TabsList>
      <TabsPanel value="overview">Overview panel</TabsPanel>
      <TabsPanel value="activity">Activity panel</TabsPanel>
      <TabsPanel value="billing">Billing panel</TabsPanel>
      <TabsPanel value="settings">Settings panel</TabsPanel>
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tab = (name: string) => canvas.getByRole("tab", { name });

    await step("Roles and relationships are correct", async () => {
      const list = canvas.getByRole("tablist", { name: "Project" });
      await expect(list).toHaveAttribute("aria-orientation", "horizontal");
      for (const element of canvas.getAllByRole("tab")) {
        const panel = document.getElementById(element.getAttribute("aria-controls") ?? "");
        await expect(panel).not.toBeNull();
        await expect(panel).toHaveAttribute("role", "tabpanel");
        await expect(panel).toHaveAttribute("aria-labelledby", element.id);
      }
      await expect(canvas.getByRole("tabpanel")).toHaveAccessibleName("Overview");
    });

    await step("The list is one tab stop, on the selected tab", async () => {
      await userEvent.tab();
      await expect(tab("Overview")).toHaveFocus();
      await expect(tab("Overview")).toHaveAttribute("tabindex", "0");
      await expect(tab("Activity")).toHaveAttribute("tabindex", "-1");
    });

    await step("ArrowRight moves and selects, and the panel follows at once", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(tab("Activity")).toHaveFocus();
      await expect(tab("Activity")).toHaveAttribute("aria-selected", "true");
      await expect(tab("Overview")).toHaveAttribute("aria-selected", "false");
      await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Activity panel");
    });

    await step("A disabled tab is skipped", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(tab("Settings")).toHaveFocus();
      await expect(tab("Billing")).toHaveAttribute("aria-selected", "false");
    });

    await step("The ends wrap", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(tab("Overview")).toHaveFocus();
      await userEvent.keyboard("{ArrowLeft}");
      await expect(tab("Settings")).toHaveFocus();
    });

    await step("Home and End", async () => {
      await userEvent.keyboard("{Home}");
      await expect(tab("Overview")).toHaveFocus();
      await userEvent.keyboard("{End}");
      await expect(tab("Settings")).toHaveFocus();
      await expect(tab("Settings")).toHaveAttribute("aria-selected", "true");
    });

    await step("Tab leaves the list for the panel, which is focusable", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("tabpanel")).toHaveFocus();
    });
  },
};

/** The pointer path: a click selects, a click on a disabled tab does not. */
export const PointerPath: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Project">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="billing" disabled>
          Billing
        </Tab>
      </TabsList>
      <TabsPanel value="overview">Overview panel</TabsPanel>
      <TabsPanel value="activity">Activity panel</TabsPanel>
      <TabsPanel value="billing">Billing panel</TabsPanel>
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Clicking a tab selects it and shows its panel", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: "Activity" }));
      await expect(canvas.getByRole("tab", { name: "Activity" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Activity panel");
      await expect(canvas.getByRole("tablist")).toHaveAttribute("data-source", "pointer");
    });

    await step("A disabled tab ignores the click", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: "Billing" }));
      await expect(canvas.getByRole("tab", { name: "Billing" })).toHaveAttribute(
        "aria-selected",
        "false",
      );
      await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Activity panel");
    });
  },
};

/** Rapid repeat: clicking through the tabs quickly settles on the last one, with one tab stop. */
export const RapidRepeat: Story = {
  render: () => (
    <Tabs defaultValue="a">
      <TabsList aria-label="Rapid">
        <Tab value="a">A</Tab>
        <Tab value="b">B</Tab>
        <Tab value="c">C</Tab>
      </TabsList>
      <TabsPanel value="a">Panel A</TabsPanel>
      <TabsPanel value="b">Panel B</TabsPanel>
      <TabsPanel value="c">Panel C</TabsPanel>
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Nine quick clicks end on the last clicked tab, not between two", async () => {
      const order = ["B", "C", "A", "C", "B", "A", "B", "C", "B"];
      for (const name of order) {
        await userEvent.click(canvas.getByRole("tab", { name }), { delay: null });
      }
      await expect(canvas.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
      await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Panel B");
      const stops = canvas.getAllByRole("tab").filter((tab) => tab.tabIndex === 0);
      await expect(stops).toHaveLength(1);
    });
  },
};

/** The same tabs with the motion tokens collapsed: the indicator appears at once. */
export const ReducedMotion: Story = {
  decorators: [withReducedMotion],
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Project">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="settings">Settings</Tab>
      </TabsList>
      <ProjectPanels />
    </Tabs>
  ),
};

/** The indicator fade, slowed, so the pointer path can be watched. Keyboard stays immediate. */
export const SlowMotion: Story = {
  decorators: [withSlowMotion],
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Project">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="settings">Settings</Tab>
      </TabsList>
      <ProjectPanels />
    </Tabs>
  ),
};

/** A part outside its Tabs throws, naming both. */
export const PartOutsideTabs: Story = {
  render: () => {
    let message = "no error, which is a bug";
    try {
      // Calling the component directly inside a render is enough: the hook
      // reads the context, finds none, and throws.
      Tab({ value: "orphan", children: "Orphan" });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    return <p className="font-mono text-caption text-foreground-muted">{message}</p>;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("The message names the part and the parent", async () => {
      await expect(canvas.getByText("Tab must be rendered inside a Tabs.")).toBeInTheDocument();
    });
  },
};
