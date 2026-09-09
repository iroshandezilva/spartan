import { MotionModes } from "./MotionModes";
import { SelectDemoClient } from "./SelectDemoClient";

/**
 * The Select example, rendered under both motion modes. The server half only
 * composes; the client half holds the controlled value.
 *
 * The only motion Select owns is the border and background colour transition,
 * so that is the difference the two copies show. The popup itself is the
 * platform's and is identical in both.
 */
export function SelectDemo() {
  return (
    <MotionModes hint="Hover the control with a pointer to see the border strengthen. Then Tab to it and press Space (macOS) or Alt+Down (Windows) to open the platform list, move with the arrow keys, type a letter to jump, and press Enter: the readout changes on the change event. Press Reset and the error border returns.">
      <SelectDemoClient />
    </MotionModes>
  );
}
