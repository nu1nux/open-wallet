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
  | 'GET_BALANCE';

interface Message {
  type: MessageType;
  payload?: unknown;
}

interface Response {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Wallet state
let isUnlocked = false;
let unlockTimestamp = 0;
const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

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
  (message: Message, _sender, sendResponse: (response: Response) => void) => {
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

async function handleMessage(message: Message): Promise<Response> {
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
