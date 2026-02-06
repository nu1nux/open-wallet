'use client';

import { useState } from 'react';
import { Button, Input, Alert, Modal } from './ui';
import { useWallet } from '@/hooks/useWallet';
import { checkPassword } from '@open-wallet/security';

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateWalletModal({ isOpen, onClose, onSuccess }: CreateWalletModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const { createWallet, isLoading, error } = useWallet();

  const passwordCheck = checkPassword(password);
  const passwordsMatch = password === confirmPassword;

  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setName('');
    setAlias('');
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordCheck.isAcceptable || !passwordsMatch) return;

    const success = await createWallet(password, name || undefined, alias || undefined);
    if (success) {
      resetForm();
      onSuccess();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Wallet">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Wallet Name (optional)"
          placeholder="My Wallet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label="Wallet Alias (optional)"
          placeholder="main-wallet"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          disabled={isLoading}
          hint="A unique identifier for quick access"
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Enter a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            error={password && !passwordCheck.isAcceptable ? passwordCheck.feedback[0] : undefined}
          />
          {password && passwordCheck.isAcceptable && (
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <span className="text-neutral-500">Strength</span>
              <span className="font-medium" style={{ color: getStrengthColor(passwordCheck.score) }}>
                {passwordCheck.strength.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
        />

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" fullWidth onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={!passwordCheck.isAcceptable || !passwordsMatch}
          >
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function getStrengthColor(score: number): string {
  if (score < 20) return '#dc2626';
  if (score < 40) return '#ea580c';
  if (score < 60) return '#ca8a04';
  if (score < 80) return '#65a30d';
  return '#16a34a';
}
