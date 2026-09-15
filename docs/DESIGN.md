# Tidepost

Three letters. A changing tide. Find your way home.

## The experience
A quiet, turn-based postal puzzle. The opening screen is the game, not a landing page. A cream field book frames an illustrated sea chart. Small islands are large, labeled HTML buttons above decorative SVG routes. A vermilion courier marker says YOU. Three tiny envelopes become delivery stamps as the player arrives. Finish at the post office to turn the chart into a keepsake postcard.

The first round is called First light. The player can deliver to Tern House in one click. Contextual help explains the next relevant rule, without a modal tutorial. No timer, loss state, lockout or forced route. All six rounds are available from the round selector. Par is an optional invitation to return, never a completion requirement.

## Exact rules
State is position, tide phase, delivered-recipient bitmask and action history. The four phases cycle Low → Rising → High → Falling → Low. Every move or wait costs one turn. Route availability is evaluated at the CURRENT tide, then the tide advances. Bridges are always open. Causeways open at Low and Falling. Ferries run at Rising and High. All routes are bidirectional. Arrival automatically delivers a letter once. Completion requires all three deliveries AND returning home. Undo restores the entire previous state. Restart clears only the current attempt.

A player can always wait. The interface never suggests time passes on its own. Closed destinations stay focusable and explain their route restrictions when selected. A textual list of routes sits next to the chart so line styling is never the only source of information.

## Visual language
Original coastal field-guide illustrations. Paper #f7f2e6, ink #163e49, sea #d6e7de, deep sea #3e6c71, coral #ad3d28. Georgia headlines evoke a small letterpress publisher. System sans labels and tabular turn counts support play. No downloaded fonts, icons or stock artwork. Route types have distinct dashed, double and dotted strokes plus explicit labels in the route list. Open/closed states also use words, not only color.

Desktop shows a large chart at left and a narrow route journal at right. Below 760px the journal follows the chart. Controls are at least 44px high. The chart has a square mobile aspect ratio with labels positioned inside safe margins. No essential hover content. Focus uses a thick contrasting outline. Reduced motion removes decorative transitions.

## Technical approach
Vanilla HTML, CSS and ES modules. No runtime dependencies or network requests. Node's built-in test runner tests a pure engine. Six authored, deterministic map fixtures are checked by a separate breadth-first reference solver that does not call the engine transition function. DOM rendering preserves stable controls and keyboard focus. The postcard is generated SVG from trusted level data and recorded actions. A small localStorage record may save completed rounds, but storage failure must never prevent play.

Build copies a known allowlist into dist. No bundler required. Browser tests run in an isolated Playwright Chromium context. GitHub Pages serves dist using an Actions deployment if permitted. Source remains independently runnable via a local static server.

## Intentionally absent
Accounts, score servers, real geography, procedural maps, map editors, tracking, audio requirements, external APIs, multiplayer, paid resources and service workers. This is a small finished game, not a platform.
