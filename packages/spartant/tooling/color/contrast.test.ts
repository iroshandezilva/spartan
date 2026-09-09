import { describe, expect, it } from "vitest";
import type { ContrastException, Pairing } from "./contrast.js";
import { describeFailure, evaluatePairing, THRESHOLDS } from "./contrast.js";

const white = { l: 1, c: 0, h: 0 };
const black = { l: 0, c: 0, h: 0 };
const mid = { l: 0.62, c: 0, h: 0 };

const pairing = (kind: Pairing["kind"]): Pairing => ({
  foreground: "color.foreground",
  background: "color.background",
  kind,
  reason: "body copy must be readable",
});

describe("policy thresholds", () => {
  it("uses the WCAG AA minimums", () => {
    expect(THRESHOLDS["body-text"]).toBe(4.5);
    expect(THRESHOLDS["large-text"]).toBe(3);
    expect(THRESHOLDS["non-text"]).toBe(3);
  });

  it("exempts disabled, which WCAG does not require", () => {
    expect(THRESHOLDS.disabled).toBe(0);
  });
});

describe("evaluation", () => {
  it("passes a pairing that clears its threshold", () => {
    const result = evaluatePairing(pairing("body-text"), black, white);
    expect(result.passes).toBe(true);
    expect(result.ratio).toBeGreaterThan(20);
  });

  it("fails a pairing that does not", () => {
    const result = evaluatePairing(pairing("body-text"), mid, white);
    expect(result.passes).toBe(false);
    expect(result.required).toBe(4.5);
  });

  it("passes the same pairing at the large-text threshold", () => {
    expect(evaluatePairing(pairing("large-text"), mid, white).passes).toBe(true);
  });

  it("honours a recorded exception", () => {
    const exception: ContrastException = {
      foreground: "color.foreground",
      background: "color.background",
      accepted: 3.2,
      reason: "decorative caption, reviewed",
      approvedIn: "HAUX-31",
    };
    const result = evaluatePairing(pairing("body-text"), mid, white, [exception]);
    expect(result.passes).toBe(true);
    expect(result.exception?.approvedIn).toBe("HAUX-31");
  });

  it("ignores an exception recorded for a different pairing", () => {
    const other: ContrastException = {
      foreground: "color.other",
      background: "color.background",
      accepted: 3.2,
      reason: "unrelated",
      approvedIn: "HAUX-31",
    };
    expect(evaluatePairing(pairing("body-text"), mid, white, [other]).passes).toBe(false);
  });
});

describe("failure output", () => {
  it("names the tokens, the measurement, the target, and the way out", () => {
    const message = describeFailure(evaluatePairing(pairing("body-text"), mid, white));
    expect(message).toContain("color.foreground on color.background");
    expect(message).toContain("needs 4.5:1");
    expect(message).toContain("body-text");
    expect(message).toContain("reviewed exception");
  });
});
