import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { fn } from 'storybook/test';
import { iconNode } from '../../../.storybook/icons.js';
import './define.js';
import type { IconButtonSize, IconButtonVariant } from './sp-icon-button.js';

type Args = { label: string; variant: IconButtonVariant; size: IconButtonSize; icon?: string; disabled: boolean; onClick: (event: Event) => void };

const variants: IconButtonVariant[] = ['primary', 'secondary', 'danger', 'ghost', 'dashed'];
const sizes: IconButtonSize[] = ['xs', 'sm', 'base'];
const row = 'display:flex;gap:12px;flex-wrap:wrap;align-items:center';

// Icons come from the licensed Central Icons set (round, outlined, radius 2, stroke 1.5, the Figma
// icon spec) via the Icons panel; without the package installed a plain plus stands in.

const meta: Meta<Args> = {
  title: 'Components/Icon Button',
  component: 'sp-icon-button',
  args: { label: 'Add item', variant: 'primary', size: 'base', icon: 'IconPlusSmall', disabled: false, onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: sizes },
    icon: { control: 'text', description: 'Icon name. Pick one in the Icons panel.' },
    onClick: { table: { disable: true } },
  },
  render: ({ label, variant, size, icon, disabled, onClick }) => html`
    <sp-icon-button label=${label} variant=${variant} size=${size} ?disabled=${disabled} @click=${onClick}>${iconNode(icon)}</sp-icon-button>
  `,
  parameters: {
    design: { type: 'figma', url: 'https://www.figma.com/design/PhcMPmdpkpgxH3N83SvpBY/Spartan-DS?node-id=326-63' },
    iconPicker: { targets: [{ arg: 'icon', label: 'Icon' }] },
    docs: {
      description: {
        component:
          'Square icon-only button built from the Spartan DS Icon Button set ([Figma](https://www.figma.com/design/PhcMPmdpkpgxH3N83SvpBY/Spartan-DS?node-id=326-63)). Sizes: `xs` is Extra small (24 px), `sm` Small (32 px), `base` Base (40 px) in Relaxed density. `label` is required. Figma has no hover, pressed, focus, or disabled variants for this set, so those states reuse the Button rules. Track work on the [Icon Button task in Notion](https://app.notion.com/p/3f4556177d6b8150b68dd79c96ccf871).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {};

export const Variants: Story = {
  render: ({ size }) => html`<div style=${row}>${variants.map(v => html`<sp-icon-button label=${v} variant=${v} size=${size}>${iconNode('IconPlusSmall')}</sp-icon-button>`)}</div>`,
};

export const Sizes: Story = {
  render: ({ variant }) => html`<div style=${row}>${sizes.map(s => html`<sp-icon-button label=${'Add ' + s} variant=${variant} size=${s}>${iconNode('IconPlusSmall')}</sp-icon-button>`)}</div>`,
};

export const Disabled: Story = {
  render: ({ size }) => html`<div style=${row}>${variants.map(v => html`<sp-icon-button label=${v} variant=${v} size=${size} disabled>${iconNode('IconPlusSmall')}</sp-icon-button>`)}</div>`,
};

// A nested density attribute re-resolves the Compact heights (base 32, small 28, extra small 24).
export const Density: Story = {
  render: ({ variant }) => html`
    <div style="display:grid;gap:24px">
      ${['Relaxed', 'Compact'].map(
        mode => html`
          <div data-sp-mode-density=${mode} style=${row}>
            <span style="width:72px">${mode}</span>
            ${sizes.map(s => html`<sp-icon-button label=${'Add ' + s} variant=${variant} size=${s}>${iconNode('IconPlusSmall')}</sp-icon-button>`)}
          </div>
        `,
      )}
    </div>
  `,
};
