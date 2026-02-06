# open-wallet

Open Wallet — Built for everyone, secured for you

A multi-chain cryptocurrency wallet supporting EVM chains (Ethereum, Polygon) and Solana. It consists of a web application (Next.js), browser extension (Chrome/Manifest V3), CLI, and core wallet engine with multiple wallet types (local, MPC, hardware).

## Requirements

- Node.js >= 22.21.1
- pnpm 9.15.0

## Quick Start

```bash
# Full setup (checks node, installs pnpm, builds, typechecks)
./scripts/bootstrap.sh

# Or manual installation
pnpm install
pnpm build
```

## Development

```bash
# Start dev mode with hot reload across all packages
pnpm dev

# Build all packages (Turbo-cached)
pnpm build
```

### Code Quality

```bash
pnpm lint          # Run ESLint
pnpm lint:fix      # Auto-fix lint issues
pnpm typecheck     # TypeScript type checking
pnpm format        # Prettier formatting
pnpm format:check  # Check formatting without changes
```

### Testing

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode for development

# Test specific package
pnpm --filter @open-wallet/keyring test
pnpm --filter @open-wallet/crypto test:watch
```

### Local Blockchains (Optional)

```bash
# Start Anvil (port 8545) + Solana (port 8899)
docker-compose -f infra/docker-compose.dev.yml up
```

### Acceptance Tests

```bash
./scripts/accept/m1-keyring.sh             # Test keyring functionality
./scripts/accept/m2-evm-local-transfer.sh  # EVM transfer tests (requires Anvil)
```

## Project Structure

```
apps/
├── web/           # Next.js 16, React 19, Zustand
└── extension/     # Chrome Extension (Manifest V3)

packages/
├── types/         # Core interfaces, enums, Result type
├── utils/         # Logger, retry logic, hex utilities
├── crypto/        # AES-256-GCM, PBKDF2/Scrypt KDF
├── storage/       # IndexedDB, Extension storage abstraction
├── keyring/       # BIP-39/32/44, HD derivation
├── rpc/           # RPC client with failover, rate limiting
├── chains-evm/    # EVM via viem (gas estimation, EIP-1559)
├── chains-solana/ # Solana via @solana/web3.js
├── wallet-core/   # Unified wallet interface, LocalWallet
├── security/      # Password/address validation, risk analysis
├── wallet-cli/    # CLI with Commander, inquirer
└── ui-kit/        # React components (Tailwind, CVA)
```

## Configuration

Copy `.env.example` to `.env` and configure RPC endpoints and security settings.

## License

MIT
