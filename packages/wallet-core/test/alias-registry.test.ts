import { describe, expect, it } from 'vitest';
import { createMemoryStorage } from '@open-wallet/storage';
import { ErrorCode } from '@open-wallet/types';
import {
  ALIAS_REGISTRY_STORAGE_KEY,
  loadAliasRegistry,
  normalizeAlias,
  releaseAlias,
  reserveAlias,
  validateAlias,
} from '../src/alias-registry';

describe('alias registry', () => {
  it('normalizes alias with trim, lowercase, and whitespace collapse', () => {
    expect(normalizeAlias('  Main   Wallet  ')).toBe('main wallet');
  });

  it('rejects blank alias', () => {
    const result = validateAlias('   ');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ErrorCode.INVALID_INPUT);
    }
  });

  it('reserves alias for a wallet id', async () => {
    const storage = createMemoryStorage();
    const result = await reserveAlias(storage, 'wallet-1', 'Main Wallet');

    expect(result.ok).toBe(true);
    const registry = await loadAliasRegistry(storage);
    expect(registry.aliasToWalletId['main wallet']).toBe('wallet-1');
    expect(registry.walletIdToAlias['wallet-1']).toBe('main wallet');
  });

  it('returns ALIAS_ALREADY_EXISTS when alias belongs to another wallet id', async () => {
    const storage = createMemoryStorage();
    await reserveAlias(storage, 'wallet-1', 'main');

    const conflict = await reserveAlias(storage, 'wallet-2', 'MAIN');
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.error.code).toBe(ErrorCode.ALIAS_ALREADY_EXISTS);
    }
  });

  it('removes alias entries when wallet is released', async () => {
    const storage = createMemoryStorage();
    await reserveAlias(storage, 'wallet-1', 'main');
    await releaseAlias(storage, 'wallet-1');

    const registry = await storage.get<{
      aliasToWalletId: Record<string, string>;
      walletIdToAlias: Record<string, string>;
    }>(ALIAS_REGISTRY_STORAGE_KEY);

    expect(registry?.aliasToWalletId.main).toBeUndefined();
    expect(registry?.walletIdToAlias['wallet-1']).toBeUndefined();
  });
});
