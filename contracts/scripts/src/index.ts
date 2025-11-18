#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from './utils/config.js';
import { getAddress } from './utils/client.js';
import { printInfo, printError } from './utils/helpers.js';

// Import command handlers
import * as profileCommands from './commands/profile.js';
import * as subscriptionCommands from './commands/subscription.js';
import * as contentCommands from './commands/content.js';

const program = new Command();

program
  .name('creator-platform-cli')
  .description('CLI for testing Creator Platform smart contracts on Sui')
  .version('1.0.0');

// ========== INFO COMMAND ==========
program
  .command('info')
  .description('Display current configuration and wallet info')
  .action(() => {
    console.log('\n' + chalk.bold('Creator Platform CLI - Configuration:'));
    console.log(chalk.gray('─'.repeat(50)));
    printInfo(`Network: ${config.network}`);
    printInfo(`RPC URL: ${config.rpcUrl}`);
    printInfo(`Wallet Address: ${getAddress()}`);
    printInfo(`Package ID: ${config.packageId || 'Not set (use PACKAGE_ID in .env)'}`);
    console.log(chalk.gray('─'.repeat(50)) + '\n');
  });

// ========== PROFILE COMMANDS ==========
const profileCmd = program.command('profile').description('Manage creator profiles');

profileCmd
  .command('create')
  .description('Create a new creator profile')
  .requiredOption('-n, --name <name>', 'Profile name')
  .requiredOption('-b, --bio <bio>', 'Profile bio')
  .option('-a, --avatar <url>', 'Avatar URL', '')
  .action(async (options) => {
    await profileCommands.createProfile(options.name, options.bio, options.avatar);
  });

profileCmd
  .command('update')
  .description('Update an existing profile')
  .requiredOption('-i, --id <id>', 'Profile object ID')
  .requiredOption('-b, --bio <bio>', 'New bio')
  .option('-a, --avatar <url>', 'New avatar URL', '')
  .action(async (options) => {
    await profileCommands.updateProfile(options.id, options.bio, options.avatar);
  });

profileCmd
  .command('get')
  .description('Get profile details')
  .requiredOption('-i, --id <id>', 'Profile object ID')
  .action(async (options) => {
    await profileCommands.getProfile(options.id);
  });

profileCmd
  .command('list')
  .description('List all your profiles')
  .action(async () => {
    await profileCommands.listMyProfiles();
  });

// ========== SUBSCRIPTION COMMANDS ==========
const subscriptionCmd = program
  .command('subscription')
  .alias('sub')
  .description('Manage subscriptions and tiers');

subscriptionCmd
  .command('create-tier')
  .description('Create a new subscription tier')
  .requiredOption('-n, --name <name>', 'Tier name (e.g., "Gold", "Premium")')
  .requiredOption('-d, --description <description>', 'Tier description')
  .requiredOption('-p, --price <price>', 'Monthly price in SUI', parseFloat)
  .action(async (options) => {
    await subscriptionCommands.createTier(options.name, options.description, options.price);
  });

subscriptionCmd
  .command('update-tier-price')
  .description('Update tier pricing')
  .requiredOption('-i, --id <id>', 'Tier object ID')
  .requiredOption('-p, --price <price>', 'New monthly price in SUI', parseFloat)
  .action(async (options) => {
    await subscriptionCommands.updateTierPrice(options.id, options.price);
  });

subscriptionCmd
  .command('deactivate-tier')
  .description('Deactivate a tier (no new subscriptions)')
  .requiredOption('-i, --id <id>', 'Tier object ID')
  .action(async (options) => {
    await subscriptionCommands.deactivateTier(options.id);
  });

subscriptionCmd
  .command('purchase')
  .description('Purchase a subscription')
  .requiredOption('-t, --tier-id <id>', 'Tier object ID')
  .requiredOption('-c, --coin-id <id>', 'Payment coin object ID')
  .action(async (options) => {
    await subscriptionCommands.purchaseSubscription(options.tierId, options.coinId);
  });

subscriptionCmd
  .command('get-tier')
  .description('Get tier details')
  .requiredOption('-i, --id <id>', 'Tier object ID')
  .action(async (options) => {
    await subscriptionCommands.getTier(options.id);
  });

subscriptionCmd
  .command('get')
  .description('Get subscription details')
  .requiredOption('-i, --id <id>', 'Subscription object ID')
  .action(async (options) => {
    await subscriptionCommands.getSubscription(options.id);
  });

subscriptionCmd
  .command('list')
  .description('List all your active subscriptions')
  .action(async () => {
    await subscriptionCommands.listMySubscriptions();
  });

// ========== CONTENT COMMANDS ==========
const contentCmd = program.command('content').description('Manage content');

contentCmd
  .command('create')
  .description('Create new content')
  .requiredOption('-t, --title <title>', 'Content title')
  .requiredOption('-d, --description <description>', 'Content description')
  .requiredOption('--type <type>', 'Content MIME type (e.g., "video/mp4")')
  .requiredOption('-b, --blob-id <id>', 'Walrus blob ID')
  .option('-p, --preview-blob-id <id>', 'Preview blob ID', '')
  .option('--tier-ids <ids>', 'Required tier IDs (comma-separated)', '')
  .option('--public', 'Make content public', false)
  .action(async (options) => {
    const tierIds = options.tierIds
      ? options.tierIds.split(',').map((id: string) => id.trim())
      : [];
    await contentCommands.createContent(
      options.title,
      options.description,
      options.type,
      options.blobId,
      options.previewBlobId,
      tierIds,
      options.public
    );
  });

contentCmd
  .command('verify-access')
  .description('Verify subscription access to content')
  .requiredOption('-c, --content-id <id>', 'Content object ID')
  .requiredOption('-s, --subscription-id <id>', 'Subscription object ID')
  .action(async (options) => {
    await contentCommands.verifyAccess(options.contentId, options.subscriptionId);
  });

contentCmd
  .command('get')
  .description('Get content details')
  .requiredOption('-i, --id <id>', 'Content object ID')
  .action(async (options) => {
    await contentCommands.getContent(options.id);
  });

contentCmd
  .command('list')
  .description('List content (requires indexer)')
  .option('--creator <address>', 'Filter by creator address')
  .action(async (options) => {
    await contentCommands.listAllContent(options.creator);
  });

// ========== UTILITY COMMANDS ==========
program
  .command('get-coins')
  .description('List your SUI coins (for payment)')
  .action(async () => {
    const { getSuiClient, getAddress } = await import('./utils/client.js');
    const client = getSuiClient();
    const address = getAddress();

    console.log('\n' + chalk.bold('Your SUI Coins:'));
    console.log(chalk.gray('─'.repeat(50)));

    try {
      const coins = await client.getCoins({
        owner: address,
        coinType: '0x2::sui::SUI',
      });

      if (coins.data.length === 0) {
        printInfo('No SUI coins found. Please fund your wallet.');
        return;
      }

      let totalBalance = BigInt(0);
      for (const coin of coins.data) {
        const balance = BigInt(coin.balance);
        totalBalance += balance;
        const sui = Number(balance) / 1_000_000_000;
        printInfo(`  Coin ID: ${coin.coinObjectId}`);
        printInfo(`  Balance: ${sui.toFixed(4)} SUI`);
        console.log();
      }

      const totalSui = Number(totalBalance) / 1_000_000_000;
      console.log(chalk.bold(`Total Balance: ${totalSui.toFixed(4)} SUI`));
      console.log(chalk.gray('─'.repeat(50)) + '\n');
    } catch (error) {
      printError(`Error fetching coins: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// Error handling
program.configureOutput({
  outputError: (str, write) => write(chalk.red(str)),
});

program.parse();
