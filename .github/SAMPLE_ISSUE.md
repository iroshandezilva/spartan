# Sample issue

A rehearsal issue for checking that this repository's guidance is enough on its
own. It is not tracked in Linear and must never be implemented on `main`.

Use it to confirm a fresh agent session, given only this repository, can work
out the right commands, constraints, and reporting format without being told.

---

## HAUX-SAMPLE: Add a `Separator` component

### Outcome

The package exports a `Separator` that divides content with a semantic border
and an appropriate accessible role.

### Scope

Add the component, its public export, and its stories. Use existing semantic
tokens.

### Acceptance criteria

- [ ] `Separator` is exported from the package's public entry point.
- [ ] It renders a horizontal or vertical divider, controlled by a prop.
- [ ] It uses a semantic border token, not a raw color value.
- [ ] It supports `className` and forwards remaining props.
- [ ] Its accessible role is correct for a decorative and a semantic divider.
- [ ] Stories cover both orientations in light and dark.

### Automated verification

Run the repository's full validation gate.

### Manual verification

Required. Inspect both orientations in light and dark.

### Out of scope

Token value changes and documentation-site pages.

---

---

The expected response is kept in `SAMPLE_ISSUE_RUBRIC.md` so this file can be
handed to an agent without giving away the answers. Do not show the rubric to
the session under test.
