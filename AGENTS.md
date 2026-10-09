# Project instructions

This repository contains a standalone Lit design system experiment at the repository root. Do not restore the deleted React workspace. Track the Lit work in the Spartant Linear project using the `Lit experiment` label and `[Lit]` issue prefix so it stays distinct from the older React work.

## Source of truth

- Project documentation: [Lit project home](https://linear.app/wearehaux/document/lit-project-home-5730425b4e0d).
- Work tracking: [Spartant Design System in Linear](https://linear.app/wearehaux/project/spartant-design-system-b4328c010ac8/overview). Use Linear to read and update the `Lit experiment` issues. The previous Notion hub is migration history.
- Agent-facing guides: [Figma component guideline](https://linear.app/wearehaux/document/lit-figma-component-guideline-a6670f4b71f3) and [agent workflow](https://linear.app/wearehaux/document/lit-agent-workflow-3b7ab59c7144). Their `.doc/` files remain local entry points.
- Keep one issue per component. Update its `Dev: ...` and `Figma: ...` labels separately and mirror them in the issue description. A component is Done only when both tracks are Done. Track documentation, plugin, research, and infrastructure as separate issues.

## Components

- In Figma, inspect the existing component and variables first. Reuse library components and token bindings. Preserve instance links, properties, slots, and relevant variants. Create only the component work requested. Follow [the Figma guide](.doc/figma.md).
- In code, build reusable Lit Web Components with TypeScript. Use Lit `static styles` for component CSS and consume generated `--sp-*` tokens. Keep Storybook as the interactive playground. Verify behavior, keyboard access, and applicable states before marking Development Done.
- Code-owned tokens feed CSS and the custom Figma plugin. Preview imports, preserve variable IDs and aliases, and verify changes in a disposable Figma file before applying them to the library. Follow [the experiment guide](.doc/experiment.md).

## Detailed guidance

Use the relevant installed skill when a task needs more detail: `figma:figma-use` for Figma editing, `design:design-system` for system audits or documentation, and `better-accessibility` for component behavior. Adapt framework-specific examples to Lit. The linked project guides contain the local conventions.

Do not use em dashes. If asked for `design.html`, make a browser-viewable design guideline with real swatches and component samples, not a Markdown file or website mockup.
