import { MotionModes } from "./MotionModes";
import { TooltipDemoClient } from "./TooltipDemoClient";

/**
 * The Tooltip example, rendered under both motion modes. The server half only
 * composes; the client half holds the readout. The tooltip surface is a
 * descendant of the panel in the DOM even though it paints in the top layer,
 * so the reduced-motion custom properties on the right-hand panel reach it.
 */
export function TooltipDemo() {
  return (
    <MotionModes hint="Rest the pointer on a toolbar button for half a second, then sweep along the row: the first tooltip waits, the rest open at once. Tab to Save draft: it opens on focus with no delay, Escape closes it, and the readout flips on the keypress.">
      <TooltipDemoClient />
    </MotionModes>
  );
}
