// Same-origin Storybook by default (the docs build copies storybook-static to /storybook).
// Set NEXT_PUBLIC_STORYBOOK_URL=http://127.0.0.1:6006 to embed a running `pnpm storybook` instead.
const base = (process.env.NEXT_PUBLIC_STORYBOOK_URL ?? '/storybook').replace(/\/$/, '');

export const storybookUrl = (path = '') => `${base}/${path}`;

/**
 * Embeds one Storybook story. `story` is the story id, for example `components-button--variants`.
 * Storybook's Theme, Hue, and Density toolbar controls are not available in an embed; open the
 * full Storybook link for those.
 */
export function StorybookEmbed({ story, title, height = 220 }: { story: string; title: string; height?: number }) {
  const id = encodeURIComponent(story);
  return (
    <figure className="sp-embed">
      <iframe title={title} src={storybookUrl(`iframe.html?id=${id}&viewMode=story`)} height={height} loading="lazy" />
      <figcaption>
        <span>{title}</span>
        <a href={storybookUrl(`?path=/story/${id}`)} target="_blank" rel="noreferrer">Open in Storybook</a>
      </figcaption>
    </figure>
  );
}

export function StorybookLink({ story, children }: { story?: string; children: React.ReactNode }) {
  const href = story ? storybookUrl(`?path=/story/${encodeURIComponent(story)}`) : storybookUrl();
  return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
}
