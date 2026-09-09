import { describe, expect, it } from "vitest";
import { packageName } from "./index.js";

describe("package entry point", () => {
  it("exposes the published package name", () => {
    expect(packageName).toBe("@iroshandezilva/spartant");
  });
});
