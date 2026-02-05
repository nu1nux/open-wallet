#!/bin/bash
set -e

# Start Anvil (Foundry's local EVM node)
# Default port: 8545

echo "Starting Anvil (local EVM node)..."

# Check if anvil is installed
if ! command -v anvil &> /dev/null; then
    echo "Anvil not found. Please install Foundry:"
    echo "  curl -L https://foundry.paradigm.xyz | bash"
    echo "  foundryup"
    exit 1
fi

# Start anvil with deterministic accounts
anvil \
    --host 0.0.0.0 \
    --port 8545 \
    --accounts 10 \
    --balance 10000 \
    --block-time 1 \
    --chain-id 31337

# Note: Anvil creates 10 accounts with 10000 ETH each
# The first account private key is:
# 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
