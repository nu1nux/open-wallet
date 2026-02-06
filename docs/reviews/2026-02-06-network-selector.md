# Code Review Report

**Date:** 2026-02-06
**Scope:** Network Selector feature - staged changes (13 files, +656 lines)
**Summary:** 1 critical, 4 warnings, 5 suggestions

## Critical Issues

| # | File:Line | Issue | Recommendation |
| - | --------- | ----- | -------------- |
| 1 | `apps/extension/src/background/index.ts:129` | Missing input validation for SET_CHAIN_ID payload | The `SET_CHAIN_ID` handler blindly trusts the payload without validating that the chainId exists in `CHAIN_CONFIGS` or that the family is valid. A malicious message could set arbitrary chain IDs. Add validation before setting chain state. |

Example fix:

```typescript
case 'SET_CHAIN_ID': {
  const payload = message.payload as { family: 'evm' | 'solana'; chainId: number };
  if (!payload || !['evm', 'solana'].includes(payload.family)) {
    return { success: false, error: 'Invalid chain family' };
  }
  if (!CHAIN_CONFIGS[payload.chainId as ChainId]) {
    return { success: false, error: 'Unknown chain ID' };
  }
  // Then proceed with setting
}
```

## Warnings

| # | File:Line | Issue | Recommendation |
| - | --------- | ----- | -------------- |
| 1 | `apps/extension/src/popup/App.tsx:127` | Unlock function has no actual password validation | `handleUnlock` always succeeds after a 500ms delay regardless of password. This appears to be stub code but could be dangerous if forgotten. Add a TODO comment or implement proper validation. |
| 2 | `packages/wallet-cli/src/commands/send.ts:253-255` | Precision loss in `formatBalance` | Using `Number(wei) / 1e18` loses precision for large bigint values (>2^53). Use the same approach as `balance.ts:76-94` which handles bigint properly. |
| 3 | `apps/extension/src/components/NetworkSelector.tsx` and `apps/web/components/network-selector.tsx` | Code duplication | Two nearly identical NetworkSelector components exist. Per the design doc, this should be in `packages/ui-kit`. Consider extracting to a shared component. |
| 4 | `packages/types/src/chain.ts:84-93` | Polygon Mumbai testnet is deprecated | Polygon Mumbai was deprecated in favor of Amoy testnet (chainId 80002) in late 2024. Users selecting Mumbai will encounter RPC failures. Update to Amoy or remove Mumbai. |

## Suggestions

| # | File:Line | Issue | Recommendation |
| - | --------- | ----- | -------------- |
| 1 | `packages/wallet-cli/src/commands/balance.ts:93` | Hardcoded "ETH" symbol in formatter | `formatEthBalance` always returns "ETH" but should use `chainConfig.nativeCurrency.symbol`. Native currencies differ across chains (MATIC, AVAX, BNB). |
| 2 | `apps/web/components/Dashboard.tsx:134` | Account type could be more specific | The `AccountRow` component accepts `{ address: string; name: string }` but the `Account` type from `@open-wallet/types` likely has more fields. Consider using the proper type for type safety. |
| 3 | `apps/extension/src/background/index.ts:81-83` | Chain reset on unlock may confuse users | Resetting to mainnet on every unlock is a design decision, but there's no feedback to users. Consider logging or emitting an event when chains are reset. |
| 4 | `packages/types/src/chain.ts:269-272` | Type safety for numeric chain ID lookup | `CHAIN_CONFIGS[numericId as ChainId]` uses type assertion. Consider adding a type guard function for safer lookups. |
| 5 | `.gitignore` | `/docs/plans` added to gitignore | This appears intentional but verify that plan documents should not be version controlled. Design docs in `/docs/designs/` are tracked but plans are not. |

## Positive Highlights

- Good use of TypeScript enums and interfaces for chain configuration (`packages/types/src/chain.ts:4-48`)
- Clean separation of chain family concerns with `getChainsByFamily` helper (`packages/types/src/chain.ts:280-282`)
- Proper click-outside handling for dropdowns using refs and cleanup (`apps/web/components/network-selector.tsx:29-40`)
- Zustand store correctly avoids persisting network selection, defaulting to mainnet for safety (`apps/web/store/wallet.ts:73-78`)
- CLI `networks` command provides helpful output with aliases and testnet badges (`packages/wallet-cli/src/commands/networks.ts:16-38`)
- Comprehensive chain alias system supports multiple formats (e.g., "eth", "eth-mainnet", "ethereum" all work)
- Design document is thorough with clear decision rationale

## Summary

This PR implements a well-designed network selector feature across web, extension, and CLI. The architecture follows the dual-chain-family approach documented in the design spec, and the implementation is generally clean.

Key risks:

1. The critical security issue in the extension background script needs immediate attention - chain ID payloads must be validated
2. The deprecated Polygon Mumbai configuration will cause issues for users

Priority recommendations:

1. Fix input validation in `SET_CHAIN_ID` handler (critical)
2. Update Polygon testnet from Mumbai to Amoy (warning)
3. Fix precision loss in CLI's `formatBalance` (warning)
4. Consider extracting NetworkSelector to ui-kit as originally planned (tech debt)

## Verdict

CHANGES REQUESTED

The critical input validation issue must be fixed before merge. The deprecated Mumbai testnet should also be addressed to prevent user confusion.
