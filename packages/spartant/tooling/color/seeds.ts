/**
 * Example seed colours.
 *
 * These produce the reviewable ramps this issue calls for. They are examples of
 * the contract, not the approved palette: HAUX-33 chooses what the system
 * actually ships.
 */

import type { FamilySeed } from "./scale.js";

export const EXAMPLE_SEEDS: FamilySeed[] = [
  { name: "neutral", hue: 264, chroma: 0.014 },
  { name: "primary", hue: 264, chroma: 0.19 },
  { name: "secondary", hue: 300, chroma: 0.09 },
  { name: "success", hue: 150, chroma: 0.15 },
  { name: "warning", hue: 75, chroma: 0.17 },
  { name: "danger", hue: 27, chroma: 0.2 },
  { name: "information", hue: 240, chroma: 0.14 },
];
