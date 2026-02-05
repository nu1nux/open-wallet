#!/bin/bash
set -e

# Milestone 5: Extension Build Test
# Verifies: Browser extension builds successfully

echo "========================================"
echo "  M5: Extension Build Test"
echo "========================================"
echo ""

echo "Building extension..."
pnpm --filter @wallet-suite/extension build

if [ -d "apps/extension/dist" ]; then
    echo ""
    echo "✓ Extension build: PASS"

    # Check for manifest
    if [ -f "apps/extension/dist/manifest.json" ]; then
        echo "✓ Manifest found"
    else
        echo "! Warning: manifest.json not found in dist"
    fi

    echo ""
    echo "========================================"
    echo "  M5 Extension Build: PASSED"
    echo "========================================"
    echo ""
    echo "Load the extension in Chrome:"
    echo "  1. Go to chrome://extensions"
    echo "  2. Enable Developer mode"
    echo "  3. Click 'Load unpacked'"
    echo "  4. Select apps/extension/dist"
else
    echo "✗ Extension build: FAIL"
    exit 1
fi
