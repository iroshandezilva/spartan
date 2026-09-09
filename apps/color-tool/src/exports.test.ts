import { readFileSync } from "node:fs";
import { generateScale } from "@spartant-color/scale.js";
// The 2020 build exports the class as a named binding; the default export
// is a CommonJS interop shim that tsc will not let us construct.
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { toCss, toTokenJson, toTypeScript } from "./exports.js";

const scale = generateScale({ name: "primary", hue: 264, chroma: 0.19 });

describe("token JSON export", () => {
  it("validates against the real token schema", () => {
    // The point of this export is that it can be pasted into a token file. If
    // it does not satisfy the schema, it cannot, so this checks against the
    // same schema the repository validates with rather than a copy.
    const schema = JSON.parse(
      readFileSync("packages/spartant/src/tokens/schema/spartant-tokens.schema.json", "utf8"),
    );
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
    const parsed = JSON.parse(toTokenJson("primary", scale));
    expect(validate(parsed), JSON.stringify(validate.errors)).toBe(true);
  });

  it("emits every step under the family, as literals", () => {
    const parsed = JSON.parse(toTokenJson("primary", scale)) as {
      color: Record<string, Record<string, { $value: string }>>;
    };
    const family = parsed.color.primary;
    expect(Object.keys(family ?? {})).toHaveLength(scale.length);
    for (const entry of scale) {
      // Primitives hold literals, never aliases. An alias here would fail the
      // repository's own layer rules on paste.
      expect(family?.[String(entry.step)]?.$value).toBe(entry.css);
      expect(family?.[String(entry.step)]?.$value).not.toMatch(/^\{/);
    }
  });

  it("is deterministic", () => {
    expect(toTokenJson("primary", scale)).toBe(toTokenJson("primary", scale));
  });
});

describe("CSS export", () => {
  it("uses the primitive naming grammar", () => {
    const css = toCss("primary", scale);
    expect(css).toContain("--spartant-color-primary-500:");
    expect(css).toContain("--spartant-color-primary-1000:");
    for (const entry of scale) {
      expect(css).toContain(`--spartant-color-primary-${entry.step}: ${entry.css};`);
    }
  });
});

describe("TypeScript export", () => {
  it("emits a const map keyed by step", () => {
    const ts = toTypeScript("primary", scale);
    expect(ts).toContain("export const primary = {");
    expect(ts).toContain("as const;");
    for (const entry of scale) {
      expect(ts).toContain(`${entry.step}: ${JSON.stringify(entry.css)},`);
    }
  });
});

describe("all three formats", () => {
  it("describe the same colours", () => {
    const json = toTokenJson("primary", scale);
    const css = toCss("primary", scale);
    const ts = toTypeScript("primary", scale);
    for (const entry of scale) {
      expect(json).toContain(entry.css);
      expect(css).toContain(entry.css);
      expect(ts).toContain(entry.css);
    }
  });
});
