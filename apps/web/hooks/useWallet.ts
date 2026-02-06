'use client';

import { useCallback, useEffect, useState } from 'react';
import { createLocalWallet, LocalWallet } from '@open-wallet/wallet-core';
import { createIndexedDBStorage } from '@open-wallet/storage';
import { ChainFamily, WalletState } from '@open-wallet/types';
import { useWalletStore } from '@/store/wallet';

let walletInstance: LocalWallet | null = null;

function getWallet(): LocalWallet {
  if (!walletInstance) {
    const storage = createIndexedDBStorage({ namespace: 'wallet-suite' });
    walletInstance = createLocalWallet(storage);
  }
  return walletInstance;
}

export function useWallet() {
  const store = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet exists on mount
  useEffect(() => {
    const checkWallet = async () => {
      const storage = createIndexedDBStorage({ namespace: 'wallet-suite' });
      const exists = await LocalWallet.exists(storage);
      store.setWalletExists(exists);
    };
    checkWallet();
  }, []);

  const createWallet = useCallback(async (password: string, name?: string, alias?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const wallet = getWallet();
      const result = await wallet.initialize({ password, name, alias });

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      const accountsResult = await wallet.getAccounts();
      if (accountsResult.ok) {
        store.setAccounts(accountsResult.value);
      }

      store.setWalletState(WalletState.UNLOCKED);
      store.setWalletExists(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unlockWallet = useCallback(async (password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const wallet = getWallet();
      const result = await wallet.unlock(password);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      const accountsResult = await wallet.getAccounts();
      if (accountsResult.ok) {
        store.setAccounts(accountsResult.value);
      }

      store.setWalletState(WalletState.UNLOCKED);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock wallet');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const lockWallet = useCallback(async () => {
    const wallet = getWallet();
    await wallet.lock();
    store.setWalletState(WalletState.LOCKED);
    store.setAccounts([]);
  }, []);

  const createAccount = useCallback(async (chainFamily: ChainFamily, name?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const wallet = getWallet();
      const result = await wallet.createAccount({ chainFamily, name });

      if (!result.ok) {
        setError(result.error.message);
        return null;
      }

      store.addAccount(result.value);
      return result.value;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAlias = useCallback(async (newAlias: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const wallet = getWallet();
      const result = await wallet.updateAlias(newAlias);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alias');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    wallet: walletInstance,
    isLoading,
    error,
    createWallet,
    unlockWallet,
    lockWallet,
    createAccount,
    updateAlias,
  };
}
