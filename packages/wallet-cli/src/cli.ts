#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { generateCommand } from './commands/generate';
import { deriveCommand } from './commands/derive';
import { balanceCommand } from './commands/balance';
import { sendCommand } from './commands/send';

const program = new Command();

program
  .name('wallet')
  .description('Wallet Suite CLI - Multi-chain cryptocurrency wallet')
  .version('0.0.1');

// Generate command
program
  .command('generate')
  .description('Generate a new wallet with mnemonic')
  .option('-w, --words <count>', 'Number of words (12, 15, 18, 21, 24)', '24')
  .option('--json', 'Output as JSON')
  .action(generateCommand);

// Derive command
program
  .command('derive')
  .description('Derive accounts from a mnemonic')
  .option('-m, --mnemonic <phrase>', 'Mnemonic phrase (or use WALLET_MNEMONIC env)')
  .option('-c, --chain <family>', 'Chain family (evm, solana)', 'evm')
  .option('-n, --count <number>', 'Number of accounts to derive', '1')
  .option('--json', 'Output as JSON')
  .action(deriveCommand);

// Balance command
program
  .command('balance')
  .description('Check balance of an address')
  .argument('<address>', 'Wallet address')
  .option('-c, --chain <chainId>', 'Chain ID (1 for ETH mainnet, 101 for Solana)', '1')
  .option('--json', 'Output as JSON')
  .action(balanceCommand);

// Send command
program
  .command('send')
  .description('Send tokens to an address')
  .argument('<to>', 'Recipient address')
  .argument('<amount>', 'Amount to send')
  .option('-m, --mnemonic <phrase>', 'Mnemonic phrase (or use WALLET_MNEMONIC env)')
  .option('-c, --chain <chainId>', 'Chain ID', '1')
  .option('-i, --index <number>', 'Account index', '0')
  .option('--dry-run', 'Simulate without sending')
  .action(sendCommand);

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error) {
  if (error instanceof Error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
  process.exit(1);
}
