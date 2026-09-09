import {
  Badge,
  Button,
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
  packageName,
  Radio,
  RadioGroup,
  Separator,
  Switch,
  Textarea,
  type ThemePreference,
  useTheme,
} from "@iroshandezilva/spartant";
import { useState } from "react";

const CHOICES: ThemePreference[] = ["system", "light", "dark"];

/**
 * Consumer example.
 *
 * The theme control uses Spartant's own `useTheme`, so this doubles as the
 * working reference for the theme API rather than a bespoke toggle that only
 * looks like one.
 */
export function App() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Deliberately a real controlled value rather than a static one, so the form
  // section exercises state as a consumer would rather than only rendering.
  const [email, setEmail] = useState("");
  const invalid = email.length > 0 && !email.includes("@");

  return (
    <div className="min-h-screen bg-background p-8 font-sans text-foreground">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Spartant consumer example</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Resolved from <code className="font-mono">{packageName}</code>
        </p>
      </header>

      <fieldset className="mb-8 rounded-surface border border-border p-4">
        <legend className="px-2 text-sm text-foreground-muted">Theme</legend>
        <div className="flex gap-2">
          {CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setTheme(choice)}
              aria-pressed={theme === choice}
              className={cn(
                "rounded-control px-3 py-1.5 text-sm font-medium",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                theme === choice
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
              )}
            >
              {choice}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-foreground-muted">
          Choice <strong>{theme}</strong>, showing <strong>{resolvedTheme}</strong>. On{" "}
          <strong>system</strong>, change your OS appearance and this follows without a reload.
        </p>
      </fieldset>

      <section className="rounded-surface border border-border bg-surface p-6 shadow-surface">
        <h2 className="text-heading-small font-semibold tracking-heading">Button</h2>
        <p className="mt-1 text-body-small text-foreground-muted">
          Every variant and size, resolved through the published exports.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="ghost">Cancel</Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button disabled>Disabled</Button>
          <Button loading>Saving</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent">Overridden</Button>
        </div>
      </section>

      <p className="mt-8 text-sm text-foreground-muted">
        The last button passes <code className="font-mono">className</code> to replace the fill,
        which is the class-merging convention working.
      </p>

      <section className="mt-8 rounded-surface border border-border bg-surface p-6 shadow-surface">
        <h2 className="text-heading-small font-semibold tracking-heading">Badge</h2>
        <p className="mt-1 text-body-small text-foreground-muted">
          Every variant. The label says what it means, so the tint is reinforcement.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge>Draft</Badge>
          <Badge variant="primary">Active</Badge>
          <Badge variant="accent">Design</Badge>
          <Badge variant="success">Deployed</Badge>
          <Badge variant="warning">In review</Badge>
          <Badge variant="danger">2 failing checks</Badge>
          <Badge variant="information">Needs docs</Badge>
        </div>
      </section>

      <section className="mt-8 rounded-surface border border-border bg-surface p-6 shadow-surface">
        <h2 className="text-heading-small font-semibold tracking-heading">Form</h2>
        <p className="mt-1 text-body-small text-foreground-muted">
          Type something without an @ to see validation associate itself.
        </p>

        <div className="mt-4 grid max-w-md gap-stack">
          <Field invalid={invalid}>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            {invalid ? (
              <FieldMessage tone="error">That does not look like an email address.</FieldMessage>
            ) : (
              <FieldMessage>We only use this to send the receipt.</FieldMessage>
            )}
          </Field>

          <Field>
            <Label>Notes</Label>
            <Textarea rows={3} placeholder="Anything we should know" />
          </Field>

          <Separator />

          <div className="flex items-center gap-control-gap">
            <Checkbox id="terms" />
            <Label htmlFor="terms">I agree to the terms</Label>
          </div>

          <RadioGroup label="Billing period" defaultValue="monthly">
            <div className="grid gap-2">
              <div className="flex items-center gap-control-gap">
                <Radio id="monthly" value="monthly" />
                <Label htmlFor="monthly">Monthly</Label>
              </div>
              <div className="flex items-center gap-control-gap">
                <Radio id="yearly" value="yearly" />
                <Label htmlFor="yearly">Yearly</Label>
              </div>
            </div>
          </RadioGroup>

          <div className="flex items-center gap-control-gap">
            <Switch id="notifications" defaultChecked />
            <Label htmlFor="notifications">Email notifications</Label>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-surface border border-border bg-surface p-6 shadow-surface">
        <h2 className="text-heading-small font-semibold tracking-heading">Overlay</h2>
        <p className="mt-1 text-body-small text-foreground-muted">
          Open it, press Tab a few times, then press Escape. Focus should stay inside while it is
          open and return to the trigger when it closes.
        </p>

        <div className="mt-4">
          {/*
           * `DialogTrigger` and `DialogClose` render their own `button`, so a
           * `Button` must not be nested inside one. That produces a button
           * inside a button, which is invalid HTML and doubles the tab stops.
           * It is the obvious mistake to make, and this example made it before
           * a browser check counted four tab stops for two actions.
           *
           * Styling is passed through `className`. Reproducing Button's fill
           * by hand here is a real rough edge, recorded on HAUX-59.
           */}
          <Dialog>
            <DialogTrigger className="inline-flex h-[var(--spartant-button-height-md)] items-center rounded-control bg-secondary px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-secondary-foreground hover:bg-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              Open dialog
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Delete this workspace?</DialogTitle>
              <DialogDescription>
                Everything in it goes with it. This cannot be undone.
              </DialogDescription>
              <div className="mt-4 flex justify-end gap-3">
                <DialogClose className="inline-flex h-[var(--spartant-button-height-md)] items-center rounded-control px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Cancel
                </DialogClose>
                <DialogClose className="inline-flex h-[var(--spartant-button-height-md)] items-center rounded-control bg-danger px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-danger-foreground hover:bg-danger-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Delete
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  );
}
