import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsLayout tree={source.pageTree} nav={{ title: <span className="brand"><span className="brand-mark">s</span>Spartan <span className="brand-lab">Lab</span></span>, url: '/docs' }} sidebar={{ defaultOpenLevel: 2 }} links={[{ text: 'Task manager', url: '/docs/project/tasks', active: 'nested-url' }]}>{children}</DocsLayout>;
}
