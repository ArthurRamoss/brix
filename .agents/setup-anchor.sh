#!/bin/bash
set -e
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use default

echo "=== Installing avm ==="
cargo install --git https://github.com/coral-xyz/anchor avm --force

echo "=== avm list-available (tail) ==="
avm list 2>&1 | tail -20 || true

echo "=== Installing latest anchor ==="
avm install latest
avm use latest

echo "=== Anchor version ==="
anchor --version
