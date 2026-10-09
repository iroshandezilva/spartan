# Spartant project workflow

Collaborative copy: [Agent workflow in Linear](https://linear.app/wearehaux/document/agent-workflow-3b7ab59c7144).

The user selected Lit, Storybook as the component playground, and a custom code-to-Figma token plugin without MCP. Project documentation and task tracking belong in Linear. These choices apply to the code at the repository root. Preserve the previous React implementation's pending deletions.

## Canonical Linear records

Track current work in the Spartant Design System Linear project. The older React issues remain historical.

- [Documentation home](https://linear.app/wearehaux/document/spartant-design-system-project-home-5730425b4e0d)
- [Project issues](https://linear.app/wearehaux/project/spartant-design-system-b4328c010ac8/overview)

Use Linear to fetch, update, and verify project documentation and issues. Do not maintain a parallel local tracker. Local MDX and `data/tasks.json` are preserved migration snapshots. Local documentation routes redirect to Linear documents; the local task API returns 410 with the Linear project URL. The previous Notion pages remain historical references.

## Task contract

- Reuse one canonical Linear issue per component. Search the project issues and source ID before creating a record.
- Update Development and Figma independently through the `Development track` and `Figma track` label groups. Keep one label from each group and mirror both values in the issue description. Both must be Done for overall completion; reopening either track reopens the issue.
- When an agent finishes work on an issue, set the issue status to **Agent Done** and record the evidence in the issue: what changed, the verification run, and the remaining gaps. Do this for every issue type, and also when only part of the issue is complete.
- Agent Done is not Done. Move a component issue to Done only when its Development and Figma tracks are both Done.
- Documentation, Plugin, Infrastructure, and Research work uses normal Linear issue status.
- Preserve unverified work as Needs verification, with evidence and remaining acceptance gates in the task body.
- Do not infer current completion from old screenshots or the historical Notion state.

## Documentation

Maintain the Linear project documents for setup, architecture, variables, plugin workflow, component development, Storybook, validation, decisions, and changelog. Distinguish implemented behavior from planned capabilities. Fumadocs may serve published component references later, but it is not the project documentation source.

## Token sync

Git-owned token data feeds generated CSS and the custom Figma plugin. Preserve variable identities, aliases, and mode values. Preview before applying. Do not delete variables merely because they are absent from an input file. Test in a disposable Figma file first. A passing build or mocked Plugin API test is not proof of real Figma runtime behavior.

## Validation

From the repository root, run `pnpm test`, `pnpm build`, and `pnpm typecheck` as relevant. Keep evidence in the corresponding Linear issue after validation. Linear issue state is not synchronized back to Git.
