'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, Search, ExternalLink, X, RefreshCw, Download } from 'lucide-react';
import { type Board, type Task, type Status, type Kind, statuses, kinds, overall, componentKey } from '@/lib/tasks';
function StatusBadge({ status }: { status: Status }) { return <span className="status-badge" data-status={status}><i />{status}</span>; }
function StatusSelect({ label, value, onChange }: { label: string; value: Status; onChange: (v: Status) => void }) {
  return <label>{label}<select value={value} onChange={e => onChange(e.target.value as Status)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>;
}
export function TaskManager() {
  const [board, setBoard] = useState<Board>();
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [search, setSearch] = useState(''), [kind, setKind] = useState('All work'), [state, setState] = useState('All statuses');
  const [draft, setDraft] = useState<Task>(), [saving, setSaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  async function reload() {
    try { const r = await fetch('/api/tasks', { cache: 'no-store' }); const data = await r.json(); if (!r.ok) throw new Error(data.error); setBoard(data); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load tasks.'); }
  }
  useEffect(() => { void reload(); }, []);
  useEffect(() => { if (draft) dialog.current?.showModal(); else dialog.current?.close(); }, [!!draft]);
  function edit(task?: Task) {
    setError(''); setNotice('');
    setDraft(task ? { ...task } : { id: crypto.randomUUID(), title: '', kind: 'Component', componentKey: '', development: 'Not started', figma: 'Not started', status: 'Not started', priority: 'Normal', notes: '', figmaUrl: '', storybookUrl: '', updatedAt: new Date().toISOString() });
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!draft || !board) return;
    setSaving(true); setError('');
    try {
      const task = { ...draft, componentKey: draft.kind === 'Component' ? componentKey(draft.title) : undefined };
      const r = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task, revision: board.revision }) });
      const data = await r.json(); if (!r.ok) throw new Error(data.error);
      setBoard(data); setDraft(undefined); setNotice(`Saved ${task.title}.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save.'); }
    finally { setSaving(false); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'spartan-tasks.json'; a.click(); URL.revokeObjectURL(url);
  }
  const visible = board?.tasks.filter(t => (kind === 'All work' || t.kind === kind) && (state === 'All statuses' || overall(t) === state) && `${t.title} ${t.id} ${t.notes}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  const completed = board?.tasks.filter(t => overall(t) === 'Done').length ?? 0;
  const patch = (value: Partial<Task>) => setDraft(d => d && ({ ...d, ...value }));
  return <div className="not-prose task-manager">
    <div className="board-summary"><div><strong>{completed}<span> / {board?.tasks.length ?? '…'}</span></strong><p>tasks complete</p></div><p>Components finish when <b>development and Figma</b> are both done. Documentation and other work have their own tasks.</p><button className="primary-button" onClick={() => edit()} disabled={!board}><Plus size={16} />New task</button></div>
    <div className="board-toolbar"><label className="search-field"><Search size={17} /><input aria-label="Search tasks" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} /></label><select aria-label="Filter task type" value={kind} onChange={e => setKind(e.target.value)}><option>All work</option>{kinds.map(k => <option key={k}>{k}</option>)}</select><select aria-label="Filter overall status" value={state} onChange={e => setState(e.target.value)}><option>All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select><button className="icon-button" aria-label="Reload tasks" onClick={() => void reload()}><RefreshCw size={16} /></button><button className="icon-button" aria-label="Export tasks" onClick={download} disabled={!board}><Download size={16} /></button></div>
    {!draft && error && <p className="error-message" role="alert">{error}</p>}
    <p className="save-notice" role="status">{notice || (board ? `${visible.length} tasks shown. Changes save to this project's task file.` : 'Loading project tasks…')}</p>
    <div className="table-scroll"><table className="task-table"><thead><tr><th>Task</th><th>Development</th><th>Figma</th><th>Overall</th></tr></thead><tbody>{visible.map(t => <tr key={t.id}><td><button className="task-title" onClick={() => edit(t)}>{t.title}</button><div className="task-meta">{t.kind}<span>{t.priority} priority</span></div></td><td>{t.kind === 'Component' ? <StatusBadge status={t.development} /> : <span className="not-applicable">Not applicable</span>}</td><td>{t.kind === 'Component' ? <StatusBadge status={t.figma} /> : <span className="not-applicable">Not applicable</span>}</td><td><StatusBadge status={overall(t)} /></td></tr>)}</tbody></table></div>
    {board && !visible.length && <div className="empty-state"><strong>No matching tasks</strong><p>Try another search or clear the filters.</p><button onClick={() => { setSearch(''); setKind('All work'); setState('All statuses'); }}>Clear filters</button></div>}
    <dialog ref={dialog} aria-labelledby="task-dialog-title" className="task-dialog" onCancel={e => { if (saving) e.preventDefault(); else setDraft(undefined); }} onClose={() => setDraft(undefined)}>{draft && <form onSubmit={save}><div className="dialog-heading"><div><span className="small-label">{board?.tasks.some(t => t.id === draft.id) ? 'Edit task' : 'New task'}</span><h2 id="task-dialog-title">{draft.title || 'What needs to happen?'}</h2></div><button type="button" className="icon-button" aria-label="Close task" disabled={saving} onClick={() => setDraft(undefined)}><X size={19} /></button></div>
      <fieldset disabled={saving}>
        <label>Task name<input autoFocus required maxLength={120} value={draft.title} onChange={e => patch({ title: e.target.value })} placeholder="For example, Button" /></label>
        <div className="form-grid"><label>Type<select value={draft.kind} disabled={board?.tasks.some(t => t.id === draft.id)} onChange={e => patch({ kind: e.target.value as Kind })}>{kinds.map(k => <option key={k}>{k}</option>)}</select></label><label>Priority<select value={draft.priority} onChange={e => patch({ priority: e.target.value as Task['priority'] })}>{['High', 'Normal', 'Low'].map(p => <option key={p}>{p}</option>)}</select></label></div>
        {draft.kind === 'Component' ? <><div className="form-grid"><StatusSelect label="Development status" value={draft.development} onChange={development => patch({ development })} /><StatusSelect label="Figma status" value={draft.figma} onChange={figma => patch({ figma })} /></div><div className="completion-rule"><span>Overall status</span><StatusBadge status={overall(draft)} /><small>Calculated from both tracks. Both must be Done.</small></div></> : <StatusSelect label="Status" value={draft.status} onChange={status => patch({ status })} />}
        <label>Notes and acceptance criteria<textarea rows={5} value={draft.notes} onChange={e => patch({ notes: e.target.value })} placeholder="What needs to change? What proves it is complete?" /></label>
        <div className="form-grid"><label>Figma link<input type="url" value={draft.figmaUrl} onChange={e => patch({ figmaUrl: e.target.value })} placeholder="https://figma.com/…" /></label><label>Storybook or reference link<input type="url" value={draft.storybookUrl} onChange={e => patch({ storybookUrl: e.target.value })} placeholder="https://…" /></label></div>
        <div className="task-links">{draft.figmaUrl && <a href={draft.figmaUrl} target="_blank" rel="noreferrer">Open Figma<ExternalLink size={12} /></a>}{draft.storybookUrl && <a href={draft.storybookUrl} target="_blank" rel="noreferrer">Open reference<ExternalLink size={12} /></a>}</div>
      </fieldset>
      {error && <div className="error-message" role="alert">{error}<button type="button" onClick={() => void reload()}>Reload latest tasks</button></div>}
      <footer><button type="button" disabled={saving} onClick={() => setDraft(undefined)}>Cancel</button><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save task'}</button></footer>
    </form>}</dialog>
  </div>;
}
