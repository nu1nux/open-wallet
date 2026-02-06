import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Account,
  ChainId,
  WalletState,
} from '@open-wallet/types';

interface WalletStore {
  // State
  state: WalletState;
  exists: boolean;
  accounts: Account[];
  selectedAccount: string | null;
  selectedChainId: ChainId;

  // Actions
  setWalletState: (state: WalletState) => void;
  setWalletExists: (exists: boolean) => void;
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  setSelectedAccount: (address: string) => void;
  setSelectedChainId: (chainId: ChainId) => void;
  reset: () => void;
}

const initialState = {
  state: WalletState.UNINITIALIZED,
  exists: false,
  accounts: [],
  selectedAccount: null,
  selectedChainId: ChainId.ETH_MAINNET,
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      ...initialState,

      setWalletState: (state) => set({ state }),

      setWalletExists: (exists) => set({ exists }),

      setAccounts: (accounts) =>
        set({
          accounts,
          selectedAccount: accounts[0]?.address || null,
        }),

      addAccount: (account) =>
        set((state) => ({
          accounts: [...state.accounts, account],
          selectedAccount: state.selectedAccount || account.address,
        })),

      setSelectedAccount: (address) => set({ selectedAccount: address }),

      setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),

      reset: () => set(initialState),
    }),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        exists: state.exists,
        selectedChainId: state.selectedChainId,
      }),
    }
  )
);
