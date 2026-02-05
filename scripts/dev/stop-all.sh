#!/bin/bash

# Stop all development services

echo "Stopping development services..."

# Stop Anvil
pkill -f "anvil" 2>/dev/null && echo "Stopped Anvil" || echo "Anvil not running"

# Stop Solana Test Validator
pkill -f "solana-test-validator" 2>/dev/null && echo "Stopped Solana Test Validator" || echo "Solana Test Validator not running"

echo "Done"
