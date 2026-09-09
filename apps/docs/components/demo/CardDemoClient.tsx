"use client";

import {
  Badge,
  Button,
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@iroshandezilva/spartant";

/**
 * Both variants, once each, on the page background. A client component only
 * because the buttons inside carry their own press handler and the package
 * does not mark them as client components; the cards themselves hold no
 * state and attach no handler.
 *
 * The left card is the default on the page. The right card shows a flat card
 * nested inside a raised one, which is the working shape for a settings
 * section: a second shadow inside a shadow would mean nothing, so the inner
 * card separates by its border instead.
 */
export function CardDemoClient() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid content-start gap-3">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-control-gap">
              <CardTitle>Checkout rewrite</CardTitle>
              <Badge variant="warning">In review</Badge>
            </div>
            <CardDescription>Replaces the three-step flow with a single page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body">
              Merged into main yesterday and waiting on two failing checks before it can ship.
            </p>
          </CardContent>
          <CardActions>
            <Button size="sm">Open</Button>
            <Button size="sm" variant="secondary">
              Share
            </Button>
          </CardActions>
        </Card>
        <p className="text-caption text-foreground-muted">
          <code>raised</code>, the default. Shadow and a subtle border in light; a lighter fill in
          dark.
        </p>
      </div>
      <div className="grid content-start gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Workspace settings</CardTitle>
            <CardDescription>Changes here apply to every member.</CardDescription>
          </CardHeader>
          <Card variant="flat">
            <CardHeader>
              <CardTitle level={4}>Delete workspace</CardTitle>
              <CardDescription>Removes every project. This cannot be undone.</CardDescription>
            </CardHeader>
            <CardActions>
              <Button size="sm" variant="danger">
                Delete workspace
              </Button>
            </CardActions>
          </Card>
        </Card>
        <p className="text-caption text-foreground-muted">
          <code>flat</code>, nested inside a raised card. A border and no shadow, at the same
          radius.
        </p>
      </div>
    </div>
  );
}
