import { DialogDemoClient } from "./DialogDemoClient";
import { MotionModes } from "./MotionModes";

/**
 * The Dialog example, rendered under both motion modes. The server half only
 * composes; the client half holds the open state and the readout.
 *
 * `DialogContent` renders where it sits in the tree and `showModal()` lifts
 * it to the top layer without a portal, so each copy's dialog is still a DOM
 * descendant of its panel. That is what lets the right-hand copy inherit the
 * collapsed motion custom properties and open with no scale or fade.
 */
export function DialogDemo() {
  return (
    <MotionModes hint="Tab to a trigger and press Enter: focus lands inside the dialog on the keypress. Press Escape and it is back on the trigger before any animation could have finished. Open and close quickly to see the entry retarget.">
      <DialogDemoClient />
    </MotionModes>
  );
}
