import { THEME_ATTRIBUTE } from "@iroshandezilva/spartant";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview, ReactRenderer } from "@storybook/react-vite";
import { AXE_CONFIG, AXE_SPEC } from "../src/lib/a11y.js";
import "./preview.css";

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    // The canvas paints the page background, so a story is judged against the
    // same surface it will sit on rather than Storybook's default white.
    backgrounds: { disable: true },
    /*
     * The accessibility panel and the test suite share one configuration.
     *
     * Two would drift, and the drift would be silent in the worst direction:
     * a rule switched off here while a reviewer reads a clean panel and
     * concludes the component is fine. `src/lib/a11y.ts` is the single source,
     * and `src/stories/stories.test.tsx` reads the same object.
     *
     * The panel has a real layout engine, so it evaluates colour contrast that
     * the suite can only report as incomplete. Both are worth having.
     */
    a11y: { config: AXE_SPEC, options: AXE_CONFIG },
  },
  decorators: [
    /**
     * Switches the theme the way Spartant actually does it: `data-theme` on the
     * root element. Storybook's own theme switcher therefore exercises the real
     * mechanism, not a Storybook-only approximation.
     */
    withThemeByDataAttribute<ReactRenderer>({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
      attributeName: THEME_ATTRIBUTE,
    }),
  ],
};

export default preview;
