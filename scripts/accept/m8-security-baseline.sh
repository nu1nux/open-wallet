#!/bin/bash
set -e

# Milestone 8: Security Baseline Test
# Verifies: Basic security measures are in place

echo "========================================"
echo "  M8: Security Baseline Test"
echo "========================================"
echo ""

PASS=0
FAIL=0

check() {
    local name=$1
    local condition=$2

    echo -n "Checking: $name... "
    if eval "$condition"; then
        echo "✓ PASS"
        ((PASS++))
    else
        echo "✗ FAIL"
        ((FAIL++))
    fi
}

# Check that encryption is used
check "Encryption module exists" "[ -f packages/crypto/src/encryption.ts ]"

# Check that KDF is used
check "KDF module exists" "[ -f packages/crypto/src/kdf.ts ]"

# Check that secure random is used
check "Secure random module exists" "[ -f packages/crypto/src/random.ts ]"

# Check password strength checker
check "Password checker exists" "[ -f packages/security/src/password-checker.ts ]"

# Check address validation
check "Address checker exists" "[ -f packages/security/src/address-checker.ts ]"

# Check transaction validation
check "Transaction checker exists" "[ -f packages/security/src/tx-checker.ts ]"

# Check audit logging
check "Audit log exists" "[ -f packages/security/src/audit-log.ts ]"

# Check that .env is in gitignore
check ".env in gitignore" "grep -q '^\.env$' .gitignore"

# Check that key material patterns are in gitignore
check "Key material in gitignore" "grep -q '\.keyshare' .gitignore"

# Check that node_modules is in gitignore
check "node_modules in gitignore" "grep -q 'node_modules' .gitignore"

# Summary
echo ""
echo "========================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "========================================"

if [ $FAIL -gt 0 ]; then
    echo ""
    echo "M8 Security Baseline: FAILED"
    exit 1
fi

echo ""
echo "M8 Security Baseline: PASSED"
echo ""
echo "Note: This is a basic check. A full security audit should include:"
echo "  - Dependency vulnerability scanning (npm audit)"
echo "  - Static analysis (eslint-plugin-security)"
echo "  - Dynamic testing"
echo "  - Penetration testing"
