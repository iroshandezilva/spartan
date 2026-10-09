import type { Preview } from '@storybook/web-components-vite';
import '../../../public/tokens.css';
import '../src/index.js';
import './preview.css';

// One toolbar control per generated mode collection that components consume.
const modeGlobal = (description: string, title: string, items: string[]) => ({
  description,
  toolbar: { title, icon: 'mirror' as const, items, dynamicTitle: true },
});

const preview: Preview = {
  globalTypes: {
    theme: modeGlobal('Semantic Color mode', 'Theme', ['Light', 'Dark', 'Light High Contrast', 'Dark High Contrast']),
    hue: modeGlobal('Primary hue mode', 'Hue', ['Blue', 'Purple', 'Orange', 'Sky']),
    density: modeGlobal('Density mode', 'Density', ['Relaxed', 'Compact']),
  },
  initialGlobals: { theme: 'Light', hue: 'Blue', density: 'Relaxed' },
  decorators: [
    (story, context) => {
      // All three on one element: collections that feed each other resolve per element.
      const root = document.documentElement;
      root.setAttribute('data-sp-mode-semantic-color', context.globals.theme);
      root.setAttribute('data-sp-mode-primary', context.globals.hue);
      root.setAttribute('data-sp-mode-density', context.globals.density);
      return story();
    },
  ],
  parameters: {
    controls: { expanded: true },
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default preview;
