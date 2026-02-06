# Network Selector

**Date:** 2026-02-06

## Context

Open Wallet is a multi-chain cryptocurrency wallet supporting EVM chains (Ethereum, Polygon, etc.) and Solana. Although testnet configurations are already defined in the codebase (ETH_SEPOLIA, POLYGON_MUMBAI, SOLANA_DEVNET, etc.), and each chain configuration has an `isTestnet: boolean` flag, there is currently no user interface allowing users to conveniently switch between mainnet and testnets.

Users have requested a network selector feature similar to MetaMask, allowing wallet users to easily switch networks.

## Discussion

### Functional Scope

Four possible implementation directions were discussed:
1.  **Network Selector** - Add a network selector in the UI.
2.  **Standalone Testnet Wallet** - Create a completely isolated testnet wallet.
3.  **Testnet Mode** - A global toggle to control whether to show mainnet or testnet.
4.  **Testnet Account Tag** - Add usage tags to accounts.

**Decision:** Adopt the Network Selector approach, as it best fits user habits (similar to MetaMask).

### Scope of Application

**Decision:** Full platform support - Web application, Chrome extension, and CLI will all support network switching.

### Interaction Design

Three UI schemes were discussed:
1.  Simple dropdown menu switching.
2.  Mainnet/Testnet grouped display.
3.  Testnets only visible when developer mode is enabled.

**Decision:** Adopt simple dropdown menu switching, similar to the MetaMask experience.

### Relationship between EVM and Solana Network Selection

Three architectural schemes were discussed:

**Option A - Minimal Change:** Single `selectedChainId`. Fast to implement but confusing (EVM and Solana are different chain families).

**Option B - Dual Chain Families:** Maintain independent network selections for EVM and Solana (`selectedEvmChainId` and `selectedSolanaChainId`). More flexible, users can operate on different testnets simultaneously.

**Option C - Context Aware:** Network selection follows the currently selected account type. UI is cleanest but implementation is complex.

**Decision:** Adopt Option B (Dual Chain Families), maintaining independent network selections for EVM and Solana.

### Security Strategy

Discussed whether network switching requires confirmation:
1.  No confirmation, instant switch.
2.  Prompt when switching to mainnet.
3.  Confirm for any switch.

**Decision:** No confirmation, instant switch, prioritizing a smooth experience.

### State Persistence

Discussed whether network selection should be remembered:
1.  Remember last selection.
2.  Always default to mainnet.

**Decision:** Always default to mainnet. Reset to ETH_MAINNET and SOLANA_MAINNET on every wallet startup/unlock, which is the safer choice.

## Approach

Implement a dual-chain family network selector:

1.  **State Management**
  - Replace the original single `selectedChainId` with `selectedEvmChainId` and `selectedSolanaChainId` in the Zustand store.
  - Do not persist network selection; default to mainnet on startup.

2.  **UI Components**
  - Create a generic `NetworkSelector` component (placed in the ui-kit package).
  - Web and Extension integrate this component respectively.
  - Display EVM network selector above EVM account blocks, and Solana network selector above Solana blocks.

3.  **CLI Support**
  - Existing `-c chainId` argument meets basic needs.
  - Add support for chain aliases (e.g., `-c sepolia` instead of `-c 11155111`).
  - Add `networks` command to list all available networks.

4.  **Extension Special Handling**
  - Use `chrome.storage.session` to save within-session network selection.
  - Implement EIP-1193 `chainChanged` event to notify connected dApps.

## Architecture

### State Management Design

```typescript
// apps/web/store/wallet.ts
interface WalletStore {
  // ... existing fields
  selectedEvmChainId: ChainId;      // Default: ETH_MAINNET
  selectedSolanaChainId: ChainId;   // Default: SOLANA_MAINNET

  // Actions
  setEvmChainId: (chainId: ChainId) => void;
  setSolanaChainId: (chainId: ChainId) => void;
}
```

### UI Component Design

```typescript
// packages/ui-kit/src/components/network-selector.tsx
interface NetworkSelectorProps {
  chainFamily: 'evm' | 'solana';
  selectedChainId: ChainId;
  onSelect: (chainId: ChainId) => void;
}
```

**Web App Layout:**
```
┌────────────────────────────────────┐
│ Open Wallet                        │
├────────────────────────────────────┤
│ EVM Networks        [Ethereum ▼]   │  ← EVM Network Selector
│ ├─ Account 1: 0x1234...            │
│ └─ Account 2: 0x5678...            │
├────────────────────────────────────┤
│ Solana              [Mainnet ▼]    │  ← Solana Network Selector
│ └─ Account 1: ABC123...            │
└────────────────────────────────────┘
```

### Data Flow

```
User selects ETH Sepolia
     ↓
store.setEvmChainId(ChainId.ETH_SEPOLIA)
     ↓
useEffect detects selectedEvmChainId change
     ↓
Call wallet.getEvmClient(ETH_SEPOLIA).getBalance(account.address)
     ↓
UI updates balance display
```

### CLI Improvements

```bash
# New networks command
open-wallet networks

# Output:
# EVM Networks:
#   eth-mainnet (1)
#   eth-sepolia (11155111) [testnet]
#   polygon (137)
#   polygon-mumbai (80001) [testnet]
#   ...
# Solana Networks:
#   solana-mainnet (101)
#   solana-devnet (102) [testnet]
#   ...

# Support aliases
open-wallet balance 0x123... -c sepolia
open-wallet send 0x123... 0x456... 0.1 -c polygon-mumbai
```

### File Change List

| Location | File | Change |
|------|------|------|
| packages/ui-kit/ | `src/components/network-selector.tsx` | New |
| packages/types/ | `src/chain.ts` | Add `CHAIN_ALIASES` map |
| apps/web/ | `store/wallet.ts` | Split network state |
| apps/web/ | `hooks/useWallet.ts` | Add network toggle methods |
| apps/web/ | `components/dashboard.tsx` | Integrate NetworkSelector |
| apps/extension/ | `src/popup/components/NetworkSelector.tsx` | New |
| apps/extension/ | `src/popup/pages/Dashboard.tsx` | Integrate network selection |
| apps/extension/ | `src/background/index.ts` | storage sync and dApp events |
| packages/wallet-cli/ | `src/commands/networks.ts` | New |
| packages/wallet-cli/ | `src/commands/balance.ts` | Support chain name aliases |
| packages/wallet-cli/ | `src/commands/send.ts` | Support chain name aliases |
| packages/wallet-cli/ | `src/utils/chain-alias.ts` | New |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Applications                          │
├──────────────┬──────────────────────┬───────────────────────┤
│   Web App    │     Extension        │         CLI           │
│ (Next.js)    │  (Chrome MV3)        │    (Commander)        │
│              │                      │                       │
│ NetworkSelector ← ui-kit           │  networks command     │
│ Zustand Store   │ chrome.storage    │  -c alias support     │
│ useWallet hook  │ dApp provider     │                       │
└──────┬───────┴──────────┬──────────┴───────────┬───────────┘
     │                  │                      │
     ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      wallet-core                             │
│  getEvmClient(chainId)  │  getSolanaClient(chainId)         │
└──────────────────────────────────────────────────────────────┘
     │                                │
     ▼                                ▼
┌─────────────────────┐    ┌─────────────────────────┐
│    chains-evm       │    │     chains-solana       │
│  (viem clients)     │    │  (@solana/web3.js)      │
└─────────────────────┘    └─────────────────────────┘
```
