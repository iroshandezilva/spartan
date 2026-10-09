import { css } from 'lit';
import { actionStyles } from '../shared/action.styles.js';

// Sizes follow the Figma Icon Button set: Base 40 px, Small 32 px, Extra small
// 24 px in Relaxed density. The control is square and uses the button height
// tokens for both axes, as the Figma set binds width and height to them.
export const iconButtonStyles = [
  actionStyles,
  css`
    button {
      --_size: var(--sp-button-height-base);
      --_icon: var(--sp-density-control-icon-size-base);

      width: var(--_size);
      height: var(--_size);
      padding: 0;
    }

    :host([size='sm']) button {
      --_size: var(--sp-button-height-sm);
      --_icon: var(--sp-density-control-icon-size-small);
    }

    :host([size='xs']) button {
      --_size: var(--sp-button-height-xs);
      --_icon: var(--sp-density-control-icon-size-small);
    }

    .icon {
      display: block;
      flex: none;
      width: var(--_icon);
      height: var(--_icon);
    }
  `,
];
