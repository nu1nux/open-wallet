/**
 * Threat categories for security analysis
 */
export enum ThreatCategory {
  /** Key theft through malware, phishing, etc. */
  KEY_THEFT = 'key_theft',
  /** Transaction manipulation or replay */
  TRANSACTION_MANIPULATION = 'transaction_manipulation',
  /** Address substitution attacks */
  ADDRESS_SUBSTITUTION = 'address_substitution',
  /** Social engineering attacks */
  SOCIAL_ENGINEERING = 'social_engineering',
  /** Smart contract vulnerabilities */
  SMART_CONTRACT = 'smart_contract',
  /** Network-level attacks (MITM, DNS hijacking) */
  NETWORK_ATTACK = 'network_attack',
  /** Physical access attacks */
  PHYSICAL_ACCESS = 'physical_access',
  /** Supply chain attacks */
  SUPPLY_CHAIN = 'supply_chain',
}

/**
 * Threat severity levels
 */
export enum ThreatSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Threat definition
 */
export interface Threat {
  id: string;
  category: ThreatCategory;
  name: string;
  description: string;
  severity: ThreatSeverity;
  mitigations: string[];
}

/**
 * Security control
 */
export interface SecurityControl {
  id: string;
  name: string;
  description: string;
  implemented: boolean;
  threats: string[]; // Threat IDs this control mitigates
}

/**
 * Threat model for the wallet
 */
export const WALLET_THREAT_MODEL: Threat[] = [
  // Key Theft
  {
    id: 'T001',
    category: ThreatCategory.KEY_THEFT,
    name: 'Mnemonic Exposure',
    description: 'Attacker obtains mnemonic through screenshots, keyloggers, or memory dumps',
    severity: ThreatSeverity.CRITICAL,
    mitigations: [
      'Encrypt mnemonic at rest with strong KDF',
      'Clear mnemonic from memory after use',
      'Warn users never to share mnemonic',
      'Use secure input methods',
    ],
  },
  {
    id: 'T002',
    category: ThreatCategory.KEY_THEFT,
    name: 'Private Key Extraction',
    description: 'Attacker extracts private keys from browser extension storage',
    severity: ThreatSeverity.CRITICAL,
    mitigations: [
      'Use encrypted storage for all key material',
      'Derive keys from mnemonic on-demand',
      'Clear keys from memory when locked',
    ],
  },
  {
    id: 'T003',
    category: ThreatCategory.KEY_THEFT,
    name: 'Phishing Attack',
    description: 'User enters mnemonic on fake website',
    severity: ThreatSeverity.HIGH,
    mitigations: [
      'Never request mnemonic import in popup',
      'Show clear warnings about mnemonic security',
      'Verify website URLs before interaction',
    ],
  },

  // Transaction Manipulation
  {
    id: 'T004',
    category: ThreatCategory.TRANSACTION_MANIPULATION,
    name: 'Transaction Tampering',
    description: 'Malicious dApp modifies transaction parameters before signing',
    severity: ThreatSeverity.HIGH,
    mitigations: [
      'Show clear transaction details before signing',
      'Verify destination address',
      'Estimate and display gas costs',
    ],
  },
  {
    id: 'T005',
    category: ThreatCategory.TRANSACTION_MANIPULATION,
    name: 'Blind Signing',
    description: 'User signs transaction without understanding its effects',
    severity: ThreatSeverity.HIGH,
    mitigations: [
      'Parse and decode contract calls',
      'Show human-readable descriptions',
      'Warn on unverified contracts',
    ],
  },

  // Address Substitution
  {
    id: 'T006',
    category: ThreatCategory.ADDRESS_SUBSTITUTION,
    name: 'Clipboard Hijacking',
    description: 'Malware replaces copied addresses with attacker address',
    severity: ThreatSeverity.HIGH,
    mitigations: [
      'Verify address after paste',
      'Use address book for known addresses',
      'Show address checksums',
    ],
  },

  // Smart Contract
  {
    id: 'T007',
    category: ThreatCategory.SMART_CONTRACT,
    name: 'Unlimited Token Approval',
    description: 'User approves unlimited spending to malicious contract',
    severity: ThreatSeverity.HIGH,
    mitigations: [
      'Warn on unlimited approvals',
      'Show approval amounts clearly',
      'Suggest limited approval amounts',
    ],
  },

  // Network
  {
    id: 'T008',
    category: ThreatCategory.NETWORK_ATTACK,
    name: 'RPC Manipulation',
    description: 'Malicious RPC returns false balance/transaction data',
    severity: ThreatSeverity.MEDIUM,
    mitigations: [
      'Use multiple RPC endpoints',
      'Verify critical data from multiple sources',
      'Use reputable RPC providers',
    ],
  },
];

/**
 * Security controls implemented in the wallet
 */
export const SECURITY_CONTROLS: SecurityControl[] = [
  {
    id: 'C001',
    name: 'Encrypted Storage',
    description: 'All sensitive data is encrypted with AES-256-GCM',
    implemented: true,
    threats: ['T001', 'T002'],
  },
  {
    id: 'C002',
    name: 'Strong KDF',
    description: 'PBKDF2/Scrypt with high iteration count for key derivation',
    implemented: true,
    threats: ['T001', 'T002'],
  },
  {
    id: 'C003',
    name: 'Auto-Lock',
    description: 'Wallet automatically locks after inactivity',
    implemented: false,
    threats: ['T001', 'T007'],
  },
  {
    id: 'C004',
    name: 'Transaction Preview',
    description: 'Clear display of transaction details before signing',
    implemented: true,
    threats: ['T004', 'T005', 'T006'],
  },
  {
    id: 'C005',
    name: 'Address Verification',
    description: 'Checksum validation and address book',
    implemented: true,
    threats: ['T006'],
  },
  {
    id: 'C006',
    name: 'Approval Warnings',
    description: 'Warnings for unlimited token approvals',
    implemented: false,
    threats: ['T007'],
  },
  {
    id: 'C007',
    name: 'RPC Fallback',
    description: 'Automatic failover to backup RPC endpoints',
    implemented: true,
    threats: ['T008'],
  },
];

/**
 * Get threats by category
 */
export function getThreatsByCategory(category: ThreatCategory): Threat[] {
  return WALLET_THREAT_MODEL.filter((t) => t.category === category);
}

/**
 * Get threats by severity
 */
export function getThreatsBySeverity(severity: ThreatSeverity): Threat[] {
  return WALLET_THREAT_MODEL.filter((t) => t.severity === severity);
}

/**
 * Get controls for a threat
 */
export function getControlsForThreat(threatId: string): SecurityControl[] {
  return SECURITY_CONTROLS.filter((c) => c.threats.includes(threatId));
}

/**
 * Get unmitigated threats
 */
export function getUnmitigatedThreats(): Threat[] {
  return WALLET_THREAT_MODEL.filter((threat) => {
    const controls = getControlsForThreat(threat.id);
    return controls.every((c) => !c.implemented);
  });
}
