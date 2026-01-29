#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('🚀 Syncing environment variables to Vercel...\n');

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');

// Variables that need special handling
const skipVariables = ['DATABASE_URL']; // Already set by Neon
const productionOverrides = {
  'NODE_ENV': 'production',
  'NEXTAUTH_SECRET': crypto.randomBytes(32).toString('hex'),
  'JWT_SECRET': crypto.randomBytes(32).toString('hex'),
  'NEXTAUTH_URL': '', // Will be set based on production URL
  'NEXT_PUBLIC_URL': '', // Will be set based on production URL
};

const needsManualUpdate = [
  'STRIPE_WEBHOOK_SECRET', // Needs production webhook secret from Stripe dashboard
];

const envVars = [];
const warnings = [];

// Parse .env file
lines.forEach(line => {
  line = line.trim();

  // Skip comments and empty lines
  if (!line || line.startsWith('#')) return;

  const [key, ...valueParts] = line.split('=');
  let value = valueParts.join('=').replace(/^["']|["']$/g, '');

  if (!key || !value) return;

  // Skip variables that are already set
  if (skipVariables.includes(key)) {
    console.log(`⏭️  Skipping ${key} (already set by Neon)`);
    return;
  }

  // Check for production overrides
  if (productionOverrides.hasOwnProperty(key)) {
    if (value.includes('development') || value.includes('localhost')) {
      value = productionOverrides[key];
      console.log(`🔄 ${key}: Using production value`);
    }
  }

  // Check for placeholder values that need manual update
  if (needsManualUpdate.includes(key)) {
    if (value.includes('your_') || value.includes('placeholder')) {
      warnings.push(`⚠️  ${key}: Contains placeholder - update in Vercel dashboard after sync`);
    }
  }

  // Check for localhost URLs
  if (key.includes('URL') && value.includes('localhost')) {
    warnings.push(`⚠️  ${key}: Contains localhost - update in Vercel dashboard with production URL`);
  }

  envVars.push({ key, value });
});

console.log(`\nFound ${envVars.length} variables to sync\n`);

// First, check if we're linked to Vercel
console.log('Checking Vercel project link...\n');
try {
  execSync('vercel link --yes', { stdio: 'inherit' });
} catch (error) {
  console.error('\n❌ Failed to link Vercel project. Please run "vercel link" manually first.');
  process.exit(1);
}

// Add each variable to Vercel
let successCount = 0;
let failCount = 0;

console.log('\n📤 Adding variables to Vercel...\n');

for (const { key, value } of envVars) {
  // Skip empty values
  if (!value || value === '') {
    console.log(`⏭️  Skipping ${key} (empty value)`);
    continue;
  }

  try {
    // Use echo to pipe the value to vercel env add
    const cmd = `echo "${value.replace(/"/g, '\\"')}" | vercel env add "${key}" production --force`;
    execSync(cmd, { stdio: 'pipe' });
    console.log(`✅ Added ${key}`);
    successCount++;
  } catch (error) {
    console.log(`❌ Failed to add ${key}`);
    failCount++;
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 Summary:`);
console.log(`   ✅ Successfully added: ${successCount}`);
console.log(`   ❌ Failed: ${failCount}`);

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings (${warnings.length}):`);
  warnings.forEach(warning => console.log(`   ${warning}`));
  console.log('\n💡 Update these values in Vercel dashboard:');
  console.log('   https://vercel.com/your-project/settings/environment-variables');
}

console.log('\n✨ Next steps:');
console.log('   1. Update any placeholder values in Vercel dashboard');
console.log('   2. Update localhost URLs with production URLs');
console.log('   3. Redeploy: vercel --prod');
console.log('   4. Run: npx prisma migrate deploy (with production DATABASE_URL)\n');
