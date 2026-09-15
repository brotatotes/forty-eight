import { levels } from './levels.js';
import { building } from './art.js';
import { PHASES, initialState, transition, undo, complete, connections } from './engine.js';
const $ = id => document.getElementById(id);
let round = 0, level = levels[0], state = initialState(level), completedRoute = null, replaying = false;
const names = () => Object.fromEntries(level.nodes.map(n => [n.id, n.name]));
const rules = {bridge:'always open',causeway:'low / falling',ferry:'rising / high'};
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
$('round-select').innerHTML = levels.map((l, i) => `<option value="${i}">${String(i + 1).padStart(2, '0')} · ${l.title}</option>`).join('');
function render() {
  const focus = document.activeElement?.dataset?.island;
  const routeFocus = document.activeElement?.dataset?.to;
  const n = names();
  $('round-number').textContent = `POSTAL ROUND ${String(round + 1).padStart(2,'0')} / 06`;
  $('round-title').textContent = level.title;
  $('chart-id').textContent = String(round + 1).padStart(3,'0');
  $('tide-name').textContent = `${PHASES[state.phase]} water`;
  $('tide-symbol').textContent = ['▁','↗','▔','↘'][state.phase];
  $('forecast').innerHTML = [0,1,2,3].map(offset => {const phase = (state.phase + offset) % 4; return `<span class="phase ${offset === 0 ? 'current' : ''}">${PHASES[phase]}<br>${offset === 0 ? 'NOW' : `+${offset} turn${offset > 1 ? 's' : ''}`}</span>`;}).join('');
  const routes = connections(level, state);
  $('islands').innerHTML = level.nodes.map(node => {
    const recipient = level.recipients.indexOf(node.id);
    const delivered = recipient >= 0 && Boolean(state.delivered & (1 << recipient));
    const current = node.id === state.position;
    const route = routes.find(e => e.to === node.id);
    const detail = current ? 'You are here' : recipient >= 0 ? delivered ? 'Delivered' : 'Letter to deliver' : node.id === level.home ? 'Home port' : 'Passing place';
    return `<button class="island ${current ? 'current' : ''}" data-island="${node.id}" style="left:${node.x}%;top:${node.y}%" aria-label="${node.name}. ${detail}.${route ? ` ${route.type} ${route.open ? 'open' : 'closed'}.` : ''}">${current ? '<span class="you">YOU</span>' : ''}${recipient >= 0 ? `<span class="letter ${delivered ? 'delivered' : ''}" aria-hidden="true">${delivered ? '✓' : '✉'}</span>` : ''}<span class="building" aria-hidden="true">${building(node.kind)}</span><span class="island-name">${node.name}</span><span class="island-detail">${detail}</span></button>`;
  }).join('');
  $('routes-art').innerHTML = level.edges.map(edge => {
    const a = level.nodes.find(node => node.id === edge.a), b = level.nodes.find(node => node.id === edge.b);
    const open = edge.type === 'bridge' || (edge.type === 'causeway' ? [0,3] : [1,2]).includes(state.phase);
    const d = `M${a.x*7},${a.y*5.2} L${b.x*7},${b.y*5.2}`;
    return `<path class="path-under ${open ? '' : 'closed'}" d="${d}"/><path class="path-line ${edge.type} ${open ? '' : 'closed'}" d="${d}"/>`;
  }).join('');
  $('mail-list').innerHTML = level.recipients.map((id,i) => {const done = Boolean(state.delivered & (1 << i));return `<li class="${done ? 'done' : ''}"><span class="envelope" aria-hidden="true">${done ? '✓' : '✉'}</span>${n[id]}<span class="done-label">${done ? 'Delivered' : 'To deliver'}</span></li>`;}).join('');
  $('mail-count').textContent = `${level.recipients.filter((_,i) => state.delivered & (1 << i)).length} / 3 delivered`;
  $('position-name').textContent = n[state.position];
  $('route-list').innerHTML = routes.map(edge => `<button class="route-option ${edge.open ? 'open' : 'closed'}" data-to="${edge.to}" aria-label="Go to ${n[edge.to]} by ${edge.type}, ${edge.open ? 'open' : 'closed'}"><span>${n[edge.to]}<small>${edge.type[0].toUpperCase() + edge.type.slice(1)} · ${rules[edge.type]}</small></span><span class="route-state">${edge.open ? 'Go →' : 'Closed'}</span></button>`).join('');
  $('turn-count').textContent = state.turns;
  $('round-challenge').textContent = `Optional challenge · ${level.par} turns. Every homecoming counts.`;
  $('undo').disabled = replaying || state.history.length === 0;
  $('wait').disabled = replaying || complete(level,state);
  if (focus) document.querySelector(`[data-island="${focus}"]`)?.focus({preventScroll:true});
  if (routeFocus) (document.querySelector(`[data-to="${routeFocus}"]`) || document.querySelector(`[data-island="${state.position}"]`))?.focus({preventScroll:true});
}
function act(action) {
  if (replaying) { $('guidance').textContent = 'Use Next replay turn to follow your route, or Restart to play again.'; return; }
  const result = transition(level, state, action);
  if (result.error) { $('guidance').textContent = result.error; return; }
  state = result.state;
  render();
  const n = names();
  let message = `${action.type === 'wait' ? 'You watched the water for a while.' : `Arrived at ${n[state.position]}.`} ${PHASES[state.phase]} tide now.`;
  if (result.newlyDelivered) message = `Letter delivered to ${n[state.position]}. ${PHASES[state.phase]} tide now.`;
  if (round === 0 && state.position === 'bell' && state.phase === 2) message += ' The causeway opens at Falling. Try waiting one turn.';
  if (state.delivered === 7 && !complete(level,state)) message += ' Your satchel is empty. Head back to the post office.';
  $('guidance').textContent = message;
  if (complete(level,state)) showPostcard();
}
function start(index) {
  replaying = false;
  $('replay-step')?.remove();
  round = index; level = levels[index]; state = initialState(level); completedRoute = null;
  $('round-select').value = String(index); $('guidance').textContent = level.note; render();
}
function postcardSvg() {
  const n = names();
  const visited = [level.home, ...state.actions.filter(a => a.type === 'move').map(a => a.to)];
  const points = visited.map(id => {const node = level.nodes.find(item => item.id === id);return `${node.x*5.2+20},${node.y*2.5+55}`;}).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 390" role="img" aria-label="Completed route postcard for ${escape(level.title)}"><rect width="600" height="390" fill="#f7f2e6"/><rect x="15" y="15" width="570" height="360" fill="none" stroke="#163e49"/><text x="35" y="46" fill="#163e49" font-family="Georgia,serif" font-size="22">Greetings from ${escape(level.title)}</text><rect x="30" y="64" width="540" height="254" fill="#d6e7de"/><polyline points="${points}" fill="none" stroke="#ad3d28" stroke-width="3" stroke-linejoin="round"/>${level.nodes.map(node => `<circle cx="${node.x*5.2+20}" cy="${node.y*2.5+55}" r="13" fill="#f7f2e6" stroke="#163e49"/><text x="${node.x*5.2+20}" y="${node.y*2.5+81}" fill="#163e49" font-family="Arial,sans-serif" font-size="10" text-anchor="middle">${escape(n[node.id])}</text>`).join('')}<text x="35" y="345" fill="#163e49" font-family="Georgia,serif" font-size="16">Three letters delivered. Home in ${state.turns} turns.</text><text x="35" y="363" fill="#49666a" font-family="Arial,sans-serif" font-size="9" letter-spacing="2">TIDEPOST · ISLAND POSTAL SERVICE</text><g transform="translate(519 344) rotate(-10)"><circle r="25" fill="none" stroke="#ad3d28" stroke-width="2"/><text text-anchor="middle" y="4" fill="#ad3d28" font-family="Arial,sans-serif" font-size="10">POSTED</text></g></svg>`;
}
function showPostcard() {
  completedRoute = structuredClone(state);
  $('postcard-art').innerHTML = postcardSvg();
  $('postcard-summary').textContent = `All three letters found their people. You made it home in ${state.turns} turns. ${state.turns === level.par ? 'A perfectly timed round. You matched the shortest route.' : `A good day's post. If you fancy another voyage, try ${level.par} turns.`}`;
  $('next-round').textContent = round === levels.length - 1 ? 'Back to first light →' : 'Next round →';
  $('postcard-dialog').showModal();
}
$('islands').addEventListener('click', e => {const button = e.target.closest('[data-island]');if (button) act({type:'move',to:button.dataset.island});});
$('route-list').addEventListener('click', e => {const button = e.target.closest('[data-to]');if (button) act({type:'move',to:button.dataset.to});});
$('wait').onclick = () => act({type:'wait'});
$('undo').onclick = () => {state = undo(state); render(); $('guidance').textContent = `One turn back. ${PHASES[state.phase]} tide at ${names()[state.position]}.`;};
$('restart').onclick = () => start(round);
$('round-select').onchange = e => start(Number(e.target.value));
$('help-open').onclick = () => $('help-dialog').showModal();
document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => $(button.dataset.close).close());
// Keep Tab cycling through the modal controls, including in browsers that
// otherwise move focus into browser chrome at the end of a native dialog.
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...dialog.querySelectorAll('button:not(:disabled), a[href], select:not(:disabled), [tabindex="0"]')];
  const first = controls[0], last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}));
$('next-round').onclick = () => {$('postcard-dialog').close();start((round+1)%levels.length);$('chart').focus();};
$('download-card').onclick = () => {
  const url = URL.createObjectURL(new Blob([postcardSvg()],{type:'image/svg+xml'}));
  const a = document.createElement('a');a.href=url;a.download=`tidepost-${level.id}.svg`;a.click();setTimeout(() => URL.revokeObjectURL(url),1000);
};
$('replay').onclick = () => {
  if (!completedRoute) return;
  const actions = completedRoute.actions;
  replaying = true;
  $('postcard-dialog').close();
  state = initialState(level);render();
  let index = 0;
  const next = () => {
    if (index >= actions.length) { replaying = false; $('replay-step')?.remove(); render(); showPostcard(); return; }
    const result = transition(level,state,actions[index++]);state = result.state;render();
    $('guidance').textContent = `Replay ${index} / ${actions.length}. ${names()[state.position]}, ${PHASES[state.phase]} tide.`;
    if (index === actions.length) $('replay-step').textContent = 'Finish replay';
  };
  const button = document.createElement('button');button.id='replay-step';button.className='primary';button.textContent='Next replay turn →';button.onclick=next;
  $('replay-step')?.remove();$('guidance').after(button);button.focus();
};
start(0);
