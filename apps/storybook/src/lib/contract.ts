/**
 * The contract every Spartant component story file declares.
 *
 * This is the machine-readable half of the story standard. The prose half is
 * `../../STORY-TEMPLATE.md`, and the two are kept honest by
 * `../stories/story-contract.test.ts`, which reads this contract out of each
 * story file and asserts the stories it implies actually exist.
 *
 * The point of putting it in the type system rather than a checklist: a
 * component author cannot forget to decide whether the component moves, what
 * its accessible name is, or how it behaves under reduced motion, because the
 * file does not compile until they have written it down. A checklist is
 * something you can skip. A required field is not.
 *
 * Nothing here is Storybook-specific. It is the component standard
 * (`MVP Components and Component Standard`) and the motion standard
 * (`Motion and Micro-interaction Standard`) expressed as types.
 */

/**
 * The states the component standard asks every component to cover, minus the
 * ones handled elsewhere: `default` is always the `Default` story, and light
 * and dark are the theme stories rather than entries in the matrix.
 *
 * A component declares the subset that applies to it. Declaring a state means
 * it appears in the `States` story; omitting one is a claim that the state
 * cannot occur for this component.
 */
export type ComponentState =
  | "hover"
  | "focus-visible"
  | "active"
  | "disabled"
  | "loading"
  | "selected"
  | "invalid"
  | "read-only"
  | "empty"
  | "long-content";

/**
 * States that only exist while the user is doing something.
 *
 * They cannot be rendered into a static matrix without restating the very
 * styles under test, so they are proved by the input-path stories, which
 * produce them for real. Everything else belongs in the `States` matrix.
 */
export const TRANSIENT_STATES = ["hover", "focus-visible", "active"] as const;

export type TransientState = (typeof TRANSIENT_STATES)[number];

/** A state the `States` story is expected to render. */
export type StaticState = Exclude<ComponentState, TransientState>;

/**
 * A component that moves.
 *
 * Every field is required because every one of them is a question the motion
 * standard asks before implementation, and an unanswered question is how a
 * component ends up animating on the keyboard path or ignoring reduced motion.
 */
export interface MotionContract {
  kind: "motion";
  /** What the motion explains: location, continuity, state, or feedback. */
  purpose: string;
  /**
   * Semantic motion roles consumed, as token paths such as
   * `duration.press-feedback`. Primitive steps are not allowed here: a
   * component that names a primitive has reached past the semantic layer.
   */
  tokens: readonly string[];
  /** Behaviour on pointer and touch. */
  pointer: string;
  /** Behaviour on the keyboard path, which must not wait for animation. */
  keyboard: string;
  /** Behaviour under `prefers-reduced-motion: reduce`. */
  reduced: string;
  /**
   * What happens when the interaction is retriggered or reversed mid-flight,
   * or why that cannot happen for this component.
   */
  interruption: string;
  /** Transform origin and paired timing. Overlays only. */
  origin?: string;
}

/**
 * A component that deliberately does not move.
 *
 * This is a first-class outcome rather than an absence. The standard requires
 * an explicit decision, so "no motion" has to be argued in the same place a
 * motion contract would be.
 */
export interface NoMotionContract {
  kind: "none";
  /** Why stillness is correct here. */
  rationale: string;
}

/** The accessibility contract the component standard asks each issue to state. */
export interface AccessibilityContract {
  /** Semantic role, and the native element it comes from where there is one. */
  role: string;
  /** How the accessible name is produced. */
  name: string;
  /** Keyboard behaviour, one entry per key or gesture. */
  keyboard: readonly string[];
  /** Focus movement, trapping, and restoration. */
  focus: string;
  /** What assistive technology is told when state changes, when anything is. */
  announcements?: string;
}

/** One manual check: what a reviewer does, and what they should see. */
export interface ManualCheck {
  step: string;
  expect: string;
}

/**
 * Manual testing is not required for this component.
 *
 * The quality strategy allows this, but only with a reason recorded in the
 * same place the steps would have gone.
 */
export interface ManualNotRequired {
  notRequired: string;
}

/** The complete declaration a component story file makes about itself. */
export interface StoryContract {
  /** Public variant names, or `[]` when the component has no variants. */
  variants: readonly string[];
  /** Public size names, or `[]` when the component has no sizes. */
  sizes: readonly string[];
  /** States from the standard that apply. Drives the `States` story. */
  states: readonly ComponentState[];
  /** Whether a user can act on it. Drives the input-path stories. */
  interactive: boolean;
  /** Whether the interaction can be retriggered before it settles. */
  retriggerable: boolean;
  /** Whether it is a positioned overlay with an entry origin. */
  overlay: boolean;
  /** The motion decision. One or the other; never neither. */
  motion: MotionContract | NoMotionContract;
  accessibility: AccessibilityContract;
  /** Manual review steps, or the reason none are needed. */
  manual: readonly ManualCheck[] | ManualNotRequired;
}

/**
 * Shape a component story's `meta` must satisfy, alongside Storybook's own
 * `Meta<typeof Component>`:
 *
 *     } satisfies Meta<typeof Thing> & WithStoryContract;
 *
 * `Meta<typeof Thing>` already restricts `args` and `argTypes` to the
 * component's real props, so the controls policy needs no separate check: a
 * control for something that is not a public prop is a compile error.
 */
export interface WithStoryContract {
  parameters: { spartant: StoryContract };
}

/** Stories every component story file exports, whatever the component is. */
const ALWAYS_REQUIRED = ["Default", "States", "DarkTheme", "Composition", "Contract"] as const;

/**
 * The stories this contract obliges the file to export.
 *
 * Both the template documentation and the contract test read this, so the
 * matrix is defined once. Adding a rule here adds it to every component at
 * once, and the test says exactly which files fall short.
 */
export function requiredStories(contract: StoryContract): string[] {
  const required: string[] = [...ALWAYS_REQUIRED];

  if (contract.variants.length > 0) required.push("Variants");
  if (contract.sizes.length > 0) required.push("Sizes");

  if (contract.interactive) {
    required.push("KeyboardPath", "PointerPath");
    // A reduced-motion story is only meaningful when there is motion to
    // reduce. A still component would render an identical second copy.
    if (contract.motion.kind === "motion") required.push("ReducedMotion");
  }

  if (contract.retriggerable) required.push("RapidRepeat");
  if (contract.overlay) required.push("OverlayOrigin");

  return required;
}
