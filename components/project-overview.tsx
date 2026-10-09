import Link from 'next/link';
import { ArrowUpRight, Boxes, GitBranch, ListChecks, BookOpen } from 'lucide-react';
export function ProjectOverview() {
  return <div className="not-prose overview">
    <div className="project-statement"><span className="small-label">Spartant Design System</span><p>Built in code.<br />Connected to design.</p><span>Lit components, a Figma token bridge, and one place to keep the work aligned.</span></div>
    <div className="overview-links">
      {[
        { href: '/docs/project/tasks', icon: ListChecks, title: 'Track the work', text: 'One component. Two progress tracks. A shared finish line.' },
        { href: '/docs/architecture', icon: Boxes, title: 'Understand the system', text: 'How Lit, Storybook, Fumadocs, and Figma fit together.' },
        { href: '/docs/sync/plugin', icon: GitBranch, title: 'Sync tokens to Figma', text: 'Preview changes, preserve bindings, and apply a code-owned release.' },
        { href: '/docs/project/decisions', icon: BookOpen, title: 'Read the decisions', text: 'What we chose, why we chose it, and what remains open.' }
      ].map(({ href, icon: Icon, title, text }) => <Link key={href} href={href}><Icon size={21} /><div><strong>{title}</strong><p>{text}</p></div><ArrowUpRight size={17} /></Link>)}
    </div>
    <div className="working-note"><strong>Current stage</strong><p>Documentation and tasks live in Linear. The token plugin awaits a real Figma import and binding check. Component progress is tracked on each issue.</p></div>
  </div>;
}
