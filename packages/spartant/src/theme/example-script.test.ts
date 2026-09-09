// @vitest-environment node
import { describe, expect, it } from "vitest";
import { spartantThemeScript } from "../../../../examples/consumer/theme-script-plugin.js";
import { themeScript } from "./theme.js";

describe("the example's blocking script", () => {
  it("injects exactly what themeScript produces", () => {
    // Injected rather than pasted, so there is no copy to drift. This asserts
    // the plugin hands over the real thing.
    const plugin = spartantThemeScript();
    const transform = plugin.transformIndexHtml;
    const run = typeof transform === "function" ? transform : transform?.handler;
    if (!run) throw new Error("plugin has no transformIndexHtml");

    const tags = run.call(null as never, "", null as never) as Array<{
      tag: string;
      children: string;
      injectTo: string;
    }>;

    expect(tags).toHaveLength(1);
    expect(tags[0]?.tag).toBe("script");
    expect(tags[0]?.children).toBe(themeScript());
  });

  it("prepends to head, so it runs before stylesheets and before React", () => {
    const plugin = spartantThemeScript();
    const transform = plugin.transformIndexHtml;
    const run = typeof transform === "function" ? transform : transform?.handler;
    if (!run) throw new Error("plugin has no transformIndexHtml");
    const tags = run.call(null as never, "", null as never) as Array<{ injectTo: string }>;
    expect(tags[0]?.injectTo).toBe("head-prepend");
  });
});
