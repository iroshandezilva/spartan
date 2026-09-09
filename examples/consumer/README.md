# spartant-example-consumer

A clean consumer example that imports Spartant the way a real application
would. Private, never published.

This example uses the `workspace:` protocol so local changes to the package are
picked up immediately during development.

Note the distinction from the release smoke test. HAUX-59 creates a separate
consumer that installs the packed artifact rather than a workspace alias, which
is what proves the published package actually works.
