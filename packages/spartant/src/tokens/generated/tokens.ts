/*
 * GENERATED FILE. Do not edit.
 *
 * Produced from packages/spartant/src/tokens/ by
 * packages/spartant/tooling/tokens/generate.ts. Run `pnpm tokens:build`.
 * `pnpm tokens:check` fails when this file drifts from the source.
 */

/** Every semantic token, as the CSS custom property that carries it. */
export const semanticTokens = {
  "border-width.default": "--spartant-border-width",
  "border-width.emphasis": "--spartant-border-width-emphasis",
  "color.accent.default": "--spartant-color-accent",
  "color.accent.foreground": "--spartant-color-accent-foreground",
  "color.accent.surface": "--spartant-color-accent-surface",
  "color.accent.text": "--spartant-color-accent-text",
  "color.background.default": "--spartant-color-background",
  "color.border.default": "--spartant-color-border",
  "color.border.strong": "--spartant-color-border-strong",
  "color.border.subtle": "--spartant-color-border-subtle",
  "color.danger.active": "--spartant-color-danger-active",
  "color.danger.default": "--spartant-color-danger",
  "color.danger.foreground": "--spartant-color-danger-foreground",
  "color.danger.hover": "--spartant-color-danger-hover",
  "color.danger.surface": "--spartant-color-danger-surface",
  "color.danger.text": "--spartant-color-danger-text",
  "color.focus-ring.default": "--spartant-color-focus-ring",
  "color.foreground.default": "--spartant-color-foreground",
  "color.foreground.disabled": "--spartant-color-foreground-disabled",
  "color.foreground.inverse": "--spartant-color-foreground-inverse",
  "color.foreground.muted": "--spartant-color-foreground-muted",
  "color.information.default": "--spartant-color-information",
  "color.information.foreground": "--spartant-color-information-foreground",
  "color.information.surface": "--spartant-color-information-surface",
  "color.information.text": "--spartant-color-information-text",
  "color.primary.active": "--spartant-color-primary-active",
  "color.primary.default": "--spartant-color-primary",
  "color.primary.foreground": "--spartant-color-primary-foreground",
  "color.primary.hover": "--spartant-color-primary-hover",
  "color.primary.surface": "--spartant-color-primary-surface",
  "color.primary.text": "--spartant-color-primary-text",
  "color.secondary.active": "--spartant-color-secondary-active",
  "color.secondary.default": "--spartant-color-secondary",
  "color.secondary.foreground": "--spartant-color-secondary-foreground",
  "color.secondary.hover": "--spartant-color-secondary-hover",
  "color.success.default": "--spartant-color-success",
  "color.success.foreground": "--spartant-color-success-foreground",
  "color.success.surface": "--spartant-color-success-surface",
  "color.success.text": "--spartant-color-success-text",
  "color.surface.default": "--spartant-color-surface",
  "color.surface.disabled": "--spartant-color-surface-disabled",
  "color.surface.elevated": "--spartant-color-surface-elevated",
  "color.surface.muted": "--spartant-color-surface-muted",
  "color.surface.selected": "--spartant-color-surface-selected",
  "color.warning.default": "--spartant-color-warning",
  "color.warning.foreground": "--spartant-color-warning-foreground",
  "color.warning.surface": "--spartant-color-warning-surface",
  "color.warning.text": "--spartant-color-warning-text",
  "distance.indicator": "--spartant-distance-indicator",
  "distance.overlay": "--spartant-distance-overlay",
  "distance.state": "--spartant-distance-state",
  "duration.indicator-loop": "--spartant-duration-indicator-loop",
  "duration.modal-enter": "--spartant-duration-modal-enter",
  "duration.modal-exit": "--spartant-duration-modal-exit",
  "duration.overlay-enter": "--spartant-duration-overlay-enter",
  "duration.overlay-exit": "--spartant-duration-overlay-exit",
  "duration.press-feedback": "--spartant-duration-press-feedback",
  "duration.reduced": "--spartant-duration-reduced",
  "duration.state-change": "--spartant-duration-state-change",
  "easing.enter": "--spartant-easing-enter",
  "easing.exit": "--spartant-easing-exit",
  "easing.move": "--spartant-easing-move",
  "easing.progress": "--spartant-easing-progress",
  "easing.state": "--spartant-easing-state",
  "elevation.flat": "--spartant-elevation-flat",
  "elevation.modal": "--spartant-elevation-modal",
  "elevation.overlay": "--spartant-elevation-overlay",
  "elevation.surface": "--spartant-elevation-surface",
  "font.family.body": "--spartant-font-family-body",
  "font.family.code": "--spartant-font-family-code",
  "font.line-height.body": "--spartant-font-line-height-body",
  "font.line-height.caption": "--spartant-font-line-height-caption",
  "font.line-height.heading": "--spartant-font-line-height-heading",
  "font.size.body": "--spartant-font-size-body",
  "font.size.body-large": "--spartant-font-size-body-large",
  "font.size.body-small": "--spartant-font-size-body-small",
  "font.size.caption": "--spartant-font-size-caption",
  "font.size.display": "--spartant-font-size-display",
  "font.size.heading": "--spartant-font-size-heading",
  "font.size.heading-large": "--spartant-font-size-heading-large",
  "font.size.heading-small": "--spartant-font-size-heading-small",
  "font.tracking.body": "--spartant-font-tracking-body",
  "font.tracking.heading": "--spartant-font-tracking-heading",
  "font.weight.body": "--spartant-font-weight-body",
  "font.weight.emphasis": "--spartant-font-weight-emphasis",
  "font.weight.heading": "--spartant-font-weight-heading",
  "opacity.disabled": "--spartant-opacity-disabled",
  "radius.control": "--spartant-radius-control",
  "radius.pill": "--spartant-radius-pill",
  "radius.surface": "--spartant-radius-surface",
  "scale.overlay-enter": "--spartant-scale-overlay-enter",
  "scale.press": "--spartant-scale-press",
  "scale.reduced": "--spartant-scale-reduced",
  "size.min-target": "--spartant-size-min-target",
  "space.control-gap": "--spartant-space-control-gap",
  "space.control-padding-x": "--spartant-space-control-padding-x",
  "space.control-padding-y": "--spartant-space-control-padding-y",
  "space.section-gap": "--spartant-space-section-gap",
  "space.stack-gap": "--spartant-space-stack-gap",
  "space.surface-padding": "--spartant-space-surface-padding",
} as const;

/** A semantic token path, for example `color.foreground.muted`. */
export type SemanticTokenPath = keyof typeof semanticTokens;

/** The CSS custom property a semantic token resolves to. */
export type SemanticTokenVariable = (typeof semanticTokens)[SemanticTokenPath];

/**
 * Returns the `var()` reference for a semantic token.
 *
 * Use this when a value has to reach inline styles or a canvas, where a utility
 * class cannot. Prefer the utility classes everywhere else.
 */
export function tokenVar(path: SemanticTokenPath): string {
  return `var(${semanticTokens[path]})`;
}

/** A spring, in the shape an animation library expects. */
export interface SpringToken {
  stiffness: number;
  damping: number;
  mass: number;
}

/**
 * Spring tokens.
 *
 * Typed values rather than CSS custom properties, because CSS has no spring
 * primitive. An animation library consumes these when one is justified;
 * until then they are the agreed values, not a dependency.
 *
 * Provisional until HAUX-68 validates them against real components.
 */
export const springs = {
  "gesture": {"stiffness":260,"damping":24,"mass":1},
  "state": {"stiffness":420,"damping":36,"mass":1},
} as const satisfies Record<string, SpringToken>;

/** A spring role, for example `state`. */
export type SpringName = keyof typeof springs;
