import { cn, useTheme } from "@iroshandezilva/spartant";
import { contrastRatio, toHex } from "@spartant-color/oklch.js";
import { generateScale, MAX_HUE_SHIFT, type ScaleEntry } from "@spartant-color/scale.js";
import { useId, useMemo, useState } from "react";
import { committedFamily, committedFamilyNames } from "./committed.js";
import { type ExportFormat, toExport } from "./exports.js";

const WHITE = { l: 1, c: 0, h: 0 };
const BLACK = { l: 0, c: 0, h: 0 };

/** A labelled range input. Keyboard operable because it is a real input. */
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="flex justify-between text-body-small">
        <span>{label}</span>
        <span className="font-mono text-foreground-muted">{format ? format(value) : value}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-primary"
      />
    </div>
  );
}

function Swatch({ entry, committed }: { entry: ScaleEntry; committed?: string }) {
  const onWhite = contrastRatio(entry.color, WHITE);
  const onBlack = contrastRatio(entry.color, BLACK);
  const differs = committed !== undefined && committed !== entry.css;

  return (
    <li className="grid gap-1">
      <div
        className="h-16 rounded-control border border-border"
        style={{ background: entry.css }}
        // The value is in the text below; the swatch itself is decoration.
        aria-hidden="true"
      />
      <div className="text-body-small">
        <div className="flex items-center justify-between">
          <span className="font-medium">{entry.step}</span>
          {entry.clamped ? (
            <span
              className="rounded-pill bg-warning px-1.5 text-caption text-warning-foreground"
              title={`Chroma reduced from ${entry.requestedChroma.toFixed(3)} to reach sRGB`}
            >
              clamped
            </span>
          ) : null}
        </div>
        <div className="font-mono text-caption text-foreground-muted">{toHex(entry.color)}</div>
        <div className="text-caption text-foreground-muted">
          {onWhite.toFixed(1)}:1 on white · {onBlack.toFixed(1)}:1 on black
        </div>
        {differs ? (
          <div className="text-caption text-danger">differs from committed</div>
        ) : committed !== undefined ? (
          <div className="text-caption text-success">matches committed</div>
        ) : null}
      </div>
    </li>
  );
}

/** The pairings the policy requires of any family used as a filled action. */
function PairingTable({ scale }: { scale: ScaleEntry[] }) {
  const at = (step: number) => scale.find((entry) => entry.step === step)?.color;
  const rows = [
    { label: "White text on step 600", fg: WHITE, bg: at(600), min: 4.5 },
    { label: "White text on step 700", fg: WHITE, bg: at(700), min: 4.5 },
    { label: "Step 600 on white", fg: at(600), bg: WHITE, min: 4.5 },
    { label: "Step 400 on step 1000", fg: at(400), bg: at(1000), min: 4.5 },
    { label: "Step 500 border on white", fg: at(500), bg: WHITE, min: 3 },
  ];

  return (
    <table className="w-full text-body-small">
      <caption className="sr-only">Required contrast pairings for this ramp</caption>
      <thead>
        <tr className="text-left text-foreground-muted">
          <th scope="col" className="py-1 font-medium">
            Pairing
          </th>
          <th scope="col" className="py-1 font-medium">
            Ratio
          </th>
          <th scope="col" className="py-1 font-medium">
            Needs
          </th>
          <th scope="col" className="py-1 font-medium">
            Result
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          if (!row.fg || !row.bg) return null;
          const ratio = contrastRatio(row.fg, row.bg);
          const passes = ratio >= row.min;
          return (
            <tr key={row.label} className="border-t border-border-subtle">
              <td className="py-1">{row.label}</td>
              <td className="py-1 font-mono">{ratio.toFixed(2)}:1</td>
              <td className="py-1 font-mono text-foreground-muted">{row.min}:1</td>
              <td className={cn("py-1 font-medium", passes ? "text-success" : "text-danger")}>
                {passes ? "pass" : "fail"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Shows the ramp doing the job it exists for, in the current theme. */
function SemanticPreview({ scale }: { scale: ScaleEntry[] }) {
  const at = (step: number) => scale.find((entry) => entry.step === step)?.css ?? "transparent";
  const { resolvedTheme } = useTheme();
  const action = resolvedTheme === "dark" ? at(400) : at(600);
  const onAction = resolvedTheme === "dark" ? at(1000) : at(0);

  return (
    <div className="rounded-surface border border-border bg-surface p-6 shadow-surface">
      <h3 className="text-heading-small font-semibold">Semantic preview</h3>
      <p className="mt-1 text-body-small text-foreground-muted">
        Showing {resolvedTheme}. The action uses step {resolvedTheme === "dark" ? 400 : 600}, per
        the usable-range rule.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-control px-4 py-2 text-body-small font-medium"
          style={{ background: action, color: onAction }}
        >
          Primary action
        </button>
        <span
          className="rounded-pill px-3 py-1 text-caption font-medium"
          style={{ background: at(resolvedTheme === "dark" ? 900 : 100), color: action }}
        >
          Badge
        </span>
        <span className="text-body-small" style={{ color: action }}>
          Link-coloured text
        </span>
      </div>
    </div>
  );
}

export function App() {
  const { theme, setTheme } = useTheme();
  const [family, setFamily] = useState("primary");
  const [hue, setHue] = useState(264);
  const [chroma, setChroma] = useState(0.19);
  const [hueShift, setHueShift] = useState(0);
  const [format, setFormat] = useState<ExportFormat>("json");
  const [copied, setCopied] = useState(false);
  const familyId = useId();
  const formatId = useId();

  const scale = useMemo(
    () => generateScale({ name: family, hue, chroma, hueShift }),
    [family, hue, chroma, hueShift],
  );
  const committed = useMemo(
    () => new Map(committedFamily(family).map((c) => [c.step, c.css])),
    [family],
  );
  const exported = useMemo(() => toExport(format, family, scale), [format, family, scale]);
  const clampedCount = scale.filter((entry) => entry.clamped).length;

  return (
    <div className="min-h-screen bg-background p-8 font-sans text-foreground">
      <header className="mb-8">
        <h1 className="text-heading-large font-semibold tracking-heading">
          Spartant colour scale tool
        </h1>
        <p className="mt-1 text-body-small text-foreground-muted">
          Generate a ramp from a seed, check it against the contrast policy, compare it with what is
          committed, and export it in the token format.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
        <aside className="grid content-start gap-6">
          <section className="grid gap-4 rounded-surface border border-border bg-surface p-6 shadow-surface">
            <h2 className="text-heading-small font-semibold">Seed</h2>

            <div className="grid gap-1">
              <label htmlFor={familyId} className="text-body-small">
                Family
              </label>
              <input
                id={familyId}
                value={family}
                onChange={(event) => setFamily(event.target.value.trim() || "primary")}
                list="committed-families"
                className="rounded-control border border-border bg-background px-3 py-1.5 text-body-small"
              />
              <datalist id="committed-families">
                {committedFamilyNames().map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <Slider
              label="Hue"
              value={hue}
              min={0}
              max={360}
              step={1}
              onChange={setHue}
              format={(v) => `${v}°`}
            />
            {/*
              Step is 0.001, not 0.005. A coarser step cannot express a
              committed seed such as neutral's 0.014, which makes the
              comparison against committed tokens unreachable for that family.
            */}
            <Slider
              label="Peak chroma"
              value={chroma}
              min={0}
              max={0.4}
              step={0.001}
              onChange={setChroma}
              format={(v) => v.toFixed(3)}
            />
            <Slider
              label="Hue shift"
              value={hueShift}
              min={-MAX_HUE_SHIFT}
              max={MAX_HUE_SHIFT}
              step={1}
              onChange={setHueShift}
              format={(v) => `${v}°`}
            />

            <p aria-live="polite" className="text-caption text-foreground-muted">
              {clampedCount === 0
                ? "Every step fits inside sRGB."
                : `${clampedCount} step${clampedCount === 1 ? "" : "s"} had chroma reduced to reach sRGB.`}
            </p>
          </section>

          <section className="grid gap-3 rounded-surface border border-border bg-surface p-6 shadow-surface">
            <h2 className="text-heading-small font-semibold">Theme</h2>
            <div className="flex gap-2">
              {(["system", "light", "dark"] as const).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={theme === choice}
                  onClick={() => setTheme(choice)}
                  className={cn(
                    "rounded-control px-3 py-1.5 text-body-small font-medium",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                    theme === choice
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
                  )}
                >
                  {choice}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="grid content-start gap-8">
          <section>
            <h2 className="mb-3 text-heading-small font-semibold">Ramp</h2>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-3">
              {scale.map((entry) => (
                <Swatch key={entry.step} entry={entry} committed={committed.get(entry.step)} />
              ))}
            </ul>
          </section>

          <SemanticPreview scale={scale} />

          <section className="rounded-surface border border-border bg-surface p-6 shadow-surface">
            <h2 className="mb-3 text-heading-small font-semibold">Contrast</h2>
            <PairingTable scale={scale} />
          </section>

          <section className="rounded-surface border border-border bg-surface p-6 shadow-surface">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-heading-small font-semibold">Export</h2>
              <div className="flex items-center gap-2">
                <label htmlFor={formatId} className="text-body-small text-foreground-muted">
                  Format
                </label>
                <select
                  id={formatId}
                  value={format}
                  onChange={(event) => setFormat(event.target.value as ExportFormat)}
                  className="rounded-control border border-border bg-background px-2 py-1 text-body-small"
                >
                  <option value="json">Token JSON</option>
                  <option value="css">CSS</option>
                  <option value="typescript">TypeScript</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(exported);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }}
                  className={cn(
                    "rounded-control bg-primary px-3 py-1 text-body-small font-medium text-primary-foreground",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                  )}
                >
                  Copy
                </button>
              </div>
            </div>
            <p aria-live="polite" className="sr-only">
              {copied ? "Export copied to the clipboard" : ""}
            </p>
            <pre className="max-h-80 overflow-auto rounded-control bg-surface-muted p-4 text-caption">
              <code>{exported}</code>
            </pre>
          </section>
        </main>
      </div>
    </div>
  );
}
