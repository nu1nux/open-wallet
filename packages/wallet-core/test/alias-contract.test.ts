import { describe, expect, it } from 'vitest';
import { ErrorCode, InitWalletOptions, WalletMetadata, WalletType } from '@open-wallet/types';

describe('wallet alias type contract', () => {
  it('supports alias in init options and metadata', () => {
    const init: InitWalletOptions = { password: 'pw-123456', alias: 'primary' };

    const metadata: WalletMetadata = {
      id: 'wallet-1',
      name: 'My Wallet',
      alias: 'primary',
      type: WalletType.LOCAL,
      createdAt: 1,
      lastActiveAt: 1,
    };

    expect(init.alias).toBe('primary');
    expect(metadata.alias).toBe('primary');
    expect(ErrorCode.ALIAS_ALREADY_EXISTS).toBe('ALIAS_ALREADY_EXISTS');
  });
});
