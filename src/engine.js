export const PHASES = ['Low', 'Rising', 'High', 'Falling'];
export const OPEN_PHASES = Object.freeze({ bridge: [0, 1, 2, 3], causeway: [0, 3], ferry: [1, 2] });
export function isOpen(type, phase) { return OPEN_PHASES[type]?.includes(phase) ?? false; }
export function initialState(level) {
  return { position: level.home, phase: level.startPhase, delivered: 0, turns: 0, history: [], actions: [] };
}
export function complete(level, state) { return state.position === level.home && state.delivered === (1 << level.recipients.length) - 1; }
export function connections(level, state) {
  return level.edges.filter(e => e.a === state.position || e.b === state.position).map(e => ({ to: e.a === state.position ? e.b : e.a, type: e.type, open: isOpen(e.type, state.phase) }));
}
export function transition(level, state, action) {
  if (!action || !['move', 'wait'].includes(action.type)) return { state, error: 'Choose an island or wait for the tide.' };
  if (complete(level, state)) return { state, error: 'This round is complete. Choose another round or undo a turn.' };
  let position = state.position;
  if (action.type === 'move') {
    const route = connections(level, state).find(e => e.to === action.to);
    if (!route) return { state, error: 'There is no direct route to that island from here.' };
    if (!route.open) return { state, error: `That ${route.type} is closed at ${PHASES[state.phase].toLowerCase()} tide. Wait or choose another route.` };
    position = action.to;
  }
  const recipient = level.recipients.indexOf(position);
  const delivered = recipient === -1 ? state.delivered : state.delivered | (1 << recipient);
  const snapshot = { position: state.position, phase: state.phase, delivered: state.delivered, turns: state.turns };
  return { state: { position, phase: (state.phase + 1) % 4, delivered, turns: state.turns + 1, history: [...state.history, snapshot], actions: [...state.actions, {type:action.type, ...(action.type === 'move' ? {to:position} : {})}] }, newlyDelivered: delivered !== state.delivered, error: null };
}
export function undo(state) {
  if (!state.history.length) return state;
  return { ...state.history.at(-1), history: state.history.slice(0, -1), actions: state.actions.slice(0, -1) };
}
export function validateLevel(level) {
  const errors = [];
  const ids = level.nodes.map(n => n.id);
  if (ids.length > 8 || new Set(ids).size !== ids.length) errors.push('Invalid node count or duplicate identifiers');
  if (!ids.includes(level.home) || !Number.isInteger(level.startPhase) || level.startPhase < 0 || level.startPhase > 3) errors.push('Invalid starting state');
  if (level.recipients.length !== 3 || new Set(level.recipients).size !== 3 || level.recipients.some(id => id === level.home || !ids.includes(id))) errors.push('Invalid recipients');
  const edges = new Set();
  for (const e of level.edges) {
    const key = [e.a, e.b].sort().join('|');
    if (!ids.includes(e.a) || !ids.includes(e.b) || e.a === e.b || !Object.hasOwn(OPEN_PHASES, e.type) || edges.has(key)) errors.push('Invalid edge');
    edges.add(key);
  }
  return errors;
}
