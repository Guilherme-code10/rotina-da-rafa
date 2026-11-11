import test from 'node:test';
import assert from 'node:assert/strict';
import {coverage, transition, createSeed, validateData, validDate} from '../assets/js/model.js';
test('coverage changes on exact renewal boundaries',()=>{
  assert.equal(coverage('2026-11-10','2026-11-11').label,'Revisar');
  assert.equal(coverage('2026-11-11','2026-11-11').label,'Renovar');
  assert.equal(coverage('2026-11-16','2026-11-11').label,'Renovar');
  assert.equal(coverage('2026-11-17','2026-11-11').label,'Em dia');
  assert.equal(coverage('').label,'Sem data');
});
test('completion keeps task and records timestamp; reopen clears completion',()=>{
  const original=createSeed().tasks[0];
  const completed=transition(original,'done',new Date('2026-11-11T12:00:00Z'));
  assert.equal(original.status,'todo');
  assert.equal(completed.completedAt,'2026-11-11T12:00:00.000Z');
  assert.equal(transition(completed,'done').completedAt,completed.completedAt);
  assert.equal(transition(completed,'todo').completedAt,null);
});
test('backup round trip preserves all original records',()=>{
  const seed=createSeed();
  assert.equal(seed.clients.length,16);assert.equal(seed.tasks.length,15);
  assert.deepEqual(validateData(JSON.parse(JSON.stringify(seed))),seed);
  assert.ok(seed.tasks.every(t=>!t.due&&t.status==='todo'));
});
test('invalid backups rejected before replacement',()=>{
  const data=createSeed();data.tasks[0].clientId='missing';assert.throws(()=>validateData(data));
  const duplicate=createSeed();duplicate.clients.push(duplicate.clients[0]);assert.throws(()=>validateData(duplicate));
  const status=createSeed();status.tasks[0].status='__proto__';assert.throws(()=>validateData(status));
  const done=createSeed();done.tasks[0].status='done';assert.throws(()=>validateData(done));
  assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2028-02-29'),true);
});
