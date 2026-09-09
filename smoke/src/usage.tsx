/**
 * Representative public usage of Spartant, written the way a consumer writes it.
 *
 * This file is a template. `scripts/smoke-test.mjs` copies it into a throwaway
 * project that installs the packed tarball, so every import here resolves
 * through the published `exports` map rather than a workspace alias. If an
 * export is renamed, removed, or never reaches the type declarations, this file
 * stops type checking and the smoke test fails.
 *
 * It renders to static markup rather than to a browser. The point of the check
 * is that the packed artifact resolves, type checks, and produces the expected
 * accessible markup. Interaction lives in the Storybook interaction tests, and
 * the visual pass is the manual step recorded on the issue.
 */

import {
  Badge,
  type BadgeVariant,
  Button,
  type ButtonVariant,
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldMessage,
  Input,
  Label,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  Radio,
  RadioGroup,
  Select,
  Separator,
  type SpringName,
  Switch,
  semanticTokens,
  Tab,
  Tabs,
  TabsList,
  TabsPanel,
  Textarea,
  type ThemePreference,
  ThemeProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  themeScript,
  tokenVar,
} from "@iroshandezilva/spartant";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const variants: ButtonVariant[] = ["primary", "secondary", "danger", "ghost"];

/** Every Badge variant, so the tint roles are exercised through the tarball too. */
const badgeVariants: BadgeVariant[] = [
  "neutral",
  "primary",
  "accent",
  "success",
  "warning",
  "danger",
  "information",
];

/** A simple component: every Button variant, a size, a loading state, a rule. */
function SimpleExample() {
  return (
    <div className={cn("grid gap-stack", "p-surface")}>
      {variants.map((variant) => (
        <Button key={variant} variant={variant} size="md">
          {variant}
        </Button>
      ))}
      <Button loading>Saving</Button>
      <Separator decorative={false} orientation="horizontal" />
      {badgeVariants.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
      <Card>
        <CardHeader>
          <CardTitle level={2}>Workspace</CardTitle>
          <CardDescription>Four members, one plan.</CardDescription>
        </CardHeader>
        <CardContent>Content sits inside the surface padding.</CardContent>
        <CardActions>
          <Button variant="secondary" size="sm">
            Manage
          </Button>
        </CardActions>
        <Card variant="flat">Nested cards go flat.</Card>
      </Card>
    </div>
  );
}

/** Form components, including the label and message association a Field owns. */
function FormExample() {
  return (
    <form>
      <Field required>
        <Label>Email</Label>
        <Input type="email" name="email" defaultValue="" />
        <FieldMessage tone="description">We only use this to sign you in.</FieldMessage>
      </Field>

      <Field invalid>
        <Label>Notes</Label>
        <Textarea name="notes" rows={3} />
        <FieldMessage tone="error">Notes cannot be empty.</FieldMessage>
      </Field>

      <Field>
        <Label>Send me updates</Label>
        <Checkbox name="updates" defaultChecked />
      </Field>

      <Field>
        <Label>Reduced motion</Label>
        <Switch name="reduced-motion" />
      </Field>

      <RadioGroup name="plan" label="Plan" defaultValue="team">
        <Radio value="solo" />
        <Radio value="team" />
      </RadioGroup>

      <Field required>
        <Label>Country</Label>
        <Select name="country" placeholder="Choose a country">
          <option value="gb">United Kingdom</option>
          <option value="lk">Sri Lanka</option>
        </Select>
      </Field>

      <Button type="submit">Save</Button>
    </form>
  );
}

/** An overlay component, with the title and description a dialog is named by. */
function OverlayExample() {
  return (
    <Dialog defaultOpen>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent dismissOnOutsideClick={false}>
        <DialogTitle>Delete project</DialogTitle>
        <DialogDescription>This cannot be undone.</DialogDescription>
        <DialogClose>Cancel</DialogClose>
      </DialogContent>
    </Dialog>
  );
}

/** A navigation component: tabs with a disabled entry and a hidden panel that keeps its element. */
function NavigationExample() {
  return (
    <Tabs defaultValue="overview" activation="manual">
      <TabsList aria-label="Project">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="billing" disabled>
          Billing
        </Tab>
      </TabsList>
      <TabsPanel value="overview">Overview content</TabsPanel>
      <TabsPanel value="activity">Activity content</TabsPanel>
      <TabsPanel value="billing">Billing content</TabsPanel>
    </Tabs>
  );
}

/** The anchored overlays: a tooltip describing its trigger, and a popover invoked by its trigger. */
function AnchoredExample() {
  return (
    <div>
      <Tooltip>
        <TooltipTrigger aria-label="Bold">B</TooltipTrigger>
        <TooltipContent placement="bottom">Bold Cmd+B</TooltipContent>
      </Tooltip>
      <Popover>
        <PopoverTrigger>Share</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Share this document</PopoverTitle>
          <PopoverDescription>Anyone with the link can view.</PopoverDescription>
          <PopoverClose>Done</PopoverClose>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Renders each example through the documented theme setup.
 *
 * `ThemeProvider` has to survive a server render without a DOM, which is the
 * setup the README documents for server-rendered apps, so rendering here is
 * also the check that the provider does not reach for `window` while rendering.
 */
function render(children: ReactNode): string {
  return renderToStaticMarkup(<ThemeProvider defaultTheme="dark">{children}</ThemeProvider>);
}

export interface SmokeResult {
  simple: string;
  form: string;
  overlay: string;
  anchored: string;
  navigation: string;
  themeScript: string;
  mergedClass: string;
  primarySurfaceVar: string;
  springName: SpringName;
  preference: ThemePreference;
  semanticTokenCount: number;
}

export function renderExamples(): SmokeResult {
  const preference: ThemePreference = "system";

  return {
    simple: render(<SimpleExample />),
    form: render(<FormExample />),
    overlay: render(<OverlayExample />),
    anchored: render(<AnchoredExample />),
    navigation: render(<NavigationExample />),
    themeScript: themeScript(),
    // `cn` has to win the last class, which is the documented override rule and
    // proves the package's own `tailwind-merge` dependency resolved.
    mergedClass: cn("bg-primary p-4", "bg-danger"),
    primarySurfaceVar: tokenVar("color.primary.default"),
    springName: "state",
    preference,
    semanticTokenCount: Object.keys(semanticTokens).length,
  };
}
