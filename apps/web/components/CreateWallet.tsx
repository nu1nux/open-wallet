'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Form, Field, Alert } from './ui';
import { useWallet } from '@/hooks/useWallet';
import { checkPassword } from '@open-wallet/security';

export function CreateWallet() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const { createWallet, isLoading, error } = useWallet();

  const passwordCheck = checkPassword(password);
  const passwordsMatch = password === confirmPassword;

  const handleCreate = async () => {
    if (!passwordCheck.isAcceptable) return;
    if (!passwordsMatch) return;

    const success = await createWallet(password, name || undefined, alias || undefined);
    if (success) {
      setStep('confirm');
    }
  };

  if (step === 'confirm') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Wallet Created</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Your wallet is ready. You can now manage your crypto assets.
            </p>
          </div>
          <Alert variant="success">
            Your wallet has been secured and encrypted.
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-neutral-900">Create Wallet</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Set up a password to secure your wallet
          </p>
        </div>

        <Card padding="lg">
          <CardContent>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
            >
              <Field name="name">
                <Field.Label>Wallet Name (optional)</Field.Label>
                <Field.Control
                  placeholder="My Wallet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field name="alias">
                <Field.Label>Wallet Alias (optional)</Field.Label>
                <Field.Control
                  placeholder="Main Wallet"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                />
              </Field>

              <Field
                name="password"
                invalid={!!password && !passwordCheck.isAcceptable}
              >
                <Field.Label>Password</Field.Label>
                <Field.Control
                  type="password"
                  placeholder="Enter a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {password && !passwordCheck.isAcceptable && (
                  <Field.Error>{passwordCheck.feedback[0]}</Field.Error>
                )}
                {password && passwordCheck.isAcceptable && (
                  <div className="mt-2 flex items-center justify-between text-[13px]">
                    <span className="text-neutral-500">Strength</span>
                    <span className="font-medium" style={{ color: getStrengthColor(passwordCheck.score) }}>
                      {passwordCheck.strength.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </Field>

              <Field
                name="confirmPassword"
                invalid={!!confirmPassword && !passwordsMatch}
              >
                <Field.Label>Confirm Password</Field.Label>
                <Field.Control
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {confirmPassword && !passwordsMatch && (
                  <Field.Error>Passwords do not match</Field.Error>
                )}
              </Field>

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
            </Form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-[13px] text-neutral-400">
          By creating a wallet, you agree to store your recovery phrase securely.
        </p>
      </div>
    </div>
  );
}

function getStrengthColor(score: number): string {
  if (score < 20) return '#dc2626';
  if (score < 40) return '#ea580c';
  if (score < 60) return '#ca8a04';
  if (score < 80) return '#65a30d';
  return '#16a34a';
}
