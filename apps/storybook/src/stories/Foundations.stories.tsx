import type { Meta, StoryObj } from "@storybook/react-vite";
import { cssVar, rolesIn } from "../lib/tokens.js";

/**
 * Foundations, read from the published token JSON.
 *
 * Reading the artefact rather than restating values means these stories cannot
 * show something the package does not ship, and they update themselves when a
 * token changes.
 *
 * These are specimens, not a component, so `meta` has no `component` and the
 * story contract does not apply. `story-contract.test.ts` tells the two apart
 * that way.
 */

const meta = {
  title: "Foundations/Overview",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const TYPE_ROLES = [
  "display",
  "heading-large",
  "heading",
  "heading-small",
  "body-large",
  "body",
  "body-small",
  "caption",
];

export const Colour: Story = {
  render: () => (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
      {rolesIn("color").map(([role, value]) => (
        <li key={role} className="grid gap-1">
          <div
            className="h-12 rounded-control border border-border"
            style={{ background: `var(${cssVar(`color.${role}`)})` }}
            aria-hidden="true"
          />
          <code className="font-mono text-caption">{role}</code>
          <span className="font-mono text-caption text-foreground-muted">{value}</span>
        </li>
      ))}
    </ul>
  ),
};

export const Typography: Story = {
  render: () => (
    <ul className="grid gap-5">
      {TYPE_ROLES.map((role) => {
        const heading = role.startsWith("heading") || role === "display";
        return (
          <li key={role} className="grid gap-1">
            <code className="font-mono text-caption text-foreground-muted">font.size.{role}</code>
            <p
              style={{
                fontSize: `var(${cssVar(`font.size.${role}`)})`,
                lineHeight: `var(${cssVar(heading ? "font.line-height.heading" : "font.line-height.body")})`,
                letterSpacing: `var(${cssVar(heading ? "font.tracking.heading" : "font.tracking.body")})`,
                fontWeight: `var(${cssVar(heading ? "font.weight.heading" : "font.weight.body")})`,
              }}
            >
              The quick brown fox jumps over the lazy dog
            </p>
          </li>
        );
      })}
    </ul>
  ),
};

export const Shape: Story = {
  render: () => (
    <div className="grid gap-8">
      <section>
        <h3 className="mb-3 text-body-small font-medium">Radius</h3>
        <div className="flex flex-wrap gap-4">
          {rolesIn("radius").map(([role, value]) => (
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
      </section>
      <section>
        <h3 className="mb-3 text-body-small font-medium">Elevation</h3>
        <div className="flex flex-wrap gap-6">
          {rolesIn("elevation").map(([role]) => (
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
      </section>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <ul className="grid gap-3">
      {rolesIn("space").map(([role, value]) => (
        <li key={role} className="flex items-center gap-4 text-body-small">
          <code className="w-48 shrink-0 font-mono text-caption text-foreground-muted">
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
  ),
};
