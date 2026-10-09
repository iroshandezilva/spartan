export const statuses = ['Not started', 'In progress', 'Review', 'Blocked', 'Needs verification', 'Done'] as const;
export const kinds = ['Component', 'Documentation', 'Plugin', 'Infrastructure', 'Research'] as const;
export type Status = typeof statuses[number];
export type Kind = typeof kinds[number];
export type Task = {
  id: string; title: string; kind: Kind; componentKey?: string;
  development: Status; figma: Status; status: Status;
  priority: 'High' | 'Normal' | 'Low'; notes: string;
  figmaUrl: string; storybookUrl: string; updatedAt: string;
};
export type Board = { revision: number; tasks: Task[] };
export function overall(task: Task): Status {
  if (task.kind !== 'Component') return task.status;
  const stages = [task.development, task.figma];
  if (stages.every(s => s === 'Done')) return 'Done';
  if (stages.includes('Blocked')) return 'Blocked';
  if (stages.every(s => s === 'Not started')) return 'Not started';
  if (stages.includes('In progress')) return 'In progress';
  if (stages.includes('Needs verification')) return 'Needs verification';
  if (stages.includes('Review')) return 'Review';
  return 'In progress';
}
export function componentKey(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function validUrl(value: unknown) {
  if (value === '') return true;
  if (typeof value !== 'string') return false;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
export function validateTask(value: unknown): asserts value is Task {
  if (!value || typeof value !== 'object') throw new Error('Invalid task.');
  const t = value as Task;
  if (typeof t.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(t.id)) throw new Error('Invalid task ID.');
  if (typeof t.title !== 'string' || !t.title.trim() || t.title.length > 120) throw new Error('Use a title between 1 and 120 characters.');
  if (!kinds.includes(t.kind)) throw new Error('Choose a valid task type.');
  for (const key of ['development', 'figma', 'status'] as const) if (!statuses.includes(t[key])) throw new Error('Choose a valid status.');
  if (!['High', 'Normal', 'Low'].includes(t.priority)) throw new Error('Choose a valid priority.');
  if (typeof t.notes !== 'string' || t.notes.length > 12000) throw new Error('Notes must be at most 12,000 characters.');
  if (!validUrl(t.figmaUrl) || !validUrl(t.storybookUrl)) throw new Error('Links must start with https:// or http://.');
  if (t.kind === 'Component' && (!t.componentKey || t.componentKey !== componentKey(t.title))) throw new Error('Component key must match its name.');
  if (typeof t.updatedAt !== 'string' || !Number.isFinite(Date.parse(t.updatedAt))) throw new Error('Invalid update date.');
}
export function validateBoard(value: unknown): asserts value is Board {
  const b = value as Board;
  if (!b || !Number.isInteger(b.revision) || b.revision < 0 || !Array.isArray(b.tasks) || b.tasks.length > 2000) throw new Error('Invalid task file.');
  const ids = new Set<string>(), components = new Set<string>();
  for (const t of b.tasks) {
    validateTask(t);
    if (ids.has(t.id)) throw new Error('Duplicate task ID.');
    ids.add(t.id);
    if (t.kind === 'Component') {
      if (components.has(t.componentKey!)) throw new Error('This component already has a task. Update the existing task.');
      components.add(t.componentKey!);
    }
  }
}
export function upsert(board: Board, input: Task): Board {
  validateTask(input);
  const old = board.tasks.find(t => t.id === input.id);
  if (old && old.kind !== input.kind) throw new Error('The task type cannot be changed.');
  const task = { ...input, title: input.title.trim(), updatedAt: new Date().toISOString() };
  const next = { revision: board.revision + 1, tasks: old ? board.tasks.map(t => t.id === task.id ? task : t) : [...board.tasks, task] };
  validateBoard(next);
  return next;
}
