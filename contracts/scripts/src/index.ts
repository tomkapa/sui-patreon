import { Command } from 'commander';
import { createContent, createProfile, createTier, purchase } from './builder';
import { createPost, viewPost } from './walrus';

const program = new Command();

program.name('subscription-cli').description('CLI for Subscription actions');

// bun start create-profile "test profile"
program
  .command('create-profile')
  .description('Create a new profile')
  .argument('<info>', 'Profile information')
  .action(createProfile);

// bun start create-tier "test tier" "test description" 1000000
program
  .command('create-tier')
  .description('Create a new tier')
  .argument('<name>', 'Tier name')
  .argument('<description>', 'Tier description')
  .argument('<price_monthly>', 'Tier price monthly')
  .action(createTier);

/*
bun start purchase 0xb7758e1461586bf8cc294a65aa10163b4623293b917464dc41eaea9bf25163ae \
  0xc3f03fd51b2965756d91b0d90aea752cdd03d7d01f354e5d87bf233969186954 0x7d16fb30c527690e949bf939bf2b65180347007bf3a7b8bafb7027fbf6180805
*/
program
  .command('purchase')
  .description('Purchase a subscription')
  .argument('<creator>', 'Creator address')
  .argument('<tier>', 'Tier object')
  .argument('<payment>', 'Payment object')
  .action(purchase);

// bun start create-content 1 "test content" "test description" "video/mp4" "qhjKu_wiI33Zkvx1QpitD2INc6BphK5KdGits5MuwFcBAQACAA"
program
  .command('create-content')
  .description('Create a new content')
  .argument('<nonce>', 'Nonce')
  .argument('<title>', 'Title')
  .argument('<description>', 'Description')
  .argument('<content_type>', 'Content type')
  .argument('<sealed_patch_id>', 'Sealed patch ID')
  .action(createContent);

// bun start create-post 1
program
  .command('create-post')
  .description('Create a new post')
  .argument('<nonce>', 'Nonce')
  .action(createPost);

/*
bun start view-post 0x24f4546334da8a2252fb11afd5609ebee5b87815028a1b171fd9f31b3fb32839 \
  0xe3606bab539282e8a7e2a19c16a79b4a333869095521756ed8b8ea84f2e72bfb
*/
program
  .command('view-post')
  .description('View a post by blob ID')
  .argument('<content>', 'Content')
  .argument('<subscription>', 'Subscription')
  .action(viewPost);

program.parse(process.argv);
