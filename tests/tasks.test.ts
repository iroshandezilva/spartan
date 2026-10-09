import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { overall, statuses, upsert, type Task } from '../lib/tasks';
import { readBoard, saveTask } from '../lib/task-store';
const task: Task = { id: 'button', title: 'Button', kind: 'Component', componentKey: 'button', development: 'Not started', figma: 'Not started', status: 'Done', priority: 'Normal', notes: '', figmaUrl: '', storybookUrl: '', updatedAt: '2026-10-09T00:00:00Z' };
test('all status combinations require both component tracks Done, regardless of status field', () => {
  for (const development of statuses) for (const figma of statuses) assert.equal(overall({ ...task, development, figma }) === 'Done', development === 'Done' && figma === 'Done');
  assert.equal(overall({...task, development:'Done',figma:'Blocked'}),'Blocked');
});
test('ordinary work has one status and component duplicates are rejected', () => {
  assert.equal(overall({...task,kind:'Documentation',status:'Done'}),'Done');
  const board=upsert({revision:0,tasks:[]},task);
  assert.throws(()=>upsert(board,{...task,id:'another',title:' button '}),/already has a task/);
  assert.throws(()=>upsert(board,{...task,figmaUrl:'javascript:alert(1)'}),/Links/);
});
test('task persistence survives reload and serializes stale concurrent writes', async () => {
  const dir=await mkdtemp(path.join(tmpdir(),'spartan-tasks-'));const file=path.join(dir,'tasks.json');
  try {
    await writeFile(file,JSON.stringify({revision:0,tasks:[]}));
    const results=await Promise.allSettled([saveTask(task,0,file),saveTask({...task,development:'Done'},0,file)]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    assert.equal(results.filter(r=>r.status==='rejected').length,1);
    assert.equal((await readBoard(file)).tasks[0].title,'Button');
    const next=await saveTask({...task,development:'Done',figma:'Done'},1,file);
    assert.equal(overall(next.tasks[0]),'Done');
    const reopened=await saveTask({...next.tasks[0],figma:'Review'},2,file);
    assert.notEqual(overall(reopened.tasks[0]),'Done');
    await writeFile(file,'broken');
    await assert.rejects(()=>saveTask(task,3,file));
  } finally {await rm(dir,{recursive:true,force:true});}
});
