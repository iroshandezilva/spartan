import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect, fn, userEvent } from 'storybook/test';
import { iconNode } from '../../../.storybook/icons.js';
import './define.js';
import type { ButtonShape, ButtonSize, ButtonType, ButtonVariant } from './sp-button.js';

type Args = {
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  shape: ButtonShape;
  type: ButtonType;
  startIcon?: string;
  endIcon?: string;
  disabled: boolean;
  loading: boolean;
  onClick: (event: Event) => void;
};

const variants: ButtonVariant[] = ['primary', 'secondary', 'danger', 'ghost', 'dashed', 'danger-subtle', 'warning'];
const row = 'display:flex;gap:12px;flex-wrap:wrap;align-items:center';

// Icons come from the licensed Central Icons set (round, outlined, radius 2, stroke 1.5, the Figma
// icon spec) via the Icons panel; without the package installed a plain plus stands in.
const ADD = 'IconPlusSmall';
const NEXT = 'IconArrowRight';

const meta: Meta<Args> = {
  title: 'Components/Button',
  component: 'sp-button',
  args: { label: 'Button', variant: 'primary', size: 'base', shape: 'rounded', type: 'button', startIcon: undefined, endIcon: undefined, disabled: false, loading: false, onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: ['sm', 'base'] },
    shape: { control: 'inline-radio', options: ['rounded', 'pill'] },
    type: { control: 'inline-radio', options: ['button', 'submit', 'reset'] },
    startIcon: { name: 'Left icon', control: 'text', description: 'Icon in the `start` slot. Pick one in the Icons panel, or type a name such as IconPlusSmall.' },
    endIcon: { name: 'Right icon', control: 'text', description: 'Icon in the `end` slot. Pick one in the Icons panel.' },
    onClick: { table: { disable: true } },
  },
  render: ({ label, variant, size, shape, type, startIcon, endIcon, disabled, loading, onClick }) => html`
    <sp-button variant=${variant} size=${size} shape=${shape} type=${type} ?disabled=${disabled} ?loading=${loading} @click=${onClick}>
      ${iconNode(startIcon, 'start')}${label}${iconNode(endIcon, 'end')}
    </sp-button>
  `,
  parameters: {
    design: { type: 'figma', url: 'https://www.figma.com/design/PhcMPmdpkpgxH3N83SvpBY/Spartan-DS?node-id=21-27' },
    iconPicker: { targets: [{ arg: 'startIcon', label: 'Left icon' }, { arg: 'endIcon', label: 'Right icon' }] },
    docs: {
      description: {
        component:
          'Action button built from the Spartan DS Button set ([Figma](https://www.figma.com/design/PhcMPmdpkpgxH3N83SvpBY/Spartan-DS?node-id=21-27)). Sizes: `sm` is Small, `base` is Base. Heights, padding, type, and icons come from the generated Component and Density variables, so the Density toolbar changes them. Track work on the [Button task in Notion](https://app.notion.com/p/3f4556177d6b8145a1b9f3cefb5a072c).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {
  // Interaction test: a real click reaches the onClick arg, then focusing the host (delegatesFocus) and pressing Enter activates it.
  play: async ({ canvasElement, args }) => {
    const host = canvasElement.querySelector('sp-button')!;
    await userEvent.click(host);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    host.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const Variants: Story = {
  render: ({ size, shape }) => html`<div style=${row}>${variants.map(v => html`<sp-button variant=${v} size=${size} shape=${shape}>${v}</sp-button>`)}</div>`,
};

export const Sizes: Story = {
  render: ({ variant }) => html`
    <div style=${row}>
      <sp-button variant=${variant} size="sm">Small</sp-button>
      <sp-button variant=${variant} size="base">Base</sp-button>
    </div>
  `,
};

export const Shapes: Story = {
  render: ({ variant }) => html`
    <div style=${row}>
      <sp-button variant=${variant} shape="rounded">Rounded</sp-button>
      <sp-button variant=${variant} shape="pill">Pill</sp-button>
    </div>
  `,
};

// Pick the icons in the Icons panel. Left and right icons are independent slots.
export const WithIcons: Story = {
  args: { label: 'Add', startIcon: ADD, endIcon: NEXT },
};

export const Disabled: Story = {
  play: async ({ canvasElement, args }) => {
    const host = canvasElement.querySelector('sp-button')!;
    await userEvent.click(host);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
  render: ({ size }) => html`<div style=${row}>${variants.map(v => html`<sp-button variant=${v} size=${size} disabled>${v}</sp-button>`)}</div>`,
};

export const Loading: Story = {
  render: ({ size }) => html`<div style=${row}>${variants.map(v => html`<sp-button variant=${v} size=${size} loading>${v}</sp-button>`)}</div>`,
};

// Density is a separate token collection: a nested attribute re-resolves every
// density-bound value (height, padding, type, icon size) inside its subtree.
export const Density: Story = {
  render: ({ variant }) => html`
    <div style="display:grid;gap:24px">
      ${['Relaxed', 'Compact'].map(
        mode => html`
          <div data-sp-mode-density=${mode} style=${row}>
            <span style="width:72px">${mode}</span>
            <sp-button variant=${variant} size="sm">${iconNode(ADD, 'start')}Small</sp-button>
            <sp-button variant=${variant} size="base">${iconNode(ADD, 'start')}Base</sp-button>
          </div>
        `,
      )}
    </div>
  `,
};

export const LongLabel: Story = {
  args: { label: 'Export every selected record to a spreadsheet' },
  render: ({ label, variant }) => html`<div style="max-width:220px"><sp-button variant=${variant}>${label}</sp-button></div>`,
};

export const InForm: Story = {
  render: () => html`
    <form
      style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        const out = (e.target as HTMLFormElement).querySelector('output')!;
        const data = new FormData(e.target as HTMLFormElement, e.submitter);
        out.value = `Submitted: ${[...data].map(([k, v]) => `${k}=${v}`).join(', ')}`;
      }}
    >
      <input name="email" value="hi@example.com" aria-label="Email" />
      <sp-button type="submit" name="intent" value="save">Submit</sp-button>
      <sp-button type="reset" variant="secondary">Reset</sp-button>
      <output></output>
    </form>
  `,
};
