import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/levels.js';
import { initialState, isOpen, transition, undo, complete, validateLevel, connections } from '../src/engine.js';
import { solve } from './reference-solver.mjs';
for (const level of levels) {
  test(`${level.title}: valid, independently solvable, exact replay and undo`, () => {
    assert.deepEqual(validateLevel(level), []);
    const route = solve(level);
    assert.ok(route && route.length < 30);
    assert.equal(level.par, route.length, 'Displayed challenge is independently achievable and optimal');
    let state = initialState(level);
    for (const action of route) {
      const prior = structuredClone(state);
      const result = transition(level, state, action);
      assert.equal(result.error, null);
      assert.deepEqual(undo(result.state), prior);
      state = result.state;
    }
    assert.ok(complete(level, state));
    assert.equal(state.turns, route.length);
    assert.equal(transition(level, state, { type: 'wait' }).state, state);
    console.log(`${level.id}: shortest ${route.length} turns; ${route.map(a => a.to || 'wait').join(' → ')}`);
  });
}
test('all route types across all four phases', () => {
  assert.deepEqual([0, 1, 2, 3].map(p => isOpen('bridge', p)), [true, true, true, true]);
  assert.deepEqual([0, 1, 2, 3].map(p => isOpen('causeway', p)), [true, false, false, true]);
  assert.deepEqual([0, 1, 2, 3].map(p => isOpen('ferry', p)), [false, true, true, false]);
  assert.equal(isOpen('unknown', 0), false);
});
test('invalid and closed moves do not mutate state or advance time', () => {
  const level = levels[0], state = initialState(level), copy = structuredClone(state);
  for (const action of [null, {}, {type:'fly'}, {type:'move',to:'missing'}, {type:'move',to:'bell'}, {type:'move',to:'post'}]) {
    assert.ok(transition(level, state, action).error);
    assert.equal(transition(level, state, action).state, state);
  }
  assert.deepEqual(state, copy);
  const atTern = { ...state, position: 'tern' };
  assert.ok(transition(level, atTern, {type:'move',to:'bell'}).error);
});
test('delivery on arrival, tide uses pre-action state, wait, and no early victory', () => {
  const level = levels[0];
  let state = initialState(level);
  state = transition(level, state, {type:'move',to:'tern'}).state;
  assert.equal(state.phase, 1); assert.equal(state.delivered, 1);
  state = transition(level, state, {type:'move',to:'bell'}).state;
  assert.equal(state.phase, 2); assert.equal(state.delivered, 3);
  assert.ok(transition(level, state, {type:'move',to:'gull'}).error);
  state = transition(level, state, {type:'wait'}).state;
  assert.equal(state.phase, 3); assert.equal(state.turns, 3);
  state = transition(level, state, {type:'move',to:'gull'}).state;
  assert.equal(state.delivered, 7); assert.equal(complete(level, state), false);
  state = transition(level, state, {type:'move',to:'post'}).state;
  assert.equal(complete(level, state), true);
});
test('revisits never redeliver and initial undo is a no-op', () => {
  const level = levels[0]; let state = initialState(level);
  assert.equal(undo(state), state);
  for (const to of ['tern','post','tern']) state = transition(level, state, {type:'move',to}).state;
  assert.equal(state.delivered, 1); assert.equal(state.turns, 3);
});
test('level validation catches corruption', () => {
  const bad = structuredClone(levels[0]); bad.edges.push({...bad.edges[0]}); bad.recipients[0] = bad.home;
  assert.ok(validateLevel(bad).length >= 2);
});
test('later maps have differing route-choice costs', () => {
  let meaningful = 0;
  for (const level of levels.slice(1)) {
    const root = initialState(level);
    const results = connections(level, root).filter(e => e.open).map(e => {
      const next = transition(level, root, {type:'move', to:e.to}).state;
      return 1 + solve(level, next).length;
    });
    if (new Set(results).size > 1) meaningful++;
  }
  assert.ok(meaningful >= 3, `Only ${meaningful} later maps have distinct opening-route costs`);
});
