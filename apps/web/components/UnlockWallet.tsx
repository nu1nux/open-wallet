'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Alert } from '@wallet-suite/ui-kit';
import { useWallet } from '@/hooks/useWallet';

export function UnlockWallet() {
  const [password, setPassword] = useState('');
  const { unlockWallet, isLoading, error } = useWallet();

  const handleUnlock = async () => {
    await unlockWallet(password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <CardHeader>
          <CardTitle>Unlock Wallet</CardTitle>
        </CardHeader>
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
    </div>
  );
}
