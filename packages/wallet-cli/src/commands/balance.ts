import chalk from 'chalk';
import ora from 'ora';
import {
  getChainConfig,
  isEvmChain,
  isSolanaChain,
  resolveChainId,
} from '@open-wallet/types';
import { createEvmClient } from '@open-wallet/chains-evm';
import { createSolanaClient, lamportsToSol } from '@open-wallet/chains-solana';

interface BalanceOptions {
  chain: string;
  json?: boolean;
}

export async function balanceCommand(
  address: string,
  options: BalanceOptions
): Promise<void> {
  const spinner = ora('Fetching balance...').start();

  try {
    const chainId = resolveChainId(options.chain);
    if (chainId === null) {
      spinner.fail(`Unknown chain: ${options.chain}`);
      console.error(chalk.gray('Run "open-wallet networks" to see available chains'));
      process.exit(1);
    }
    const chainConfig = getChainConfig(chainId);

    let balance: bigint;
    let formattedBalance: string;

    if (isEvmChain(chainId)) {
      const client = createEvmClient({ chainId });
      balance = await client.getBalance(address as `0x${string}`);
      formattedBalance = formatEthBalance(balance, chainConfig.nativeCurrency.decimals, chainConfig.nativeCurrency.symbol);
    } else if (isSolanaChain(chainId)) {
      const client = createSolanaClient({ chainId });
      balance = await client.getBalance(address);
      formattedBalance = `${lamportsToSol(balance).toFixed(9)} SOL`;
    } else {
      spinner.fail(`Unsupported chain: ${chainId}`);
      process.exit(1);
    }

    spinner.succeed('Balance fetched');

    if (options.json) {
      console.log(JSON.stringify({
        address,
        chainId,
        chainName: chainConfig.name,
        balance: balance.toString(),
        formattedBalance,
        symbol: chainConfig.nativeCurrency.symbol,
      }, null, 2));
      return;
    }

    console.log();
    console.log(chalk.cyan.bold('Balance:'));
    console.log();
    console.log(`  ${chalk.white('Address:')}  ${chalk.green(address)}`);
    console.log(`  ${chalk.white('Network:')}  ${chalk.gray(chainConfig.name)}`);
    console.log(`  ${chalk.white('Balance:')}  ${chalk.yellow.bold(formattedBalance)}`);
    console.log();
  } catch (error) {
    spinner.fail('Failed to fetch balance');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

function formatEthBalance(wei: bigint, decimals: number, symbol: string): string {
  const divisor = BigInt(10 ** decimals);
  const whole = wei / divisor;
  const fraction = wei % divisor;

  if (fraction === 0n) {
    return `${whole} ${symbol}`;
  }

  const fractionStr = fraction.toString().padStart(decimals, '0');
  // Show up to 6 decimal places
  const trimmed = fractionStr.slice(0, 6).replace(/0+$/, '');

  if (!trimmed) {
    return `${whole} ${symbol}`;
  }

  return `${whole}.${trimmed} ${symbol}`;
}
