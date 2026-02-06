import chalk from 'chalk';
import ora from 'ora';
import { password, confirm } from '@inquirer/prompts';
import {
  ChainId,
  isEvmChain,
  isSolanaChain,
  getChainConfig,
  resolveChainId,
} from '@open-wallet/types';
import {
  validateMnemonic,
  createEvmAccountFromMnemonic,
  createSolanaAccountFromMnemonic,
} from '@open-wallet/keyring';
import {
  createEvmClient,
  sendTransaction as sendEvmTransaction,
  parseEthAmount,
} from '@open-wallet/chains-evm';
import {
  createSolanaClient,
  sendTransfer as sendSolanaTransfer,
  solToLamports,
} from '@open-wallet/chains-solana';
import { Keypair } from '@solana/web3.js';
import { decodeBase58 } from '@open-wallet/keyring';

interface SendOptions {
  mnemonic?: string;
  chain: string;
  index: string;
  dryRun?: boolean;
}

export async function sendCommand(
  to: string,
  amount: string,
  options: SendOptions
): Promise<void> {
  const spinner = ora('Preparing transaction...').start();

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

    const chainId = resolveChainId(options.chain);
    if (chainId === null) {
      spinner.fail(`Unknown chain: ${options.chain}`);
      console.error(chalk.gray('Run "open-wallet networks" to see available chains'));
      process.exit(1);
    }
    const accountIndex = parseInt(options.index, 10);

    spinner.text = 'Deriving account...';

    if (isEvmChain(chainId)) {
      await sendEvmTransfer(
        spinner,
        mnemonic,
        chainId,
        accountIndex,
        to,
        amount,
        options.dryRun
      );
    } else if (isSolanaChain(chainId)) {
      await sendSolanaTransferCmd(
        spinner,
        mnemonic,
        chainId,
        accountIndex,
        to,
        amount,
        options.dryRun
      );
    } else {
      spinner.fail(`Unsupported chain: ${chainId}`);
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Transaction failed');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function sendEvmTransfer(
  spinner: ReturnType<typeof ora>,
  mnemonic: string,
  chainId: ChainId,
  accountIndex: number,
  to: string,
  amount: string,
  dryRun?: boolean
): Promise<void> {
  const account = createEvmAccountFromMnemonic(mnemonic, accountIndex);
  const client = createEvmClient({ chainId });
  const chainConfig = getChainConfig(chainId);

  spinner.text = 'Checking balance...';
  const balance = await client.getBalance(account.address as `0x${string}`);
  const value = parseEthAmount(amount);

  if (balance < value) {
    spinner.fail('Insufficient balance');
    console.error(chalk.red(`Balance: ${formatBalance(balance)} ${chainConfig.nativeCurrency.symbol}`));
    console.error(chalk.red(`Required: ${amount} ${chainConfig.nativeCurrency.symbol}`));
    process.exit(1);
  }

  // Show transaction details
  spinner.stop();
  console.log();
  console.log(chalk.cyan.bold('Transaction Details:'));
  console.log(`  ${chalk.white('From:')}    ${chalk.green(account.address)}`);
  console.log(`  ${chalk.white('To:')}      ${chalk.green(to)}`);
  console.log(`  ${chalk.white('Amount:')}  ${chalk.yellow.bold(amount)} ${chainConfig.nativeCurrency.symbol}`);
  console.log(`  ${chalk.white('Network:')} ${chalk.gray(chainConfig.name)}`);
  console.log();

  if (dryRun) {
    console.log(chalk.yellow('Dry run - transaction not sent'));
    return;
  }

  // Confirm
  const confirmed = await confirm({
    message: 'Send this transaction?',
    default: false,
  });

  if (!confirmed) {
    console.log(chalk.yellow('Transaction cancelled'));
    return;
  }

  spinner.start('Sending transaction...');

  const result = await sendEvmTransaction(
    client,
    {
      chainId,
      from: account.address,
      to: to as `0x${string}`,
      value,
    },
    account.privateKey
  );

  if (!result.ok) {
    spinner.fail('Transaction failed');
    console.error(chalk.red(result.error.message));
    process.exit(1);
  }

  spinner.succeed('Transaction sent');
  console.log();
  console.log(`  ${chalk.white('Hash:')} ${chalk.green(result.value.hash)}`);
  if (chainConfig.blockExplorerUrls?.[0]) {
    console.log(`  ${chalk.white('Explorer:')} ${chalk.gray(chainConfig.blockExplorerUrls[0])}/tx/${result.value.hash}`);
  }
  console.log();
}

async function sendSolanaTransferCmd(
  spinner: ReturnType<typeof ora>,
  mnemonic: string,
  chainId: ChainId,
  accountIndex: number,
  to: string,
  amount: string,
  dryRun?: boolean
): Promise<void> {
  const account = createSolanaAccountFromMnemonic(mnemonic, accountIndex);
  const client = createSolanaClient({ chainId });
  const chainConfig = getChainConfig(chainId);

  spinner.text = 'Checking balance...';
  const balance = await client.getBalance(account.address);
  const value = solToLamports(parseFloat(amount));

  if (balance < value) {
    spinner.fail('Insufficient balance');
    console.error(chalk.red(`Balance: ${Number(balance) / 1e9} SOL`));
    console.error(chalk.red(`Required: ${amount} SOL`));
    process.exit(1);
  }

  // Show transaction details
  spinner.stop();
  console.log();
  console.log(chalk.cyan.bold('Transaction Details:'));
  console.log(`  ${chalk.white('From:')}    ${chalk.green(account.address)}`);
  console.log(`  ${chalk.white('To:')}      ${chalk.green(to)}`);
  console.log(`  ${chalk.white('Amount:')}  ${chalk.yellow.bold(amount)} SOL`);
  console.log(`  ${chalk.white('Network:')} ${chalk.gray(chainConfig.name)}`);
  console.log();

  if (dryRun) {
    console.log(chalk.yellow('Dry run - transaction not sent'));
    return;
  }

  // Confirm
  const confirmed = await confirm({
    message: 'Send this transaction?',
    default: false,
  });

  if (!confirmed) {
    console.log(chalk.yellow('Transaction cancelled'));
    return;
  }

  spinner.start('Sending transaction...');

  // Create keypair from seed
  const seed = decodeBase58(account.secretSeed);
  const keypair = Keypair.fromSeed(seed);

  const result = await sendSolanaTransfer(client, to, value, keypair);

  if (!result.ok) {
    spinner.fail('Transaction failed');
    console.error(chalk.red(result.error.message));
    process.exit(1);
  }

  spinner.succeed('Transaction sent');
  console.log();
  console.log(`  ${chalk.white('Signature:')} ${chalk.green(result.value.hash)}`);
  if (chainConfig.blockExplorerUrls?.[0]) {
    console.log(`  ${chalk.white('Explorer:')} ${chalk.gray(chainConfig.blockExplorerUrls[0])}/tx/${result.value.hash}`);
  }
  console.log();
}

function formatBalance(wei: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = wei / divisor;
  const fraction = wei % divisor;

  if (fraction === 0n) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmed = fractionStr.slice(0, 6).replace(/0+$/, '');

  if (!trimmed) {
    return whole.toString();
  }

  return `${whole}.${trimmed}`;
}
