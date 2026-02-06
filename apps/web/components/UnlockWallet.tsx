'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Input, Alert } from './ui';
import { useWallet } from '@/hooks/useWallet';

export function UnlockWallet() {
  const [password, setPassword] = useState('');
  const { unlockWallet, isLoading, error } = useWallet();

  const handleUnlock = async () => {
    await unlockWallet(password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-neutral-900">Welcome back</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Enter your password to unlock
          </p>
        </div>

        <Card padding="lg">
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUnlock();
              }}
              className="space-y-4"
            >
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />

              {error && (
                <Alert variant="error">{error}</Alert>
              )}

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                disabled={!password}
              >
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-[13px] text-neutral-400">
          Forgot your password? You'll need your recovery phrase.
        </p>
      </div>
    </div>
  );
}
