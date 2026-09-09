import { CardDemoClient } from "./CardDemoClient";

/**
 * The Card example, rendered once. There is no `MotionModes` wrapper because
 * Card has no motion contract: nothing on the surface changes in response to
 * the user, so a reduced-motion copy would be identical to this one. The
 * buttons inside keep their own press feedback and their own contract.
 */
export function CardDemo() {
  return (
    <div className="not-prose">
      <CardDemoClient />
    </div>
  );
}
