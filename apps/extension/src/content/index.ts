/**
 * Content Script for Wallet Suite Extension
 *
 * This script is injected into web pages and:
 * - Injects the provider object (window.walletSuite)
 * - Handles communication between dApps and the extension
 * - Implements EIP-1193 provider interface for EVM
 */

// Inject provider script into page context
function injectProvider() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('src/content/provider.js');
  script.type = 'module';
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
}

// Only inject if we're in a web page
if (document.contentType === 'text/html') {
  injectProvider();
}

// Message relay between page and background
window.addEventListener('message', async (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;

  const message = event.data;

  // Only handle our messages
  if (message?.target !== 'wallet-suite-content') return;

  try {
    // Forward to background script
    const response = await chrome.runtime.sendMessage(message.data);

    // Send response back to page
    window.postMessage(
      {
        target: 'wallet-suite-page',
        id: message.id,
        response,
      },
      '*'
    );
  } catch (error) {
    window.postMessage(
      {
        target: 'wallet-suite-page',
        id: message.id,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      '*'
    );
  }
});

// eslint-disable-next-line no-console
console.log('[WalletSuite] Content script loaded');
