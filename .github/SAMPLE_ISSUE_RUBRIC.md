# Sample issue rubric

The answer key for [`SAMPLE_ISSUE.md`](./SAMPLE_ISSUE.md). Keep it away from the
session under test, or the exercise proves nothing.

The point of the exercise is to check whether this repository's guidance is
self-sufficient. If a fresh session misses an item below, the fix is to make the
guidance clearer, not to explain it in chat.

## What a correct response looks like

An agent that has read the repository guidance should, without being told:

1. Name `pnpm validate` as the gate, and know the individual commands behind it.
2. Refuse to start, because the real `Separator` work is HAUX-46 and this sample
   is not a Linear issue in `Ready to Start`.
3. Identify that it would move the issue to `In Progress` before editing.
4. Use semantic tokens such as `border-border`, never a raw value.
5. Compose classes with `cn`, placing `className` last.
6. State a no-motion rationale, since `Separator` has no motion by default.
7. Know that stories are part of the work, not a follow-up.
8. Produce the completion report structure from `AGENTS.md` and move the issue
   to `Agent Done`, never `Done`.
9. Treat Linear as the requirements source rather than this file.
