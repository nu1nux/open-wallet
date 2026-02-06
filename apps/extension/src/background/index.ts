/**
 * Background Service Worker for Wallet Suite Extension
 *
 * This service worker handles:
 * - Wallet state management
 * - Message passing between popup and content scripts
 * - Transaction signing requests
 * - Network requests
 */

// Message types
type MessageType =
  | 'WALLET_UNLOCK'
  | 'WALLET_LOCK'
  | 'WALLET_STATUS'
  | 'SIGN_TRANSACTION'
  | 'SIGN_MESSAGE'
  | 'GET_ACCOUNTS'
  | 'GET_BALANCE'
  | 'GET_CHAIN_ID'
  | 'SET_CHAIN_ID';

interface Message {
  type: MessageType;
  payload?: unknown;
}

interface ExtensionResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Wallet state
let isUnlocked = false;
let unlockTimestamp = 0;
const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// Chain state (session only, resets to mainnet on extension restart)
let selectedEvmChainId = 1; // ETH_MAINNET
let selectedSolanaChainId = 101; // SOLANA_MAINNET

// Auto-lock timer
setInterval(() => {
  if (isUnlocked && Date.now() - unlockTimestamp > LOCK_TIMEOUT_MS) {
    isUnlocked = false;
    // eslint-disable-next-line no-console
    console.log('[Wallet] Auto-locked due to inactivity');
  }
}, 60000); // Check every minute

// Message handler
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: ExtensionResponse) => void) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

    // Return true to indicate async response
    return true;
  }
);

async function handleMessage(message: Message): Promise<ExtensionResponse> {
  switch (message.type) {
    case 'WALLET_STATUS':
      return {
        success: true,
        data: { isUnlocked },
      };

    case 'WALLET_UNLOCK':
      // In real implementation, decrypt wallet with password
      isUnlocked = true;
      unlockTimestamp = Date.now();
      // Reset to mainnet on unlock
      selectedEvmChainId = 1;
      selectedSolanaChainId = 101;
      return { success: true };

    case 'WALLET_LOCK':
      isUnlocked = false;
      return { success: true };

    case 'GET_ACCOUNTS':
      if (!isUnlocked) {
        return { success: false, error: 'Wallet is locked' };
      }
      // Return mock accounts for now
      return {
        success: true,
        data: [
          {
            address: '0x1234567890123456789012345678901234567890',
            name: 'Account 1',
          },
        ],
      };

    case 'SIGN_TRANSACTION':
      if (!isUnlocked) {
        return { success: false, error: 'Wallet is locked' };
      }
      // In real implementation, sign the transaction
      return { success: false, error: 'Not implemented' };

    case 'SIGN_MESSAGE':
      if (!isUnlocked) {
        return { success: false, error: 'Wallet is locked' };
      }
      // In real implementation, sign the message
      return { success: false, error: 'Not implemented' };

    case 'GET_CHAIN_ID':
      return {
        success: true,
        data: {
          evm: selectedEvmChainId,
          solana: selectedSolanaChainId,
        },
      };

    case 'SET_CHAIN_ID': {
      const payload = message.payload as { family: 'evm' | 'solana'; chainId: number } | undefined;
      if (!payload || typeof payload.family !== 'string' || typeof payload.chainId !== 'number') {
        return { success: false, error: 'Invalid payload' };
      }
      if (!['evm', 'solana'].includes(payload.family)) {
        return { success: false, error: 'Invalid chain family' };
      }
      // Validate chainId is a known chain (basic validation using known mainnet/testnet IDs)
      const validEvmChainIds = [1, 11155111, 137, 80002, 42161, 10, 8453, 43114, 56, 31337];
      const validSolanaChainIds = [101, 102, 103, 104];
      const validChainIds = payload.family === 'evm' ? validEvmChainIds : validSolanaChainIds;
      if (!validChainIds.includes(payload.chainId)) {
        return { success: false, error: 'Unknown chain ID' };
      }
      if (payload.family === 'evm') {
        selectedEvmChainId = payload.chainId;
      } else {
        selectedSolanaChainId = payload.chainId;
      }
      return { success: true };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// Extension install/update handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // eslint-disable-next-line no-console
    console.log('[Wallet] Extension installed');
  } else if (details.reason === 'update') {
    // eslint-disable-next-line no-console
    console.log('[Wallet] Extension updated');
  }
});
