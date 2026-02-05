# MPC Protocol Specification

## Overview

This document describes the Multi-Party Computation (MPC) protocol for distributed key generation and signing in Wallet Suite.

## Goals

1. **Threshold Security**: 2-of-3 signature scheme - any 2 parties can sign
2. **Key Confidentiality**: No single party knows the full private key
3. **Forward Secrecy**: Key refresh without changing the public key
4. **Non-Interactivity**: Minimize communication rounds during signing

## Protocol Selection

### For ECDSA (EVM)
**Protocol**: GG20 (Gennaro & Goldfeder, 2020)
- Threshold ECDSA without trusted dealer
- 6-round key generation
- 4-round signing (or 1-round with preprocessing)

### For EdDSA (Solana)
**Protocol**: FROST (Flexible Round-Optimized Schnorr Threshold)
- Threshold Schnorr signatures
- 2-round signing
- More efficient than threshold ECDSA

## Key Generation Ceremony

### Phase 1: Commitment
Each party i:
1. Generate random polynomial f_i(x) of degree t-1
2. Compute commitment C_i = g^{f_i(0)}
3. Broadcast C_i

### Phase 2: Share Distribution
Each party i:
1. Compute shares s_{ij} = f_i(j) for each party j
2. Encrypt s_{ij} with party j's public key
3. Send encrypted share to party j

### Phase 3: Verification
Each party j:
1. Decrypt received shares
2. Verify shares against commitments
3. Compute private share x_j = Σ s_{ij}
4. Compute public key Y = Π C_i

### Output
- Each party holds: (x_i, Y)
- x_i: private key share
- Y: common public key

## Signing Protocol (GG20)

### Input
- Message m to sign
- t parties participating (threshold)

### Phase 1: Initialization
Each party i:
1. Generate random k_i, γ_i
2. Compute R_i = g^{k_i}
3. Broadcast commitment to R_i

### Phase 2: R Computation
1. Reveal R_i values
2. Compute R = Π R_i
3. Derive r = x-coordinate of R

### Phase 3: Signature Share
Each party i:
1. Compute σ_i = k_i^{-1}(m + r·x_i)
2. Broadcast σ_i

### Phase 4: Combination
1. Compute s = Σ λ_i · σ_i (Lagrange interpolation)
2. Output signature (r, s)

## Key Refresh Protocol

### Purpose
- Proactive security: Refresh shares periodically
- Key rotation: Update shares without changing public key
- Recovery: Generate new share for lost party

### Protocol
1. Generate refresh polynomial with f(0) = 0
2. Distribute refresh shares
3. Each party adds refresh share to existing share
4. Public key remains unchanged

## Communication Protocol

### Message Format
```typescript
interface MpcMessage {
  type: 'keygen' | 'sign' | 'refresh';
  round: number;
  fromParty: number;
  toParty: number | 'broadcast';
  sessionId: string;
  payload: Uint8Array;
  signature: Uint8Array;  // Authentication
  timestamp: number;
}
```

### Transport
- Primary: WebSocket for real-time communication
- Fallback: HTTPS polling
- End-to-end encryption between parties

### Authentication
- Each party has an identity key pair
- All messages signed with identity key
- TLS for transport security

## Security Considerations

### Assumptions
1. At most t-1 parties are corrupted
2. Secure point-to-point channels
3. Reliable broadcast
4. PKI for party identity

### Attack Vectors
1. **Denial of Service**: Abort detection and blame
2. **Information Leakage**: Zero-knowledge proofs
3. **Malicious Behavior**: Verifiable secret sharing

### Mitigations
1. Commitment schemes to prevent adaptive attacks
2. ZK proofs for honest behavior
3. Timeout and abort protocols
4. Session isolation

## Implementation Notes

### Libraries
- **ECDSA**: Consider using tss-lib or multi-party-ecdsa
- **EdDSA**: Use FROST reference implementation

### Performance
- Key generation: ~5 seconds (6 rounds)
- Signing: ~1 second (4 rounds)
- With preprocessing: <100ms per signature

### Storage
- Key shares encrypted at rest
- Separate encryption per party
- Secure deletion after use

## Recovery Procedures

### Lost Share Recovery
1. Remaining t parties collaborate
2. Generate new share for recovering party
3. Use key refresh to update all shares

### Emergency Key Recovery
1. Requires t parties with valid shares
2. Reconstruct full private key (breaks threshold security)
3. Use only in emergency situations

## Compliance

### Audit Trail
- Log all ceremony events
- Record party participation
- Store non-sensitive metadata

### Key Ceremony Requirements
- Video recording of ceremony
- Multi-factor authentication for participants
- Air-gapped ceremony machine (recommended)
