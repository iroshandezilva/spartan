/**
 * The required contrast pairings, as data.
 *
 * A role is only required to work where it is actually used, so this list is
 * the definition of "where it is used". Adding a role that carries text or
 * state means adding its pairing here; a role with no entry is asserted to
 * never sit against anything that matters, which is a claim worth making
 * deliberately.
 *
 * Thresholds and the exception policy live in ../color/contrast.ts. The
 * rationale is in ../../src/tokens/COLOR.md.
 */

import type { ContrastException, Pairing } from "../color/contrast.js";

export const REQUIRED_PAIRINGS: Pairing[] = [
  // Body text on the two surfaces every screen is built from.
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

  // Filled actions and status surfaces carry their own foreground.
  ...(
    ["primary", "secondary", "accent", "success", "warning", "danger", "information"] as const
  ).map<Pairing>((role) => ({
    foreground: `color.${role}.foreground`,
    background: `color.${role}.default`,
    kind: "body-text",
    reason: `label on a filled ${role} surface`,
  })),

  // A status colour used as *text* is a different requirement from the same
  // colour used as a fill, and it is the one that gets skipped. Both surfaces,
  // because a chip inside a card sits on a different ground from one on a page.
  ...(
    ["primary", "accent", "success", "warning", "danger", "information"] as const
  ).flatMap<Pairing>((role) => [
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

  // Interactive states must stay legible, not just distinguishable.
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

  // The switch thumb is an indicator carrying state, so it needs 3:1 against
  // every track it can sit on. Declared as pairings because a colour that is not
  // a declared pairing is a colour this check cannot see.
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

  // Non-text: boundaries and focus, on every surface they can appear over.
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

  // Disabled is exempt from a minimum, and is listed so the measurement is
  // recorded rather than the pairing being forgotten.
  {
    foreground: "color.foreground.disabled",
    background: "color.surface.disabled",
    kind: "disabled",
    reason: "disabled text should still be readable even though WCAG exempts it",
  },
];

/**
 * Reviewed exceptions. Empty, and that is the goal.
 *
 * An entry here means a required pairing ships below its threshold with a named
 * approving issue. See COLOR.md for when that is legitimate.
 */
export const CONTRAST_EXCEPTIONS: ContrastException[] = [];
