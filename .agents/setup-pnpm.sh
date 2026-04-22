#!/bin/bash
set -e
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use default
which node
which corepack
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
