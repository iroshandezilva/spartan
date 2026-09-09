import { MotionModes } from "./MotionModes";
import { SelectionControlsDemoClient } from "./SelectionControlsDemoClient";

/**
 * The selection controls example, rendered under both motion modes. The
 * server half only composes; the client half holds every control's state.
 */
export function SelectionControlsDemo() {
  return (
    <MotionModes hint="Click each label rather than the control, then Tab to the switch and press Space: the readout flips on the keypress while the thumb is still travelling. In the radio group, use the arrow keys.">
      <SelectionControlsDemoClient />
    </MotionModes>
  );
}
