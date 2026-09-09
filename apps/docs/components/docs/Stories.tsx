import type { ReactNode } from "react";

interface Story {
  /** The exported story name, as it appears in Storybook's sidebar. */
  name: string;
  /** What the story, its play function, or its audit proves. */
  proves: ReactNode;
}

interface StoriesProps {
  /** File name under `apps/storybook/src/stories/`. */
  file: string;
  stories: readonly Story[];
}

const STORIES_DIR = "apps/storybook/src/stories";

/**
 * Storybook coverage for one component, linked by file path and story name.
 *
 * There is no hosted Storybook. The static build is the CI artifact named
 * `storybook-static-<sha>` on every run of the validate workflow, and the
 * repository's `pnpm review:storybook` serves it locally. Naming the file and
 * the story is what lets a reader find the same story in either place.
 */
export function Stories({ file, stories }: StoriesProps) {
  return (
    <div className="not-prose grid gap-3">
      <p className="text-body-small text-foreground-muted">
        Story file: <code className="text-foreground">{`${STORIES_DIR}/${file}`}</code>. Open it
        with <code className="text-foreground">pnpm dev:storybook</code> from the repository, or
        serve the <code className="text-foreground">storybook-static-&lt;sha&gt;</code> artifact
        that every CI run retains with{" "}
        <code className="text-foreground">pnpm review:storybook &lt;path&gt;</code>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-body-small">
          <thead>
            <tr className="border-border border-b text-left text-foreground-muted">
              <th className="py-2 pr-4 font-medium">Story</th>
              <th className="py-2 font-medium">Proves</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story) => (
              <tr key={story.name} className="border-border border-b align-top">
                <td className="py-2 pr-4">
                  <code className="text-foreground">{story.name}</code>
                </td>
                <td className="py-2 text-foreground">{story.proves}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
