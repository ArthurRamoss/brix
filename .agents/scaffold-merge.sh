#!/usr/bin/env bash
# One-shot: merge anchor scaffold from /tmp into the real repo, then stage Next.js app
set -e

SRC=/tmp/brix-scaffold
DST=/mnt/c/Users/Ramos/Desktop/brix

if [ ! -d "$SRC" ]; then
  echo "ERR: $SRC not found. Run anchor init first."
  exit 1
fi

echo "=== Copying anchor artifacts ==="
cp -r "$SRC/programs" "$DST/"
cp -r "$SRC/migrations" "$DST/"
cp "$SRC/Anchor.toml" "$DST/"
cp "$SRC/Cargo.toml" "$DST/"
cp "$SRC/rust-toolchain.toml" "$DST/"
cp "$SRC/.prettierignore" "$DST/"
cp "$SRC/package.json" "$DST/package.json.anchor"
cp "$SRC/tsconfig.json" "$DST/tsconfig.json"

echo "=== Appending scaffold .gitignore entries (if missing) ==="
for pattern in 'test-ledger' '.surfpool' '.yarn'; do
  if ! grep -Fxq "$pattern" "$DST/.gitignore" 2>/dev/null; then
    echo "$pattern" >> "$DST/.gitignore"
    echo "  + $pattern"
  fi
done

echo
echo "=== Result ==="
ls -la "$DST/" | grep -vE '^total|^\.$|^\.\.$'
