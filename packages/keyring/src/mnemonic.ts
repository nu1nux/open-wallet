import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { randomBytes } from '@open-wallet/crypto';

/**
 * Mnemonic word counts and their corresponding entropy bits
 */
export const MNEMONIC_STRENGTHS = {
  12: 128,
  15: 160,
  18: 192,
  21: 224,
  24: 256,
} as const;

export type MnemonicWordCount = keyof typeof MNEMONIC_STRENGTHS;

/**
 * Generate a new mnemonic phrase
 *
 * @param wordCount - Number of words (12, 15, 18, 21, or 24)
 * @returns BIP-39 mnemonic phrase
 */
export function generateMnemonic(wordCount: MnemonicWordCount = 24): string {
  const strength = MNEMONIC_STRENGTHS[wordCount];
  const entropy = randomBytes(strength / 8);
  return bip39.entropyToMnemonic(entropy, wordlist);
}

/**
 * Validate a mnemonic phrase
 *
 * @param mnemonic - The mnemonic phrase to validate
 * @returns true if valid, false otherwise
 */
export function validateMnemonic(mnemonic: string): boolean {
  try {
    return bip39.validateMnemonic(mnemonic, wordlist);
  } catch {
    return false;
  }
}

/**
 * Convert mnemonic to seed
 *
 * @param mnemonic - The mnemonic phrase
 * @param passphrase - Optional BIP-39 passphrase
 * @returns 64-byte seed
 */
export function mnemonicToSeed(mnemonic: string, passphrase = ''): Uint8Array {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic');
  }
  return bip39.mnemonicToSeedSync(mnemonic, passphrase);
}

/**
 * Convert mnemonic to entropy bytes
 *
 * @param mnemonic - The mnemonic phrase
 * @returns Entropy bytes
 */
export function mnemonicToEntropy(mnemonic: string): Uint8Array {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic');
  }
  return bip39.mnemonicToEntropy(mnemonic, wordlist);
}

/**
 * Convert entropy to mnemonic
 *
 * @param entropy - Entropy bytes (16, 20, 24, 28, or 32 bytes)
 * @returns BIP-39 mnemonic phrase
 */
export function entropyToMnemonic(entropy: Uint8Array): string {
  return bip39.entropyToMnemonic(entropy, wordlist);
}

/**
 * Get word count from mnemonic
 *
 * @param mnemonic - The mnemonic phrase
 * @returns Word count
 */
export function getMnemonicWordCount(mnemonic: string): number {
  return mnemonic.trim().split(/\s+/).length;
}

/**
 * Normalize a mnemonic (trim whitespace, lowercase, single spaces)
 *
 * @param mnemonic - The mnemonic phrase
 * @returns Normalized mnemonic
 */
export function normalizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Get the BIP-39 wordlist
 */
export function getWordlist(): string[] {
  return [...wordlist];
}

/**
 * Check if a word is in the BIP-39 wordlist
 */
export function isValidWord(word: string): boolean {
  return wordlist.includes(word.toLowerCase());
}

/**
 * Get word suggestions for autocomplete
 *
 * @param prefix - The prefix to match
 * @param limit - Maximum number of suggestions
 * @returns Array of matching words
 */
export function getWordSuggestions(prefix: string, limit = 5): string[] {
  const normalizedPrefix = prefix.toLowerCase();
  return wordlist
    .filter((word: string) => word.startsWith(normalizedPrefix))
    .slice(0, limit);
}
