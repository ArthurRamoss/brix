#!/bin/bash
set -e
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

KEY_PATH="$HOME/.config/solana/id.json"

if [ -f "$KEY_PATH" ]; then
  echo "=== Keypair ja existe em $KEY_PATH ==="
else
  echo "=== Gerando keypair (sem passphrase para dev; trocar se for mainnet) ==="
  mkdir -p "$HOME/.config/solana"
  solana-keygen new --no-bip39-passphrase --outfile "$KEY_PATH" --force
fi

echo "=== Configurando devnet ==="
solana config set --url devnet

echo "=== Config atual ==="
solana config get

echo "=== Address ==="
solana address

echo "=== Airdrop 2 SOL ==="
solana airdrop 2 || echo "Airdrop falhou (rate limit comum). Tentaremos de novo depois."

echo "=== Balance ==="
solana balance
