import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Input, Spinner, Alert, AddressDisplay } from '../components/ui';

type View = 'loading' | 'create' | 'unlock' | 'dashboard';

export function App() {
  const [view, setView] = useState<View>('loading');

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const result = await chrome.storage.local.get('wallet');
      if (result.wallet) {
        setView('unlock');
      } else {
        setView('create');
      }
    } catch {
      setView('create');
    }
  };

  if (view === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (view === 'create') {
    return <CreateView onSuccess={() => setView('dashboard')} />;
  }

  if (view === 'unlock') {
    return <UnlockView onSuccess={() => setView('dashboard')} />;
  }

  return <DashboardView onLock={() => setView('unlock')} />;
}

function CreateView({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await chrome.storage.local.set({ wallet: { created: Date.now() } });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-neutral-50 p-4">
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">Open Wallet</h1>
        <p className="text-sm text-neutral-500">Create a new wallet</p>
      </div>

      <Card className="flex-1">
        <CardContent className="space-y-4">
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Button
            fullWidth
            onClick={handleCreate}
            isLoading={isLoading}
            disabled={!password || !confirmPassword}
          >
            Create Wallet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function UnlockView({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSuccess();
    } catch {
      setError('Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-neutral-50 p-4">
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">Open Wallet</h1>
        <p className="text-sm text-neutral-500">Unlock your wallet</p>
      </div>

      <Card className="flex-1">
        <CardContent className="space-y-4">
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Button
            fullWidth
            onClick={handleUnlock}
            isLoading={isLoading}
            disabled={!password}
          >
            Unlock
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardView({ onLock }: { onLock: () => void }) {
  const mockAddress = '0x1234567890123456789012345678901234567890';

  return (
    <div className="flex h-full flex-col bg-neutral-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <h1 className="font-semibold text-neutral-900">Open Wallet</h1>
        <Button variant="ghost" size="sm" onClick={onLock}>
          Lock
        </Button>
      </div>

      {/* Account */}
      <div className="border-b border-neutral-200 bg-white px-4 py-4">
        <div className="text-sm text-neutral-500">Account 1</div>
        <AddressDisplay address={mockAddress} truncateChars={8} />
      </div>

      {/* Balance */}
      <div className="border-b border-neutral-200 bg-white px-4 py-6 text-center">
        <div className="text-2xl font-semibold text-neutral-900">0.00 ETH</div>
        <div className="text-sm text-neutral-500">$0.00 USD</div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-b border-neutral-200 bg-white px-4 py-4">
        <Button fullWidth variant="primary">
          Send
        </Button>
        <Button fullWidth variant="secondary">
          Receive
        </Button>
      </div>

      {/* Activity */}
      <div className="flex-1 overflow-auto p-4">
        <div className="text-sm font-medium text-neutral-700">Activity</div>
        <div className="mt-2 text-center text-sm text-neutral-400">
          No transactions yet
        </div>
      </div>
    </div>
  );
}
