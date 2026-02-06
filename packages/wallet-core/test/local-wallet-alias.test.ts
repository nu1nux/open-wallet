import { describe, expect, it } from 'vitest';
import { createMemoryStorage } from '@open-wallet/storage';
import { ErrorCode } from '@open-wallet/types';
import { createLocalWallet } from '../src/local-wallet';
import { ALIAS_REGISTRY_STORAGE_KEY } from '../src/alias-registry';

describe('LocalWallet alias behavior', () => {
  it('persists alias in metadata and registry on initialize', async () => {
    const storage = createMemoryStorage();
    const wallet = createLocalWallet(storage);

    const init = await wallet.initialize({
      password: 'pw-123456',
      name: 'Canonical Name',
      alias: 'Main Wallet',
    });

    expect(init.ok).toBe(true);

    const metadata = await storage.get<{ id: string; name: string; alias?: string }>('wallet:metadata');
    expect(metadata?.name).toBe('Canonical Name');
    expect(metadata?.alias).toBe('Main Wallet');

    const registry = await storage.get<{
      aliasToWalletId: Record<string, string>;
      walletIdToAlias: Record<string, string>;
    }>(ALIAS_REGISTRY_STORAGE_KEY);

    expect(metadata).not.toBeNull();
    expect(registry?.aliasToWalletId['main wallet']).toBe(metadata!.id);
  });

  it('returns ALIAS_ALREADY_EXISTS when alias is already reserved by another wallet id', async () => {
    const storage = createMemoryStorage();
    await storage.set(ALIAS_REGISTRY_STORAGE_KEY, {
      aliasToWalletId: { main: 'wallet-existing' },
      walletIdToAlias: { 'wallet-existing': 'main' },
    });

    const wallet = createLocalWallet(storage);
    const init = await wallet.initialize({
      password: 'pw-123456',
      alias: 'MAIN',
    });

    expect(init.ok).toBe(false);
    if (!init.ok) {
      expect(init.error.code).toBe(ErrorCode.ALIAS_ALREADY_EXISTS);
    }
  });

  it('releases alias when wallet is destroyed', async () => {
    const storage = createMemoryStorage();
    const wallet = createLocalWallet(storage);
    await wallet.initialize({ password: 'pw-123456', alias: 'primary' });

    const metadata = await storage.get<{ id: string }>('wallet:metadata');
    await wallet.destroy();

    const registry = await storage.get<{
      aliasToWalletId: Record<string, string>;
      walletIdToAlias: Record<string, string>;
    }>(ALIAS_REGISTRY_STORAGE_KEY);

    expect(registry?.aliasToWalletId.primary).toBeUndefined();
    expect(registry?.walletIdToAlias[metadata!.id]).toBeUndefined();
  });

  it('backfills missing alias registry entry during unlock', async () => {
    const storage = createMemoryStorage();
    const wallet = createLocalWallet(storage);
    await wallet.initialize({ password: 'pw-123456', alias: 'Backfill Alias' });
    const metadata = await storage.get<{ id: string }>('wallet:metadata');

    await storage.set(ALIAS_REGISTRY_STORAGE_KEY, {
      aliasToWalletId: {},
      walletIdToAlias: {},
    });

    const freshWallet = createLocalWallet(storage);
    const unlock = await freshWallet.unlock('pw-123456');
    expect(unlock.ok).toBe(true);

    const registry = await storage.get<{
      aliasToWalletId: Record<string, string>;
      walletIdToAlias: Record<string, string>;
    }>(ALIAS_REGISTRY_STORAGE_KEY);
    expect(registry?.aliasToWalletId['backfill alias']).toBe(metadata!.id);
  });
});
