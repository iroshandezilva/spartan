import { cn, useTheme } from "@iroshandezilva/spartant";
import { Motion } from "./Motion.js";
import { cssVar, rolesIn } from "./tokens.js";

const TYPE_ROLES = [
  ["display", "Display"],
  ["heading-large", "Heading large"],
  ["heading", "Heading"],
  ["heading-small", "Heading small"],
  ["body-large", "Body large"],
  ["body", "Body"],
  ["body-small", "Body small"],
  ["caption", "Caption"],
] as const;

const SPECIMEN = "The quick brown fox jumps over the lazy dog";

function Typography() {
  return (
    <section aria-labelledby="type-heading" className="grid gap-4">
      <h2 id="type-heading" className="text-heading font-semibold tracking-heading">
        Typography
      </h2>
      <p className="text-body-small text-foreground-muted">
        Rendered at real size. Headings use the tighter line height and negative tracking; body uses
        1.5 and no tracking.
      </p>
      <ul className="grid gap-5 rounded-surface border border-border bg-surface p-6 shadow-surface">
        {TYPE_ROLES.map(([role, label]) => {
          const heading = role.startsWith("heading") || role === "display";
          return (
            <li key={role} className="grid gap-1" data-testid={`type-${role}`}>
              <div className="flex flex-wrap items-baseline gap-2 text-caption text-foreground-muted">
                <span className="font-medium text-foreground">{label}</span>
                <code className="font-mono">font.size.{role}</code>
                <span data-testid={`size-${role}`} />
              </div>
              <p
                style={{
                  fontSize: `var(${cssVar(`font.size.${role}`)})`,
                  lineHeight: `var(${cssVar(heading ? "font.line-height.heading" : "font.line-height.body")})`,
                  letterSpacing: `var(${cssVar(heading ? "font.tracking.heading" : "font.tracking.body")})`,
                  fontWeight: `var(${cssVar(heading ? "font.weight.heading" : "font.weight.body")})`,
                }}
              >
                {SPECIMEN}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Spacing() {
  const roles = rolesIn("space");
  return (
    <section aria-labelledby="space-heading" className="grid gap-4">
      <h2 id="space-heading" className="text-heading font-semibold tracking-heading">
        Spacing
      </h2>
      <ul className="grid gap-3 rounded-surface border border-border bg-surface p-6 shadow-surface">
        {roles.map(([role, value]) => (
          <li key={role} className="flex items-center gap-4 text-body-small">
            <code className="w-44 shrink-0 font-mono text-caption text-foreground-muted">
              space.{role}
            </code>
            <div
              className="h-4 rounded-sm bg-primary"
              style={{ width: `var(${cssVar(`space.${role}`)})` }}
              aria-hidden="true"
            />
            <span className="font-mono text-caption text-foreground-muted">{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Shape() {
  const radii = rolesIn("radius");
  return (
    <section aria-labelledby="shape-heading" className="grid gap-4">
      <h2 id="shape-heading" className="text-heading font-semibold tracking-heading">
        Radius and elevation
      </h2>
      <p className="text-body-small text-foreground-muted">
        Containers are rounder than the controls inside them. Elevation is always paired with a
        border and a background, because a shadow alone nearly disappears in dark.
      </p>
      <div className="grid gap-6 rounded-surface border border-border bg-surface p-6 shadow-surface sm:grid-cols-2">
        <div className="grid gap-3">
          <h3 className="text-body-small font-medium">Radius</h3>
          <div className="flex flex-wrap gap-3">
            {radii.map(([role, value]) => (
              <div key={role} className="grid gap-1 text-caption">
                <div
                  className="size-16 border border-border-strong bg-surface-muted"
                  style={{ borderRadius: `var(${cssVar(`radius.${role}`)})` }}
                  aria-hidden="true"
                />
                <code className="font-mono text-foreground-muted">{role}</code>
                <span className="text-foreground-muted">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          <h3 className="text-body-small font-medium">Elevation</h3>
          <div className="flex flex-wrap gap-4">
            {["flat", "surface", "overlay", "modal"].map((role) => (
              <div key={role} className="grid gap-1 text-caption">
                <div
                  className="size-16 rounded-surface border border-border bg-surface-elevated"
                  style={{ boxShadow: `var(${cssVar(`elevation.${role}`)})` }}
                  aria-hidden="true"
                />
                <code className="font-mono text-foreground-muted">{role}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function App() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background p-8 font-sans text-foreground">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-large font-semibold tracking-heading">
            Spartant foundations
          </h1>
          <p className="mt-1 text-body-small text-foreground-muted">
            Typography, spacing, shape, and motion at real size. Values come from the published
            token JSON, so this cannot show something the package does not ship.
          </p>
        </div>
        <div className="flex gap-2">
          {(["system", "light", "dark"] as const).map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={theme === choice}
              onClick={() => setTheme(choice)}
              className={cn(
                "rounded-control px-3 py-1.5 text-body-small font-medium",
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
      </header>

      <div className="grid max-w-4xl gap-12">
        <Typography />
        <Spacing />
        <Shape />
        <Motion />
      </div>
    </div>
  );
}
