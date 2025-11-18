import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, getKeypair, getAddress } from '../utils/client.js';
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

export async function createProfile(name: string, bio: string, avatarUrl: string): Promise<void> {
  if (!config.packageId) {
    printError('PACKAGE_ID not set in environment. Please deploy the contract first.');
    process.exit(1);
  }

  const spinner = ora('Creating creator profile...').start();

  try {
    const client = getSuiClient();
    const keypair = getKeypair();
    const address = getAddress();

    const tx = new Transaction();

    // Call create_profile function
    const profile = tx.moveCall({
      target: `${config.packageId}::profile::create_profile`,
      arguments: [tx.pure.string(name), tx.pure.string(bio), tx.pure.string(avatarUrl)],
    });

    // Transfer profile to sender
    tx.transferObjects([profile], tx.pure.address(address));

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
      printSuccess('Profile created successfully!');

      const profileId = extractObjectId(result, 0);
      if (profileId) {
        printInfo(`Profile Object ID: ${profileId}`);
        printInfo(`Creator Address: ${address}`);
        printInfo(`Name: ${name}`);
      }

      printTransactionResult(result);
    } else {
      printError('Failed to create profile');
      printTransactionResult(result);
      process.exit(1);
    }
  } catch (error) {
    spinner.stop();
    printError(`Error creating profile: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function updateProfile(
  profileId: string,
  bio: string,
  avatarUrl: string
): Promise<void> {
  if (!config.packageId) {
    printError('PACKAGE_ID not set in environment. Please deploy the contract first.');
    process.exit(1);
  }

  const spinner = ora('Updating creator profile...').start();

  try {
    const client = getSuiClient();
    const keypair = getKeypair();

    const tx = new Transaction();

    // Call update_profile function
    tx.moveCall({
      target: `${config.packageId}::profile::update_profile`,
      arguments: [tx.object(profileId), tx.pure.string(bio), tx.pure.string(avatarUrl)],
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
      printSuccess('Profile updated successfully!');
      printTransactionResult(result);
    } else {
      printError('Failed to update profile');
      printTransactionResult(result);
      process.exit(1);
    }
  } catch (error) {
    spinner.stop();
    printError(`Error updating profile: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function getProfile(profileId: string): Promise<void> {
  const spinner = ora('Fetching profile...').start();

  try {
    const client = getSuiClient();

    const object = await client.getObject({
      id: profileId,
      options: {
        showContent: true,
        showOwner: true,
      },
    });

    spinner.stop();

    if (object.data?.content && object.data.content.dataType === 'moveObject') {
      const fields = object.data.content.fields as any;

      console.log('\n' + chalk.bold('Creator Profile:'));
      console.log(chalk.gray('─'.repeat(50)));
      printInfo(`Profile ID: ${profileId}`);
      printInfo(`Creator: ${fields.creator}`);
      printInfo(`Name: ${fields.name}`);
      printInfo(`Bio: ${fields.bio}`);
      printInfo(`Avatar URL: ${fields.avatar_url}`);
      printInfo(`Created At: ${new Date(Number(fields.created_at)).toISOString()}`);
      console.log(chalk.gray('─'.repeat(50)) + '\n');
    } else {
      printError('Profile not found or invalid object type');
    }
  } catch (error) {
    spinner.stop();
    printError(`Error fetching profile: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function listMyProfiles(): Promise<void> {
  if (!config.packageId) {
    printError('PACKAGE_ID not set in environment.');
    process.exit(1);
  }

  const spinner = ora('Fetching your profiles...').start();

  try {
    const client = getSuiClient();
    const address = getAddress();

    const objects = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${config.packageId}::profile::CreatorProfile`,
      },
      options: {
        showContent: true,
      },
    });

    spinner.stop();

    if (objects.data.length === 0) {
      printInfo('No profiles found for your address.');
      return;
    }

    console.log('\n' + chalk.bold(`Your Profiles (${objects.data.length}):`));
    console.log(chalk.gray('─'.repeat(50)));

    for (const obj of objects.data) {
      if (obj.data?.content && obj.data.content.dataType === 'moveObject') {
        const fields = obj.data.content.fields as any;
        console.log(chalk.cyan(`\n${fields.name}`));
        printInfo(`  ID: ${obj.data.objectId}`);
        printInfo(`  Bio: ${fields.bio}`);
        printInfo(`  Avatar: ${fields.avatar_url}`);
      }
    }

    console.log(chalk.gray('─'.repeat(50)) + '\n');
  } catch (error) {
    spinner.stop();
    printError(
      `Error fetching profiles: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}
