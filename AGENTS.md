# AGENTS.md

This file provides guidance to Code Agent when working with code in this repository.

## Project Overview

Open Wallet is a multi-chain cryptocurrency wallet supporting EVM chains (Ethereum, Polygon) and Solana. It consists of a web application (Next.js), browser extension (Chrome/Manifest V3), CLI, and core wallet engine with multiple wallet types (local, MPC, hardware).

## Commands

```bash
# Setup
./scripts/bootstrap.sh    # Full setup (checks node, installs pnpm, builds, typechecks)
pnpm install              # Install dependencies

# Development
pnpm dev                  # Start dev mode (hot reload across packages)
pnpm build                # Compile all packages (Turbo-cached)

# Code Quality
pnpm lint                 # Run ESLint
pnpm lint:fix             # Auto-fix lint issues
pnpm typecheck            # TypeScript type checking
pnpm format               # Prettier formatting
pnpm format:check         # Check formatting without changes

# Testing
pnpm test                 # Run all tests
pnpm test:watch           # Watch mode for development

# Individual package testing (from package directory)
pnpm --filter @open-wallet/keyring test        # Test specific package
pnpm --filter @open-wallet/crypto test:watch   # Watch specific package

# Local blockchains (optional)
docker-compose -f infra/docker-compose.dev.yml up  # Anvil (8545) + Solana (8899)

# Milestone acceptance tests
./scripts/accept/m1-keyring.sh                 # Test keyring functionality
./scripts/accept/m2-evm-local-transfer.sh      # EVM transfer tests (requires Anvil)
```

## Architecture

### Monorepo Structure

- **Package Manager**: pnpm 9.15.0 with workspaces
- **Build Orchestration**: Turborepo (dependency-aware caching)
- **Node Version**: >=22.21.1

### Package Dependency Layers (strict, no circular dependencies)

```
Layer 5 - Interfaces
├── @open-wallet/wallet-cli    # CLI with Commander, inquirer
└── @open-wallet/ui-kit        # React components (Tailwind, CVA)

Layer 4 - Core
├── @open-wallet/wallet-core   # Unified wallet interface, LocalWallet
└── @open-wallet/security      # Password/address validation, risk analysis

Layer 3 - Chain Support
├── @open-wallet/chains-evm    # EVM via viem (gas estimation, EIP-1559)
└── @open-wallet/chains-solana # Solana via @solana/web3.js

Layer 2 - Key Management
├── @open-wallet/keyring       # BIP-39/32/44, HD derivation, account generation
└── @open-wallet/rpc           # RPC client with failover, rate limiting

Layer 1 - Infrastructure
├── @open-wallet/crypto        # AES-256-GCM, PBKDF2/Scrypt KDF
└── @open-wallet/storage       # IndexedDB, Extension storage abstraction

Layer 0 - Foundation
├── @open-wallet/types         # Core interfaces, enums, Result type
└── @open-wallet/utils         # Logger, retry logic, hex utilities
```

### Applications

- `apps/web/` - Next.js 16, React 19, Zustand state management
- `apps/extension/` - Vite + @crxjs/vite-plugin, Chrome Manifest V3

### Result Type Pattern

All packages use a Rust-inspired Result type for error handling (no exceptions):

```typescript
import { Result, ok, err, ErrorCode, unwrap, isOk } from '@open-wallet/types';

function doSomething(): Result<Data> {
  if (failed) return err(ErrorCode.SOME_ERROR, 'Description');
  return ok(data);
}

// Usage
const result = doSomething();
if (isOk(result)) {
  const value = result.value;
}
```

## Key Conventions

- **Package naming**: `@open-wallet/*` scope
- **Internal dependencies**: Use `workspace:*` in package.json
- **Module format**: ESM only (`"type": "module"`)
- **Error handling**: Always use Result type, never throw in library code
- **Build output**: Each package builds from `src/` to `dist/`
- **TypeScript**: Strict mode, ES2022 target, bundler module resolution

## Configuration Files

- `tsconfig.base.json` - Base TypeScript config (all packages extend this)
- `.eslintrc.cjs` - ESLint with TypeScript parser
- `.prettierrc` - Single quotes, 2-space indent, 100 char width
- `.env.example` - RPC endpoints, security settings (copy to `.env`)
- `turbo.json` - Turbo pipeline (build, test, lint tasks)

## Security Notes

- All wallet keys encrypted at rest (AES-256-GCM)
- PBKDF2 with 600k iterations for key derivation
- Session auto-lock after 15 minutes (configurable via env)
- Transaction risk analysis before signing
