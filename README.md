# Tidepost

**Three letters. A changing tide. Find your way home.**

A quiet, turn-based postal puzzle for the browser. Cross bridges, catch ferries, wait for causeways, and deliver three letters before returning to the post office. Your finished route becomes a downloadable postcard.

Six small authored rounds. Unlimited undo. No timer, accounts, analytics, downloaded fonts, runtime dependencies or API calls.

## Run locally

Requires Node.js 22 or newer. No package install is needed.

```sh
npm start
```

Open http://127.0.0.1:4173. Play by clicking the islands or the route list. Keyboard players can use Tab and Enter.

## Rules

- Bridges are always open.
- Causeways open at Low and Falling tide.
- Ferries run at Rising and High tide.
- A route uses the tide shown **before** you move. Every move or wait advances the tide one phase.
- Letters are delivered automatically on arrival. Deliver all three and return home.
- Undo restores the previous turn. Restart begins the current round again.
- Optional turn targets match independently verified shortest routes. Every homecoming earns a postcard, whatever your score.
- Progress stays in the current tab only. Reloading begins a fresh round.

The sea never moves while you think.

## Develop and test

```sh
npm test
npm run build
SERVE_DIR=dist npm start
```

The optional browser suite uses Playwright only as a development tool. Install it with `npm install --no-save --package-lock=false playwright`, then `npx playwright install chromium`. With the production server running, run `npm run test:browser` in a second terminal. It tests all six rounds, four viewport widths, keyboard completion, postcard download, replay, blocked storage and reduced motion. Results go to the ignored `.artifacts/browser` directory. `TEST_URL`, `TEST_OUTPUT`, `CHROMIUM_PATH` and `PLAYWRIGHT_MODULE` support existing isolated test environments without a new browser install.

A pure engine owns the rules. An independent breadth-first reference solver checks every authored map and its shortest completion route. The build copies a small allowlist into `dist` and writes SHA-256 file identities.

- `src/engine.js` is the deterministic game model.
- `src/levels.js` contains six original maps.
- `src/app.js` connects the accessible HTML controls and postcard reward.
- `src/art.js` contains original SVG line drawings.
- `docs/` records the design, acceptance criteria and demo plan.

## Status

Playable development build. Release verification, public hosting, presentation and recorded demo are in progress. This source does not yet claim a verified public release.

## License

MIT. All game illustrations and authored maps were created for Tidepost. System fonts are used without redistribution.
