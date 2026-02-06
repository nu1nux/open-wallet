import chalk from 'chalk';
import ora from 'ora';
import { password } from '@inquirer/prompts';
import {
  validateMnemonic,
  createEvmAccountFromMnemonic,
  createSolanaAccountFromMnemonic,
} from '@open-wallet/keyring';
import { ChainFamily } from '@open-wallet/types';

interface DeriveOptions {
  mnemonic?: string;
  chain: string;
  count: string;
  json?: boolean;
}

export async function deriveCommand(options: DeriveOptions): Promise<void> {
  const spinner = ora('Deriving accounts...').start();

  try {
    // Get mnemonic
    let mnemonic = options.mnemonic || process.env.WALLET_MNEMONIC;

    if (!mnemonic) {
      spinner.stop();
      mnemonic = await password({
        message: 'Enter your recovery phrase:',
        mask: '*',
      });
    }

    // Validate mnemonic
    if (!validateMnemonic(mnemonic)) {
      spinner.fail('Invalid mnemonic phrase');
      process.exit(1);
    }

    // Parse chain family
    const chainFamily = options.chain.toLowerCase() === 'solana'
      ? ChainFamily.SOLANA
      : ChainFamily.EVM;

    // Parse count
    const count = parseInt(options.count, 10);
    if (isNaN(count) || count < 1 || count > 100) {
      spinner.fail('Invalid account count (must be 1-100)');
      process.exit(1);
    }

    spinner.start('Deriving accounts...');

    // Derive accounts
    const accounts = [];
    for (let i = 0; i < count; i++) {
      const account = chainFamily === ChainFamily.EVM
        ? createEvmAccountFromMnemonic(mnemonic, i)
        : createSolanaAccountFromMnemonic(mnemonic, i);

      accounts.push({
        index: i,
        address: account.address,
        path: account.derivationPath,
        // Don't include private key in output by default
      });
    }

    spinner.succeed(`Derived ${count} ${chainFamily} account(s)`);

    if (options.json) {
      console.log(JSON.stringify(accounts, null, 2));
      return;
    }

    // Display accounts
    console.log();
    console.log(chalk.cyan.bold(`${chainFamily.toUpperCase()} Accounts:`));
    console.log();

    for (const account of accounts) {
      console.log(chalk.gray(`#${account.index}`));
      console.log(`  ${chalk.white('Address:')} ${chalk.green(account.address)}`);
      console.log(`  ${chalk.white('Path:')}    ${chalk.gray(account.path)}`);
      console.log();
    }
  } catch (error) {
    spinner.fail('Failed to derive accounts');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
