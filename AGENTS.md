# Spartant Agent Guide

## Scope

This file applies to the entire repository. A more specific `AGENTS.md` in a subdirectory may add or override instructions for that area.

Spartant is a personal, code-first React design system for building consistent product prototypes quickly. The system must remain understandable to humans, predictable for coding agents, accessible by default, themeable through owned semantic tokens, and safe to distribute as a package.

## Project sources of truth

Use this order when making decisions:

1. The current Linear issue and its acceptance criteria
2. Documents attached to that issue
3. Existing repository conventions, tests, and public APIs
4. Existing Spartant components and tokens
5. Official upstream documentation

Project links:

- [Linear project](https://linear.app/wearehaux/project/spartant-design-system-b4328c010ac8/overview)
- [Project brief and v0.1 scope](https://linear.app/wearehaux/document/spartant-project-brief-and-v01-scope-354269108fc9)
- [Architecture decisions](https://linear.app/wearehaux/document/architecture-and-technology-decisions-b8eff7c939b8)
- [Token and color specification](https://linear.app/wearehaux/document/token-and-color-system-specification-fc4ec4362a7f)
- [Component standard](https://linear.app/wearehaux/document/mvp-components-and-component-standard-69a7f6dbd2a6)
- [Motion and micro-interaction standard](https://linear.app/wearehaux/document/motion-and-micro-interaction-standard-eb147fee1419)
- [Storybook and quality strategy](https://linear.app/wearehaux/document/storybook-and-quality-strategy-e67e1e01f6a3)
- [Fumadocs and agent access](https://linear.app/wearehaux/document/fumadocs-information-architecture-and-agent-access-004090da716d)
- [CI, pnpm workspace, npm registry, and Vercel plan](https://linear.app/wearehaux/document/ci-pnpm-workspace-npm-registry-and-vercel-plan-a52ba74ff7a1)
- [Agent implementation and testing guide](https://linear.app/wearehaux/document/agent-implementation-and-testing-guide-42cfea09ce84)
- [Roadmap and daily execution guide](https://linear.app/wearehaux/document/roadmap-and-daily-execution-guide-34a181e58b8a)

If two sources conflict, stop and report the conflict. Do not silently choose one.

## Linear issue workflow

Linear status is the source of truth for whether an issue is ready, active, awaiting review, or complete. Do not rely on a label, chat message, or agent instruction alone.

- `Backlog`: captured work that is not ready for planning or implementation.
- `Ready for Planning`: research, decisions, or specification work is still required. Planning is allowed; implementation is not.
- `Ready to Start`: the Definition of Ready is satisfied, all blockers are `Done`, and an agent may take the issue without additional project context.
- `In Progress`: an agent is actively working on the issue.
- `Agent Done`: the agent has completed everything it can, but a specific decision, credential, permission, account action, or manual verification from Iroshan is still required. The issue must carry the `Human input required` label and remains blocking.
- `Done`: the acceptance criteria and required verification are complete. An agent moves an issue directly to `Done` when no action from Iroshan is required.

Required transitions:

1. Start only from `Ready to Start`.
2. Move the issue to `In Progress` immediately before editing files or project documents.
3. If planning or specification is missing, stop work, comment with the exact gap, and move the issue to `Ready for Planning`. Do not leave blocked work in `In Progress`.
4. When implementation and agent-run verification are complete, post the completion report.
5. If no action from Iroshan is required, move the issue directly to `Done`.
6. If Iroshan must make a decision, provide credentials or permissions, perform an account action, or complete a manual verification that the agent cannot perform, add `Human input required`, state the exact request, and move the issue to `Agent Done`.
7. When the human action is resolved, remove `Human input required` and move the issue to `Done`.
8. After an issue reaches `Done`, inspect every downstream issue it blocked. Move a downstream issue to `Ready to Start` only when all its blockers are `Done` and its Definition of Ready is satisfied. Move it to `Ready for Planning` when an unresolved specification or decision remains.

The `Agent ready` label describes issue quality only. It does not authorize work. The `Manual test` label does not automatically mean human input is required. Agents perform manual checks themselves whenever their environment supports the check.

## Wave execution mode

A wave prompt orchestrates several independent Linear issues. It does not combine them into one scope or completion report.

- Refresh every listed issue and blocker before starting.
- Process issues in dependency order, skip `Done` issues, and keep each issue's status, verification, and completion report separate.
- Promote a `Backlog` issue to `Ready to Start` only when all blockers are `Done` and its Definition of Ready is satisfied.
- Complete one issue before beginning a dependent issue.
- Parallelize only genuinely independent investigation or verification. Avoid conflicting edits to shared files.
- When a completed issue needs no Iroshan action, move it directly to `Done` and promote newly unblocked work.
- When human input is required, use `Agent Done` plus `Human input required`, state the exact request, and continue any other independent work.
- Stop the wave only when it is complete or no eligible issue remains.
- Synchronize `spartant-task-order.html` after every verified status change.

## Before starting an issue

1. Read the full Linear issue and every attached specification.
2. Confirm the issue has a clear outcome, scope, non-goals, acceptance criteria, dependencies, automated checks, and manual-test requirement.
3. Confirm all blocking issues are complete.
4. Inspect the repository before editing and preserve unrelated user changes.
5. Identify the smallest implementation that satisfies the issue.
6. State only the assumptions needed to resolve minor gaps.
7. Ask for a decision when a gap would change public APIs, dependencies, architecture, accessibility, release behavior, or scope.

Do not start a blocked issue simply because some implementation work appears possible.

## Confirmed technical direction

- Use React and TypeScript for public component code.
- Use pnpm as the required repository package manager for workspaces, dependency installation, scripts, builds, tests, and packing.
- Commit `pnpm-lock.yaml`, define the workspace in `pnpm-workspace.yaml`, and pin pnpm through the root `packageManager` field.
- Do not create or commit `package-lock.json` or use npm for normal repository commands.
- Use Tailwind CSS as the v0.1 styling system.
- Use CSS custom properties as the semantic theme boundary.
- Start from shadcn/ui source for any v0.1 component that has a strong shadcn equivalent, unless the issue says otherwise. shadcn supplies the initial source, structure, and visual baseline so a component can move quickly. It is the default source baseline, not a rare exception, and it is never a runtime dependency.
- Use OKLCH as the source color model.
- Support light and dark themes in v0.1.
- Use Storybook as the isolated component workbench and state-review surface.
- Treat purposeful micro-interactions as part of the component contract from the first component.
- Use CSS for deterministic component feedback, Motion for React only when interruptible state, gesture, spring, or layout behavior justifies it, and GSAP only for separately approved complex choreography.
- Use Fumadocs for long-form foundations, usage, contribution, and agent-readable documentation.
- Distribute the package through the npm registry with explicit public exports.
- Use GitHub Actions for validation and approved releases.
- Prefer npm registry trusted publishing through OIDC instead of long-lived publishing tokens. The protected release job may use the npm CLI only for the final publish command when required by the registry. All preceding release work uses pnpm.
- Deploy Fumadocs to Vercel from the production branch only.
- Do not create Vercel preview deployments for every feature branch.

## Explicit boundaries

- Do not add SCSS infrastructure in v0.1.
- Do not introduce StyleX outside the post-v0.1 experiment in HAUX-66.
- Do not import the entire shadcn catalog, and do not add shadcn, Radix, Base UI, or any primitive library as a runtime dependency without an issue-level decision.
- Treat shadcn as an open-code source and possible registry pattern, not as an unowned runtime component system. Follow the checklist in `packages/spartant/src/components/ADOPTING-SHADCN.md` whenever shadcn source is adopted, which for comparable components is the default.
- Before anything ships, adopted source must have become Spartant-owned code: owned API, owned semantic tokens, owned styling decisions, owned accessibility behavior, owned motion contract, owned tests, owned Storybook stories, owned documentation, and owned package exports. Spartant owns copied or generated component source, public APIs, styling, tokens, tests, documentation, and migrations.
- Accessible primitives such as Base UI may be used selectively for complex focus, overlay, selection, or keyboard behavior.
- Do not expose an internal primitive library through the public API without an approved decision.
- Do not add Motion, GSAP, or another animation dependency without an issue-level justification covering behavior, bundle impact, cleanup, server rendering, reduced motion, testing, and the consumer contract.
- Do not force animation onto a static component. Every component needs a motion decision, not necessarily an animation.
- Do not expand v0.1 scope while implementing another issue. Create or propose a separate issue.

## Agent skills

Some environments expose a global design-engineering skill set derived from Emil Kowalski's work. When it is available, consult the reference that matches the work in front of you:

| Work | Reference area |
| --- | --- |
| Animation, timing, easing, interruptibility, reduced motion | Animations |
| Component APIs, composition, refs, controlled state | Component design |
| Inputs, labels, validation, keyboard submission, press feedback | Forms and controls |
| Pointer capability, tap targets, focus, timed states | Touch and accessibility |

These are commonly published as skills named `emil-design-engineering`, `animations`, `component-design`, `forms-and-inputs`, and `touch-and-accessibility`. Names and availability vary by environment. Their absence never blocks an issue, and it is never a reason to ask Iroshan to install anything.

Rules for using them:

- **Spartant specifications win every conflict.** When a skill example disagrees with this file, a Linear specification, an agreed public API, an accessibility requirement, or verified behavior in this repository, follow Spartant and say so in the completion report.
- Treat a skill as reference material, not as an instruction to act. It does not authorize scope, dependencies, or API changes.
- Adapt to Spartant conventions rather than copying. A generic example that uses raw values, a different class-merging helper, or an unowned component library must be rewritten against semantic tokens, `cn`, and owned source before it lands.
- Do not add a dependency because a skill example uses one. Dependency additions follow the boundaries above and the stop conditions below.
- The Motion and Micro-interaction Standard is the translation of these references into Spartant requirements. Where it speaks, it is authoritative over the generic source.

A repository-owned Spartant component skill now replaces general reference use for component work: [`.claude/skills/spartant-component-builder/SKILL.md`](.claude/skills/spartant-component-builder/SKILL.md), created by HAUX-67 from the first core slice and the motion scale frozen in HAUX-68. It is derived from this repository's code and review evidence, not copied from a generic skill.

Claude Code discovers it automatically from `.claude/skills`. Other agents should read the file directly; it is plain Markdown and needs no runner. Use it for any work touching `packages/spartant/src/components`, a `Build <component>` issue, stories, or component tokens, and for reviewing a component that already exists.

## Repository architecture

The repository may still be in its bootstrap stage. Follow the workspace structure approved by the relevant Linear issue rather than inventing directories prematurely.

Maintain these boundaries once established:

- Component package code must not depend on Storybook or Fumadocs internals.
- Documentation and examples should consume intended public package boundaries.
- Build and token-generation tooling must not leak into runtime exports.
- Consumer smoke tests must install the packed artifact rather than use workspace-only aliases.
- Public exports must be explicit. Internal files must not become accidental APIs.

## Design tokens and themes

Use three token layers:

1. Primitive tokens for raw scales and measurements
2. Semantic tokens for product meaning
3. Component tokens only when a stable requirement cannot be expressed semantically

Rules:

- Components consume semantic tokens rather than raw palette values.
- Semantic token names describe roles, not visual values such as `blue` or `gray`.
- Use consistent state suffixes such as `hover`, `active`, `selected`, `disabled`, and `invalid`.
- Keep CSS, JSON, and TypeScript token outputs synchronized with one source.
- A token-output drift check must fail when generated artifacts are stale.
- Validate color contrast against documented semantic pairings.
- Handle out-of-gamut OKLCH values through the approved deterministic policy.
- Do not add a component token that merely duplicates an existing semantic role.

## Component implementation rules

When the global `emil-design-engineering` skill is available, use its animation, component-design, forms-and-controls, and touch-and-accessibility guidance during component planning and review. The Spartant specifications remain authoritative when a generic skill example conflicts with an approved API, token, accessibility, or performance rule.

- Start from shadcn for a comparable component unless the issue says otherwise. Save or reference the upstream provenance when adopting source.
- Prefer native elements and platform behavior when they satisfy the requirement, including when the shadcn source reached for a primitive to get behavior the platform already supplies.
- Replace shadcn token names with Spartant semantic tokens. Remove unused dependencies, and add none without issue-level justification.
- Do not expose shadcn, Radix, Base UI, or any primitive API through Spartant public props unless explicitly approved.
- Keep `cn` and the approved variant strategy unless a decision issue changes them.
- Keep public APIs small, typed, composable, and predictable.
- Support refs and `className` where appropriate.
- Prefer composition over large configuration objects.
- Document controlled and uncontrolled behavior when both are supported.
- Preserve accessible names, roles, state, keyboard behavior, focus behavior, and announcements.
- Use semantic tokens for every product-facing visual state.
- Cover applicable states including default, hover, focus visible, active, disabled, loading, selected, invalid, read only, empty, long content, light theme, and dark theme.
- Keep component source, package exports, Storybook stories, Fumadocs pages, tests, and changelog entries synchronized.
- Record a motion purpose or explicit no-motion rationale for every component.
- For interactive components, define pointer, touch, keyboard, rapid-repeat, interruption, and reduced-motion behavior before implementation.
- Consume shared motion tokens. Do not invent per-component duration or easing values without a documented exception.
- Pointer and touch press feedback may animate. Keyboard activation must remain immediate and must not wait for spatial motion.
- Gate hover motion behind `@media (hover: hover) and (pointer: fine)`.
- Keep focus movement, announcements, validation, and state changes independent of animation completion.

For complex interactive components, document before implementation:

- Semantic and native-element strategy
- Accessible-name source
- Keyboard interaction model
- Focus entry, movement, trapping, and restoration
- Dismissal behavior
- Screen-reader announcements
- Error and description association
- Pointer and touch behavior
- Reduced-motion behavior

## Storybook requirements

Storybook is part of the component implementation, not optional follow-up work.

Every released component or component family must include:

- A clear default story
- Stories for every public variant and size
- Applicable edge and interaction states
- Light and dark theme coverage
- Long-content and constrained-layout examples when relevant
- A realistic composition example
- Controls limited to supported public props
- Interaction tests for meaningful behavior
- Automated accessibility checks
- Normal-motion and reduced-motion coverage when the component is interactive
- Pointer or touch and keyboard paths for motion-sensitive behavior
- Rapid-repeat or interruption coverage when an interaction can be retriggered

Do not use Fumadocs as a replacement for exhaustive state stories.

## Fumadocs requirements

Fumadocs explains how and why to use the system. Component pages should include:

1. Purpose and when to use
2. When not to use
3. Import and minimal example
4. Anatomy
5. Public API
6. Variants and sizes
7. Required states
8. Accessibility and keyboard behavior
9. Theme and token dependencies
10. Composition examples
11. Testing guidance
12. Known limitations
13. Changelog or migration links

Keep `llms.txt` and other machine-readable entry points synchronized with published documentation.

If asked to create `design.html`, create a browser-viewable design guideline page with real color swatches, typography specimens, spacing, radii, shadows, and component samples. It is not a website mockup. Do not replace it with `design.md`.

## Verification

Run the exact checks named in the Linear issue. Use repository scripts once they exist. Do not invent a command or claim it passed when it was not run.

Run repository scripts through pnpm. CI must install with `pnpm install --frozen-lockfile` once the lockfile exists.

Relevant work should consider:

- Formatting check
- Lint
- Type check
- Unit or behavior tests
- Storybook interaction tests
- Automated accessibility checks
- Token schema and drift validation
- Package build and export inspection
- Storybook static build
- Fumadocs production build and link checks
- Packed-package consumer smoke test

Choose checks according to the affected behavior, but explain every omitted check that would normally apply.

## Manual testing

[`MANUAL-REVIEW.md`](MANUAL-REVIEW.md) is the checklist. It separates universal
checks from component-specific ones, gives every step an expected result, says
which failures block completion, and ends with a result block to paste into the
Linear comment and the pull request. Use it rather than inventing steps.

Every completed issue must contain one of these statements:

- `Manual test required`: include environment, exact steps, expected result, actual result, and evidence.
- `Manual test not required`: include a short reason.

Manual testing is normally required for changes affecting keyboard navigation, focus, screen readers, pointer or touch behavior, theme appearance, responsive or long-content behavior, animation, reduced motion, package installation, or production deployment.

If Iroshan must perform the manual check, add `Human input required`, leave the work in `Agent Done`, and provide a concise checklist. If the agent can perform the check, record the evidence and move directly to `Done`.

## Definition of done

An issue is done only when:

- Its acceptance criteria pass.
- The implementation stays within scope.
- Relevant automated checks pass.
- Required Storybook stories and tests exist.
- Accessibility behavior is verified.
- Manual testing is complete or explicitly not required.
- Documentation and examples match the implementation.
- Package exports and generated artifacts are synchronized.
- Known limitations and follow-up work are recorded.
- No release-blocking issue remains hidden.

Passing code alone is not enough.

## Completion report

Use this structure in the final response and, when connected, the Linear completion comment:

```md
### Completed

One short outcome summary.

### Changed

- Main areas or files changed
- Public behavior or API changed
- Documentation and stories changed

### Automated verification

- Check: command or action
- Result: pass or fail
- Relevant output or artifact

### Manual verification

- Required: yes or no
- Steps performed or steps for Iroshan
- Result and evidence

### Risks and follow-ups

- Known limitations
- Deferred work
- Linked follow-up issues
```

## Stop conditions

Stop and ask for a decision when:

- A public API choice is materially ambiguous.
- A new dependency changes the architecture or consumer contract.
- Required accessibility behavior cannot be met.
- A release requires credentials or authority not already granted.
- The issue conflicts with a confirmed project decision.
- The acceptance criteria require meaningful scope expansion.
- Tests fail for reasons that cannot be resolved without changing unrelated work.

Do not hide the blocker, lower the acceptance criteria, or silently change the intended behavior.

## Writing and change hygiene

- Use clear, direct language.
- Do not use an em dash.
- Keep comments focused on why, constraints, or non-obvious behavior.
- Preserve unrelated user changes.
- Prefer small, reviewable changes tied to one Linear issue.
- Do not perform destructive Git operations unless explicitly requested.
- Never include secrets, tokens, or private credentials in code, documentation, logs, screenshots, or issue comments.
