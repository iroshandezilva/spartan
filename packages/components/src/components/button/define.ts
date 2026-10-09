import { SpButton } from './sp-button.js';

if (!customElements.get('sp-button')) customElements.define('sp-button', SpButton);

export { SpButton };
export type { ButtonSize, ButtonType, ButtonVariant } from './sp-button.js';
