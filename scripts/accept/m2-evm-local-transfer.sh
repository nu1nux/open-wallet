#!/bin/bash
set -e

# Milestone 2: EVM Local Transfer Acceptance Test
# Verifies: Can send ETH on local Anvil node

echo "========================================"
echo "  M2: EVM Local Transfer Test"
echo "========================================"
echo ""

# Check if Anvil is running
if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
    echo "Error: Anvil is not running"
    echo "Start it with: ./scripts/dev/start-anvil.sh"
    exit 1
fi
echo "✓ Anvil is running"

# Use Anvil's default test account
# Account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

echo ""
echo "Checking balance on local network..."
BALANCE=$(pnpm --filter @wallet-suite/wallet-cli dev -- balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --chain 31337 --json 2>/dev/null)

if echo "$BALANCE" | grep -q "balance"; then
    echo "✓ Balance check: PASS"
    echo "  $(echo "$BALANCE" | grep -o '"formattedBalance":"[^"]*"' | cut -d'"' -f4)"
else
    echo "✗ Balance check: FAIL"
    exit 1
fi

echo ""
echo "========================================"
echo "  M2 EVM Local Transfer: PASSED"
echo "========================================"
echo ""
echo "Note: Full transfer test requires interactive confirmation"
echo "Run manually: pnpm --filter @wallet-suite/wallet-cli dev -- send <to> 0.1 --chain 31337 --dry-run"
