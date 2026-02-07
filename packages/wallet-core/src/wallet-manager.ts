import { IStorage } from '@open-wallet/storage';
import { ErrorCode, Result, WalletMetadata, err, ok } from '@open-wallet/types';
import { LocalWallet } from './local-wallet';

const REGISTRY_KEY = 'wallet:registry';
const DEFAULT_MAX_WALLETS = 20;

interface WalletRegistry {
  walletIds: string[];
  version: number;
  maxWallets: number;
}

interface ManagedWallet {
  metadata: WalletMetadata;
  instance: LocalWallet | null;
  isUnlocked: boolean;
}

const EMPTY_REGISTRY: WalletRegistry = {
  walletIds: [],
  version: 1,
  maxWallets: DEFAULT_MAX_WALLETS,
};

export class WalletManager {
  private registry: WalletRegistry = EMPTY_REGISTRY;
  private managed = new Map<string, ManagedWallet>();
  private activeWalletId: string | null = null;

  private constructor(private readonly storage: IStorage) {}

  static async create(storage: IStorage): Promise<Result<WalletManager>> {
    const manager = new WalletManager(storage);
    const loadResult = await manager.loadRegistry();
    if (!loadResult.ok) return loadResult;
    return ok(manager);
  }

  listWallets(): WalletMetadata[] {
    return this.registry.walletIds
      .map((id) => this.managed.get(id)?.metadata)
      .filter((metadata): metadata is WalletMetadata => Boolean(metadata));
  }

  getWalletCount(): number {
    return this.registry.walletIds.length;
  }

  canCreateWallet(): boolean {
    return this.getWalletCount() < this.registry.maxWallets;
  }

  getActiveWalletId(): string | null {
    return this.activeWalletId;
  }

  private async loadRegistry(): Promise<Result<void>> {
    const stored = await this.storage.get<WalletRegistry>(REGISTRY_KEY);
    this.registry = stored ?? { ...EMPTY_REGISTRY, walletIds: [] };

    for (const walletId of this.registry.walletIds) {
      const metadata = await this.storage.get<WalletMetadata>(`wallet:${walletId}:metadata`);
      if (!metadata) {
        return err(ErrorCode.REGISTRY_CORRUPTED, `Missing metadata for wallet ${walletId}`);
      }

      this.managed.set(walletId, {
        metadata,
        instance: null,
        isUnlocked: false,
      });
    }

    this.activeWalletId = this.registry.walletIds[0] ?? null;
    return ok(undefined);
  }
}
