#!/usr/bin/env python3
"""Inspect npm archives and write a deterministic browser bundle."""
import json
import os
from pathlib import Path
import stat
import sys
import tarfile
import zipfile

command, *args = sys.argv[1:]
if command == 'inspect':
    archive, expected = args
    names = json.loads(expected)
    with tarfile.open(archive, 'r:gz') as tar:
        members = tar.getmembers()
        paths = [m.name.removeprefix('package/') for m in members]
        if any(not m.name.startswith('package/') or not m.isfile() for m in members):
            raise SystemExit('archive contains a non-file or unexpected root')
        if len(paths) != len(set(paths)) or sorted(paths) != sorted(names):
            raise SystemExit('archive file allowlist mismatch')
        if any(p.startswith('/') or '..' in Path(p).parts or '\\' in p for p in paths):
            raise SystemExit('unsafe archive path')
elif command == 'zip':
    source, destination = map(Path, args)
    files = []
    for directory, dirs, names in os.walk(source, followlinks=False):
        for name in dirs + names:
            path = Path(directory, name)
            if path.is_symlink(): raise SystemExit(f'symlink forbidden: {path}')
        for name in names:
            path = Path(directory, name)
            if not path.is_file(): raise SystemExit(f'non-file forbidden: {path}')
            files.append(path)
    with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(files):
            info = zipfile.ZipInfo(path.relative_to(source).as_posix(), (1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, path.read_bytes())
else:
    raise SystemExit('unknown archive operation')
