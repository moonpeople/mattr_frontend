#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${1:-$ROOT/../mattr_builder}"

APP_SRC="$ROOT/apps/builder"
PACKAGES_SRC="$ROOT/packages"
WORKSPACE_FILE="$ROOT/pnpm-workspace.yaml"

if [[ ! -d "$APP_SRC" ]]; then
  echo "Source app not found: $APP_SRC" >&2
  exit 1
fi

if [[ ! -d "$PACKAGES_SRC" ]]; then
  echo "Source packages not found: $PACKAGES_SRC" >&2
  exit 1
fi

if [[ ! -f "$WORKSPACE_FILE" ]]; then
  echo "Workspace file not found: $WORKSPACE_FILE" >&2
  exit 1
fi

PACKAGE_DIRS=()
while IFS= read -r line; do
  if [[ -n "$line" ]]; then
    PACKAGE_DIRS+=("$line")
  fi
done < <(node - "$ROOT" <<'NODE'
const fs = require('fs')
const path = require('path')

const root = process.argv[2]
const packagesRoot = path.join(root, 'packages')
const appPkgPath = path.join(root, 'apps', 'builder', 'package.json')

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

const workspaceNames = (pkg) => {
  const out = []
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    const deps = pkg[section] || {}
    for (const [name, version] of Object.entries(deps)) {
      if (typeof version === 'string' && version.startsWith('workspace:')) {
        out.push(name)
      }
    }
  }
  return out
}

const nameToDir = new Map()
for (const dir of fs.readdirSync(packagesRoot)) {
  const pkgPath = path.join(packagesRoot, dir, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    continue
  }
  const pkg = readJson(pkgPath)
  if (pkg && typeof pkg.name === 'string') {
    nameToDir.set(pkg.name, dir)
  }
}

const appPkg = readJson(appPkgPath)
const queue = [...workspaceNames(appPkg)]
const selected = new Set()

while (queue.length > 0) {
  const pkgName = queue.shift()
  if (!pkgName || selected.has(pkgName)) {
    continue
  }
  selected.add(pkgName)

  const dir = nameToDir.get(pkgName)
  if (!dir) {
    continue
  }

  const pkgPath = path.join(packagesRoot, dir, 'package.json')
  const pkg = readJson(pkgPath)
  for (const depName of workspaceNames(pkg)) {
    if (!selected.has(depName)) {
      queue.push(depName)
    }
  }
}

const dirs = [...selected]
  .map((name) => nameToDir.get(name))
  .filter(Boolean)
  .sort()

process.stdout.write(`${dirs.join('\n')}\n`)
NODE
)

if [[ ${#PACKAGE_DIRS[@]} -eq 0 ]]; then
  echo "No workspace packages resolved for apps/builder" >&2
  exit 1
fi

mkdir -p "$DEST/apps" "$DEST/packages"

rsync -a --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .turbo \
  --exclude coverage \
  --exclude tsconfig.tsbuildinfo \
  --exclude .DS_Store \
  "$APP_SRC"/ "$DEST/apps/builder"/

for dir in "${PACKAGE_DIRS[@]}"; do
  rsync -a --delete \
    --exclude node_modules \
    --exclude dist \
    --exclude .turbo \
    --exclude coverage \
    --exclude tsconfig.tsbuildinfo \
    --exclude .DS_Store \
    "$PACKAGES_SRC/$dir"/ "$DEST/packages/$dir"/
done

cp "$WORKSPACE_FILE" "$DEST/pnpm-workspace.yaml"

cat > "$DEST/package.json" <<'JSON'
{
  "name": "mattr-builder-workspace",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@10.24.0",
  "scripts": {
    "dev": "pnpm --filter ./apps/builder dev:platform",
    "dev:standalone": "pnpm --filter ./apps/builder dev:standalone",
    "build": "pnpm --filter ./apps/builder build",
    "lint": "pnpm --filter ./apps/builder lint",
    "typecheck": "pnpm --filter ./apps/builder typecheck",
    "test": "pnpm --filter ./apps/builder test"
  }
}
JSON

cat > "$DEST/.gitignore" <<'EOF'
node_modules
.pnpm-store
.turbo

apps/*/node_modules
apps/*/.next
apps/*/coverage
apps/*/tsconfig.tsbuildinfo

packages/*/node_modules
packages/*/dist
packages/*/coverage
packages/*/tsconfig.tsbuildinfo
EOF

echo "Builder app extracted to: $DEST"
echo "Copied app: apps/builder"
echo "Copied packages (${#PACKAGE_DIRS[@]}):"
for dir in "${PACKAGE_DIRS[@]}"; do
  echo "  - packages/$dir"
done
echo
echo "Next steps:"
echo "  cd \"$DEST\""
echo "  pnpm install"
echo "  pnpm dev:standalone   # or pnpm dev"
