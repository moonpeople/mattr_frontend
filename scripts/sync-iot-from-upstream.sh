#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/../iot_studio/apps/studio"
DST="$ROOT/apps/iot"

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

# Patch path-specific references for mattr layout
if [[ -f "$DST/Dockerfile" ]]; then
  perl -0pi -e 's/apps\/studio/apps\/iot/g' "$DST/Dockerfile"
fi

if [[ -f "$DST/scripts/__tests__/ratchet-eslint-rules.test.ts" ]]; then
  perl -0pi -e 's/apps\/studio/apps\/iot/g' "$DST/scripts/__tests__/ratchet-eslint-rules.test.ts"
fi

echo "Synced: $SRC -> $DST"
