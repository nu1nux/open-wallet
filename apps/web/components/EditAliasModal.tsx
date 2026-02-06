'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Alert, Modal } from './ui';
import { useWallet } from '@/hooks/useWallet';

interface EditAliasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentAlias: string;
}

export function EditAliasModal({ isOpen, onClose, onSuccess, currentAlias }: EditAliasModalProps) {
  const [alias, setAlias] = useState(currentAlias);
  const { updateAlias, isLoading, error } = useWallet();

  // Reset alias when modal opens with new currentAlias
  useEffect(() => {
    if (isOpen) {
      setAlias(currentAlias);
    }
  }, [isOpen, currentAlias]);

  const handleClose = () => {
    if (!isLoading) {
      setAlias(currentAlias);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await updateAlias(alias);
    if (success) {
      onSuccess();
    }
  };

  const hasChanges = alias !== currentAlias;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Alias">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Wallet Alias"
          placeholder="main-wallet"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          disabled={isLoading}
          hint="Leave empty to remove the alias"
        />

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" fullWidth onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" fullWidth isLoading={isLoading} disabled={!hasChanges}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
