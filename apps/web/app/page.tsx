'use client';

import { useWalletStore } from '@/store/wallet';
import { WalletState } from '@open-wallet/types';
import { CreateWallet } from '@/components/CreateWallet';
import { UnlockWallet } from '@/components/UnlockWallet';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  const { state, exists } = useWalletStore();

  // Show create wallet if no wallet exists
  if (!exists) {
    return <CreateWallet />;
  }

  // Show unlock if wallet is locked
  if (state === WalletState.LOCKED || state === WalletState.UNINITIALIZED) {
    return <UnlockWallet />;
  }

  // Show dashboard if unlocked
  return <Dashboard />;
}
