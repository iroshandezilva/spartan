import { describe, expect, it } from "vitest";
import {
  anchoredSurface,
  anchorNameFor,
  type Box,
  PLACEMENTS,
  placementClasses,
  resolveSide,
} from "./overlay.js";

const box = (left: number, top: number, width: number, height: number): Box => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

/** A 100 by 40 trigger in the middle of a notional viewport. */
const anchor = box(400, 300, 100, 40);

describe("resolveSide", () => {
  it("reads the side the surface actually landed on", () => {
    expect(resolveSide(anchor, box(380, 240, 140, 52), "top")).toBe("top");
    expect(resolveSide(anchor, box(380, 348, 140, 52), "top")).toBe("bottom");
    expect(resolveSide(anchor, box(240, 294, 152, 52), "top")).toBe("left");
    expect(resolveSide(anchor, box(508, 294, 152, 52), "top")).toBe("right");
  });

  it("reports a flip, which is the whole reason it exists", () => {
    // Requested top, but the browser's fallback put it below: the transform
    // origin has to follow the surface, not the request.
    expect(resolveSide(anchor, box(380, 348, 140, 52), "top")).toBe("bottom");
    expect(resolveSide(anchor, box(380, 240, 140, 52), "bottom")).toBe("top");
  });

  it("keeps the requested placement when the geometry says nothing", () => {
    // happy-dom has no layout engine and returns an all-zero rect. Reading
    // sides from that would report `top` for everything.
    expect(resolveSide(box(0, 0, 0, 0), box(0, 0, 0, 0), "bottom")).toBe("bottom");
    expect(resolveSide(anchor, box(400, 300, 0, 0), "left")).toBe("left");
  });

  it("keeps the requested placement when the surface overlaps the anchor", () => {
    expect(resolveSide(anchor, box(410, 310, 40, 20), "right")).toBe("right");
  });
});

describe("placement classes", () => {
  it("cover every placement with a position-area and a fallback list", () => {
    for (const placement of PLACEMENTS) {
      const classes = placementClasses[placement];
      expect(classes).toContain(`[position-area:${placement}]`);
      expect(classes).toContain("[position-try-fallbacks:");
    }
  });

  it("flip along the axis of the placement", () => {
    expect(placementClasses.top).toContain("flip-block");
    expect(placementClasses.bottom).toContain("flip-block");
    expect(placementClasses.left).toContain("flip-inline");
    expect(placementClasses.right).toContain("flip-inline");
  });

  it("reset the user-agent centring so position-area can align toward the anchor", () => {
    expect(anchoredSurface).toContain("inset-auto");
    // The gap is a margin on every side, so it survives a fallback flip.
    expect(anchoredSurface).toContain("m-control-gap");
    for (const side of PLACEMENTS) {
      expect(anchoredSurface).toContain(`data-[side=${side}]:origin-`);
    }
  });
});

describe("anchorNameFor", () => {
  it("produces a dashed identifier from any useId output", () => {
    for (const id of [":r1:", "«r1»", "_r_1_", "r1"]) {
      expect(anchorNameFor(id)).toMatch(/^--spartant-anchor-[a-zA-Z0-9_-]+$/);
    }
  });

  it("keeps distinct ids distinct", () => {
    expect(anchorNameFor("«r1»")).not.toBe(anchorNameFor("«r2»"));
  });
});
