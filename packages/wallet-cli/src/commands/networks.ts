import chalk from 'chalk';
import {
  ChainFamily,
  getChainsByFamily,
  CHAIN_ALIASES,
} from '@open-wallet/types';

export function networksCommand(): void {
  const evmChains = getChainsByFamily(ChainFamily.EVM);
  const solanaChains = getChainsByFamily(ChainFamily.SOLANA);

  console.log();
  console.log(chalk.cyan.bold('EVM Networks:'));
  console.log();

  for (const chain of evmChains) {
    const aliases = getAliasesForChain(chain.chainId);
    const aliasStr = aliases.length > 0 ? chalk.gray(` (${aliases.join(', ')})`) : '';
    const testnetBadge = chain.isTestnet ? chalk.yellow(' [testnet]') : '';

    console.log(
      `  ${chalk.white(chain.name.padEnd(24))} ${chalk.gray(String(chain.chainId).padStart(10))}${aliasStr}${testnetBadge}`
    );
  }

  console.log();
  console.log(chalk.cyan.bold('Solana Networks:'));
  console.log();

  for (const chain of solanaChains) {
    const aliases = getAliasesForChain(chain.chainId);
    const aliasStr = aliases.length > 0 ? chalk.gray(` (${aliases.join(', ')})`) : '';
    const testnetBadge = chain.isTestnet ? chalk.yellow(' [testnet]') : '';

    console.log(
      `  ${chalk.white(chain.name.padEnd(24))} ${chalk.gray(String(chain.chainId).padStart(10))}${aliasStr}${testnetBadge}`
    );
  }

  console.log();
  console.log(chalk.gray('Use -c <alias|chainId> with balance/send commands'));
  console.log();
}

function getAliasesForChain(chainId: number): string[] {
  const aliases: string[] = [];
  for (const [alias, id] of Object.entries(CHAIN_ALIASES)) {
    if (id === chainId) {
      aliases.push(alias);
    }
  }
  // Return first 2 aliases only to keep output clean
  return aliases.slice(0, 2);
}
