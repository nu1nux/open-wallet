#!/bin/bash
set -e

# Milestone 4: Web App Build Test
# Verifies: Next.js web app builds successfully

echo "========================================"
echo "  M4: Web App Build Test"
echo "========================================"
echo ""

echo "Building web app..."
pnpm --filter @wallet-suite/web build

if [ -d "apps/web/.next" ]; then
    echo ""
    echo "✓ Web app build: PASS"
    echo ""
    echo "========================================"
    echo "  M4 Web Build: PASSED"
    echo "========================================"
else
    echo "✗ Web app build: FAIL"
    exit 1
fi
