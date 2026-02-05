#!/bin/bash
set -e

echo "========================================"
echo "  Wallet Suite Bootstrap Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ]; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 20 or higher: https://nodejs.org"
    exit 1
fi

if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js version must be 20 or higher (found v$NODE_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js v$(node -v)${NC}"

# Check pnpm
echo ""
echo "Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm v$(pnpm -v)${NC}"

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install

# Build packages
echo ""
echo "Building packages..."
pnpm build

# Run type check
echo ""
echo "Running type check..."
pnpm typecheck || true

# Run linting
echo ""
echo "Running linter..."
pnpm lint || true

# Copy env file
echo ""
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${YELLOW}! .env file already exists, skipping...${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}  Bootstrap Complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Update .env with your RPC URLs"
echo "  2. Run 'pnpm dev' to start development"
echo "  3. Run 'pnpm test' to run tests"
echo ""
