import { SpIconButton } from './sp-icon-button.js';

if (!customElements.get('sp-icon-button')) customElements.define('sp-icon-button', SpIconButton);

export { SpIconButton };
export type { IconButtonSize, IconButtonVariant } from './sp-icon-button.js';
