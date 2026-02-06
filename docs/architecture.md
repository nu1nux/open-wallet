# Wallet Suite Architecture

## Overview

Wallet Suite is a modular, multi-chain cryptocurrency wallet built as a pnpm monorepo with Turborepo for build orchestration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Applications                             │
├─────────────────┬─────────────────┬────────────────────────────┤
│   Web (Next.js) │ Extension (Vite)│    CLI (Commander)          │
└────────┬────────┴────────┬────────┴───────────┬────────────────┘
         │                 │                     │
         └────────────────┬┴─────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                      wallet-core                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ LocalWallet  │  │  MpcWallet   │  │ HardwareWallet│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
┌────────┴───────┐ ┌───────┴───────┐ ┌──────┴────────┐
│   chains-evm   │ │ chains-solana │ │   security    │
│    (viem)      │ │ (@solana/web3)│ │               │
└────────┬───────┘ └───────┬───────┘ └───────────────┘
         │                 │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │     keyring     │
         │  (BIP-32/39)    │
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───┴────┐ ┌──────┴─────┐ ┌────┴────┐
│ crypto │ │  storage   │ │   rpc   │
└───┬────┘ └──────┬─────┘ └────┬────┘
    │             │            │
    └─────────────┼────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────┴────┐     ┌──────┴────┐
    │  types  │     │   utils   │
    └─────────┘     └───────────┘
```

## Package Dependencies

### Layer 0: Foundation
- **@open-wallet/types** - TypeScript types, enums, interfaces
- **@open-wallet/utils** - Logging, retry, timing, validation utilities

### Layer 1: Infrastructure
- **@open-wallet/crypto** - Encryption, KDF, hashing (uses @noble/*)
- **@open-wallet/storage** - Storage abstraction (IndexedDB, extension)

### Layer 2: Key Management
- **@open-wallet/keyring** - HD derivation, account management (uses @scure/*)
- **@open-wallet/rpc** - RPC client with failover and rate limiting

### Layer 3: Chain Support
- **@open-wallet/chains-evm** - EVM transaction support (uses viem)
- **@open-wallet/chains-solana** - Solana transaction support (uses @solana/web3.js)

### Layer 4: Wallet Core
- **@open-wallet/wallet-core** - Unified wallet interface
- **@open-wallet/security** - Security utilities and checks

### Layer 5: Interface
- **@open-wallet/wallet-cli** - Command-line interface
- **@open-wallet/ui-kit** - React UI components

## Key Design Decisions

### 1. Monorepo with Turborepo
- **Why:** Shared code, consistent tooling, atomic changes
- **Build:** Cached builds with dependency tracking
- **Development:** Hot reload across packages

### 2. Type-Safe Result Pattern
```typescript
type Result<T> = Ok<T> | Err;

// Usage
const result = await wallet.signTransaction(tx);
if (result.ok) {
  const signed = result.value;
} else {
  console.error(result.error);
}
```
- **Why:** Explicit error handling, no thrown exceptions
- **Inspired by:** Rust's Result type

### 3. Abstract Storage Interface
```typescript
interface IStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
}
```
- **Why:** Same code works in web (IndexedDB) and extension (chrome.storage)

### 4. Modular Chain Support
- Each chain has its own package
- Shared interfaces for transactions and signing
- Easy to add new chains

### 5. Security by Default
- Encrypted storage for all sensitive data
- Strong KDF (PBKDF2 with 600k iterations)
- Audit logging for security-relevant operations
- Transaction risk analysis

## Data Flow

### Creating a Wallet
```
User Input (password)
       │
       ▼
┌──────────────┐
│ KDF (PBKDF2) │ ── Derive encryption key
└──────────────┘
       │
       ▼
┌──────────────┐
│  Generate    │ ── BIP-39 mnemonic
│  Mnemonic    │
└──────────────┘
       │
       ▼
┌──────────────┐
│ HD Derivation│ ── Derive initial accounts
└──────────────┘
       │
       ▼
┌──────────────┐
│  Encrypt &   │ ── AES-256-GCM
│    Store     │
└──────────────┘
```

### Signing a Transaction
```
Transaction Request
       │
       ▼
┌──────────────┐
│ Risk Analysis│ ── Check for suspicious patterns
└──────────────┘
       │
       ▼
┌──────────────┐
│ User Approval│ ── Show details, get confirmation
└──────────────┘
       │
       ▼
┌──────────────┐
│ Get Private  │ ── Decrypt from keyring
│     Key      │
└──────────────┘
       │
       ▼
┌──────────────┐
│    Sign      │ ── secp256k1 (EVM) or ed25519 (Solana)
└──────────────┘
       │
       ▼
┌──────────────┐
│  Broadcast   │ ── Send to network
└──────────────┘
       │
       ▼
┌──────────────┐
│ Audit Log    │ ── Record transaction
└──────────────┘
```

## Security Architecture

### Threat Model Categories
1. **Key Theft** - Mnemonic/private key exposure
2. **Transaction Manipulation** - Malicious dApp attacks
3. **Address Substitution** - Clipboard hijacking
4. **Social Engineering** - Phishing attacks

### Security Controls
1. **Encrypted Storage** - All sensitive data encrypted at rest
2. **Strong KDF** - PBKDF2 with 600,000 iterations
3. **Memory Clearing** - Best-effort clearing of sensitive data
4. **Auto-Lock** - Automatic wallet locking after inactivity
5. **Transaction Preview** - Clear display before signing
6. **Address Validation** - Checksum verification

### Audit Logging
- Wallet lifecycle events
- Transaction operations
- Security events (failed unlocks, etc.)

## Testing Strategy

### Unit Tests
- Individual package functionality
- Crypto operations
- Type utilities

### Integration Tests
- Cross-package interactions
- Wallet operations end-to-end

### Acceptance Tests
- Milestone verification scripts
- Build validation
- Security baseline checks

## Future Considerations

### MPC Architecture (Planned)
```
┌─────────────────────────────────────────┐
│           MPC Coordinator               │
└──────────────────┬──────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
┌────┴────┐  ┌────┴────┐  ┌────┴────┐
│ Party 0 │  │ Party 1 │  │ Party 2 │
│ (Share) │  │ (Share) │  │ (Share) │
└─────────┘  └─────────┘  └─────────┘
```

### Scalability
- Service worker for background processing
- Web Workers for crypto operations
- Lazy loading of chain-specific code
