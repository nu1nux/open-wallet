import { IStorage } from '@open-wallet/storage';
import { ErrorCode, Result, err, ok } from '@open-wallet/types';

export const ALIAS_REGISTRY_STORAGE_KEY = 'wallet:aliases';

export interface AliasRegistry {
  aliasToWalletId: Record<string, string>;
  walletIdToAlias: Record<string, string>;
}

const EMPTY_REGISTRY: AliasRegistry = {
  aliasToWalletId: {},
  walletIdToAlias: {},
};

export function normalizeAlias(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function validateAlias(raw: string): Result<string> {
  const normalized = normalizeAlias(raw);
  if (!normalized) {
    return err(ErrorCode.INVALID_INPUT, 'Alias cannot be empty');
  }
  if (normalized.length > 40) {
    return err(ErrorCode.INVALID_INPUT, 'Alias must be 40 characters or fewer');
  }
  return ok(normalized);
}

export async function loadAliasRegistry(storage: IStorage): Promise<AliasRegistry> {
  return (await storage.get<AliasRegistry>(ALIAS_REGISTRY_STORAGE_KEY)) ?? {
    ...EMPTY_REGISTRY,
    aliasToWalletId: {},
    walletIdToAlias: {},
  };
}

async function saveAliasRegistry(storage: IStorage, registry: AliasRegistry): Promise<void> {
  await storage.set(ALIAS_REGISTRY_STORAGE_KEY, registry);
}

export async function reserveAlias(
  storage: IStorage,
  walletId: string,
  rawAlias: string
): Promise<Result<string>> {
  const validated = validateAlias(rawAlias);
  if (!validated.ok) return validated;
  const normalized = validated.value;

  const registry = await loadAliasRegistry(storage);
  const currentOwner = registry.aliasToWalletId[normalized];
  if (currentOwner && currentOwner !== walletId) {
    return err(ErrorCode.ALIAS_ALREADY_EXISTS, 'Alias already exists');
  }

  const previousAlias = registry.walletIdToAlias[walletId];
  if (previousAlias && previousAlias !== normalized) {
    delete registry.aliasToWalletId[previousAlias];
  }

  registry.aliasToWalletId[normalized] = walletId;
  registry.walletIdToAlias[walletId] = normalized;
  await saveAliasRegistry(storage, registry);
  return ok(normalized);
}

export async function releaseAlias(storage: IStorage, walletId: string): Promise<void> {
  const registry = await loadAliasRegistry(storage);
  const alias = registry.walletIdToAlias[walletId];
  if (!alias) return;
  delete registry.walletIdToAlias[walletId];
  delete registry.aliasToWalletId[alias];
  await saveAliasRegistry(storage, registry);
}
