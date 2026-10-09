import { readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { type Task, type Board, validateBoard, upsert } from './tasks';
const globals = globalThis as typeof globalThis & { spartantWriteQueue?: Promise<unknown> };
export async function readBoard(file = path.join(process.cwd(), 'data/tasks.json')): Promise<Board> {
  const board: unknown = JSON.parse(await readFile(file, 'utf8'));
  validateBoard(board);
  return board;
}
export function saveTask(task: Task, revision: number, file = path.join(process.cwd(), 'data/tasks.json')): Promise<Board> {
  const work = (globals.spartantWriteQueue ?? Promise.resolve()).catch(() => {}).then(async () => {
    const board = await readBoard(file);
    if (board.revision !== revision) throw new Error('CONFLICT');
    const next = upsert(board, task);
    const temp = `${file}.${process.pid}.tmp`;
    await writeFile(temp, JSON.stringify(next, null, 2) + '\n');
    await rename(temp, file);
    return next;
  });
  globals.spartantWriteQueue = work;
  return work;
}
