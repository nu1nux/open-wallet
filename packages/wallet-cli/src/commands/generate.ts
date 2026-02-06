import chalk from 'chalk';
import ora from 'ora';
import { generateMnemonic, MnemonicWordCount, validateMnemonic } from '@open-wallet/keyring';

interface GenerateOptions {
  words: string;
  json?: boolean;
}

export async function generateCommand(options: GenerateOptions): Promise<void> {
  const spinner = ora('Generating wallet...').start();

  try {
    // Validate word count
    const wordCount = parseInt(options.words, 10) as MnemonicWordCount;
    if (![12, 15, 18, 21, 24].includes(wordCount)) {
      spinner.fail('Invalid word count');
      console.error(chalk.red('Word count must be 12, 15, 18, 21, or 24'));
      process.exit(1);
    }

    // Generate mnemonic
    const mnemonic = generateMnemonic(wordCount);

    // Validate the generated mnemonic
    if (!validateMnemonic(mnemonic)) {
      spinner.fail('Generated mnemonic is invalid');
      process.exit(1);
    }

    spinner.succeed('Wallet generated');

    if (options.json) {
      console.log(JSON.stringify({ mnemonic, wordCount }, null, 2));
      return;
    }

    // Display the mnemonic
    console.log();
    console.log(chalk.yellow.bold('IMPORTANT: Write down your recovery phrase and store it safely!'));
    console.log(chalk.yellow('Anyone with this phrase can access your funds.'));
    console.log();
    console.log(chalk.cyan.bold('Recovery Phrase:'));
    console.log();

    const words = mnemonic.split(' ');
    const columns = wordCount <= 12 ? 3 : 4;
    const rows = Math.ceil(words.length / columns);

    for (let row = 0; row < rows; row++) {
      const rowWords = [];
      for (let col = 0; col < columns; col++) {
        const index = row + col * rows;
        if (index < words.length) {
          const num = (index + 1).toString().padStart(2, ' ');
          rowWords.push(`${chalk.gray(num)}. ${chalk.white(words[index].padEnd(10))}`);
        }
      }
      console.log('  ' + rowWords.join('  '));
    }

    console.log();
    console.log(chalk.green('Next steps:'));
    console.log(chalk.gray('1. Write down the recovery phrase on paper'));
    console.log(chalk.gray('2. Store it in a safe place'));
    console.log(chalk.gray('3. Never share it with anyone'));
    console.log(chalk.gray('4. Use `wallet derive` to create accounts'));
  } catch (error) {
    spinner.fail('Failed to generate wallet');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
