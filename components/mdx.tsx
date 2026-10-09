import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Callout } from 'fumadocs-ui/components/callout';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { Scale, Swatches } from './swatches';
import { StorybookEmbed, StorybookLink } from './storybook-embed';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return { ...defaultMdxComponents, Callout, Tab, Tabs, Swatches, Scale, StorybookEmbed, StorybookLink, ...components };
}
