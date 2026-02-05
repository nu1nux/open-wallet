# Wallet Suite Roadmap

## Overview

Wallet Suite is a multi-chain cryptocurrency wallet supporting EVM chains and Solana, with web app, browser extension, and CLI interfaces.

## Milestones

### M0: Foundation (Current)
- [x] Project structure setup (pnpm + Turborepo)
- [x] TypeScript configuration
- [x] ESLint and Prettier setup
- [x] Core type definitions
- [x] Build pipeline

**Acceptance:** `./scripts/accept/m0-foundation.sh`

### M1: Keyring
- [x] BIP-39 mnemonic generation
- [x] BIP-32/44 HD derivation
- [x] EVM account derivation (secp256k1)
- [x] Solana account derivation (ed25519)
- [x] Encrypted keyring storage
- [x] CLI generate/derive commands

**Acceptance:** `./scripts/accept/m1-keyring.sh`

### M2: EVM Local Transfer
- [x] EVM client with viem
- [x] Transaction building
- [x] Gas estimation
- [x] EIP-1559 support
- [x] Transaction signing
- [x] Local Anvil integration

**Acceptance:** `./scripts/accept/m2-evm-local-transfer.sh`

### M3: Solana Local Transfer
- [x] Solana client with @solana/web3.js
- [x] Transaction building
- [x] Priority fees
- [x] Transaction signing
- [x] Local test validator integration

**Acceptance:** `./scripts/accept/m3-solana-local-transfer.sh`

### M4: Web App
- [x] Next.js 14 setup
- [x] Wallet state management (Zustand)
- [x] Create wallet flow
- [x] Unlock wallet flow
- [x] Account dashboard
- [x] UI components library

**Acceptance:** `./scripts/accept/m4-web-build.sh`

### M5: Browser Extension
- [x] Manifest V3 setup
- [x] Popup UI
- [x] Background service worker
- [x] Content script for dApp injection
- [x] Chrome storage integration

**Acceptance:** `./scripts/accept/m5-extension-build.sh`

### M6: MPC EVM (Future)
- [ ] Threshold signature scheme (2-of-3)
- [ ] Key generation ceremony
- [ ] Distributed signing protocol
- [ ] Key refresh mechanism
- [ ] Party communication layer

**Acceptance:** `./scripts/accept/m6-mpc-evm.sh`

### M7: MPC Solana (Future)
- [ ] Ed25519 threshold signatures
- [ ] Solana-specific MPC protocol
- [ ] SPL token support with MPC

**Acceptance:** `./scripts/accept/m7-mpc-solana.sh`

### M8: Security Baseline
- [x] Encryption (AES-256-GCM)
- [x] Key derivation (PBKDF2/Scrypt)
- [x] Password strength checking
- [x] Address validation
- [x] Transaction risk analysis
- [x] Audit logging

**Acceptance:** `./scripts/accept/m8-security-baseline.sh`

## Future Enhancements

### Token Support
- ERC-20 token transfers (implemented)
- SPL token transfers (implemented)
- NFT support (ERC-721, ERC-1155)
- Token list management
- Price feeds integration

### Multi-Chain Expansion
- Bitcoin support
- Cosmos ecosystem
- Layer 2 chains (Arbitrum, Optimism, Base)

### dApp Integration
- WalletConnect v2
- EIP-6963 provider discovery
- Transaction simulation
- Contract verification

### Security Enhancements
- Hardware wallet support (Ledger, Trezor)
- Social recovery
- Multi-sig support
- Phishing protection

### UX Improvements
- Transaction history
- Address book
- Custom networks
- Gas estimation UI
- Mobile apps (React Native)

## Timeline

| Milestone | Status | Target |
|-----------|--------|--------|
| M0 Foundation | Complete | - |
| M1 Keyring | Complete | - |
| M2 EVM Transfer | Complete | - |
| M3 Solana Transfer | Complete | - |
| M4 Web App | Complete | - |
| M5 Extension | Complete | - |
| M6 MPC EVM | Planned | TBD |
| M7 MPC Solana | Planned | TBD |
| M8 Security | Complete | - |
