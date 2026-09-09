/**
 * Public entry point for the Spartant design system.
 *
 * Every public export is re-exported here. Consumers import from the package
 * name only, never from a deep path inside dist.
 *
 * Styles are a separate entry point, imported once by the consumer:
 *
 *   import "@iroshandezilva/spartant/styles.css";
 */

/** The name this package is published under on the npm registry. */
export const packageName = "@iroshandezilva/spartant" as const;

/** Type-level form of the package name, proving types reach the .d.ts output. */
export type PackageName = typeof packageName;

export type { BadgeProps, BadgeVariant } from "./components/badge/Badge.js";
export { Badge } from "./components/badge/Badge.js";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./components/button/Button.js";
export { Button } from "./components/button/Button.js";
export type {
  CardActionsProps,
  CardContentProps,
  CardDescriptionProps,
  CardHeaderProps,
  CardProps,
  CardTitleLevel,
  CardTitleProps,
  CardVariant,
} from "./components/card/Card.js";
export {
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/card/Card.js";
export type {
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogProps,
  DialogTitleProps,
  DialogTriggerProps,
} from "./components/dialog/Dialog.js";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./components/dialog/Dialog.js";
export type { FieldMessageTone, FieldProps } from "./components/field/Field.js";
export { Field } from "./components/field/Field.js";
export type { FieldMessageProps } from "./components/field/FieldMessage.js";
export { FieldMessage } from "./components/field/FieldMessage.js";
export type { InputProps } from "./components/field/Input.js";
export { Input } from "./components/field/Input.js";
export type { LabelProps } from "./components/field/Label.js";
export { Label } from "./components/field/Label.js";
export type { TextareaProps } from "./components/field/Textarea.js";
export { Textarea } from "./components/field/Textarea.js";
export type {
  PopoverCloseProps,
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverProps,
  PopoverTitleProps,
  PopoverTriggerProps,
} from "./components/popover/Popover.js";
export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "./components/popover/Popover.js";
export type { SelectProps } from "./components/select/Select.js";
export { Select } from "./components/select/Select.js";
export type { CheckboxProps } from "./components/selection/Checkbox.js";
export { Checkbox } from "./components/selection/Checkbox.js";
export type { RadioGroupProps, RadioProps } from "./components/selection/RadioGroup.js";
export { Radio, RadioGroup } from "./components/selection/RadioGroup.js";
export type { SwitchProps } from "./components/selection/Switch.js";
export { Switch } from "./components/selection/Switch.js";
export type { SeparatorProps } from "./components/separator/Separator.js";
export { Separator } from "./components/separator/Separator.js";
export type {
  TabProps,
  TabsActivation,
  TabsListProps,
  TabsOrientation,
  TabsPanelProps,
  TabsProps,
} from "./components/tabs/Tabs.js";
export { Tab, Tabs, TabsList, TabsPanel } from "./components/tabs/Tabs.js";
export type {
  TooltipContentProps,
  TooltipProps,
  TooltipTriggerProps,
} from "./components/tooltip/Tooltip.js";
export { Tooltip, TooltipContent, TooltipTrigger } from "./components/tooltip/Tooltip.js";
export { cn } from "./lib/cn.js";
export type { ThemeContextValue, ThemeProviderProps } from "./theme/ThemeProvider.js";
export { ThemeProvider, useTheme } from "./theme/ThemeProvider.js";
export {
  applyTheme,
  getSystemTheme,
  type ResolvedTheme,
  readAppliedTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  type ThemePreference,
  themeScript,
} from "./theme/theme.js";

/**
 * Generated token surface. Produced from the token sources by
 * `pnpm tokens:build`, so it can never disagree with the stylesheet.
 */
export {
  type SemanticTokenPath,
  type SemanticTokenVariable,
  type SpringName,
  type SpringToken,
  semanticTokens,
  springs,
  tokenVar,
} from "./tokens/generated/tokens.js";
