import type { ReactNode } from "react";
import type { StoryContract } from "./contract.js";

/**
 * Renders a component's declared contract as a story.
 *
 * The standard asks for a visible no-motion rationale, documented manual-test
 * steps, and accessibility notes. Those could live in a markdown file, and
 * would then be read approximately never. Rendering them as a story called
 * `Contract` puts them one click from the component in the same tool a reviewer
 * already has open, and keeps them adjacent to the states they describe.
 *
 * It reads the same object the contract test reads, so the panel cannot show a
 * contract different from the one being enforced.
 */
export function ContractPanel({ contract }: { contract: StoryContract }) {
  const { motion, accessibility, manual } = contract;

  return (
    <div className="grid max-w-3xl gap-6 text-body-small">
      <Section title={motion.kind === "motion" ? "Motion" : "No motion"}>
        <Rows>
          {motion.kind === "none" ? (
            <Row term="Rationale" detail={motion.rationale} />
          ) : (
            <>
              <Row term="Purpose" detail={motion.purpose} />
              <Row
                term="Tokens"
                detail={
                  <ul className="grid gap-0.5">
                    {motion.tokens.map((token) => (
                      <li key={token} className="font-mono text-caption">
                        {token}
                      </li>
                    ))}
                  </ul>
                }
              />
              <Row term="Pointer and touch" detail={motion.pointer} />
              <Row term="Keyboard" detail={motion.keyboard} />
              <Row term="Reduced motion" detail={motion.reduced} />
              <Row term="Interruption" detail={motion.interruption} />
              {motion.origin ? <Row term="Origin and timing" detail={motion.origin} /> : null}
            </>
          )}
        </Rows>
      </Section>

      <Section title="Accessibility">
        <Rows>
          <Row term="Role" detail={accessibility.role} />
          <Row term="Accessible name" detail={accessibility.name} />
          <Row
            term="Keyboard"
            detail={
              <ul className="grid gap-0.5">
                {accessibility.keyboard.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            }
          />
          <Row term="Focus" detail={accessibility.focus} />
          {accessibility.announcements ? (
            <Row term="Announcements" detail={accessibility.announcements} />
          ) : null}
        </Rows>
      </Section>

      <Section title="Manual review">
        {"notRequired" in manual ? (
          <Rows>
            <Row term="Not required" detail={manual.notRequired} />
          </Rows>
        ) : (
          <ol className="grid gap-3">
            {manual.map((check) => (
              <li key={check.step} className="grid gap-0.5">
                <span className="text-foreground">{check.step}</span>
                <span className="text-foreground-muted">Expect: {check.expect}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}

/**
 * A section heading and its body.
 *
 * The body is deliberately not wrapped in a `<dl>` here. An earlier version was,
 * which put the manual-review `<ol>` directly inside a definition list. That is
 * a real violation, and the story suite from HAUX-40 caught it on its first run:
 * a `<dl>` may only directly contain `<dt>` and `<dd>` groups, `<div>`,
 * `<script>`, or `<template>`. Each caller now picks the list its content needs.
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-heading-small font-semibold tracking-heading text-foreground">{title}</h2>
      {children}
    </section>
  );
}

/** The definition list the term-and-detail rows require as their parent. */
function Rows({ children }: { children: ReactNode }) {
  return <dl className="grid gap-3">{children}</dl>;
}

function Row({ term, detail }: { term: string; detail: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-foreground-muted">{term}</dt>
      <dd className="text-foreground">{detail}</dd>
    </div>
  );
}
