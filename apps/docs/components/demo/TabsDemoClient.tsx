"use client";

import { Tab, Tabs, TabsList, TabsPanel } from "@iroshandezilva/spartant";
import { useState } from "react";

/**
 * Two tab sets, both controlled so the readouts can show the value the
 * component reported. The first uses automatic activation with one disabled
 * tab, so an arrow key both moves and selects and the disabled tab is
 * skipped. The second uses manual activation, so an arrow key only moves
 * focus and Enter or Space selects.
 *
 * Both readouts flip in `onValueChange`, which runs in the click or keydown
 * handler, before the indicator has begun its fade. That is the contract:
 * state never waits for the transition.
 */
export function TabsDemoClient() {
  const [value, setValue] = useState("overview");
  const [changes, setChanges] = useState(0);
  const [manualValue, setManualValue] = useState("inbox");

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-caption text-foreground-muted">
          Automatic activation. Arrows move and select; Billing is disabled and skipped.
        </p>
        <Tabs
          value={value}
          onValueChange={(next) => {
            setValue(next);
            setChanges((count) => count + 1);
          }}
        >
          <TabsList aria-label="Project">
            <Tab value="overview">Overview</Tab>
            <Tab value="activity">Activity</Tab>
            <Tab value="billing" disabled>
              Billing
            </Tab>
            <Tab value="settings">Settings</Tab>
          </TabsList>
          <TabsPanel value="overview">
            <p className="text-body-small text-foreground-muted">
              Fourteen open tasks across three milestones, two of them due this week.
            </p>
          </TabsPanel>
          <TabsPanel value="activity">
            <p className="text-body-small text-foreground-muted">
              Twelve changes today, the last one four minutes ago.
            </p>
          </TabsPanel>
          <TabsPanel value="billing">
            <p className="text-body-small text-foreground-muted">Billing.</p>
          </TabsPanel>
          <TabsPanel value="settings">
            <p className="text-body-small text-foreground-muted">
              Visibility, members, and the things that are hard to undo.
            </p>
          </TabsPanel>
        </Tabs>
        <p className="text-caption text-foreground-muted" aria-live="polite">
          Selected: {value}. Changed {changes} {changes === 1 ? "time" : "times"}.
        </p>
      </div>
      <div className="grid gap-2">
        <p className="text-caption text-foreground-muted">
          Manual activation. Arrows move focus only; Enter or Space selects.
        </p>
        <Tabs activation="manual" value={manualValue} onValueChange={setManualValue}>
          <TabsList aria-label="Mailboxes">
            <Tab value="inbox">Inbox</Tab>
            <Tab value="starred">Starred</Tab>
            <Tab value="archive">Archive</Tab>
          </TabsList>
          <TabsPanel value="inbox">
            <p className="text-body-small text-foreground-muted">Three unread.</p>
          </TabsPanel>
          <TabsPanel value="starred">
            <p className="text-body-small text-foreground-muted">Nothing starred yet.</p>
          </TabsPanel>
          <TabsPanel value="archive">
            <p className="text-body-small text-foreground-muted">
              Two hundred and six messages, oldest from March.
            </p>
          </TabsPanel>
        </Tabs>
        <p className="text-caption text-foreground-muted" aria-live="polite">
          Selected: {manualValue}.
        </p>
      </div>
    </div>
  );
}
