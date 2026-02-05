'use client';

import { Button, Card, CardContent, CardHeader, CardTitle, AddressDisplay, Balance } from '@wallet-suite/ui-kit';
import { useWalletStore } from '@/store/wallet';
import { useWallet } from '@/hooks/useWallet';
import { ChainFamily } from '@wallet-suite/types';

export function Dashboard() {
  const { accounts, selectedAccount, selectedChainId } = useWalletStore();
  const { lockWallet, createAccount, isLoading } = useWallet();

  const evmAccounts = accounts.filter((a) => a.chainFamily === ChainFamily.EVM);
  const solanaAccounts = accounts.filter((a) => a.chainFamily === ChainFamily.SOLANA);

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Wallet Suite</h1>
        <Button variant="outline" onClick={lockWallet}>
          Lock Wallet
        </Button>
      </div>

      {/* Account Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* EVM Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>EVM Accounts</CardTitle>
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
              <p className="text-sm text-gray-500">No EVM accounts yet</p>
            ) : (
              <div className="space-y-3">
                {evmAccounts.map((account) => (
                  <AccountCard key={account.address} account={account} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solana Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Solana Accounts</CardTitle>
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
              <p className="text-sm text-gray-500">No Solana accounts yet</p>
            ) : (
              <div className="space-y-3">
                {solanaAccounts.map((account) => (
                  <AccountCard key={account.address} account={account} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Send</Button>
            <Button variant="secondary">Receive</Button>
            <Button variant="outline">View History</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountCard({ account }: { account: { address: string; name: string } }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <div className="mb-1 text-sm font-medium text-gray-900">{account.name}</div>
      <AddressDisplay address={account.address} truncateChars={8} />
      <div className="mt-2">
        <Balance amount="0.00" symbol="ETH" size="sm" />
      </div>
    </div>
  );
}
