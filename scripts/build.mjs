import { cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// dist is generated output. A clean allowlist build must never retain old files.
await rm('dist', {recursive:true, force:true});
await mkdir('dist', {recursive:true});
for (const path of ['index.html','src','public']) await cp(path, `dist/${path}`, {recursive:true});
const manifest = {};
async function walk(dir) {
  for (const item of (await readdir(dir,{withFileTypes:true})).sort((a,b) => a.name.localeCompare(b.name))) {
    const path = `${dir}/${item.name}`;
    if (item.isDirectory()) await walk(path);
    else if (!path.endsWith('/build-manifest.json')) manifest[path.slice(5)] = createHash('sha256').update(await readFile(path)).digest('hex');
  }
}
await walk('dist');
await writeFile('dist/build-manifest.json', JSON.stringify(manifest,null,2) + String.fromCharCode(10));
console.log(`Production build complete. ${Object.keys(manifest).length} files, no runtime dependencies.`);
for (const [path, hash] of Object.entries(manifest)) console.log(`${hash}  ${path}`);
