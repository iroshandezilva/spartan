import { MotionModes } from "./MotionModes";
import { TabsDemoClient } from "./TabsDemoClient";

/**
 * The Tabs example, rendered under both motion modes. The server half only
 * composes; the client half holds the selection and the readouts.
 */
export function TabsDemo() {
  return (
    <MotionModes hint="Click a tab and watch the underline fade in, then Tab into the list and press ArrowRight: the keyboard path paints the new tab at once, and in both cases the readout has already changed.">
      <TabsDemoClient />
    </MotionModes>
  );
}
