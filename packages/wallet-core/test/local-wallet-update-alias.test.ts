import { describe, expect, it, beforeEach } from 'vitest';
import { createMemoryStorage } from '@open-wallet/storage';
import { ErrorCode } from '@open-wallet/types';
import { createLocalWallet, LocalWallet } from '../src/local-wallet';
import { loadAliasRegistry } from '../src/alias-registry';

describe('LocalWallet.updateAlias', () => {
  let storage: ReturnType<typeof createMemoryStorage>;
  let wallet: LocalWallet;

  beforeEach(async () => {
    storage = createMemoryStorage();
    wallet = createLocalWallet(storage);
    await wallet.initialize({ password: 'testpass123!', alias: 'original' });
  });

  it('updates alias in metadata and registry', async () => {
    const result = await wallet.updateAlias('new alias');

    expect(result.ok).toBe(true);

    const metadata = wallet.getMetadata();
    expect(metadata.alias).toBe('new alias');

    const registry = await loadAliasRegistry(storage);
    expect(registry.aliasToWalletId['new alias']).toBe(metadata.id);
    expect(registry.aliasToWalletId['original']).toBeUndefined();
  });

  it('returns ALIAS_ALREADY_EXISTS when alias is taken by another wallet', async () => {
    // Create second wallet with different alias
    const wallet2 = createLocalWallet(storage);
    await wallet2.initialize({ password: 'testpass456!', alias: 'taken' });

    // Try to update first wallet to use second wallet's alias
    const result = await wallet.updateAlias('TAKEN');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ErrorCode.ALIAS_ALREADY_EXISTS);
    }
  });

  it('clears alias when given empty string', async () => {
    const result = await wallet.updateAlias('');

    expect(result.ok).toBe(true);

    const metadata = wallet.getMetadata();
    expect(metadata.alias).toBeUndefined();
  });

  it('returns WALLET_LOCKED when wallet is locked', async () => {
    await wallet.lock();

    const result = await wallet.updateAlias('new alias');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ErrorCode.WALLET_LOCKED);
    }
  });
});
