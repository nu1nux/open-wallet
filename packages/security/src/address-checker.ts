import { checksumEvmAddress, isValidChecksumAddress } from '@open-wallet/crypto';

/**
 * Address risk level
 */
export enum AddressRisk {
  SAFE = 'safe',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Address check result
 */
export interface AddressCheckResult {
  valid: boolean;
  checksumValid: boolean;
  risk: AddressRisk;
  warnings: string[];
}

/**
 * Known malicious addresses (example subset)
 */
const KNOWN_MALICIOUS_ADDRESSES = new Set([
  // Example phishing addresses - in production this would be a larger list
  '0x0000000000000000000000000000000000000000',
]);

/**
 * Known contract addresses that should be treated with caution
 */
const KNOWN_RISKY_CONTRACTS = new Set([
  // Example - in production this would include known scam contracts
]);

/**
 * Check an EVM address
 */
export function checkEvmAddress(address: string): AddressCheckResult {
  const warnings: string[] = [];
  let risk = AddressRisk.SAFE;

  // Basic format validation
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return {
      valid: false,
      checksumValid: false,
      risk: AddressRisk.CRITICAL,
      warnings: ['Invalid address format'],
    };
  }

  // Check checksum
  const checksumValid = isValidChecksumAddress(address);
  if (!checksumValid && address !== address.toLowerCase()) {
    warnings.push('Address has invalid checksum - verify carefully');
    risk = AddressRisk.MEDIUM;
  }

  // Check for zero address
  if (address.toLowerCase() === '0x0000000000000000000000000000000000000000') {
    warnings.push('This is the zero address - funds sent here will be lost');
    risk = AddressRisk.CRITICAL;
  }

  // Check for known malicious addresses
  if (KNOWN_MALICIOUS_ADDRESSES.has(address.toLowerCase())) {
    warnings.push('This address has been flagged as malicious');
    risk = AddressRisk.CRITICAL;
  }

  // Check for known risky contracts
  if (KNOWN_RISKY_CONTRACTS.has(address.toLowerCase())) {
    warnings.push('This contract has been flagged as potentially risky');
    risk = AddressRisk.HIGH;
  }

  // Check for similar addresses (potential typosquatting)
  // In production, this would check against user's address book

  return {
    valid: true,
    checksumValid,
    risk,
    warnings,
  };
}

/**
 * Check a Solana address
 */
export function checkSolanaAddress(address: string): AddressCheckResult {
  const warnings: string[] = [];
  let risk = AddressRisk.SAFE;

  // Basic format validation (base58, 32-44 chars)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!base58Regex.test(address)) {
    return {
      valid: false,
      checksumValid: false,
      risk: AddressRisk.CRITICAL,
      warnings: ['Invalid Solana address format'],
    };
  }

  // Solana addresses don't have checksums in the same way
  // But we can check for known patterns

  // Check for system program (usually intentional)
  if (address === '11111111111111111111111111111111') {
    warnings.push('This is the Solana System Program address');
    risk = AddressRisk.LOW;
  }

  return {
    valid: true,
    checksumValid: true, // Solana uses base58check internally
    risk,
    warnings,
  };
}

/**
 * Compare two addresses for similarity (detect typosquatting)
 */
export function checkAddressSimilarity(address1: string, address2: string): number {
  // Levenshtein distance
  const a = address1.toLowerCase();
  const b = address2.toLowerCase();

  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[a.length][b.length];
  const maxLength = Math.max(a.length, b.length);

  // Return similarity as percentage (0-100)
  return ((maxLength - distance) / maxLength) * 100;
}

/**
 * Check if address might be a typosquat of another
 */
export function isSuspiciouslySimilar(
  address: string,
  knownAddresses: string[],
  threshold = 90
): { similar: boolean; matches: string[] } {
  const matches = knownAddresses.filter(
    (known) =>
      known.toLowerCase() !== address.toLowerCase() &&
      checkAddressSimilarity(address, known) >= threshold
  );

  return {
    similar: matches.length > 0,
    matches,
  };
}

/**
 * Format address for display (shortened form)
 */
export function formatAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Get checksummed EVM address
 */
export function getChecksummedAddress(address: string): string {
  return checksumEvmAddress(address);
}
