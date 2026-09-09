# v0.1 component inventory

What ships in v0.1, why each thing is in, what is deferred, and the decisions
that shaped it.

> **Status: approved.** Iroshan approved this on 8 September 2026 as written,
> including every recommendation in the open-decisions section below. HAUX-44 is
> Done. Component implementation follows this document; a change to it is a new
> decision issue, not a pull request.

## The decision in one line

**Keep the sixteen components already proposed. Add nothing. Defer everything
else with a named trigger.**

## What is in, and why

Sixteen components across ten issues. Each row gives the need it serves, the
reason it earns a place in a first release, and how it will be built.

### Foundations and display

| Component | User need | Release reason | Built with | Motion |
| --- | --- | --- | --- | --- |
| Button ([HAUX-43](https://linear.app/wearehaux/issue/HAUX-43/build-button)) | Trigger an action | The most used control in any prototype. 68 files in Atlas, the highest count in the evidence. Proves variants, sizes, states, and press feedback for everything after it. | Native `button`, owned | Press feedback |
| Badge ([HAUX-45](https://linear.app/wearehaux/issue/HAUX-45/build-badge)) | Label a status or category | Every list and table needs one, and it is where semantic colour is most often abused. 8 files in Atlas. | Owned | None |
| Card ([HAUX-47](https://linear.app/wearehaux/issue/HAUX-47/build-card)) | Group related content on a surface | The default container in a prototype. Proves surface, elevation, and radius roles against real content. 14 files in Atlas. | Owned | None |
| Separator ([HAUX-46](https://linear.app/wearehaux/issue/HAUX-46/build-separator)) | Divide content | Cheap, and the semantic-versus-decorative distinction is worth establishing once. | Native `hr` or `role="separator"`, owned | None |

### Text fields

| Component | User need | Release reason | Built with | Motion |
| --- | --- | --- | --- | --- |
| Label, Input, Textarea, Field Message ([HAUX-49](https://linear.app/wearehaux/issue/HAUX-49/build-text-field-primitives-label-input-textarea-and-field-message)) | Enter and correct text, and understand what went wrong | A prototype without a form is a mockup. Input is 38 files in Atlas and Label 28. Field Message is the piece Atlas lacks, so error text there is ad hoc. | Native `label`, `input`, `textarea`, owned | Focus and validation feedback, no layout shift |

Kept as one issue because they are one contract. A Label that does not associate
with an Input, or an error that is not referenced by `aria-describedby`, is not a
partial success; it is a broken field.

### Selection controls

| Component | User need | Release reason | Built with | Motion |
| --- | --- | --- | --- | --- |
| Checkbox, Radio Group, Switch ([HAUX-48](https://linear.app/wearehaux/issue/HAUX-48/build-selection-controls-checkbox-radio-group-and-switch)) | Choose independently, choose exclusively, flip a setting | Three different semantics that are constantly confused for each other. Atlas has none of Radio Group or Switch and records the cost: a native checkbox standing in for a setting that saves on flip. | Native `input`, owned | Indicator and thumb transitions |

Checkbox scores 1 file in the Atlas evidence. That is an artefact, as the
evidence itself says: Atlas uses native inputs for form booleans and reserves
its Checkbox for row selection. Low usage there is not an argument against a
design system having one.

### Overlays

| Component | User need | Release reason | Built with | Motion |
| --- | --- | --- | --- | --- |
| Dialog ([HAUX-50](https://linear.app/wearehaux/issue/HAUX-50/build-dialog)) | Ask a focused question without losing context | The hardest accessibility contract in the set, and the one most often got wrong. Doing it early sets the focus and dismissal patterns everything else copies. | **Native `dialog` with `showModal()`**, owned. See below. | Centre origin, coordinated backdrop |
| Tooltip, Popover ([HAUX-53](https://linear.app/wearehaux/issue/HAUX-53/build-tooltip-and-popover)) | Supplemental text; richer non-modal content | Atlas uses the native `title` attribute in roughly 57 files, which is unstyled, delayed, invisible on touch, and cannot hold a shortcut. Popover is imported raw at two call sites that repeat the same six lines. | Decide at the issue. See decision 4. | Origin-aware entry |

### Navigation and choice

| Component | User need | Release reason | Built with | Motion |
| --- | --- | --- | --- | --- |
| Select ([HAUX-52](https://linear.app/wearehaux/issue/HAUX-52/build-select)) | Choose one option from a list | 12 files in Atlas. The one control where native and custom genuinely trade off, and the issue already requires that decision to be recorded. | Decide at the issue. See decision 4. | Origin-aware entry |
| Tabs ([HAUX-51](https://linear.app/wearehaux/issue/HAUX-51/build-tabs)) | Switch between related panels | 5 files in Atlas. Establishes roving tabindex and the manual-versus-automatic activation choice. | Owned | Pointer selection may animate the indicator; keyboard stays immediate |

## Dialog on the native element

Approved: build Dialog on `<dialog>` with `showModal()` rather than on a
primitive library.

AGENTS.md says to prefer native elements and platform behaviour when they
satisfy the requirement, and here they largely do. `showModal()` gives a focus
trap, top-layer stacking above every `z-index`, `Escape` dismissal, background
inertness, and focus restoration, with no dependency and no runtime cost.

What still has to be owned: `::backdrop` styling from tokens, the coordinated
backdrop and surface timing, the `Escape` path under reduced motion, and
labelling through `aria-labelledby`. Those are the parts worth writing anyway,
because they are the parts the motion and accessibility standards specify.

Recorded limitation: closing animations need `Escape` intercepted so the element
is removed after the transition rather than instantly, and that interception must
never delay focus restoration. HAUX-50 owns proving it.

## Deferred, with the trigger that reopens each

Nothing below is rejected. Each has the condition that should bring it back.

| Deferred | Why not v0.1 | Reopen when |
| --- | --- | --- |
| Table | The largest component in any system, 8 parts in Atlas, and it pulls in sorting, selection, and virtualisation. It would consume the release. | A prototype needs real tabular data, or after v0.1 ships. |
| DropdownMenu | 16 files in Atlas and genuinely useful, but it is Popover plus roving focus plus typeahead. It should follow the overlay patterns rather than invent them. | Popover is built and its positioning is proven. |
| EmptyState, PageHeader | Layout compositions, not primitives. Cheap to assemble from Card, Button, and type roles once those exist. | They are rebuilt identically in three prototypes. |
| UserAvatar, Avatar, AvatarStack | 20 files in Atlas, but the identity-hashed tint is product logic, not a design-system concern. | Avatar is needed without the hashing, or the hashing is agreed to belong in the system. |
| StatusBadge | Atlas maps 17 statuses onto 6 tones, and that mapping is domain language. See decision 2. | The mapping is shown to be shared across products. |
| Toaster | A notification queue, a portal, and a timing model. `toast()` is called from 36 files in Atlas, so it is real, but it is a system of its own. | After v0.1, as its own issue. |
| DatePicker, Calendar | Locale, time zones, and keyboard grids. Atlas's is hand-built and local-time only, which is the warning. | A prototype needs dates and the native input is genuinely insufficient. |
| Combobox, Sheet, AlertDialog, Skeleton, ButtonGroup, Breadcrumb, Progress, Pagination, Accordion | Each is reasonable and none is load-bearing for a first release. AlertDialog and Sheet are Dialog variants and should wait for Dialog to settle. | Named in a new issue with its own need. |

## Decisions, all approved

Each was recommended by this document and accepted on 8 September 2026. They are
recorded here with the reasoning, because the reasoning is what makes them
revisitable.

### 1. Status colours have no text role, and one of them fails AA today

The semantic layer gives every status family a fill (`color.danger`) and an ink
to sit **on** that fill (`color.danger-foreground`). There is no role for status
colour used **as text on the page**, which is exactly what Field Message needs
for an error and Badge needs for a soft tone.

The Atlas evidence predicted this failure and it is real here. Measured with the
repository's own contrast tooling, using each fill as text:

| Fill used as text | On background | On surface | AA body text |
| --- | --- | --- | --- |
| `success` | **4.47** | 4.74 | **fails** |
| `warning` | 4.88 | 5.16 | passes |
| `danger` | 5.28 | 5.59 | passes |
| `information` | 4.70 | 4.98 | passes |
| `primary` | 4.96 | 5.25 | passes |
| `accent` | 4.94 | 5.23 | passes |

Not a defect today, because nothing uses a fill as text and no pairing claims it
does. It becomes one the moment Field Message renders an error, and `success` is
the role that fails, which is the one nobody would think to check.

**Recommendation:** add a text role per status family (`color.<family>.text`)
resolved against both background and surface, and add both pairings to the
contrast check so this can never regress. Belongs in HAUX-49's slice at the
latest, and ideally before it.

### 2. Status-to-tone mapping is the product's, not the system's

Atlas maps 17 statuses onto 6 tones, and those status names are domain language.

**Recommendation:** Spartant ships Badge with semantic tones. A consuming
application owns the mapping from its own statuses onto those tones. No
StatusBadge in the system.

### 3. There is no soft tone for status, only a solid fill

Badge needs a quiet variant. Today that means a full-strength fill with white
text, which is loud for a list of twenty rows.

**Recommendation:** add an opaque tint and a matching text role per family,
never an alpha. The evidence is specific about why: an alpha tint measured 5.21
on the page and 4.78 inside a card, so it has no single contrast figure to
assert. Every Spartant colour is already opaque; keep it that way.

### 4. Base UI is not needed for this slice, and the question can wait

Nothing in Button, text fields, selection controls, or Dialog needs a primitive
library once Dialog uses the native element. Select, Tooltip, and Popover are
where the trade genuinely appears, and they are not in this slice.

**Recommendation:** decide nothing now. Build the first slice with owned source
and native elements, and let HAUX-52 and HAUX-53 make the case with real
requirements. If a primitive is adopted, `ADOPTING-SHADCN.md` already sets the
ownership rules and AGENTS.md already forbids exposing it through the public API.

### 5. There is no control size scale in the tokens

The token layer has exactly one control padding pair
(`space.control-padding-x: 1rem`, `space.control-padding-y: 0.5rem`) and no
size roles. A Button with `sm`, `md`, and `lg` needs tokens that do not exist.

With the current padding and body line height a default control computes to
40px tall, which is under the 44px floor the Motion and Micro-interaction
Standard states. HAUX-41 already found the proof component at 32px.

**Recommendation:** HAUX-43 adds a control size scale as semantic tokens, and
the floor is met as a hit area rather than a visual height. A 44px-tall button
everywhere is wrong for dense layouts; a 32px button whose target extends to
44px on a coarse pointer is right. See the hit-area rule in
[`API-CONVENTIONS.md`](API-CONVENTIONS.md).

## What this inventory corrects

Worth stating, because it is the strongest evidence that the set is right rather
than merely plausible. Four of the five things Spartant plans that Atlas does not
have appear on **Atlas's own list of what it is missing**, with the cost of each
absence recorded: Tooltip, Popover, Switch, and Radio Group. The inventory is
already answering known gaps in a working application.

## Related

- [`API-CONVENTIONS.md`](API-CONVENTIONS.md) for the rules every component follows
- [Atlas component inventory as v0.1 evidence](https://linear.app/wearehaux/document/atlas-component-inventory-as-v01-evidence-5b468a0a61de)
- [MVP components and component standard](https://linear.app/wearehaux/document/mvp-components-and-component-standard-69a7f6dbd2a6)
