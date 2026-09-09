import manifest from "@iroshandezilva/spartant/package.json";
import { Callout } from "fumadocs-ui/components/callout";
import { packageName } from "@/lib/shared";

const version: string = manifest.version;

/**
 * The prerelease notice every component page carries, identical on each so a
 * reader who lands on any page learns the same thing. The version is read
 * from the package manifest rather than typed, so the notice cannot claim a
 * version the package does not have.
 */
export function Prerelease() {
  return (
    <Callout type="warn" title="Prerelease">
      This page documents the component as it exists in the repository at package version{" "}
      <code>{version}</code>. <code>{packageName}</code> has not been published to the npm registry,
      so every API here is prerelease and may change before the first release. Nothing on this page
      is deprecated.
    </Callout>
  );
}
