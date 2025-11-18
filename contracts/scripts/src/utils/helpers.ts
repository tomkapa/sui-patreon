import chalk from 'chalk';
import { SuiTransactionBlockResponse } from '@mysten/sui/client';

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatSUI(mist: bigint | string): string {
  const mistBigInt = typeof mist === 'string' ? BigInt(mist) : mist;
  const sui = Number(mistBigInt) / 1_000_000_000;
  return sui.toFixed(4);
}

export function mistToSui(mist: bigint | string): number {
  const mistBigInt = typeof mist === 'string' ? BigInt(mist) : mist;
  return Number(mistBigInt) / 1_000_000_000;
}

export function suiToMist(sui: number): bigint {
  return BigInt(Math.floor(sui * 1_000_000_000));
}

export function printSuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function printError(message: string): void {
  console.log(chalk.red('✗'), message);
}

export function printInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function printWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function printTransactionResult(result: SuiTransactionBlockResponse): void {
  console.log('\n' + chalk.bold('Transaction Result:'));
  console.log(chalk.gray('─'.repeat(50)));

  printInfo(`Digest: ${result.digest}`);

  if (result.effects?.status.status === 'success') {
    printSuccess('Status: Success');
  } else {
    printError(`Status: Failed - ${result.effects?.status.error || 'Unknown error'}`);
  }

  // Print created objects
  const created = result.effects?.created;
  if (created && created.length > 0) {
    console.log('\n' + chalk.bold('Created Objects:'));
    created.forEach((obj) => {
      printInfo(`  Object ID: ${obj.reference.objectId}`);
      printInfo(`  Type: ${obj.owner}`);
    });
  }

  // Print gas used
  if (result.effects?.gasUsed) {
    const gasUsed = result.effects.gasUsed;
    console.log('\n' + chalk.bold('Gas Used:'));
    printInfo(`  Computation: ${formatSUI(gasUsed.computationCost)} SUI`);
    printInfo(`  Storage: ${formatSUI(gasUsed.storageCost)} SUI`);
    printInfo(`  Storage Rebate: ${formatSUI(gasUsed.storageRebate)} SUI`);
  }

  console.log(chalk.gray('─'.repeat(50)) + '\n');
}

export function extractObjectId(
  result: SuiTransactionBlockResponse,
  index: number = 0
): string | null {
  const created = result.effects?.created;
  if (!created || created.length === 0) {
    return null;
  }
  return created[index]?.reference.objectId || null;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
