/**
 * The required contrast pairings, as the documentation states them.
 *
 * This mirrors `packages/spartant/tooling/tokens/pairings.ts`, which is the
 * enforced list: `pnpm check:colors` fails the build when any pairing below
 * falls under its threshold in either theme. The tooling is not a package
 * export, so the list is restated here. If the two ever disagree, the tooling
 * is right and this file is stale.
 */

export type PairingKind = "body-text" | "large-text" | "non-text" | "disabled";

/** WCAG 2.2 AA minimums. Disabled is exempt and measured for legibility only. */
export const THRESHOLDS: Record<PairingKind, number> = {
  "body-text": 4.5,
  "large-text": 3,
  "non-text": 3,
  disabled: 0,
};

export interface Pairing {
  foreground: string;
  background: string;
  kind: PairingKind;
  reason: string;
}

const FILLED = ["primary", "secondary", "accent", "success", "warning", "danger", "information"];
const TEXT = ["primary", "accent", "success", "warning", "danger", "information"];

export const REQUIRED_PAIRINGS: Pairing[] = [
  {
    foreground: "color.foreground.default",
    background: "color.background.default",
    kind: "body-text",
    reason: "primary reading text on the page",
  },
  {
    foreground: "color.foreground.default",
    background: "color.surface.default",
    kind: "body-text",
    reason: "primary reading text inside a card",
  },
  {
    foreground: "color.foreground.muted",
    background: "color.background.default",
    kind: "body-text",
    reason: "secondary text is still text and is read at body size",
  },
  {
    foreground: "color.foreground.muted",
    background: "color.surface.default",
    kind: "body-text",
    reason: "secondary text inside a card",
  },
  {
    foreground: "color.foreground.default",
    background: "color.surface.elevated",
    kind: "body-text",
    reason: "text on a raised surface such as a popover",
  },
  {
    foreground: "color.foreground.default",
    background: "color.surface.muted",
    kind: "body-text",
    reason: "text on a recessed surface",
  },
  {
    foreground: "color.foreground.default",
    background: "color.surface.selected",
    kind: "body-text",
    reason: "text stays readable when its row is selected",
  },
  {
    foreground: "color.foreground.muted",
    background: "color.surface.muted",
    kind: "body-text",
    reason: "muted text on a recessed surface, which is what an unselected tab is",
  },
  ...FILLED.map<Pairing>((role) => ({
    foreground: `color.${role}.foreground`,
    background: `color.${role}.default`,
    kind: "body-text",
    reason: `label on a filled ${role} surface`,
  })),
  ...TEXT.flatMap<Pairing>((role) => [
    {
      foreground: `color.${role}.text`,
      background: "color.background.default",
      kind: "body-text",
      reason: `${role} text on the page background`,
    },
    {
      foreground: `color.${role}.text`,
      background: "color.surface.default",
      kind: "body-text",
      reason: `${role} text on a surface`,
    },
    {
      foreground: `color.${role}.text`,
      background: `color.${role}.surface`,
      kind: "body-text",
      reason: `${role} text on its own tint, which is what a soft badge is`,
    },
  ]),
  {
    foreground: "color.primary.foreground",
    background: "color.primary.hover",
    kind: "body-text",
    reason: "the label does not become unreadable on hover",
  },
  {
    foreground: "color.primary.foreground",
    background: "color.primary.active",
    kind: "body-text",
    reason: "the label does not become unreadable while pressed",
  },
  {
    foreground: "color.danger.foreground",
    background: "color.danger.hover",
    kind: "body-text",
    reason: "a destructive action stays legible on hover",
  },
  {
    foreground: "color.danger.foreground",
    background: "color.danger.active",
    kind: "body-text",
    reason: "a destructive action stays legible while pressed",
  },
  {
    foreground: "color.secondary.foreground",
    background: "color.secondary.hover",
    kind: "body-text",
    reason: "a secondary action stays legible on hover",
  },
  {
    foreground: "color.secondary.foreground",
    background: "color.secondary.active",
    kind: "body-text",
    reason: "a secondary action stays legible while pressed",
  },
  {
    foreground: "color.surface.default",
    background: "color.primary.default",
    kind: "non-text",
    reason: "the switch thumb against a checked track",
  },
  {
    foreground: "color.surface.default",
    background: "color.border.strong",
    kind: "non-text",
    reason: "the switch thumb against an unchecked track",
  },
  {
    foreground: "color.surface.default",
    background: "color.foreground.disabled",
    kind: "non-text",
    reason: "the switch thumb against a disabled checked track",
  },
  {
    foreground: "color.border.strong",
    background: "color.background.default",
    kind: "non-text",
    reason: "a boundary that carries state must be perceivable",
  },
  {
    foreground: "color.border.strong",
    background: "color.surface.default",
    kind: "non-text",
    reason: "a boundary that carries state must be perceivable on a card",
  },
  {
    foreground: "color.focus-ring.default",
    background: "color.background.default",
    kind: "non-text",
    reason: "keyboard users lose their place without a visible focus ring",
  },
  {
    foreground: "color.focus-ring.default",
    background: "color.surface.default",
    kind: "non-text",
    reason: "a focus ring visible on the page but not on a card is the common failure",
  },
  {
    foreground: "color.focus-ring.default",
    background: "color.surface.elevated",
    kind: "non-text",
    reason: "focus must survive inside dialogs and popovers",
  },
  {
    foreground: "color.primary.default",
    background: "color.background.default",
    kind: "non-text",
    reason: "an unfilled primary control must be perceivable",
  },
  {
    foreground: "color.foreground.disabled",
    background: "color.surface.disabled",
    kind: "disabled",
    reason: "disabled text should still be readable even though WCAG exempts it",
  },
];
