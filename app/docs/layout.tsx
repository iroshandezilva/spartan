import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import { linearProjectHome } from '@/lib/linear';
import { storybookUrl } from '@/components/storybook-embed';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{ title: <span className="brand"><span className="brand-mark">s</span>Spartan</span>, url: '/docs' }}
      sidebar={{ defaultOpenLevel: 1 }}
      links={[
        { text: 'Storybook', url: storybookUrl(), external: true },
        { text: 'Project (Linear)', url: linearProjectHome, external: true },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
