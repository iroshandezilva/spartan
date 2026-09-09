import type { ReactNode } from "react";
import { MotionModesClient } from "./MotionModesClient";
import { reducedMotionOverrides } from "./reduced-motion";

interface MotionModesProps {
  /** The live example. It is rendered twice, once per motion mode. */
  children: ReactNode;
  /** What the reader should try, in one sentence. */
  hint?: string;
}

/**
 * Server half of the two-mode wrapper every interactive component example
 * uses. It reads the reduced-motion overrides from the published token JSON
 * and hands them to the client half, which renders the example under normal
 * motion and again with the overrides applied to that subtree only.
 *
 * Nothing here is a dependency beyond CSS: the right-hand copy behaves the
 * way it does because the motion custom properties on its wrapper carry the
 * collapsed values, which is exactly what the package stylesheet does under
 * `prefers-reduced-motion: reduce`.
 */
export function MotionModes({ children, hint }: MotionModesProps) {
  return (
    <MotionModesClient reducedOverrides={reducedMotionOverrides()} hint={hint}>
      {children}
    </MotionModesClient>
  );
}
