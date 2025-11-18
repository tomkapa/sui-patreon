import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, getKeypair } from '../utils/client.js';
import { config } from '../utils/config.js';
import {
  printSuccess,
  printError,
  printInfo,
  printTransactionResult,
  extractObjectId,
} from '../utils/helpers.js';
import chalk from 'chalk';
import ora from 'ora';

export async function createContent(
  title: string,
  description: string,
  contentType: string,
  walrusBlobId: string,
  previewBlobId: string,
  requiredTierIds: string[],
  isPublic: boolean
): Promise<void> {
  if (!config.packageId) {
    printError('PACKAGE_ID not set in environment. Please deploy the contract first.');
    process.exit(1);
  }

  const spinner = ora('Creating content...').start();

  try {
    const client = getSuiClient();
    const keypair = getKeypair();

    const tx = new Transaction();

    // Call create_content entry function
    tx.moveCall({
      target: `${config.packageId}::content::create_content`,
      arguments: [
        tx.pure.string(title),
        tx.pure.string(description),
        tx.pure.string(contentType),
        tx.pure.string(walrusBlobId),
        tx.pure.string(previewBlobId),
        tx.pure.vector('address', requiredTierIds),
        tx.pure.bool(isPublic),
      ],
    });

    // Sign and execute
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    spinner.stop();

    if (result.effects?.status.status === 'success') {
      printSuccess('Content created successfully!');

      const contentId = extractObjectId(result, 0);
      if (contentId) {
        printInfo(`Content Object ID: ${contentId}`);
        printInfo(`Title: ${title}`);
        printInfo(`Type: ${contentType}`);
        printInfo(`Public: ${isPublic}`);
        printInfo(`Required Tiers: ${requiredTierIds.length}`);
      }

      printTransactionResult(result);
    } else {
      printError('Failed to create content');
      printTransactionResult(result);
      process.exit(1);
    }
  } catch (error) {
    spinner.stop();
    printError(`Error creating content: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function verifyAccess(contentId: string, subscriptionId: string): Promise<void> {
  if (!config.packageId) {
    printError('PACKAGE_ID not set in environment. Please deploy the contract first.');
    process.exit(1);
  }

  const spinner = ora('Verifying access...').start();

  try {
    const client = getSuiClient();
    const keypair = getKeypair();

    const tx = new Transaction();

    // Call seal_approve entry function (this verifies access)
    tx.moveCall({
      target: `${config.packageId}::content::seal_approve`,
      arguments: [tx.object(contentId), tx.object(subscriptionId)],
    });

    // Sign and execute
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    spinner.stop();

    if (result.effects?.status.status === 'success') {
      printSuccess('Access verified! You have permission to view this content.');
      printTransactionResult(result);
    } else {
      printError('Access denied! Your subscription does not grant access to this content.');
      printTransactionResult(result);
      process.exit(1);
    }
  } catch (error) {
    spinner.stop();
    printError(
      `Access verification failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

export async function getContent(contentId: string): Promise<void> {
  const spinner = ora('Fetching content...').start();

  try {
    const client = getSuiClient();

    const object = await client.getObject({
      id: contentId,
      options: {
        showContent: true,
      },
    });

    spinner.stop();

    if (object.data?.content && object.data.content.dataType === 'moveObject') {
      const fields = object.data.content.fields as any;

      console.log('\n' + chalk.bold('Content:'));
      console.log(chalk.gray('─'.repeat(50)));
      printInfo(`Content ID: ${contentId}`);
      printInfo(`Creator: ${fields.creator}`);
      printInfo(`Title: ${fields.title}`);
      printInfo(`Description: ${fields.description}`);
      printInfo(`Content Type: ${fields.content_type}`);
      printInfo(`Walrus Blob ID: ${fields.walrus_blob_id}`);
      printInfo(`Preview Blob ID: ${fields.preview_blob_id || 'None'}`);
      printInfo(`Public: ${fields.is_public}`);
      printInfo(`Required Tiers: ${fields.required_tier_ids?.length || 0}`);
      printInfo(`Created At: ${new Date(Number(fields.created_at)).toISOString()}`);

      if (fields.required_tier_ids && fields.required_tier_ids.length > 0) {
        console.log('\n' + chalk.bold('Required Tier IDs:'));
        fields.required_tier_ids.forEach((id: string, index: number) => {
          printInfo(`  ${index + 1}. ${id}`);
        });
      }

      console.log(chalk.gray('─'.repeat(50)) + '\n');
    } else {
      printError('Content not found or invalid object type');
    }
  } catch (error) {
    spinner.stop();
    printError(`Error fetching content: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function listAllContent(creatorAddress?: string): Promise<void> {
  if (!config.packageId) {
    printError('PACKAGE_ID not set in environment.');
    process.exit(1);
  }

  const spinner = ora('Fetching content...').start();

  try {
    // Query all Content objects
    // Note: This requires indexing or using dynamic fields
    // For now, we'll note this limitation
    spinner.stop();

    printInfo('Note: Listing all content requires an indexer or event subscription.');
    printInfo('You can query specific content by ID using the "get-content" command.');
    printInfo('Alternatively, subscribe to ContentCreated events to track all content.');

    if (creatorAddress) {
      printInfo(`\nTo find content by creator ${creatorAddress}, you can:`);
      printInfo('1. Subscribe to ContentCreated events filtered by creator address');
      printInfo('2. Use an indexer service that tracks content creation');
    }
  } catch (error) {
    spinner.stop();
    printError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
