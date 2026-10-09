import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { HUES } from '../../theme.js';
import { SEMANTIC_MODES, type SemanticMode, type SectionId } from './color-model.js';
import './color-palette.js';

type Args = { primary: (typeof HUES)[number]; semanticColor: SemanticMode };

const meta: Meta<Args> = {
  title: 'Foundations/Colors',
  args: { primary: 'Blue', semanticColor: 'Light' },
  argTypes: {
    primary: { name: 'Primary mode', control: 'inline-radio', options: [...HUES], description: 'The 02 Primary collection mode. Changes the primary brand palette and every role that aliases it.' },
    semanticColor: { name: 'Semantic Color mode', control: 'select', options: [...SEMANTIC_MODES], description: 'The 03 Semantic Color collection mode: Light, Dark, Light High Contrast, or Dark High Contrast.' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every COLOR variable in the generated production token source (`tokens/source.json`), grouped as primitive scales, primary brand palettes, semantic roles, component colors, and style colors. Names, CSS variable names, and alias relationships come from the token source; the value on each swatch is read from the live `--sp-*` CSS variable for the selected modes, so nothing here duplicates a color. The two controls set the modes for the swatches on this page; the Style mode follows the Style toolbar item. Tracked in HAUX-97.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Args>;

const palette = (sections: SectionId[], { primary, semanticColor }: Args, extra: { pairings?: boolean; heading?: boolean } = {}) =>
  html`<sb-color-palette .primary=${primary} .semanticColor=${semanticColor} .sections=${sections} .pairings=${extra.pairings ?? false} .heading=${extra.heading ?? true}></sb-color-palette>`;

export const All: Story = {
  render: args => palette(['primitives', 'primary', 'semantic', 'component', 'style'], args, { pairings: true }),
};

export const Primitives: Story = { render: args => palette(['primitives'], args) };
export const PrimaryPalettes: Story = { name: 'Primary palettes', render: args => palette(['primary'], args) };
export const SemanticRoles: Story = { name: 'Semantic roles', render: args => palette(['semantic'], args) };
export const ComponentAndStyle: Story = { name: 'Component and style colors', render: args => palette(['component', 'style'], args) };
export const Pairings: Story = { name: 'Foreground and surface pairings', render: args => palette([], args, { pairings: true }) };

/** The same pairings in all four Semantic Color modes at once, for checking that labels stay readable. */
export const PairingsInEveryMode: Story = {
  name: 'Pairings in every mode',
  render: ({ primary }) =>
    html`${SEMANTIC_MODES.map(m => html`<sb-color-palette .primary=${primary} .semanticColor=${m} .sections=${[]} .pairings=${true} .heading=${true}></sb-color-palette>`)}`,
};
