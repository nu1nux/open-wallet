#!/bin/bash
set -e

# Milestone 0: Foundation Acceptance Test
# Verifies: Build passes, lint passes

echo "========================================"
echo "  M0: Foundation Acceptance Test"
echo "========================================"
echo ""

PASS=0
FAIL=0

run_test() {
    local name=$1
    local cmd=$2

    echo -n "Testing: $name... "
    if eval "$cmd" > /dev/null 2>&1; then
        echo "✓ PASS"
        ((PASS++))
    else
        echo "✗ FAIL"
        ((FAIL++))
    fi
}

# Tests
run_test "pnpm install" "pnpm install"
run_test "pnpm build" "pnpm build"
run_test "pnpm lint" "pnpm lint"
run_test "pnpm typecheck" "pnpm typecheck"

# Summary
echo ""
echo "========================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "========================================"

if [ $FAIL -gt 0 ]; then
    exit 1
fi

echo ""
echo "M0 Foundation: PASSED"
