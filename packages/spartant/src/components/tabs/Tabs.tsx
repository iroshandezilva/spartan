import type { ComponentPropsWithoutRef, KeyboardEvent, PointerEvent, Ref } from "react";
import { createContext, use, useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "../../lib/cn.js";
import { coarseHitArea } from "../selection/shared.js";

/**
 * ADAPTED FROM shadcn/ui `tabs`, new-york style.
 * Upstream snapshot and provenance: ./upstream/
 *
 * What changed, and why, in the order the adoption checklist asks:
 *
 * 1. `@radix-ui/react-tabs` was dropped and the behaviour is owned. AGENTS.md
 *    forbids a primitive library without a decision issue, and the platform
 *    supplies what tabs need: native `button` elements for focus, activation,
 *    and disabled semantics; `role="tablist"`, `role="tab"` with
 *    `aria-selected` and `aria-controls`, and `role="tabpanel"` with
 *    `aria-labelledby` for the relationships; and a roving tabindex, which is
 *    thirty lines of keydown handling rather than a dependency. Same verdict
 *    the Switch adaptation reached, for the same reason.
 * 2. The public API no longer leaks the primitive. Upstream typed every part
 *    as `ComponentPropsWithoutRef<typeof TabsPrimitive.X>`. Each part here
 *    extends the native element it renders.
 * 3. `"use client"` and `forwardRef` removed; `ref` is a prop.
 * 4. `TabsTrigger` and `TabsContent` became `Tab` and `TabsPanel`, which are
 *    the names in the inventory and the ARIA pattern.
 * 5. shadcn's `bg-muted`, `text-muted-foreground`, `ring-ring`,
 *    `ring-offset-background`, `disabled:opacity-50`, `transition-all`, and
 *    `data-[state=active]` became Spartant roles, named transition properties,
 *    and `aria-selected`, which is the state itself rather than a mirror of it.
 * 6. The selected pill was replaced by an underline indicator. Upstream marks
 *    the selected tab with `bg-background` on a `bg-muted` track and a shadow.
 *    In Spartant tokens that pill measures 1.16:1 in light and 1.15:1 in dark
 *    against its track, so it cannot carry the selected state on its own. A
 *    two-pixel `color.primary` indicator does: `primary` is a declared
 *    non-text pairing at or above 3:1 on the page background.
 * 7. Upstream's `h-9` trigger is 36px tall and its `p-1` list gives it 28px of
 *    hit area. Tabs here are `size.min-target` tall, which is the 44px floor.
 */

export type TabsOrientation = "horizontal" | "vertical";

/**
 * When a tab becomes selected.
 *
 * `automatic` selects a tab the moment it receives focus, so the arrow keys
 * both move and select. That is the WAI-ARIA default and the right choice when
 * panels are cheap to show. `manual` moves focus only; Enter or Space selects.
 * Use it when showing a panel is expensive or has side effects, so a keyboard
 * user passing through the list does not trigger every one.
 */
export type TabsActivation = "automatic" | "manual";

/** The input that produced the current selection, which decides whether it animates. */
type SelectionSource = "pointer" | "keyboard";

interface TabsContextValue {
  baseId: string;
  value: string | undefined;
  select: (value: string) => void;
  noteSource: (source: SelectionSource) => void;
  source: SelectionSource;
  orientation: TabsOrientation;
  activation: TabsActivation;
  /** Values whose panel is rendered, so a tab only claims to control a panel that exists. */
  panels: ReadonlySet<string>;
  registerPanel: (value: string) => () => void;
}

/** Not exported. A part outside its `Tabs` throws with a message naming both. */
const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(part: string): TabsContextValue {
  const context = use(TabsContext);
  if (!context) {
    throw new Error(`${part} must be rendered inside a Tabs.`);
  }
  return context;
}

/**
 * Ids are derived from the root's id and the tab's value, so a tab and its
 * panel agree on each other's id without ever meeting. That is also why `Tab`
 * and `TabsPanel` do not accept `id`: an override on one side would silently
 * break `aria-controls` or `aria-labelledby` on the other. Override the id on
 * `Tabs` instead, and both sides follow.
 *
 * Whitespace in a value becomes a hyphen, because an id cannot contain it and
 * a query for `#id with space` throws. Everything else passes through.
 */
const idSafe = (value: string) => value.replace(/\s+/g, "-");
const tabId = (baseId: string, value: string) => `${baseId}-tab-${idSafe(value)}`;
const panelId = (baseId: string, value: string) => `${baseId}-panel-${idSafe(value)}`;

export interface TabsProps extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue"> {
  /** Controlled selection: the `value` of the selected `Tab`. */
  value?: string;
  /** Uncontrolled initial selection. With neither, nothing is selected. */
  defaultValue?: string;
  /** Called with the newly selected value, from pointer and keyboard alike. */
  onValueChange?: (value: string) => void;
  /** Which way the list runs, and therefore which arrow keys move through it. Defaults to `horizontal`. */
  orientation?: TabsOrientation;
  /** Whether focusing a tab selects it. Defaults to `automatic`. */
  activation?: TabsActivation;
  /** Base for every generated id. Generated when omitted. */
  id?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Layout per orientation.
 *
 * The root lays its list and panels out so a vertical `Tabs` works without the
 * caller reinventing the flex row. `className` is merged last, so a consumer
 * who wants something else overrides it.
 */
const rootClasses: Record<TabsOrientation, string> = {
  horizontal: "flex flex-col gap-stack",
  vertical: "flex items-start gap-stack",
};

/**
 * Switching between related panels.
 *
 * Owned source on native elements, following the WAI-ARIA tabs pattern. The
 * list is one tab stop: the selected tab holds `tabindex="0"`, every other tab
 * holds `-1`, and the arrow keys move between them. Disabled tabs are skipped,
 * and the ends wrap.
 */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  activation = "automatic",
  id,
  className,
  children,
  ...props
}: TabsProps) {
  const generated = useId();
  const baseId = id ?? generated;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  /*
   * The last input seen by the list, and the one the current selection came
   * from. The ref is written by the list's pointer and key handlers before the
   * selection changes; the state is committed with the selection, so the
   * stylesheet sees both in one paint and the indicator either animates or
   * does not. The motion standard requires the keyboard path to be immediate,
   * and this is how a component knows which path it is on.
   */
  const sourceRef = useRef<SelectionSource>("pointer");
  const [source, setSource] = useState<SelectionSource>("pointer");
  /*
   * The value the current input interaction has already asked for. A pointer
   * click on a tab arrives as focus and then click, and in automatic mode both
   * would request the same selection. Uncontrolled, the second is a no-op
   * because the first already committed; controlled, a parent that declined
   * the first would be asked twice. This makes it once per interaction: the
   * list clears it on every pointerdown and keydown.
   */
  const requestedRef = useRef<string | undefined>(undefined);

  const isControlled = value !== undefined;
  const current = isControlled ? value : uncontrolled;

  const select = useCallback(
    (next: string) => {
      setSource(sourceRef.current);
      if (next === current || next === requestedRef.current) return;
      requestedRef.current = next;
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
    },
    [current, isControlled, onValueChange],
  );

  const noteSource = useCallback((next: SelectionSource) => {
    sourceRef.current = next;
    requestedRef.current = undefined;
  }, []);

  /*
   * Which panels exist. A tab points at its panel through `aria-controls`,
   * and a reference to an id that is not in the document is an invalid ARIA
   * value, which axe reports as critical. Tabs are sometimes rendered without
   * panels, as navigation or as a filter bar, so the reference is only made
   * once the panel has registered. That happens in an effect, so on a static
   * server render the attribute is absent until hydration, which is the same
   * trade the Field family makes for `aria-describedby`.
   */
  const [panels, setPanels] = useState<ReadonlySet<string>>(() => new Set());
  const registerPanel = useCallback((panel: string) => {
    setPanels((existing) => (existing.has(panel) ? existing : new Set(existing).add(panel)));
    return () => {
      setPanels((existing) => {
        if (!existing.has(panel)) return existing;
        const next = new Set(existing);
        next.delete(panel);
        return next;
      });
    };
  }, []);

  return (
    <TabsContext
      value={{
        baseId,
        value: current,
        select,
        noteSource,
        source,
        orientation,
        activation,
        panels,
        registerPanel,
      }}
    >
      <div
        id={id}
        data-orientation={orientation}
        className={cn(rootClasses[orientation], className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext>
  );
}

export interface TabsListProps extends ComponentPropsWithoutRef<"div"> {
  ref?: Ref<HTMLDivElement>;
}

/** The arrow keys that move through the list, per orientation. */
const navigationKeys: Record<TabsOrientation, { next: string; previous: string }> = {
  horizontal: { next: "ArrowRight", previous: "ArrowLeft" },
  vertical: { next: "ArrowDown", previous: "ArrowUp" },
};

/**
 * The list is the scroll container for a long horizontal set, and it carries
 * the rule the indicator sits on. The rule is an `after` pseudo-element that
 * is also a flex item: it fills whatever width the tabs leave, so the line
 * runs to the edge of the list rather than stopping at the last tab, and it
 * scrolls with the tabs because it is in flow with them.
 *
 * The 4px of padding is the focus ring's headroom. A scroll container clips at
 * its padding box, and the shared focus treatment draws 2px outside the tab at
 * 2px offset, so without this the ring's top and bottom would be cut off.
 */
const listClasses: Record<TabsOrientation, string> = {
  horizontal: cn(
    "flex overflow-x-auto p-1",
    "after:flex-1 after:border-border after:border-b after:content-['']",
  ),
  vertical: cn(
    "flex flex-col p-1",
    "after:flex-1 after:border-border after:border-r after:content-['']",
  ),
};

/** Every enabled tab in the list, in DOM order. */
function enabledTabs(list: HTMLElement): HTMLButtonElement[] {
  return Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter(
    (tab) => !tab.disabled,
  );
}

/**
 * The container the tabs live in.
 *
 * Owns the keyboard model. Arrow keys along the orientation move focus to the
 * previous or next enabled tab and wrap at the ends; Home and End jump to the
 * first and last. Selection is not decided here: in automatic mode the tab
 * that receives focus selects itself, in manual mode nothing selects until
 * Enter or Space. That keeps the list ignorant of values and lets tabs be
 * added or removed without it knowing.
 */
export function TabsList({ ref, className, onKeyDown, onPointerDown, ...props }: TabsListProps) {
  const { orientation, source, noteSource } = useTabs("TabsList");
  const listRef = useRef<HTMLDivElement | null>(null);

  /*
   * The roving tab stop, kept honest after every render.
   *
   * React renders `tabindex="0"` on the selected tab and `-1` everywhere else,
   * which is right until the selected tab is disabled or nothing is selected.
   * Then no tab is reachable by Tab at all, and the list falls out of the
   * page's keyboard order. This gives the stop to the first enabled tab in
   * that case, and moves it back the moment a selected, enabled tab exists.
   * No dependency list, on purpose: it has to hold after any render, including
   * one that added or disabled a tab.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after every render by design; see above.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const tabs = enabledTabs(list);
    const stop = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0];
    for (const tab of tabs) tab.tabIndex = tab === stop ? 0 : -1;
  });

  return (
    <div
      ref={(node) => {
        listRef.current = node;
        const cleanup = typeof ref === "function" ? ref(node) : undefined;
        if (ref && typeof ref !== "function") ref.current = node;
        return () => {
          listRef.current = null;
          if (typeof cleanup === "function") cleanup();
          else if (typeof ref === "function") ref(null);
          else if (ref) ref.current = null;
        };
      }}
      role="tablist"
      aria-orientation={orientation}
      data-source={source}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        onPointerDown?.(event);
        noteSource("pointer");
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        noteSource("keyboard");
        if (event.defaultPrevented) return;

        const tabs = enabledTabs(event.currentTarget);
        const origin = (event.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');
        const index = origin ? tabs.indexOf(origin) : -1;
        if (index === -1) return;

        const { next, previous } = navigationKeys[orientation];
        let target: number;
        if (event.key === next) target = (index + 1) % tabs.length;
        else if (event.key === previous) target = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") target = 0;
        else if (event.key === "End") target = tabs.length - 1;
        else return;

        // The page must not scroll on an arrow key the list has consumed.
        event.preventDefault();
        tabs[target]?.focus();
      }}
      className={cn("group/tabs", listClasses[orientation], className)}
      {...props}
    />
  );
}

export interface TabProps
  extends Omit<ComponentPropsWithoutRef<"button">, "id" | "type" | "value"> {
  /** What selecting this tab selects. Also names its panel. */
  value: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * The indicator is an inset box shadow rather than a border or a child: it
 * paints without taking space, so selecting a tab moves nothing around it,
 * and a shadow colour transitions. Two pixels, from the emphasis border width,
 * on the edge that meets the list's rule.
 *
 * Written as an arbitrary property rather than `shadow-[...]`. tailwind-merge
 * recognises an arbitrary shadow by its first two lengths, and `calc()` is not
 * a length it reads, so a `shadow-[...]` here would be filed under shadow
 * colour and could collide with, or be dropped beside, a caller's own class.
 * An arbitrary property is grouped by its property name and cannot be
 * misfiled.
 */
const indicator: Record<TabsOrientation, string> = {
  horizontal: cn(
    "[box-shadow:inset_0_calc(-1*var(--spartant-border-width-emphasis))_0_0_transparent]",
    "aria-selected:[box-shadow:inset_0_calc(-1*var(--spartant-border-width-emphasis))_0_0_var(--spartant-color-primary)]",
  ),
  vertical: cn(
    "[box-shadow:inset_calc(-1*var(--spartant-border-width-emphasis))_0_0_0_transparent]",
    "aria-selected:[box-shadow:inset_calc(-1*var(--spartant-border-width-emphasis))_0_0_0_var(--spartant-color-primary)]",
  ),
};

const tabOrientation: Record<TabsOrientation, string> = {
  horizontal: "justify-center whitespace-nowrap border-b border-border",
  vertical: "justify-start text-start border-r border-border",
};

const tabBase = cn(
  "relative inline-flex shrink-0 items-center gap-control-gap",
  "min-h-[var(--spartant-size-min-target)] px-control-x",
  "font-sans font-medium text-body text-foreground-muted",
  "cursor-pointer select-none",
  "hover:not-disabled:text-foreground",
  "aria-selected:text-foreground",
  "disabled:cursor-not-allowed disabled:text-foreground-disabled",
  // One focus treatment, identical on every focusable component.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  // The label colour and the indicator, on the state duration. Named
  // properties: `transition-colors` would include the focus ring's outline.
  "transition-[color,box-shadow] duration-state ease-state",
  // The keyboard path is immediate. The list records which input it last saw,
  // and a selection that came from a key change paints its final state at
  // once. Reduced motion needs nothing here: the duration is a token and the
  // stylesheet collapses it.
  "group-data-[source=keyboard]/tabs:transition-none",
);

/**
 * One tab. A native `button`, so Enter, Space, focus, and `disabled` are the
 * platform's. What is added is the role, the selected state, the link to its
 * panel, and its place in the roving tab order.
 */
export function Tab({ value, disabled, className, onClick, onFocus, ...props }: TabProps) {
  const { baseId, value: selectedValue, select, orientation, activation, panels } = useTabs("Tab");
  const selected = selectedValue === value;

  return (
    <button
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={selected}
      aria-controls={panels.has(value) ? panelId(baseId, value) : undefined}
      tabIndex={selected && !disabled ? 0 : -1}
      disabled={disabled}
      data-orientation={orientation}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) select(value);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        // Automatic activation: arriving by arrow key is selecting. Manual
        // activation leaves selection to the click a native button dispatches
        // for Enter and Space.
        if (activation === "automatic" && !disabled) select(value);
      }}
      className={cn(
        tabBase,
        tabOrientation[orientation],
        indicator[orientation],
        coarseHitArea,
        className,
      )}
      {...props}
    />
  );
}

export interface TabsPanelProps extends Omit<ComponentPropsWithoutRef<"div">, "id"> {
  /** The `Tab` this panel belongs to. */
  value: string;
  /**
   * Keep the children rendered while another tab is selected.
   *
   * By default a hidden panel keeps its element, so `aria-controls` always
   * points at something, and drops its children, so an expensive panel costs
   * nothing until it is shown. Set this when the panel holds state that must
   * survive switching away, such as a half-filled form.
   */
  keepMounted?: boolean;
  ref?: Ref<HTMLDivElement>;
}

const panelOrientation: Record<TabsOrientation, string> = {
  horizontal: "",
  vertical: "min-w-0 flex-1",
};

/**
 * The content a tab reveals.
 *
 * Focusable, so a keyboard user can move from the list into the panel with a
 * single Tab even when the panel holds no focusable content of its own.
 */
export function TabsPanel({
  value,
  keepMounted = false,
  className,
  children,
  ...props
}: TabsPanelProps) {
  const { baseId, value: selectedValue, orientation, registerPanel } = useTabs("TabsPanel");
  const selected = selectedValue === value;

  useEffect(() => registerPanel(value), [registerPanel, value]);

  return (
    <div
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      hidden={!selected}
      // The WAI-ARIA pattern makes the panel focusable so a keyboard user can
      // reach its content from the list with one Tab, even when the panel
      // holds nothing focusable of its own. Only the shown panel: a hidden one
      // is out of the tab order in every browser, and saying so here keeps a
      // DOM without the stylesheet honest too.
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the rule does not know `tabpanel`; see above.
      tabIndex={selected ? 0 : -1}
      data-orientation={orientation}
      className={cn(
        "rounded-control text-body text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        panelOrientation[orientation],
        className,
      )}
      {...props}
    >
      {selected || keepMounted ? children : null}
    </div>
  );
}
