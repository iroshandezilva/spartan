import { MotionModes } from "./MotionModes";
import { TextFieldsDemoClient } from "./TextFieldsDemoClient";

/**
 * The text-field example, rendered under both motion modes. The server half
 * only composes; the client half holds the value and derives the invalid
 * state from it. Each copy generates its own ids through `useId`, so the two
 * fields on this page cannot collide.
 */
export function TextFieldsDemo() {
  return (
    <MotionModes hint="Tab into the email field and type a value without an @: the border turns to the danger colour and the error appears on the keystroke in both copies. Tab away and back to see the focus ring arrive instantly.">
      <TextFieldsDemoClient />
    </MotionModes>
  );
}
