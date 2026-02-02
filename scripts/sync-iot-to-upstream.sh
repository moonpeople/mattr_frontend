#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/apps/iot"
DST="$ROOT/../iot_studio/apps/studio"

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

# Patch path-specific references back to upstream layout
if [[ -f "$DST/Dockerfile" ]]; then
  perl -0pi -e 's/apps\/iot/apps\/studio/g' "$DST/Dockerfile"
fi

if [[ -f "$DST/scripts/__tests__/ratchet-eslint-rules.test.ts" ]]; then
  perl -0pi -e 's/apps\/iot/apps\/studio/g' "$DST/scripts/__tests__/ratchet-eslint-rules.test.ts"
fi

echo "Synced: $SRC -> $DST"
echo "Next:"
echo "  git -C \"$ROOT/../iot_studio\" status"
