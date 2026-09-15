import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';

test('local server supports media seeking, HEAD, captions and invalid ranges', async () => {
  const child = spawn(process.execPath, ['scripts/serve.mjs'], {env:{...process.env, PORT:'4198'}, stdio:['ignore','pipe','pipe']});
  try {
    await once(child.stdout, 'data');
    const url = 'http://127.0.0.1:4198/public/tidepost-demo.mp4';
    const original = await readFile('public/tidepost-demo.mp4');
    const head = await fetch(url, {method:'HEAD'});
    assert.equal(head.status,200);
    assert.equal(head.headers.get('content-length'),String(original.length));
    assert.equal((await head.arrayBuffer()).byteLength,0);
    for (const [range,start,end] of [['bytes=0-99',0,99],['bytes=100-',100,original.length-1],['bytes=-50',original.length-50,original.length-1]]) {
      const response = await fetch(url, {headers:{Range:range}});
      assert.equal(response.status,206);
      assert.equal(response.headers.get('content-range'),`bytes ${start}-${end}/${original.length}`);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()),original.subarray(start,end+1));
    }
    for (const range of ['bytes=999999999-','bytes=10-2','bytes=-0','bytes=abc','bytes=0-1,4-5']) {
      const response = await fetch(url, {headers:{Range:range}});
      assert.equal(response.status,416);
    }
    assert.match((await fetch('http://127.0.0.1:4198/public/demo.vtt')).headers.get('content-type'),/text\/vtt/);
    assert.equal((await fetch(url, {method:'POST'})).status,405);
    assert.equal((await fetch('http://127.0.0.1:4198/missing')).status,404);
  } finally {
    const exit = once(child,'exit');
    child.kill();
    await exit;
  }
});
