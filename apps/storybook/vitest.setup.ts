/**
 * Gives portable stories the same project annotations the workbench uses.
 *
 * Without this, `composeStories` would render each story without the preview's
 * decorators, so the theme attribute would never be applied and the suite would
 * be testing something the workbench never shows. Storybook's own guidance puts
 * this in a setup file so it runs once per worker, before any story is composed.
 */

import { setProjectAnnotations } from "@storybook/react";
import * as preview from "./.storybook/preview.js";

setProjectAnnotations([preview]);
