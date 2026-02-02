#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/../mattr_studio/apps/studio"
DST="$ROOT/apps/studio"

if [[ ! -d "$SRC" ]]; then
  echo "Source not found: $SRC" >&2
  exit 1
fi

if [[ ! -d "$DST" ]]; then
  echo "Destination not found: $DST" >&2
  exit 1
fi

rsync -a --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .turbo \
  --exclude tsconfig.tsbuildinfo \
  "$SRC"/ "$DST"/

echo "Synced: $SRC -> $DST"
