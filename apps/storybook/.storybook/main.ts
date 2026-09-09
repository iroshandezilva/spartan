import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-themes", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    // Controls are generated from the component's own props, so a control
    // cannot exist for a prop the component does not accept.
    //
    // `react-docgen` rather than `react-docgen-typescript`: the latter reaches
    // into TypeScript compiler internals that changed in TypeScript 7 and
    // crashes on this toolchain. The AST-based reader extracts the same prop
    // names and JSDoc, and loses only some resolved type detail.
    reactDocgen: "react-docgen",
  },
  viteFinal(viteConfig) {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    return viteConfig;
  },
};

export default config;
