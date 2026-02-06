import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, ChainId, WalletState } from '@open-wallet/types';

interface WalletStore {
  // State
  state: WalletState;
  exists: boolean;
  accounts: Account[];
  selectedAccount: string | null;
  selectedEvmChainId: ChainId;
  selectedSolanaChainId: ChainId;

  // Actions
  setWalletState: (state: WalletState) => void;
  setWalletExists: (exists: boolean) => void;
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  setSelectedAccount: (address: string) => void;
  setEvmChainId: (chainId: ChainId) => void;
  setSolanaChainId: (chainId: ChainId) => void;
  reset: () => void;
}

const initialState = {
  state: WalletState.UNINITIALIZED,
  exists: false,
  accounts: [],
  selectedAccount: null,
  selectedEvmChainId: ChainId.ETH_MAINNET,
  selectedSolanaChainId: ChainId.SOLANA_MAINNET,
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      ...initialState,

      setWalletState: (state) =>
        set({
          state,
          // Reset to mainnet when unlocking
          ...(state === WalletState.UNLOCKED
            ? {
                selectedEvmChainId: ChainId.ETH_MAINNET,
                selectedSolanaChainId: ChainId.SOLANA_MAINNET,
              }
            : {}),
        }),

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

      setEvmChainId: (chainId) => set({ selectedEvmChainId: chainId }),

      setSolanaChainId: (chainId) => set({ selectedSolanaChainId: chainId }),

      reset: () => set(initialState),
    }),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        exists: state.exists,
        // Do NOT persist chain selection - always reset to mainnet
      }),
    }
  )
);
