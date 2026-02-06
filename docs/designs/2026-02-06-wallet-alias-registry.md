# Wallet Alias Registry for Creation Flow

**Date:** 2026-02-06

## Context
The brainstorming started from a request to add a wallet name alias during wallet creation. The current flow already supports an optional `name`, but there is no separate alias concept and no alias uniqueness behavior. The goal was to define how alias should behave at creation time without changing the canonical meaning of the existing wallet name.

## Discussion
The session clarified three key requirements. First, alias should be a separate field instead of replacing name. Second, alias must be unique globally per wallet profile. Third, `name` remains the canonical wallet name, while alias is a secondary display identity.

Three design options were explored. Option 1 was a minimal metadata extension with inline uniqueness checks. Option 2 introduced a broader profile layer for future preferences. Option 3 introduced a dedicated alias registry abstraction for uniqueness and future multi-wallet support. Option 3 was selected despite higher complexity because it centralizes identity rules and scales better.

## Approach
Add optional `alias` support to wallet creation and persist it in wallet metadata while keeping `name` canonical. Enforce uniqueness through a dedicated alias registry keyed by normalized aliases. Validation and normalization are handled in wallet-core, not the UI layer, so rules stay consistent across entry points.

Errors should follow the existing `Result` pattern, including invalid alias format and alias collision outcomes. Existing wallets without alias remain valid. Lifecycle behavior should include registry updates for future alias changes and registry cleanup on wallet destruction.

## Architecture
The design uses four parts:

1. Wallet metadata store: keeps wallet metadata and adds optional alias alongside canonical name.
2. Alias registry store: stores normalized alias-to-wallet ID mappings (and optional reverse mapping).
3. Alias validation service: performs normalization, format checks, reserved checks, and uniqueness checks.
4. Initialization orchestrator: writes keyring, metadata, and alias mapping in a consistent sequence with failure handling.

Creation flow:
1. UI collects `name` and optional `alias`.
2. Hook passes both values into wallet initialization.
3. Core normalizes alias and validates uniqueness in registry.
4. On success, core persists encrypted wallet, metadata, and alias mapping, then unlocks.
5. On collision, return a deterministic alias-exists error.

Reliability notes:
1. Use lazy/backfill reconciliation on load for metadata-registry mismatches.
2. Keep normalization deterministic (trim, lowercase, whitespace normalization).
3. Include tests for normalization equivalence, uniqueness conflicts, persistence consistency, destroy cleanup, backward compatibility, and near-concurrent same-alias create attempts.
