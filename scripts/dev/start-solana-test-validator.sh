#!/bin/bash
set -e

# Start Solana Test Validator
# Default port: 8899

echo "Starting Solana Test Validator..."

# Check if solana-test-validator is installed
if ! command -v solana-test-validator &> /dev/null; then
    echo "Solana CLI not found. Please install:"
    echo "  sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Create ledger directory if it doesn't exist
mkdir -p .solana/test-ledger

# Start the validator
solana-test-validator \
    --ledger .solana/test-ledger \
    --rpc-port 8899 \
    --reset

# Note: The validator will airdrop SOL to accounts automatically
# Use solana airdrop <amount> <address> for more
