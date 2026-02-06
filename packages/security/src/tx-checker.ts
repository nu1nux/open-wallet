import { ChainId, EvmTxRequest, TxRequest, isEvmChain } from '@open-wallet/types';

/**
 * Transaction risk level
 */
export enum TransactionRisk {
  SAFE = 'safe',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Transaction check result
 */
export interface TransactionCheckResult {
  risk: TransactionRisk;
  warnings: string[];
  recommendations: string[];
}

/**
 * Known high-value thresholds (in wei/lamports)
 */
const HIGH_VALUE_THRESHOLDS = {
  ETH: BigInt('1000000000000000000'), // 1 ETH
  SOL: BigInt('1000000000'), // 1 SOL
};

/**
 * Known function selectors for risky operations
 */
const RISKY_FUNCTION_SELECTORS: Record<string, { name: string; risk: TransactionRisk }> = {
  // ERC-20 approve with unlimited amount
  '0x095ea7b3': { name: 'approve', risk: TransactionRisk.MEDIUM },
  // setApprovalForAll (NFTs)
  '0xa22cb465': { name: 'setApprovalForAll', risk: TransactionRisk.HIGH },
  // transferOwnership
  '0xf2fde38b': { name: 'transferOwnership', risk: TransactionRisk.CRITICAL },
  // upgradeTo
  '0x3659cfe6': { name: 'upgradeTo', risk: TransactionRisk.CRITICAL },
  // selfdestruct (via call)
  '0x00000000': { name: 'unknown', risk: TransactionRisk.LOW },
};

/**
 * Max uint256 for detecting unlimited approvals
 */
const MAX_UINT256 = 2n ** 256n - 1n;

/**
 * Check a transaction for security risks
 */
export function checkTransaction(request: TxRequest): TransactionCheckResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (isEvmChain(request.chainId)) {
    return checkEvmTransaction(request as EvmTxRequest);
  }

  // Generic checks
  if (request.value > 0n) {
    warnings.push(`Sending ${formatValue(request.value, request.chainId)} native tokens`);
  }

  return { risk: TransactionRisk.SAFE, warnings, recommendations };
}

/**
 * Check an EVM transaction
 */
function checkEvmTransaction(request: EvmTxRequest): TransactionCheckResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let risk = TransactionRisk.SAFE;

  // Check for high value
  if (request.value >= HIGH_VALUE_THRESHOLDS.ETH) {
    warnings.push('High value transaction - verify recipient address');
    risk = maxRisk(risk, TransactionRisk.MEDIUM);
  }

  // Check for contract interaction
  if (request.data && request.data.length > 2) {
    const selector = request.data.slice(0, 10);
    const knownFunction = RISKY_FUNCTION_SELECTORS[selector];

    if (knownFunction) {
      warnings.push(`This transaction calls ${knownFunction.name}()`);
      risk = maxRisk(risk, knownFunction.risk);

      // Check for unlimited approval
      if (selector === '0x095ea7b3' && request.data.length >= 74) {
        const amountHex = request.data.slice(74);
        try {
          const amount = BigInt('0x' + amountHex);
          if (amount === MAX_UINT256) {
            warnings.push('UNLIMITED token approval requested');
            recommendations.push('Consider approving only the needed amount');
            risk = maxRisk(risk, TransactionRisk.HIGH);
          }
        } catch {
          // Invalid hex, skip
        }
      }

      // setApprovalForAll warning
      if (selector === '0xa22cb465') {
        warnings.push('This grants approval for ALL your NFTs in this collection');
        recommendations.push('Only approve on trusted platforms');
      }
    } else {
      warnings.push('Contract interaction detected');
      recommendations.push('Verify you trust this contract');
    }
  }

  // Check gas settings
  if (request.maxFeePerGas) {
    const gasPriceGwei = Number(request.maxFeePerGas) / 1e9;
    if (gasPriceGwei > 100) {
      warnings.push(`High gas price: ${gasPriceGwei.toFixed(1)} gwei`);
      recommendations.push('Consider waiting for lower gas prices');
    }
  }

  // Check for zero address
  if (request.to === '0x0000000000000000000000000000000000000000') {
    warnings.push('Sending to zero address - funds will be lost');
    risk = TransactionRisk.CRITICAL;
  }

  return { risk, warnings, recommendations };
}

/**
 * Format value for display
 */
function formatValue(value: bigint, chainId: ChainId): string {
  if (isEvmChain(chainId)) {
    const eth = Number(value) / 1e18;
    return `${eth.toFixed(4)} ETH`;
  }
  const sol = Number(value) / 1e9;
  return `${sol.toFixed(4)} SOL`;
}

/**
 * Get the higher risk level
 */
function maxRisk(a: TransactionRisk, b: TransactionRisk): TransactionRisk {
  const levels = [
    TransactionRisk.SAFE,
    TransactionRisk.LOW,
    TransactionRisk.MEDIUM,
    TransactionRisk.HIGH,
    TransactionRisk.CRITICAL,
  ];
  return levels[Math.max(levels.indexOf(a), levels.indexOf(b))];
}

/**
 * Check if transaction requires extra confirmation
 */
export function requiresExtraConfirmation(result: TransactionCheckResult): boolean {
  return result.risk === TransactionRisk.HIGH || result.risk === TransactionRisk.CRITICAL;
}

/**
 * Get risk color for UI
 */
export function getRiskColor(risk: TransactionRisk): string {
  switch (risk) {
    case TransactionRisk.SAFE:
      return '#00cc44';
    case TransactionRisk.LOW:
      return '#88cc00';
    case TransactionRisk.MEDIUM:
      return '#ffcc00';
    case TransactionRisk.HIGH:
      return '#ff8800';
    case TransactionRisk.CRITICAL:
      return '#ff4444';
  }
}

/**
 * Get risk label for display
 */
export function getRiskLabel(risk: TransactionRisk): string {
  switch (risk) {
    case TransactionRisk.SAFE:
      return 'Safe';
    case TransactionRisk.LOW:
      return 'Low Risk';
    case TransactionRisk.MEDIUM:
      return 'Medium Risk';
    case TransactionRisk.HIGH:
      return 'High Risk';
    case TransactionRisk.CRITICAL:
      return 'Critical Risk';
  }
}
