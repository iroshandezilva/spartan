import { ButtonDemoClient } from "./ButtonDemoClient";
import { MotionModes } from "./MotionModes";

/**
 * The Button example, rendered under both motion modes. The server half only
 * composes; the client half holds the loading state.
 */
export function ButtonDemo() {
  return (
    <MotionModes hint="Press and hold with a pointer to see the press scale, then Tab to a button and press Space: the keyboard path activates on the keypress.">
      <ButtonDemoClient />
    </MotionModes>
  );
}
