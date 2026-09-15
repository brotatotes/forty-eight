// Independent reference implementation. Deliberately imports no production engine.
export function solve(level, start = null) {
  const recipients = Object.fromEntries(level.recipients.map((id, i) => [id, 2 ** i]));
  const goal = 2 ** level.recipients.length - 1;
  const root = start || { position: level.home, phase: level.startPhase, delivered: 0 };
  const queue = [{ ...root, path: [] }];
  const seen = new Set();
  for (let head = 0; head < queue.length; head++) {
    const item = queue[head];
    const key = `${item.position}/${item.phase}/${item.delivered}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (item.position === level.home && item.delivered === goal) return item.path;
    const next = [{ type: 'wait' }];
    for (const edge of level.edges) {
      const valid = edge.type === 'bridge' || (edge.type === 'causeway' ? [0, 3] : [1, 2]).includes(item.phase);
      if (valid && [edge.a, edge.b].includes(item.position)) next.push({ type: 'move', to: edge.a === item.position ? edge.b : edge.a });
    }
    for (const action of next) {
      const position = action.to || item.position;
      queue.push({ position, phase: (item.phase + 1) % 4, delivered: item.delivered | (recipients[position] || 0), path: [...item.path, action] });
    }
  }
  return null;
}
