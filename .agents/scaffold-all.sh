#!/usr/bin/env bash
# Full Anchor scaffold in one shot (idempotent where possible).
# Runs anchor init in /tmp, renames to brix, merges into repo.
set -e

DST=/mnt/c/Users/Ramos/Desktop/brix
SRC=/tmp/brix-scaffold

# === 1. Anchor init in /tmp ===
echo "=== anchor init ==="
rm -rf "$SRC"
cd /tmp
anchor init brix-scaffold --no-git 2>&1 | tail -5 || true

if [ ! -d "$SRC/programs" ]; then
  echo "ERR: anchor init did not produce programs/"
  exit 1
fi

cd "$SRC"

# === 2. Rename scaffold → brix ===
echo "=== renaming scaffold -> brix ==="
mv programs/brix-scaffold programs/brix
sed -i 's/name = "brix-scaffold"/name = "brix"/' programs/brix/Cargo.toml
sed -i 's/name = "brix_scaffold"/name = "brix"/' programs/brix/Cargo.toml
sed -i 's/pub mod brix_scaffold/pub mod brix/' programs/brix/src/lib.rs
sed -i 's/brix_scaffold = /brix = /' Anchor.toml
sed -i 's/package_manager = "yarn"/package_manager = "pnpm"/' Anchor.toml
sed -i 's/cluster = "localnet"/cluster = "devnet"/' Anchor.toml

# Clean yarn/app artifacts
rm -f yarn.lock
rm -rf node_modules target app

# === 3. Copy to real repo ===
echo "=== copying to $DST ==="
cp -r "$SRC/programs" "$DST/"
cp -r "$SRC/migrations" "$DST/"
cp "$SRC/Anchor.toml" "$DST/"
cp "$SRC/Cargo.toml" "$DST/"
cp "$SRC/rust-toolchain.toml" "$DST/"
cp "$SRC/.prettierignore" "$DST/"
cp "$SRC/package.json" "$DST/package.json.anchor"
cp "$SRC/tsconfig.json" "$DST/tsconfig.json"

# === 4. Merge .gitignore entries ===
for pattern in 'test-ledger' '.surfpool' '.yarn'; do
  if ! grep -Fxq "$pattern" "$DST/.gitignore" 2>/dev/null; then
    echo "$pattern" >> "$DST/.gitignore"
    echo "  + .gitignore: $pattern"
  fi
done

echo
echo "=== DONE ==="
ls -la "$DST/" | grep -vE '^total|^d.* \.$|^d.* \.\.$'
