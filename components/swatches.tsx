/** Color swatches that read the live Spartan CSS variable, so they follow the active theme. */
export function Swatches({ tokens }: { tokens: string[] }) {
  return (
    <div className="sp-swatches">
      {tokens.map(token => (
        <div className="sp-swatch" key={token}>
          <div style={{ background: `var(${token})` }} />
          <p><code>{token}</code></p>
        </div>
      ))}
    </div>
  );
}

/** Radius and spacing previews. */
export function Scale({ tokens, kind }: { tokens: string[]; kind: 'radius' | 'space' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, margin: '1.25rem 0' }}>
      {tokens.map(token => (
        <div key={token} style={{ fontSize: 12 }}>
          <div
            style={
              kind === 'radius'
                ? { width: 64, height: 64, background: 'var(--sp-color-primary-surface)', border: '1px solid var(--sp-color-primary-default)', borderRadius: `var(${token})` }
                : { width: `var(${token})`, height: 16, minWidth: 1, background: 'var(--sp-color-primary-default)' }
            }
          />
          <code>{token}</code>
        </div>
      ))}
    </div>
  );
}
