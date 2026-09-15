#!/usr/bin/env python3
"""Package a clean, built checkout. ZIP metadata and ordering are deterministic."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile


def git(*args):
    return subprocess.check_output(['git', *args]).decode().strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='.artifacts/release')
    args = parser.parse_args()
    if git('status', '--porcelain'):
        raise SystemExit('Commit the source before packaging. Working tree must be clean.')
    version = json.loads(Path('package.json').read_text())['version']
    manifest_bytes = Path('dist/build-manifest.json').read_bytes()
    manifest = json.loads(manifest_bytes)
    payload = {}
    for name in git('ls-files').splitlines():
        path = Path(name)
        if path.is_symlink() or not path.is_file():
            raise SystemExit(f'Unsupported source file: {name}')
        payload[name] = path.read_bytes()
    for name, expected in manifest.items():
        path = Path('dist') / name
        if path.is_symlink() or '..' in Path(name).parts or Path(name).is_absolute():
            raise SystemExit('Invalid build manifest path')
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != expected:
            raise SystemExit(f'Build identity mismatch: {name}')
        # Production assets must be exact copies of this clean source.
        if name not in payload or payload[name] != data:
            raise SystemExit(f'Build is stale or untracked: {name}')
        payload['dist/' + name] = data
    payload['dist/build-manifest.json'] = manifest_bytes
    identity = {'name':'Tidepost', 'version':version, 'sourceCommit':git('rev-parse', 'HEAD'),
                'buildManifestSha256':hashlib.sha256(manifest_bytes).hexdigest(),
                'run':'Node.js 22+. Run npm start and open http://127.0.0.1:4173. No install or internet required.'}
    payload['RELEASE.json'] = (json.dumps(identity, indent=2) + '\n').encode()
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    archive = out / f'tidepost-v{version}.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipped:
        for name, data in sorted(payload.items()):
            info = zipfile.ZipInfo('tidepost/' + name, date_time=(2026, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            zipped.writestr(info, data, compresslevel=9)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (out / 'SHA256SUMS.txt').write_text(f'{digest}  {archive.name}\n')
    print(json.dumps({**identity, 'archive':archive.name, 'sha256':digest, 'bytes':archive.stat().st_size}, indent=2))


if __name__ == '__main__':
    main()
