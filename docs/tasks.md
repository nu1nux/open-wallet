# Wallet Suite Task Checklist

## Phase 1: Foundation

### Root Configuration
- [x] package.json with turbo scripts
- [x] pnpm-workspace.yaml
- [x] turbo.json
- [x] tsconfig.base.json
- [x] .eslintrc.cjs
- [x] .editorconfig
- [x] .env.example
- [x] .gitignore
- [x] .prettierrc

### Level 0 Packages (No Dependencies)
- [x] @open-wallet/types
  - [x] ChainId enum
  - [x] Chain configurations
  - [x] Account types
  - [x] Transaction types
  - [x] Result type (Ok/Err)
  - [x] Token types

- [x] @open-wallet/utils
  - [x] Logger
  - [x] Assert utilities
  - [x] Retry with backoff
  - [x] Hex utilities
  - [x] Timing utilities
  - [x] Validation utilities

### Level 1 Packages
- [x] @open-wallet/crypto
  - [x] KDF (PBKDF2, Scrypt)
  - [x] AES-256-GCM encryption
  - [x] Hashing (SHA-256, Keccak-256)
  - [x] Secure random

- [x] @open-wallet/storage
  - [x] Storage interface
  - [x] Memory storage
  - [x] IndexedDB storage
  - [x] Extension storage

### Level 2 Packages
- [x] @open-wallet/keyring
  - [x] Mnemonic generation
  - [x] HD derivation
  - [x] EVM accounts
  - [x] Solana accounts
  - [x] Keyring manager

- [x] @open-wallet/rpc
  - [x] RPC client
  - [x] Health checking
  - [x] Failover support
  - [x] Rate limiting

### Level 3 Packages
- [x] @open-wallet/chains-evm
  - [x] EVM client (viem)
  - [x] Transaction building
  - [x] Gas estimation
  - [x] ERC-20 support

- [x] @open-wallet/chains-solana
  - [x] Solana client
  - [x] Transaction building
  - [x] SPL token support

### Level 4 Packages
- [x] @open-wallet/wallet-core
  - [x] Base wallet interface
  - [x] Local wallet implementation
  - [x] MPC wallet stub

- [x] @open-wallet/security
  - [x] Threat model
  - [x] Password checker
  - [x] Address checker
  - [x] Transaction checker
  - [x] Audit logging

### Level 5 Packages
- [x] @open-wallet/wallet-cli
  - [x] Generate command
  - [x] Derive command
  - [x] Balance command
  - [x] Send command

- [x] @open-wallet/ui-kit
  - [x] Button component
  - [x] Card component
  - [x] Input component
  - [x] AddressDisplay component
  - [x] Balance component
  - [x] Spinner component
  - [x] Modal component
  - [x] Alert component

## Phase 2: Applications

### Web App (@open-wallet/web)
- [x] Next.js 14 setup
- [x] Tailwind CSS
- [x] App router
- [x] Wallet store (Zustand)
- [x] useWallet hook
- [x] CreateWallet component
- [x] UnlockWallet component
- [x] Dashboard component

### Browser Extension (@open-wallet/extension)
- [x] Vite + CRXJS setup
- [x] Manifest V3
- [x] Popup UI
- [x] Background service worker
- [x] Content script

## Phase 3: Scripts & Docs

### Scripts
- [x] bootstrap.sh
- [x] start-anvil.sh
- [x] start-solana-test-validator.sh
- [x] stop-all.sh
- [x] m0-foundation.sh
- [x] m1-keyring.sh
- [x] m2-evm-local-transfer.sh
- [x] m3-solana-local-transfer.sh
- [x] m4-web-build.sh
- [x] m5-extension-build.sh
- [x] m6-mpc-evm.sh (stub)
- [x] m7-mpc-solana.sh (stub)
- [x] m8-security-baseline.sh

### Documentation
- [x] roadmap.md
- [x] tasks.md
- [x] architecture.md
- [x] mpc/protocol.md
- [x] mpc/runbook.md

### Infrastructure
- [x] docker-compose.dev.yml
- [x] docker-compose.mpc.yml

## Phase 4: Future Work

### MPC Implementation
- [ ] Implement threshold ECDSA
- [ ] Party communication protocol
- [ ] Key generation ceremony
- [ ] Distributed signing
- [ ] Key refresh

### Additional Features
- [ ] Hardware wallet support
- [ ] WalletConnect integration
- [ ] Transaction history
- [ ] Address book
- [ ] Price feeds
