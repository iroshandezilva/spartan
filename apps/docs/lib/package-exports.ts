/** The runtime export names of the package, grouped by kind. Shared by the
 * rendered export table and its Markdown form so both list the same thing. */
export function groupExports(names: readonly string[]): Array<[string, string[]]> {
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  const components = sorted.filter((name) => /^[A-Z]/.test(name) && !/^[A-Z_]+$/.test(name));
  const constants = sorted.filter((name) => /^[A-Z_]+$/.test(name));
  const functions = sorted.filter((name) => /^[a-z]/.test(name));
  return [
    ["Components", components],
    ["Functions and values", functions],
    ["Constants", constants],
  ];
}
