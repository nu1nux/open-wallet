'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from './ui';
import { useWalletStore } from '@/store/wallet';
import { useWallet } from '@/hooks/useWallet';
import { ChainFamily, CHAIN_CONFIGS } from '@open-wallet/types';
import { NetworkSelector } from './network-selector';

export function Dashboard() {
  const { accounts, selectedEvmChainId, selectedSolanaChainId, setEvmChainId, setSolanaChainId } = useWalletStore();
  const { lockWallet, createAccount, isLoading } = useWallet();

  const evmAccounts = accounts.filter((a) => a.chainFamily === ChainFamily.EVM);
  const solanaAccounts = accounts.filter((a) => a.chainFamily === ChainFamily.SOLANA);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Open Wallet</h1>
            <p className="text-sm text-neutral-500">Multi-chain wallet</p>
          </div>
          <Button variant="outline" size="sm" onClick={lockWallet}>
            Lock
          </Button>
        </div>

        {/* Accounts */}
        <div className="space-y-4">
          {/* EVM */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>EVM</CardTitle>
                  <NetworkSelector
                    chainFamily={ChainFamily.EVM}
                    selectedChainId={selectedEvmChainId}
                    onSelect={setEvmChainId}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => createAccount(ChainFamily.EVM)}
                  disabled={isLoading}
                >
                  + Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {evmAccounts.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">
                  No accounts yet
                </p>
              ) : (
                <div className="space-y-2">
                  {evmAccounts.map((account) => (
                    <AccountRow
                      key={account.address}
                      account={account}
                      symbol={CHAIN_CONFIGS[selectedEvmChainId].nativeCurrency.symbol}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solana */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Solana</CardTitle>
                  <NetworkSelector
                    chainFamily={ChainFamily.SOLANA}
                    selectedChainId={selectedSolanaChainId}
                    onSelect={setSolanaChainId}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => createAccount(ChainFamily.SOLANA)}
                  disabled={isLoading}
                >
                  + Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {solanaAccounts.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">
                  No accounts yet
                </p>
              ) : (
                <div className="space-y-2">
                  {solanaAccounts.map((account) => (
                    <AccountRow
                      key={account.address}
                      account={account}
                      symbol={CHAIN_CONFIGS[selectedSolanaChainId].nativeCurrency.symbol}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button size="sm">Send</Button>
                <Button size="sm" variant="secondary">Receive</Button>
                <Button size="sm" variant="outline">History</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AccountRow({ account, symbol }: { account: { address: string; name: string }; symbol: string }) {
  const [copied, setCopied] = useState(false);

  const truncatedAddress = `${account.address.slice(0, 8)}...${account.address.slice(-6)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2.5">
      <div>
        <div className="text-sm font-medium text-neutral-900">{account.name}</div>
        <div className="flex items-center gap-1.5 font-mono text-[13px] text-neutral-500">
          <span>{truncatedAddress}</span>
          <button
            onClick={handleCopy}
            className="rounded p-0.5 text-neutral-400 hover:text-neutral-600"
            title="Copy address"
          >
            {copied ? (
              <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-medium text-neutral-900">0.00</span>
        <span className="text-[13px] text-neutral-500">{symbol}</span>
      </div>
    </div>
  );
}
