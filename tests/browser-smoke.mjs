// Optional test-only Playwright installation. The shipped game has no dependencies.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { levels } from '../src/levels.js';
import { solve } from './reference-solver.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const output = resolve(process.env.TEST_OUTPUT || '.artifacts/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const errors = [], requests = [], rounds = [], layouts = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked for test', 'SecurityError'); } });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith(new URL(base).origin) && !request.url().startsWith('blob:')) requests.push(request.url()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#help-open').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#help-dialog').evaluate(e => e.open), true);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => Boolean(document.activeElement.closest('#help-dialog'))), true, 'Modal must keep keyboard focus');
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'help-open');
  assert.equal(await page.locator('#help-open').evaluate(e => getComputedStyle(e).outlineStyle), 'solid', 'Keyboard focus must be visible');
  // Real first-use path. A rejected crossing must not consume a turn.
  for (const id of ['tern', 'bell']) await page.locator(`[data-island="${id}"]`).click();
  await page.locator('[data-island="gull"]').click();
  assert.equal(await page.locator('#turn-count').textContent(), '2');
  assert.match(await page.locator('#guidance').textContent(), /closed/);
  await page.locator('#wait').click();
  for (const id of ['gull', 'post']) await page.locator(`[data-island="${id}"]`).click();
  assert.equal(await page.locator('#postcard-dialog').evaluate(e => e.open), true);
  await page.screenshot({ path: `${output}/postcard.png`, fullPage: true });
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-card').click();
  const download = await downloadPromise;
  await download.saveAs(`${output}/postcard.svg`);
  const svg = await readFile(`${output}/postcard.svg`, 'utf8');
  assert.match(svg, /Home in 5 turns/);
  assert.doesNotMatch(svg, /(?:href|src)=["']https?:/);
  assert.equal(await page.evaluate(xml => new DOMParser().parseFromString(xml, 'image/svg+xml').querySelector('parsererror') === null, svg), true);
  await page.locator('#replay').click();
  assert.equal(await page.locator('#wait').isDisabled(), true);
  await page.locator('[data-island="tern"]').click();
  assert.equal(await page.locator('#turn-count').textContent(), '0');
  for (let i = 0; i < 6; i++) await page.locator('#replay-step').click();
  assert.equal(await page.locator('#postcard-dialog').evaluate(e => e.open), true);
  await page.locator('#next-round').click();
  assert.equal(await page.locator('#round-select').inputValue(), '1');
  assert.equal(await page.locator('#replay-step').count(), 0);
  // Every map at narrow mobile, mobile, tablet and desktop. Test actual hit targets.
  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [index, level] of levels.entries()) {
      await page.selectOption('#round-select', String(index));
      const layout = await page.evaluate(() => {
        const nodes = [...document.querySelectorAll('[data-island]')];
        const collisions = [];
        const labels = nodes.map(n => ({ name: n.dataset.island, rect: n.querySelector('.island-name').getBoundingClientRect() }));
        for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
          const a = labels[i].rect, b = labels[j].rect;
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) collisions.push([labels[i].name, labels[j].name]);
        }
        return { overflow: document.documentElement.scrollWidth > innerWidth, collisions };
      });
      assert.equal(layout.overflow, false, `${level.id} overflows at ${width}`);
      assert.deepEqual(layout.collisions, [], `${level.id} labels overlap at ${width}`);
      await page.locator('#chart').screenshot({ path: `${output}/chart-${width}-${index + 1}.png` });
      for (const node of level.nodes) {
        await page.selectOption('#round-select', String(index));
        const target = page.locator(`[data-island="${node.id}"]`);
        await target.scrollIntoViewIfNeeded();
        const hit = await target.evaluate(e => { const r = e.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('[data-island]')?.dataset.island; });
        assert.equal(hit, node.id, `${level.id}/${node.id} hit target at ${width}`);
      }
      layouts.push({ round: level.id, width, ...layout });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Complete every round through the rendered UI, not by injecting game state.
  for (const [index, level] of levels.entries()) {
    await page.selectOption('#round-select', String(index));
    const route = solve(level);
    for (const action of route) await page.locator(action.type === 'wait' ? '#wait' : `[data-island="${action.to}"]`).click();
    assert.equal(await page.locator('#postcard-dialog').evaluate(e => e.open), true);
    assert.equal(await page.locator('#turn-count').textContent(), String(route.length));
    await page.keyboard.press('Escape');
    await page.locator('#undo').click();
    assert.equal(await page.locator('#turn-count').textContent(), String(route.length - 1));
    rounds.push({ round: level.id, turns: route.length });
  }
  // Complete the first round using only Tab and Enter, including dynamic rerenders.
  await page.reload({ waitUntil: 'networkidle' });
  for (const selector of ['[data-island="tern"]', '[data-island="bell"]', '#wait', '[data-island="gull"]', '[data-island="post"]']) {
    let found = false;
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Tab');
      if (await page.locator(selector).evaluate(e => e === document.activeElement)) { found = true; break; }
    }
    assert.ok(found, `Keyboard target unreachable: ${selector}`);
    await page.keyboard.press('Enter');
  }
  assert.equal(await page.locator('#postcard-dialog').evaluate(e => e.open), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.island), 'post');
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  const receipt = { testedAt: new Date().toISOString(), base, rounds, layouts, realSvgDownload: true, replay: true, keyboardCompletion: true, helpFocusReturn: true, dialogFocusTrap: true, visibleKeyboardFocus: true, postcardFocusReturn: true, reducedMotion: true, blockedStorage: true, pageErrors: errors, unexpectedRequests: requests };
  await writeFile(`${output}/receipt.json`, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt, null, 2));
} finally { await browser.close(); }
