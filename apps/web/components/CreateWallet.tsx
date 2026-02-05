'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Alert } from '@wallet-suite/ui-kit';
import { useWallet } from '@/hooks/useWallet';
import { checkPassword } from '@wallet-suite/security';

export function CreateWallet() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const { createWallet, isLoading, error } = useWallet();

  const passwordCheck = checkPassword(password);
  const passwordsMatch = password === confirmPassword;

  const handleCreate = async () => {
    if (!passwordCheck.isAcceptable) return;
    if (!passwordsMatch) return;

    const success = await createWallet(password, name || undefined);
    if (success) {
      setStep('confirm');
    }
  };

  if (step === 'confirm') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md" padding="lg">
          <CardHeader>
            <CardTitle>Wallet Created!</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="success" className="mb-4">
              Your wallet has been created successfully.
            </Alert>
            <p className="text-sm text-gray-600">
              Your wallet is now ready to use. You can view your accounts and start
              sending and receiving crypto.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <CardHeader>
          <CardTitle>Create Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-4"
          >
            <Input
              label="Wallet Name (optional)"
              placeholder="My Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={password && !passwordCheck.isAcceptable ? passwordCheck.feedback[0] : undefined}
            />

            {password && (
              <div className="text-sm">
                <span className="text-gray-500">Strength: </span>
                <span
                  style={{ color: getStrengthColor(passwordCheck.score) }}
                  className="font-medium"
                >
                  {passwordCheck.strength.replace('_', ' ')}
                </span>
              </div>
            )}

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
            />

            {error && (
              <Alert variant="error">{error}</Alert>
            )}

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={!passwordCheck.isAcceptable || !passwordsMatch}
            >
              Create Wallet
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            By creating a wallet, you agree to store your recovery phrase securely.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function getStrengthColor(score: number): string {
  if (score < 20) return '#ff4444';
  if (score < 40) return '#ff8800';
  if (score < 60) return '#ffcc00';
  if (score < 80) return '#88cc00';
  return '#00cc44';
}
