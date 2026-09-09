---
kind: component
bump: minor
issue: HAUX-52
---

Add `Select`, a styled native `select` with `placeholder`, `onValueChange`, and `Field` wiring.

Native rather than a custom listbox: keyboard navigation, typeahead, form participation, the mobile picker, and focus behaviour come from the platform, and no dependency was added. The popup's appearance is the platform's, which is recorded as a limitation in the component README.
