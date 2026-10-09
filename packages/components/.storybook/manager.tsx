// "Icons" panel: search the generated Central Icons set and pick one for the current
// story's icon arguments. Stories opt in with parameters.iconPicker.
import React, { useMemo, useState } from 'react';
import { AddonPanel, ToggleButton } from 'storybook/internal/components';
import { addons, types, useArgs, useGlobals, useParameter } from 'storybook/manager-api';
import { useTheme } from 'storybook/theming';
import data from './generated/icons.json';

type IconEntry = [name: string, words: string, svg: string];
type Target = { arg: string; label: string };
const entries = data as IconEntry[];
const PAGE = 240;

const Picker = () => {
  const theme = useTheme();
  const config = useParameter<{ targets: Target[] } | undefined>('iconPicker', undefined);
  const [args, updateArgs] = useArgs();
  const [targetIndex, setTargetIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const matches = useMemo(() => {
    const tokens = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
    return tokens.length ? entries.filter(([name, words]) => tokens.every(t => name.toLowerCase().includes(t) || words.includes(t))) : entries;
  }, [query]);

  if (!config) return <p style={{ padding: 16 }}>This story has no icon arguments.</p>;
  if (!entries.length) return <p style={{ padding: 16 }}>The licensed icon library is not installed. Set CENTRAL_LICENSE_KEY, run pnpm install, then restart Storybook.</p>;

  const target = config.targets[Math.min(targetIndex, config.targets.length - 1)];
  const current = (args as Record<string, string | undefined>)[target.arg];
  const border = `1px solid ${theme.appBorderColor}`;
  const button = (active: boolean): React.CSSProperties => ({ font: 'inherit', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, border, color: theme.color.defaultText, background: active ? theme.background.hoverable : 'transparent', fontWeight: active ? 600 : 400 });

  return (
    <div style={{ padding: 12, display: 'grid', gap: 10, color: theme.color.defaultText, fontSize: 13 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {config.targets.length > 1 &&
          config.targets.map((t, i) => (
            <button key={t.arg} type="button" style={button(i === targetIndex)} onClick={() => setTargetIndex(i)}>
              {t.label}
              {(args as Record<string, string | undefined>)[t.arg] ? `: ${(args as Record<string, string>)[t.arg]}` : ''}
            </button>
          ))}
        <button type="button" style={button(false)} disabled={!current} onClick={() => updateArgs({ [target.arg]: undefined })}>
          Remove {config.targets.length > 1 ? target.label.toLowerCase() : 'icon'}
        </button>
        <span style={{ opacity: 0.7 }}>{current ? `Selected: ${current}` : 'No icon selected'}</span>
      </div>
      <input
        type="search"
        aria-label="Search icons"
        placeholder={`Search ${entries.length.toLocaleString()} icons by name or keyword, for example "arrow right"`}
        value={query}
        onChange={e => { setQuery(e.target.value); setLimit(PAGE); }}
        style={{ font: 'inherit', padding: '8px 10px', borderRadius: 6, border, background: theme.input.background, color: theme.input.color }}
      />
      <div role="listbox" aria-label={`Icons for ${target.label}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 6 }}>
        {matches.slice(0, limit).map(([name, , svg]) => (
          <button
            key={name}
            type="button"
            role="option"
            aria-selected={name === current}
            title={name}
            onClick={() => updateArgs({ [target.arg]: name })}
            style={{ ...button(name === current), display: 'grid', justifyItems: 'center', gap: 6, padding: '10px 4px', fontSize: 11, overflow: 'hidden' }}
          >
            <span style={{ width: 24, height: 24, display: 'block' }} dangerouslySetInnerHTML={{ __html: svg }} />
            <span style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name.replace(/^Icon/, '')}</span>
          </button>
        ))}
      </div>
      {matches.length === 0 && <p style={{ opacity: 0.7 }}>No icons match "{query}".</p>}
      {matches.length > limit && (
        <button type="button" style={button(false)} onClick={() => setLimit(limit + PAGE)}>
          Show more ({(matches.length - limit).toLocaleString()} left)
        </button>
      )}
    </div>
  );
};

addons.register('spartan/icon-picker', () => {
  addons.add('spartan/icon-picker/panel', {
    type: types.PANEL,
    title: 'Icons',
    match: ({ viewMode }) => viewMode === 'story',
    paramKey: 'iconPicker',
    render: ({ active }) => (
      <AddonPanel active={!!active}>
        <Picker />
      </AddonPanel>
    ),
  });
});

// High contrast is its own on/off setting, not a theme value, so it is a labeled toggle button in
// the toolbar rather than a dropdown item. Storybook's ToggleButton is a real button with
// role="switch" and aria-checked, so it is reachable with Tab and toggles with Space or Enter.
const HighContrastToggle = () => {
  const [globals, updateGlobals] = useGlobals();
  const on = globals.highContrast === true;
  return (
    <ToggleButton
      pressed={on}
      ariaLabel="High contrast"
      tooltip="High contrast on or off, for every style and color scheme"
      onClick={() => updateGlobals({ highContrast: !on })}
    >
      High contrast: {on ? 'On' : 'Off'}
    </ToggleButton>
  );
};

addons.register('spartan/high-contrast', () => {
  addons.add('spartan/high-contrast/tool', {
    type: types.TOOL,
    title: 'High contrast',
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: () => <HighContrastToggle />,
  });
});
