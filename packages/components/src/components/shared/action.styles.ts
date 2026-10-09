import { css } from 'lit';

// Color, state, and shadow rules shared by sp-button and sp-icon-button.
// Every value is a generated --sp-* variable; each mapping follows the Spartan DS
// Button and Icon Button master sets (variable bindings read from Figma).
export const actionStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  button {
    --_fill: var(--sp-color-primary-default);
    --_fill-hover: var(--sp-color-primary-hover);
    --_fill-active: var(--sp-color-primary-active);
    --_color: var(--sp-color-primary-foreground);
    --_border: transparent;
    --_shadow: 0 1px 3px var(--sp-color-shadow-control-ambient), 0 0 2px var(--sp-color-shadow-control-edge);

    position: relative;
    box-sizing: border-box;
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    margin: 0;
    border: var(--sp-border-width-default) solid var(--_border);
    border-radius: var(--sp-radius-control);
    background: var(--_fill);
    box-shadow: var(--_shadow);
    color: var(--_color);
    font-family: var(--sp-font-family-body), system-ui, sans-serif;
    font-weight: var(--sp-font-weight-emphasis);
    white-space: nowrap;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  :host([variant='secondary']) button {
    --_fill: var(--sp-color-secondary-default);
    --_fill-hover: var(--sp-color-secondary-hover);
    --_fill-active: var(--sp-color-secondary-active);
    --_color: var(--sp-color-secondary-foreground);
  }

  :host([variant='danger']) button {
    --_fill: var(--sp-color-danger-default);
    --_fill-hover: var(--sp-color-danger-hover);
    --_fill-active: var(--sp-color-danger-active);
    --_color: var(--sp-color-danger-foreground);
    --_shadow: none;
  }

  :host([variant='warning']) button {
    --_fill: var(--sp-color-warning-default);
    --_fill-hover: var(--sp-color-warning-hover);
    --_fill-active: var(--sp-color-warning-active);
    --_color: var(--sp-color-warning-foreground);
    --_shadow: none;
  }

  :host([variant='danger-subtle']) button {
    --_fill: var(--sp-color-danger-subtle-default);
    --_fill-hover: var(--sp-color-danger-subtle-hover);
    --_fill-active: var(--sp-color-danger-subtle-active);
    --_color: var(--sp-color-danger-text);
    --_shadow: none;
  }

  :host([variant='ghost']) button {
    --_fill: transparent;
    --_fill-hover: var(--sp-color-secondary-hover);
    --_fill-active: var(--sp-color-secondary-active);
    --_color: var(--sp-color-foreground-default);
    --_shadow: none;
  }

  :host([variant='dashed']) button {
    --_fill: var(--sp-color-dashed-default);
    --_fill-hover: var(--sp-color-dashed-hover);
    --_fill-active: var(--sp-color-dashed-active);
    --_color: var(--sp-color-secondary-foreground);
    --_border: var(--sp-color-dashed-border);
    --_shadow: none;
  }

  :host([variant='dashed']) button {
    border-style: dashed;
  }

  @media (hover: hover) {
    button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--_fill-hover);
    }
  }

  button:active:not(:disabled):not([aria-busy='true']) {
    background: var(--_fill-active);
  }

  /* Figma draws the ring 4px outside the edge with a 2px stroke inside its frame. */
  button:focus-visible {
    outline: 2px solid var(--sp-color-focus-ring-default);
    outline-offset: 2px;
  }

  /* Variant rules set the same custom properties with higher specificity, so the
     disabled rule repeats the variant selector to win over every variant. */
  button:disabled,
  :host([variant]) button:disabled {
    --_fill: var(--sp-color-surface-disabled);
    --_color: var(--sp-color-foreground-disabled);
    --_shadow: none;
    background: var(--_fill);
    cursor: not-allowed;
  }

  :host([variant='ghost']) button:disabled {
    --_fill: transparent;
  }

  ::slotted(svg),
  ::slotted(img) {
    display: block;
    width: 100%;
    height: 100%;
  }
`;
