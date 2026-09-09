/**
 * Contrast policy: thresholds, the required pairings, and the exception path.
 *
 * The rationale is in ../../src/tokens/COLOR.md. This module is the executable
 * form of it, so the policy and the check cannot drift apart.
 */

import { contrastRatio, type Oklch } from "./oklch.js";

/** What a pairing is used for. The use decides the threshold. */
export type PairingKind = "body-text" | "large-text" | "non-text" | "disabled";

/**
 * WCAG 2.2 AA minimums.
 *
 * `large-text` means 24px, or 18.66px bold and above.
 * `non-text` covers focus rings and any boundary that carries state.
 * `disabled` is exempt by WCAG and is checked only for legibility, never
 * blocking, which is why it is recorded here rather than left implicit.
 */
export const THRESHOLDS: Record<PairingKind, number> = {
  "body-text": 4.5,
  "large-text": 3,
  "non-text": 3,
  disabled: 0,
};

export interface Pairing {
  /** Semantic token drawn on top. */
  foreground: string;
  /** Semantic token drawn underneath. */
  background: string;
  kind: PairingKind;
  /** Why this pairing matters, for the failure message. */
  reason: string;
}

/**
 * A recorded, reviewed exception.
 *
 * Exceptions are data rather than a code path so they are searchable, and so
 * an unreviewed failure can never be silently downgraded into one.
 */
export interface ContrastException {
  foreground: string;
  background: string;
  /** Ratio accepted despite being below the threshold. */
  accepted: number;
  reason: string;
  /** Linear issue that approved it. Required. */
  approvedIn: string;
}

export interface PairingResult {
  pairing: Pairing;
  ratio: number;
  required: number;
  passes: boolean;
  exception?: ContrastException;
}

/** Evaluates one pairing against the policy, honouring a recorded exception. */
export function evaluatePairing(
  pairing: Pairing,
  foreground: Oklch,
  background: Oklch,
  exceptions: ContrastException[] = [],
): PairingResult {
  const ratio = Number(contrastRatio(foreground, background).toFixed(2));
  const required = THRESHOLDS[pairing.kind];
  const exception = exceptions.find(
    (e) => e.foreground === pairing.foreground && e.background === pairing.background,
  );
  return {
    pairing,
    ratio,
    required,
    passes: ratio >= required || exception !== undefined,
    exception,
  };
}

/** Renders a failure so the reader knows the token, the measurement, and the target. */
export function describeFailure(result: PairingResult): string {
  const { pairing, ratio, required } = result;
  return [
    `${pairing.foreground} on ${pairing.background}`,
    `  measured ${ratio}:1, needs ${required}:1 for ${pairing.kind}`,
    `  why it matters: ${pairing.reason}`,
    "  fix the mapping, or record a reviewed exception with an approving issue",
  ].join("\n");
}
