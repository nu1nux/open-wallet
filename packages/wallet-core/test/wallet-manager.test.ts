import { describe, expect, it } from 'vitest';
import { ErrorCode } from '@open-wallet/types';
import { createMemoryStorage } from '@open-wallet/storage';
import { createLocalWallet } from '../src/local-wallet';
import { WalletManager } from '../src/wallet-manager';

describe('wallet manager contracts', () => {
  it('exposes new multi-wallet error codes', () => {
    expect(ErrorCode.WALLET_LIMIT_REACHED).toBe('WALLET_LIMIT_REACHED');
    expect(ErrorCode.WALLET_NOT_FOUND).toBe('WALLET_NOT_FOUND');
    expect(ErrorCode.WALLET_ALREADY_UNLOCKED).toBe('WALLET_ALREADY_UNLOCKED');
    expect(ErrorCode.WALLET_NOT_UNLOCKED).toBe('WALLET_NOT_UNLOCKED');
    expect(ErrorCode.REGISTRY_CORRUPTED).toBe('REGISTRY_CORRUPTED');
  });

  it('stores each local wallet under wallet-specific keys', async () => {
    const storage = createMemoryStorage();
    const walletA = createLocalWallet(storage, { walletId: 'wallet-a' });
    const walletB = createLocalWallet(storage, { walletId: 'wallet-b' });

    await walletA.initialize({ password: 'pw-123456' });
    await walletB.initialize({ password: 'pw-abcdef' });

    const keys = await storage.keys();
    expect(keys).toContain('wallet:wallet-a');
    expect(keys).toContain('wallet:wallet-a:metadata');
    expect(keys).toContain('wallet:wallet-b');
    expect(keys).toContain('wallet:wallet-b:metadata');
  });

  it('creates empty manager with default registry', async () => {
    const storage = createMemoryStorage();
    const managerResult = await WalletManager.create(storage);

    expect(managerResult.ok).toBe(true);
    if (!managerResult.ok) return;

    expect(managerResult.value.getWalletCount()).toBe(0);
    expect(managerResult.value.canCreateWallet()).toBe(true);
    expect(managerResult.value.listWallets()).toEqual([]);
  });
});
