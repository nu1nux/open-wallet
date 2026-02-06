#!/bin/bash
set -e

# Milestone 1: Keyring Acceptance Test
# Verifies: Mnemonic generation and account derivation

echo "========================================"
echo "  M1: Keyring Acceptance Test"
echo "========================================"
echo ""

# Build first
pnpm build

# Run the CLI to generate a mnemonic
echo "Testing mnemonic generation..."
RESULT=$(pnpm --filter @open-wallet/wallet-cli dev -- generate --words 12 --json 2>/dev/null)

# Check if mnemonic was generated
if echo "$RESULT" | grep -q "mnemonic"; then
    echo "✓ Mnemonic generation: PASS"
else
    echo "✗ Mnemonic generation: FAIL"
    exit 1
fi

# Test derivation
echo ""
echo "Testing account derivation..."
MNEMONIC=$(echo "$RESULT" | grep -o '"mnemonic":"[^"]*"' | cut -d'"' -f4)

DERIVE_RESULT=$(WALLET_MNEMONIC="$MNEMONIC" pnpm --filter @open-wallet/wallet-cli dev -- derive --chain evm --count 2 --json 2>/dev/null)

if echo "$DERIVE_RESULT" | grep -q "0x"; then
    echo "✓ EVM account derivation: PASS"
else
    echo "✗ EVM account derivation: FAIL"
    exit 1
fi

DERIVE_SOL=$(WALLET_MNEMONIC="$MNEMONIC" pnpm --filter @open-wallet/wallet-cli dev -- derive --chain solana --count 2 --json 2>/dev/null)

if echo "$DERIVE_SOL" | grep -q "address"; then
    echo "✓ Solana account derivation: PASS"
else
    echo "✗ Solana account derivation: FAIL"
    exit 1
fi

echo ""
echo "========================================"
echo "  M1 Keyring: PASSED"
echo "========================================"
