import { MotionModes } from "./MotionModes";
import { PopoverDemoClient } from "./PopoverDemoClient";

/**
 * The Popover example, rendered under both motion modes. The server half only
 * composes; the client half holds the open state and the readout.
 *
 * The surface is shown in the top layer through `popover="auto"`, but it is
 * still a DOM descendant of the panel that renders it, with no portal, so the
 * reduced-motion custom properties on the right-hand panel inherit into it and
 * that copy really does open and close in place.
 */
export function PopoverDemo() {
  return (
    <MotionModes hint="Tab to Share and press Enter: focus lands in the Link field before the surface has finished growing. Press Escape and focus is back on Share while the surface is still fading. Click the page to dismiss it; click Share while it is open to close it without reopening.">
      <PopoverDemoClient />
    </MotionModes>
  );
}
