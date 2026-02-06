# Wallet Lists Support

**Date:** 2026-02-06

## Context

The current Open Wallet architecture supports only **one wallet per storage instance** using a singleton pattern. Users need the ability to manage **multiple wallets** within a single browser/app instance—for example, separate wallets for personal, business, and savings purposes.

### Requirements Gathered

- **Purpose:** Multiple wallets per user (not multi-user or import-only)
- **Authentication:** Per-wallet passwords (each wallet encrypted independently)
- **Unlock UX:** Wallet selector first, then password entry for selected wallet
- **Concurrency:** Multiple wallets can be unlocked simultaneously
- **UI Model:** Wallet tabs—one tab per wallet, click to switch, only one visible at a time
- **Limits:** Hard limit of 20 wallets maximum
- **UI Framework:** Components built with @base-ui/react

## Discussion

### Authentication Model Trade-offs

Three options were considered:

1. **Per-wallet password** (chosen): Each wallet encrypted with its own password. More secure isolation, but user must remember multiple passwords.
2. **Master password:** Single password unlocks all wallets. Simpler UX, but all wallets exposed if master is compromised.
3. **Hybrid:** Master password for quick access, optional per-wallet passwords for high-security wallets.

Per-wallet passwords preserve the existing security model and provide better isolation between wallets.

### Architectural Approaches Explored

| Approach | Description | Trade-offs |
|----------|-------------|------------|
| **A: Flat Registry** | Single registry file + key prefixes | Simple, quick to implement, but registry becomes bottleneck |
| **B: Wallet Manager** (chosen) | New class orchestrating independent LocalWallet instances | Clean separation, moderate refactoring, each wallet encapsulated |
| **C: Namespace Isolation** | Each wallet in separate storage namespace | Maximum isolation, most storage layer changes |

The Wallet Manager approach provides the cleanest abstraction while keeping each wallet fully encapsulated.

### UI Presentation Options

- **Active wallet focus:** One wallet at a time, sidebar for others
- **Unified account view:** All accounts from all wallets mixed together
- **Wallet tabs** (chosen): Tab bar showing all wallets, clicking switches view

Wallet tabs provide clear organization while keeping contexts separate.

## Approach

Introduce a **WalletManager** class that orchestrates multiple independent `LocalWallet` instances. Each wallet maintains its own password, encrypted keyring, and accounts. The UI presents wallets as tabs, with clear locked/unlocked indicators.

### Key Decisions

- Per-wallet passwords (existing security model preserved)
- Multiple wallets can be unlocked simultaneously
- Wallet tabs UI with clear locked/unlocked states
- Hard limit of 20 wallets
- Global alias registry spans all wallets (unchanged)
- Global network selection (simpler; can be per-wallet later)

## Architecture

### Data Structures

```typescript
// New registry stored at "wallet:registry"
interface WalletRegistry {
  walletIds: string[];           // Ordered list of wallet IDs
  version: number;               // For future migrations
  maxWallets: number;            // Hard limit (default: 20)
}

// WalletManager state tracking
interface ManagedWallet {
  metadata: WalletMetadata;
  instance: LocalWallet | null;  // null = not loaded/locked
  isUnlocked: boolean;
}
```

### Storage Layout

| Key | Content |
|-----|---------|
| `wallet:registry` | WalletRegistry (unencrypted, just IDs) |
| `wallet:{id}` | Encrypted keyring for that wallet |
| `wallet:{id}:metadata` | WalletMetadata (unencrypted) |
| `wallet:aliases` | Global alias registry (unchanged, spans all wallets) |

### WalletManager API

```typescript
class WalletManager {
  // Initialization
  static create(storage: IStorage): Promise<Result<WalletManager>>

  // Registry operations
  listWallets(): WalletMetadata[]
  getWalletCount(): number
  canCreateWallet(): boolean

  // Wallet lifecycle
  createWallet(options: CreateWalletOptions): Promise<Result<string>>
  deleteWallet(id: string, password: string): Promise<Result<void>>

  // Lock/unlock
  unlockWallet(id: string, password: string): Promise<Result<void>>
  lockWallet(id: string): void
  lockAll(): void

  // Access
  getWallet(id: string): LocalWallet | null
  getUnlockedWallets(): LocalWallet[]
  isUnlocked(id: string): boolean

  // Active wallet
  getActiveWalletId(): string | null
  setActiveWallet(id: string): Result<void>
}
```

### Zustand Store Updates

```typescript
interface WalletStore {
  // Multi-wallet state
  walletList: WalletMetadata[];
  unlockedWalletIds: Set<string>;
  activeWalletId: string | null;

  // Per-wallet account cache
  accountsByWallet: Map<string, Account[]>;

  // Network selection (global)
  selectedEvmChainId: ChainId;
  selectedSolanaChainId: ChainId;

  // Actions
  setWalletList(wallets: WalletMetadata[]): void
  addWallet(metadata: WalletMetadata): void
  removeWallet(id: string): void
  setUnlocked(id: string, unlocked: boolean): void
  setActiveWallet(id: string): void
  setAccountsForWallet(walletId: string, accounts: Account[]): void
}
```

### UI Components (using @base-ui/react)

| Component | Base UI Primitive | Purpose |
|-----------|------------------|---------|
| `WalletTabs` | `Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel` | Tab navigation between wallets |
| `UnlockWalletModal` | `Dialog.Root`, `Dialog.Portal`, `Dialog.Popup` | Modal for password entry |
| `CreateWalletModal` | `Dialog.Root`, `Dialog.Portal`, `Dialog.Popup` | Modal for new wallet creation |

### User Flows

1. **First visit (no wallets):** Show CreateWallet page (unchanged)
2. **Has wallets, all locked:** Show WalletSelector with unlock prompts
3. **Has wallets, some unlocked:** Show Dashboard with WalletTabs
4. **Create new wallet:** Click "+" tab → CreateWalletModal
5. **Switch wallets:** Click different tab → if locked, UnlockWalletModal; if unlocked, instant switch

### Error Handling

New error codes:

```typescript
enum ErrorCode {
  WALLET_LIMIT_REACHED = 'WALLET_LIMIT_REACHED',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  WALLET_ALREADY_UNLOCKED = 'WALLET_ALREADY_UNLOCKED',
  WALLET_NOT_UNLOCKED = 'WALLET_NOT_UNLOCKED',
  REGISTRY_CORRUPTED = 'REGISTRY_CORRUPTED',
}
```

Edge cases:

| Scenario | Behavior |
|----------|----------|
| Delete last wallet | Allowed; returns to "Create Wallet" screen |
| Delete active wallet | Lock, remove, switch to next unlocked or first in list |
| Create at limit (20) | Return error; UI disables "+" button |
| Storage corrupted | Auto-recover by scanning `wallet:*:metadata` keys |

### Files to Create

- `packages/wallet-core/src/wallet-manager.ts`
- `packages/wallet-core/test/wallet-manager.test.ts`
- `apps/web/hooks/useWalletManager.ts`
- `apps/web/components/WalletTabs.tsx`
- `apps/web/components/UnlockWalletModal.tsx`

### Files to Modify

- `packages/types/src/error.ts` (new error codes)
- `apps/web/store/wallet.ts` (multi-wallet state)
- `apps/web/components/Dashboard.tsx` (integrate tabs)
- `apps/web/app/page.tsx` (routing logic for multi-wallet)

### Testing Strategy

**Unit tests** (`packages/wallet-core/test/wallet-manager.test.ts`):
- Registry operations (create, load, limit enforcement, recovery)
- Wallet lifecycle (create, delete with password verification)
- Lock/unlock (correct/wrong password, multiple simultaneous)
- Active wallet switching and deletion handling

**Integration tests:**
- Full flow: create → unlock → create second → switch → delete
- UI state syncs with manager state
- Tab navigation reflects unlock status

**Manual test scenarios:**
1. Create 20 wallets, verify "+" disabled
2. Delete active wallet, verify switch
3. Refresh page, verify all locked, registry intact
4. Attempt duplicate alias across wallets, verify rejection
