// Optional Playwright check for the presentation and real recorded demo.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const output = resolve(process.env.TEST_OUTPUT || '.artifacts/delivery');
await mkdir(output, {recursive:true});
const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
const errors = [], failed = [], viewports = [];
try {
  const context = await browser.newContext({viewport:{width:1440,height:1000}, reducedMotion:'reduce'});
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if(r.status() >= 400) failed.push({url:r.url(), status:r.status()}); });
  for (const width of [320,390,820,1440]) {
    await page.setViewportSize({width,height:1000});
    for (const path of ['presentation.html','demo.html']) {
      await page.goto(new URL(path, base.endsWith('/') ? base : base + '/').href, {waitUntil:'networkidle'});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${path} overflow at ${width}`);
      assert.ok(await page.locator('h1').count());
      for (const img of await page.locator('img').all()) assert.equal(await img.evaluate(e => e.complete && e.naturalWidth > 0), true);
      await page.screenshot({path:`${output}/${path}-${width}.png`,fullPage:true});
      viewports.push({path,width,overflow:false});
    }
  }
  await page.goto(new URL('presentation.html', base.endsWith('/') ? base : base + '/').href);
  assert.equal(await page.locator('.slide').count(),5);
  await page.keyboard.press('ArrowRight');
  assert.equal(new URL(page.url()).hash,'#slide-2');
  await page.keyboard.press('ArrowLeft');
  assert.equal(new URL(page.url()).hash,'#slide-1');
  await page.locator('.deck-controls a').nth(4).click();
  assert.equal(new URL(page.url()).hash,'#slide-5');
  await page.emulateMedia({media:'print'});
  await page.pdf({path:`${output}/presentation.pdf`,preferCSSPageSize:true,printBackground:true});
  await page.emulateMedia({media:'screen'});
  await page.goto(new URL('demo.html', base.endsWith('/') ? base : base + '/').href);
  const playback = await page.locator('video').evaluate(async video => {
    await new Promise((resolve,reject) => {if(video.readyState >= 1)return resolve();video.addEventListener('loadedmetadata',resolve,{once:true});video.addEventListener('error',()=>reject(new Error(video.error?.message || 'Video failed')),{once:true});});
    video.muted = true;
    await video.play();
    await new Promise(resolve => video.addEventListener('timeupdate',resolve,{once:true}));
    video.pause();
    const played = video.currentTime > 0;
    const sought = new Promise(resolve => video.addEventListener('seeked',resolve,{once:true}));
    video.currentTime = Math.min(52,video.duration - 2);
    await sought;
    return {duration:video.duration,width:video.videoWidth,height:video.videoHeight,played,seekedTo:video.currentTime,error:video.error?.message || null};
  });
  assert.ok(playback.duration >= 60 && playback.duration <= 120);
  assert.equal(playback.played,true);
  assert.equal(playback.error,null);
  assert.ok(Math.abs(playback.seekedTo - 52) < 0.5, `seek landed at ${playback.seekedTo}, expected 52 seconds`);
  await page.locator('video').screenshot({path:`${output}/video-homecoming.png`});
  const captions = await context.request.get(new URL('public/demo.vtt',base.endsWith('/') ? base : base + '/').href);
  assert.equal(captions.status(),200);
  assert.match(captions.headers()['content-type'], /text\/vtt/);
  assert.match(await captions.text(),/Home in five turns/);
  assert.deepEqual(errors,[]);
  assert.deepEqual(failed,[]);
  const receipt={testedAt:new Date().toISOString(),base,slides:5,arrowKeys:true,slideLinks:true,printPdf:true,viewports,playback,captions:true,pageErrors:errors,failedRequests:failed};
  await writeFile(`${output}/receipt.json`,JSON.stringify(receipt,null,2));
  console.log(JSON.stringify(receipt,null,2));
} finally {await browser.close();}
