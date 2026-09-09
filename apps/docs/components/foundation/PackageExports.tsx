"use client";

import * as spartant from "@iroshandezilva/spartant";
import { groupExports } from "@/lib/package-exports";

/*
 * A client component, for the same reason as ButtonRow: the package's entry
 * point re-exports ThemeProvider, whose hooks the server compiler rejects, so
 * the package can only be imported from a client module. The component is
 * still prerendered at build time, so the list is in the static HTML.
 */

/**
 * The package's runtime exports, read from the package itself.
 *
 * Types are not listed because they do not exist at runtime; the `.d.ts`
 * beside the entry point is the authority for those. This list is what a
 * coding agent can import today, and it cannot drift from the package because
 * it is the package.
 */
export function PackageExports() {
  const groups = groupExports(Object.keys(spartant));

  return (
    <table>
      <thead>
        <tr>
          <th>Kind</th>
          <th>Exports from the package root</th>
        </tr>
      </thead>
      <tbody>
        {groups.map(([title, items]) => (
          <tr key={title}>
            <td>{title}</td>
            <td>
              {items.map((name, index) => (
                <span key={name}>
                  {index > 0 ? ", " : null}
                  <code>{name}</code>
                </span>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
