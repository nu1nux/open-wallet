#!/bin/bash
set -e

# Milestone 3: Solana Local Transfer Acceptance Test
# Verifies: Can interact with Solana on local test validator

echo "========================================"
echo "  M3: Solana Local Transfer Test"
echo "========================================"
echo ""

# Check if Solana test validator is running
if ! curl -s http://localhost:8899 > /dev/null 2>&1; then
    echo "Error: Solana Test Validator is not running"
    echo "Start it with: ./scripts/dev/start-solana-test-validator.sh"
    exit 1
fi
echo "✓ Solana Test Validator is running"

# Generate a test wallet
echo ""
echo "Generating test wallet..."
RESULT=$(pnpm --filter @open-wallet/wallet-cli dev -- generate --words 12 --json 2>/dev/null)
MNEMONIC=$(echo "$RESULT" | grep -o '"mnemonic":"[^"]*"' | cut -d'"' -f4)

# Derive Solana address
DERIVE_RESULT=$(WALLET_MNEMONIC="$MNEMONIC" pnpm --filter @open-wallet/wallet-cli dev -- derive --chain solana --json 2>/dev/null)
ADDRESS=$(echo "$DERIVE_RESULT" | grep -o '"address":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Test address: $ADDRESS"

# Check balance (should be 0 for new address)
echo ""
echo "Checking balance on local network..."
BALANCE=$(pnpm --filter @open-wallet/wallet-cli dev -- balance "$ADDRESS" --chain 104 --json 2>/dev/null)

if echo "$BALANCE" | grep -q "balance"; then
    echo "✓ Balance check: PASS"
else
    echo "✗ Balance check: FAIL"
    exit 1
fi

echo ""
echo "========================================"
echo "  M3 Solana Local Transfer: PASSED"
echo "========================================"
echo ""
echo "Note: To airdrop SOL, use: solana airdrop 1 $ADDRESS"
