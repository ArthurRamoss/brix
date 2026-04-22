#!/bin/bash
set -e
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use default >/dev/null

cd "$HOME"
rm -rf anchor-test-tmp
echo "=== anchor init anchor-test-tmp ==="
anchor init anchor-test-tmp --no-install 2>&1 | tail -20
cd anchor-test-tmp

echo "=== anchor build ==="
anchor build 2>&1 | tail -30

echo "=== DONE ==="
