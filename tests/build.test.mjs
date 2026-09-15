import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

test('production build removes stale output and repeats with identical hashes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tidepost-build-'));
  try {
    for (const path of ['scripts', 'index.html', 'presentation.html', 'demo.html', 'src', 'public']) await cp(new URL(`../${path}`, import.meta.url), join(dir, path), {recursive:true});
    await mkdir(join(dir, 'dist'));
    await writeFile(join(dir, 'dist', 'stale.txt'), 'This file must not ship.');
    const build = () => execFileSync(process.execPath, ['scripts/build.mjs'], {cwd:dir, encoding:'utf8'});
    assert.match(build(), /Production build complete/);
    const manifest = await readFile(join(dir, 'dist', 'build-manifest.json'), 'utf8');
    await assert.rejects(readFile(join(dir, 'dist', 'stale.txt')), {code:'ENOENT'});
    for (const [path, expected] of Object.entries(JSON.parse(manifest))) {
      assert.ok(['index.html', 'presentation.html', 'demo.html'].includes(path) || path.startsWith('src/') || path.startsWith('public/'));
      assert.equal(createHash('sha256').update(await readFile(join(dir, 'dist', path))).digest('hex'), expected);
    }
    build();
    assert.equal(await readFile(join(dir, 'dist', 'build-manifest.json'), 'utf8'), manifest);
  } finally { await rm(dir, {recursive:true, force:true}); }
});
