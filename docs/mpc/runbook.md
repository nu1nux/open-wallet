# MPC Operations Runbook

## Overview

This runbook provides operational procedures for managing MPC key ceremonies and signing operations in Wallet Suite.

## Prerequisites

### Hardware Requirements
- Each party: Dedicated server or secure workstation
- Network: Reliable, low-latency connections between parties
- Storage: Encrypted storage for key shares

### Software Requirements
- Node.js 20+
- Docker (for containerized deployment)
- Secure shell access

### Personnel Requirements
- Minimum 3 key holders for 2-of-3 setup
- 1 ceremony coordinator
- 1 security observer (recommended)

## Key Generation Ceremony

### Pre-Ceremony Checklist
- [ ] All parties have secure workstations
- [ ] Network connectivity verified between all parties
- [ ] Backup procedures documented
- [ ] Emergency contacts confirmed
- [ ] Audit logging enabled

### Step 1: Initialize Ceremony
```bash
# On coordinator machine
./scripts/mpc/init-keygen.sh \
  --threshold 2 \
  --parties 3 \
  --session-id "keygen-$(date +%Y%m%d)"
```

### Step 2: Party Registration
Each party runs:
```bash
# On party machine
./scripts/mpc/register-party.sh \
  --session-id "keygen-20240115" \
  --party-index 0 \
  --coordinator-url "https://coordinator.internal"
```

### Step 3: Execute Key Generation
```bash
# Coordinator initiates
./scripts/mpc/start-keygen.sh --session-id "keygen-20240115"

# Monitor progress
./scripts/mpc/status.sh --session-id "keygen-20240115"
```

### Step 4: Verify Results
```bash
# Each party verifies
./scripts/mpc/verify-keygen.sh \
  --session-id "keygen-20240115" \
  --expected-pubkey "0x..."
```

### Step 5: Backup Key Shares
Each party:
1. Export encrypted key share
2. Store in secure location
3. Test restoration

### Post-Ceremony
- [ ] Document ceremony completion
- [ ] Store public key in config
- [ ] Destroy ceremony session data
- [ ] Update key management records

## Signing Operations

### Online Signing (Normal Operation)

#### Step 1: Initiate Signing Request
```bash
./scripts/mpc/sign.sh \
  --session-id "sign-$(uuidgen)" \
  --message "0x..." \
  --participants "0,1"
```

#### Step 2: Approve Signing
Each participating party:
1. Review transaction details
2. Authenticate (MFA required)
3. Approve signing

#### Step 3: Monitor Completion
```bash
./scripts/mpc/sign-status.sh --session-id "sign-xxx"
```

### Offline Signing (Air-Gapped)

For high-value transactions:

1. Export signing request to USB
2. Transfer to air-gapped machine
3. Sign with local key share
4. Export partial signature
5. Combine signatures on coordinator

## Key Refresh

### Scheduled Refresh (Monthly)

```bash
# Initiate refresh
./scripts/mpc/refresh.sh \
  --session-id "refresh-$(date +%Y%m)" \
  --all-parties

# Verify public key unchanged
./scripts/mpc/verify-pubkey.sh
```

### Emergency Share Rotation

When a party's share may be compromised:

1. **Isolate**: Disable compromised party's access
2. **Assess**: Determine if threshold is still secure
3. **Refresh**: Execute emergency refresh
4. **Revoke**: Invalidate old shares
5. **Audit**: Review access logs

## Recovery Procedures

### Lost Share Recovery

When a party loses their key share:

1. Verify identity of recovering party
2. Ensure threshold (t) parties available
3. Execute share recovery:
```bash
./scripts/mpc/recover-share.sh \
  --recovering-party 2 \
  --participants "0,1"
```
4. Verify new share works
5. Refresh all shares

### Full Key Recovery (Emergency Only)

**Warning**: This reconstructs the full private key and should only be used in emergencies.

1. Assemble t key holders physically
2. Air-gap the recovery machine
3. Execute recovery:
```bash
./scripts/mpc/emergency-recover.sh \
  --participants "0,1" \
  --output "recovered-key.enc"
```
4. Immediately migrate to new key
5. Destroy recovered key

## Monitoring

### Health Checks

```bash
# Check all parties
./scripts/mpc/health.sh

# Expected output:
# Party 0: ONLINE (latency: 45ms)
# Party 1: ONLINE (latency: 52ms)
# Party 2: ONLINE (latency: 48ms)
```

### Alerts
- Party offline > 5 minutes
- Signing timeout > 30 seconds
- Failed authentication attempts
- Unusual signing patterns

### Metrics
- Signing success rate
- Average signing latency
- Party availability
- Network latency between parties

## Troubleshooting

### Signing Timeout
1. Check party connectivity
2. Verify all parties received request
3. Check for network partitions
4. Retry with fresh session

### Party Unreachable
1. Verify network connectivity
2. Check party service status
3. Review firewall rules
4. Failover to backup party if available

### Invalid Signature
1. Verify message hash matches
2. Check public key configuration
3. Review party logs for errors
4. Re-execute signing ceremony

### Key Mismatch After Refresh
1. **Do not panic** - Public key should not change
2. Compare party public keys
3. Identify inconsistent party
4. Restore from backup if needed

## Security Procedures

### Party Compromise Response
1. Disable compromised party immediately
2. Rotate all authentication credentials
3. Execute emergency key refresh
4. Review audit logs
5. File incident report

### Audit Log Review
```bash
# Export audit logs
./scripts/mpc/export-audit.sh \
  --from "2024-01-01" \
  --to "2024-01-31" \
  --output audit-jan.json
```

### Compliance Verification
- Monthly: Key share backup verification
- Quarterly: Access control review
- Annually: Full security audit

## Contacts

### On-Call Schedule
- Primary: [Party 0 holder]
- Secondary: [Party 1 holder]
- Escalation: [Security team]

### Emergency Contacts
- Security incident: security@example.com
- Key ceremony support: keymgmt@example.com
