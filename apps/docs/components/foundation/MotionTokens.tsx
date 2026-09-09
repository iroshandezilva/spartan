import { cssVariable, isSpring, rolesUnder, scalar } from "@/lib/tokens";

/**
 * Which motion roles a component has validated, and which have no consumer
 * yet. This split is prose from `packages/spartant/src/tokens/FOUNDATIONS.md`
 * and is enforced there by `foundations.test.ts`; the values beside it are
 * read from the published token JSON.
 */
const VALIDATED_BY: Record<string, string> = {
  "duration.press-feedback": "Button press",
  "duration.state-change": "Field focus and validation, Checkbox, Radio, Switch",
  "duration.modal-enter": "Dialog entry",
  "duration.indicator-loop": "Button loading spinner",
  "duration.reduced": "The reduced-motion collapse",
  "easing.state": "Button, Field, Checkbox, Radio",
  "easing.move": "Switch thumb",
  "easing.enter": "Dialog entry",
  "easing.progress": "Button loading spinner",
  "scale.press": "Button press",
  "scale.overlay-enter": "Dialog entry",
  "scale.reduced": "The reduced-motion collapse",
};

const PROVISIONAL_BECAUSE: Record<string, string> = {
  "duration.overlay-enter":
    "No overlay component yet. Popover and Tooltip are HAUX-53, Select is HAUX-52.",
  "duration.overlay-exit":
    "No overlay component yet. Popover and Tooltip are HAUX-53, Select is HAUX-52.",
  "duration.modal-exit":
    "Dialog closes instantly so focus is never delayed, so nothing consumes an exit duration.",
  "easing.exit":
    "Dialog closes instantly so focus is never delayed, so nothing consumes an exit curve.",
  "distance.indicator":
    "No component moves anything spatially yet. The first slice used scale and colour throughout.",
  "distance.state":
    "No component moves anything spatially yet. The first slice used scale and colour throughout.",
  "distance.overlay":
    "No component moves anything spatially yet. The first slice used scale and colour throughout.",
};

interface MotionTableProps {
  prefix: "duration" | "easing" | "distance" | "scale";
}

const USE: Record<string, string> = {
  "duration.press-feedback": "Pointer and touch press",
  "duration.state-change": "Hover, selection, small indicators",
  "duration.overlay-enter": "Popovers, selects, tooltips arriving",
  "duration.overlay-exit": "The same, leaving",
  "duration.modal-enter": "Dialogs and large surfaces arriving",
  "duration.modal-exit": "The same, leaving",
  "duration.indicator-loop": "One turn of a loading spinner",
  "duration.reduced": "Everything, under reduced motion",
  "easing.enter": "Anything arriving",
  "easing.exit": "Anything leaving",
  "easing.move": "Moving between two visible positions",
  "easing.state": "Colour and simple state",
  "easing.progress": "Time and progress only",
  "distance.indicator": "Icon and indicator nudges",
  "distance.state": "Small state movement",
  "distance.overlay": "Surfaces entering from their trigger",
  "scale.press": "Press feedback",
  "scale.overlay-enter": "Surfaces entering",
  "scale.reduced": "Under reduced motion",
};

/** The status column as text. Throws for a role in neither list, so a new
 * token cannot appear on the page without a stated status. */
export function motionStatus(path: string): string {
  const validated = VALIDATED_BY[path];
  if (validated) return `Frozen. ${validated}.`;
  const why = PROVISIONAL_BECAUSE[path];
  if (why) return `Provisional. ${why}`;
  throw new Error(`${path} is in neither the frozen nor the provisional list`);
}

export interface MotionRow {
  path: string;
  value: string;
  use: string;
  variable: string;
  status: string;
}

/** One motion category's rows, shared by the rendered table and its Markdown form. */
export function motionRows(prefix: MotionTableProps["prefix"]): MotionRow[] {
  return rolesUnder(prefix).map(({ path }) => ({
    path,
    value: scalar(path),
    use: USE[path] ?? "",
    variable: cssVariable(path),
    status: motionStatus(path),
  }));
}

export interface SpringRow {
  name: string;
  stiffness: number;
  damping: number;
  mass: number;
  character: string;
  status: string;
}

/** The spring rows, shared by the rendered table and its Markdown form. */
export function springRows(): SpringRow[] {
  return rolesUnder("spring").map(({ role, value }) => {
    if (!isSpring(value)) throw new Error(`spring.${role} is not a spring`);
    return {
      name: role,
      stiffness: value.stiffness,
      damping: value.damping,
      mass: value.mass,
      character:
        role === "state"
          ? "Settles fast, essentially no overshoot"
          : "Slight overshoot, longer settle",
      status: "Provisional. No component needed spring physics; CSS covered every interaction.",
    };
  });
}

/** One motion category with its value, use, custom property, and status. */
export function MotionTable({ prefix }: MotionTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Value</th>
          <th>Use</th>
          <th>Custom property</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {motionRows(prefix).map((row) => (
          <tr key={row.path}>
            <td>
              <code>{row.path}</code>
            </td>
            <td>
              <code>{row.value}</code>
            </td>
            <td>{row.use}</td>
            <td>
              <code className="text-caption">{row.variable}</code>
            </td>
            <td>{row.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The spring tokens, read from the published token JSON. The package also
 * exports them as `springs`, generated from the same source.
 */
export function SpringTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Stiffness</th>
          <th>Damping</th>
          <th>Mass</th>
          <th>Character</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {springRows().map((spring) => (
          <tr key={spring.name}>
            <td>
              <code>springs.{spring.name}</code>
            </td>
            <td>{spring.stiffness}</td>
            <td>{spring.damping}</td>
            <td>{spring.mass}</td>
            <td>{spring.character}</td>
            <td>{spring.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function bezierPoint(t: number, p1: number, p2: number): number {
  const mt = 1 - t;
  return 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t;
}

/** Plots one easing role's cubic-bezier curve. Time runs left to right. */
function EasingCurve({ path }: { path: string }) {
  const value = scalar(path);
  const match = value.match(/^cubic-bezier\(([^)]+)\)$/);
  if (!match) throw new Error(`${path} is not a cubic-bezier`);
  const [x1, y1, x2, y2] = (match[1] as string).split(",").map((n) => Number(n.trim()));
  if ([x1, y1, x2, y2].some((n) => n === undefined || Number.isNaN(n))) {
    throw new Error(`${path} has a malformed cubic-bezier`);
  }
  const size = 96;
  const points: string[] = [];
  for (let i = 0; i <= 40; i += 1) {
    const t = i / 40;
    const x = bezierPoint(t, x1 as number, x2 as number) * size;
    const y = size - bezierPoint(t, y1 as number, y2 as number) * size;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <figure className="grid gap-1 text-caption">
      <svg
        viewBox={`-4 -4 ${size + 8} ${size + 8}`}
        width={size}
        height={size}
        role="img"
        aria-label={`${path}: ${value}`}
        className="rounded-control border border-border bg-surface"
      >
        <line x1="0" y1={size} x2={size} y2="0" stroke="var(--spartant-color-border)" />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--spartant-color-primary)"
          strokeWidth="2"
        />
      </svg>
      <figcaption>
        <code className="font-mono text-foreground">{path}</code>
        <br />
        <span className="font-mono text-foreground-muted">{value}</span>
      </figcaption>
    </figure>
  );
}

/** Every easing role plotted, so the difference between curves is visible. */
export function EasingCurves() {
  return (
    <div className="not-prose flex flex-wrap gap-6">
      {rolesUnder("easing").map(({ path }) => (
        <EasingCurve key={path} path={path} />
      ))}
    </div>
  );
}
