import type { Preview } from '@storybook/web-components-vite';
import '../../../public/tokens.css';
import '../src/index.js';
import { COLOR_SCHEMES, DENSITIES, HUES, STYLES, applyTheme, fromLegacyTheme, type ThemeConfig } from '../src/theme.js';
import './preview.css';

// Six independent globals, each one a Storybook URL parameter (for example
// ?globals=style:Helios;theme:Dark;highContrast:!true;hue:Purple;density:Compact;direction:rtl), so a
// shared link reproduces the exact combination. Style, theme, hue, density, and direction are toolbar
// dropdowns that show their current value; High contrast is an on/off toggle registered in manager.tsx.
// Direction sets the native `dir` on the document root. That is the whole direction contract:
// components use logical properties and inherit it, and a nested `dir` overrides it.
const dropdown = (label: string, description: string, values: readonly string[]) => ({
  name: label,
  description,
  toolbar: { title: label, icon: 'mirror' as const, items: values.map(value => ({ value, title: `${label}: ${value}` })), dynamicTitle: true },
});

const DIRECTIONS = ['ltr', 'rtl'] as const;
const DEFAULTS = { style: 'Atlas', theme: 'Light', highContrast: false, hue: 'Blue', density: 'Relaxed', direction: 'ltr' } as const;
const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);

const preview: Preview = {
  globalTypes: {
    style: dropdown('Style', 'Visual style', STYLES),
    theme: dropdown('Theme', 'Color scheme', COLOR_SCHEMES),
    highContrast: { name: 'High contrast', description: 'High contrast on or off, for every style and both color schemes' },
    hue: dropdown('Hue', 'Brand hue', HUES),
    density: dropdown('Density', 'Density', DENSITIES),
    direction: dropdown('Direction', 'Text direction, set as `dir` on the document root', DIRECTIONS),
  },
  initialGlobals: { ...DEFAULTS },
  decorators: [
    (story, context) => {
      const g = context.globals as Record<string, unknown>;
      let colorScheme = pick(COLOR_SCHEMES, g.theme, DEFAULTS.theme);
      let highContrast = g.highContrast === true;
      // A link from before high contrast became its own toggle may carry theme:"Dark High Contrast".
      if (typeof g.theme === 'string' && /High Contrast$/.test(g.theme)) ({ colorScheme, highContrast } = { ...fromLegacyTheme(g.theme), highContrast: true });
      const config: ThemeConfig = {
        style: pick(STYLES, g.style, DEFAULTS.style),
        colorScheme,
        highContrast,
        hue: pick(HUES, g.hue, DEFAULTS.hue),
        density: pick(DENSITIES, g.density, DEFAULTS.density),
      };
      // Every setting on one element: the document root, which the canvas and the Docs previews share.
      applyTheme(document.documentElement, config);
      document.documentElement.dir = pick(DIRECTIONS, g.direction, DEFAULTS.direction);
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
