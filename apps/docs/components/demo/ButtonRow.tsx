"use client";

import { Button, type ButtonVariant } from "@iroshandezilva/spartant";

/*
 * The package ships without `"use client"` directives, because it targets any
 * React 19 renderer rather than the Next.js App Router specifically. A wrapper
 * that carries the directive is the documented way to consume such a package
 * from a server component, and it keeps the boundary in this app rather than
 * pushing a bundler assumption into the published artifact.
 */

const variants: readonly ButtonVariant[] = ["primary", "secondary", "danger", "ghost"];

/** Every Button variant, rendered live. This is a pipeline proof, not the
 * component's documentation: HAUX-56 owns the real component pages, and
 * Storybook remains the exhaustive state surface. */
export function ButtonRow() {
  return (
    <div className="not-prose flex flex-wrap items-center gap-3">
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  );
}
