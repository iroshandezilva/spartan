/**
 * Public usage that must NOT type check.
 *
 * The smoke test compiles this file on its own and fails when the compiler is
 * happy. That inverted expectation is the point: a package can ship type
 * declarations that resolve and still accept anything, and a consumer only
 * discovers that when a typo reaches production. Each line below is a mistake a
 * consumer makes, and each one has to be rejected by the packed `.d.ts` files.
 *
 * Every expected error carries its TypeScript error code. `scripts/smoke-test.mjs`
 * asserts that each listed code appears in the compiler output, so widening a
 * prop to `string` cannot quietly turn one of these into a pass by way of some
 * unrelated error taking its place.
 *
 * Keep the codes in this file and in EXPECTED_TYPE_ERRORS in the script the same.
 */

import {
  Button,
  Field,
  FieldMessage,
  Switch,
  ThemeProvider,
  tokenVar,
} from "@iroshandezilva/spartant";

export function InvalidVariant() {
  // TS2322: `variant` is a closed union, not an arbitrary string.
  return <Button variant="mauve">No such variant</Button>;
}

export function InvalidSize() {
  // TS2322: `size` is a closed union.
  return <Button size="enormous">Too big</Button>;
}

export function InvalidFieldMessageTone() {
  // TS2322: `tone` is `description` or `error`.
  return (
    <Field>
      <FieldMessage tone="warning">Not a tone</FieldMessage>
    </Field>
  );
}

export function InvalidThemePreference() {
  // TS2322: `defaultTheme` is `light`, `dark`, or `system`.
  return <ThemeProvider defaultTheme="sepia">Themed</ThemeProvider>;
}

export function InvalidCallbackSignature() {
  // TS2322: `onCheckedChange` receives a boolean, not a string.
  return <Switch onCheckedChange={(checked: string) => checked.trim()} />;
}

export function invalidTokenPath(): string {
  // TS2345: token paths are a closed set generated from the token sources.
  return tokenVar("color.primary.nope");
}
