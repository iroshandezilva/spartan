# Adopting shadcn source

The workflow every component issue follows when it starts from shadcn/ui,
which for a v0.1 component with a strong shadcn equivalent is the default.
Decided in HAUX-65, proven on two components.

**Spartant is shadcn-first and not shadcn-dependent.** Where a comparable
component exists, start from it: it supplies the initial source, structure, and
visual baseline, and that is what lets a component move quickly. Skip it only
when the issue says so, or when no comparable component exists.

shadcn is an **open-code input**. Source is copied in, reviewed, rewritten, and
owned. It is never a runtime dependency, the catalog is never imported
wholesale, and nothing about its API becomes part of Spartant's public contract.
Before anything ships, the component must have become Spartant-owned code:
owned API, owned semantic tokens, owned styling decisions, owned accessibility
behaviour, owned motion contract, owned tests, owned Storybook stories, owned
documentation, and owned package exports. The checklist below is how that
happens.

## The checklist

Copy this into the component issue and work through it. Every box is something
that went wrong in the two proof adaptations, not a hypothetical.

### 1. Import

- [ ] Fetch the registry entry, not a copy from a blog: `https://ui.shadcn.com/r/styles/new-york/<name>.json`
- [ ] Save the upstream text verbatim under `upstream/`, and record source URL, style, date, declared dependencies, and a sha256 in `provenance.json`
- [ ] Never import from `upstream/`. It is evidence, not code

### 2. Dependency review

- [ ] List every declared dependency and ask what it actually buys
- [ ] **Check whether each declared dependency is even used.** shadcn's Badge declares `@radix-ui/react-slot` and never imports it
- [ ] For each remaining one, decide: own the behaviour, use an approved primitive, or accept the dependency with written justification
- [ ] A dependency added to the package changes the consumer contract. That needs an issue-level decision, per `AGENTS.md`
- [ ] Replace `cva` with a `Record<Variant, string>` lookup unless variants genuinely compose along several axes

**Owned logic or a primitive?** The test is what the platform already gives you:

| Behaviour | Verdict |
| --- | --- |
| Toggle, press, focus, disabled | Own it. A native `<button>` supplies all of it |
| Roving focus, typeahead, active descendant | Consider a primitive |
| Focus trapping, restoration, dismissal, portals, scroll lock | Use a primitive. Getting this wrong is an accessibility failure, not a bug |

### 3. API cleanup

- [ ] **Never type props as the primitive's props.** `ComponentPropsWithoutRef<typeof Primitive.Root>` makes the primitive's whole surface your contract and turns removing it into a breaking change
- [ ] Take `ref` as a prop. React 19 needs no `forwardRef`, and `React.ElementRef` is deprecated
- [ ] Delete `"use client"`. It is a Next.js directive that means nothing to a library consumer
- [ ] Name variants for Spartant roles: `danger`, not `destructive`
- [ ] Check the rendered element is right. shadcn's Badge renders a `<div>`, which is wrong inside running text

### 4. Token replacement

- [ ] Every colour is a semantic role. No `bg-destructive`, `ring-ring`, `bg-input`, which are shadcn's vocabulary
- [ ] **No opacity shortcuts for state.** `hover:bg-primary/80` renders differently on every surface it sits on and cannot be contrast-checked. Use `hover:bg-primary-hover`
- [ ] `disabled:opacity-50` becomes the disabled roles, for the same reason
- [ ] Raw `rounded-md`, `text-xs`, `px-2.5` become semantic tokens
- [ ] Motion uses duration and easing tokens, so reduced motion needs no per-component work
- [ ] `focus:` becomes `focus-visible:`. A ring on mouse click teaches people to ignore the ring

### 5. Accessibility review

- [ ] Role, accessible name, state, and keyboard behaviour all verified
- [ ] **Measure the touch target.** shadcn's Switch is 20x36 CSS pixels against a 44x44 floor. It looks correct, which is why it survives a copy-paste
- [ ] Decorative inner elements are `aria-hidden`
- [ ] Disabled state is carried by the attribute, not only by colour
- [ ] State changes do not wait for animation

### 6. Testing

- [ ] Behaviour tests: controlled, uncontrolled, disabled, keyboard
- [ ] Assertions that the adaptation stayed adapted: no primitive import, no foreign token, no opacity shortcut
- [ ] Where a defect was found upstream, assert **both** that upstream has it and that the adaptation does not. That is what stops a later refactor quietly reintroducing it

### 7. Provenance and updates

- [ ] `pnpm check:upstream` reports whether upstream moved. It never writes
- [ ] An upstream change is a prompt to review, never an automatic merge
- [ ] Record the decision, and update the snapshot and sha256 only when something is deliberately adopted

## Distribution: npm and registry

**npm is the contract.** `@iroshandezilva/spartant` is how Spartant ships:
versioned, semver'd, with a changelog and a migration path. A consumer who
installs the package gets components that update when they choose.

**A registry, if it ever exists, is a convenience.** shadcn's own model is
copy-in source, which suits a prototype that wants to own and edit. Spartant may
one day publish a registry so `shadcn add` can pull Spartant components as
open code.

If that happens:

- The registry serves **the same owned source** the npm package builds from. It is a second delivery of one artefact, never a fork
- Registry output carries no Spartant runtime dependency a consumer cannot see
- The npm package remains the supported path. Registry copies are unversioned by nature and cannot be migrated for the consumer
- A registry is additive. Nothing in the package may depend on it existing

This is a stated position, not a commitment. Building one needs its own issue.

## Worked examples

`../experiments/shadcn/` holds both proof adaptations with the upstream
snapshots beside them. They are experiment evidence, deliberately **not exported
from the package entry point**. The released Badge (HAUX-45) and Switch
(HAUX-48) were built as owned source before this direction was settled; whether
they, and the rest of the first slice, would gain anything from their shadcn
equivalents is the job of the component audit issue rather than a rewrite.

| Component | What the review caught |
| --- | --- |
| Badge, simple | An unused declared dependency; `cva` for a four-way lookup; a `<div>` inside running text; `focus:` instead of `focus-visible:`; an opacity hover |
| Switch, behaviour-heavy | A Radix dependency re-supplying what a native button gives free; the primitive's props leaked as the public API; a `"use client"` directive; **a 20x36 touch target against a 44px floor** |
