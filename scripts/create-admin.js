#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('🔧 EmailVerifyPro Admin User Setup\n');

  // Get admin details
  const email = await question('Admin email: ');
  const password = await question('Admin password: ');
  const grantUnlimitedCredits = await question('Grant unlimited credits? (y/n): ');

  if (!email || !password) {
    console.error('❌ Email and password are required');
    process.exit(1);
  }

  const hasUnlimitedCredits = grantUnlimitedCredits.toLowerCase() === 'y';

  console.log('\n📊 Creating admin user with:');
  console.log(`   Email: ${email}`);
  console.log(`   Role: ADMIN`);
  console.log(`   Unlimited Credits: ${hasUnlimitedCredits}`);
  console.log(`   Initial Credits: ${hasUnlimitedCredits ? 'N/A (Unlimited)' : '100'}\n`);

  const confirm = await question('Proceed? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    process.exit(0);
  }

  const prisma = new PrismaClient();

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('\n⚠️  User already exists. Updating to admin...');

      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          hasUnlimitedCredits,
          creditsBalance: hasUnlimitedCredits ? 999999999 : existingUser.creditsBalance
        }
      });

      console.log('✅ User updated to admin successfully!');
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Credits: ${updatedUser.hasUnlimitedCredits ? 'Unlimited' : updatedUser.creditsBalance}`);
    } else {
      console.log('\n🔐 Hashing password...');
      const passwordHash = await bcrypt.hash(password, 10);

      console.log('💾 Creating admin user...');
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'ADMIN',
          creditsBalance: hasUnlimitedCredits ? 999999999 : 100,
          hasUnlimitedCredits,
          isVerified: true
        }
      });

      console.log('\n✅ Admin user created successfully!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Credits: ${user.hasUnlimitedCredits ? 'Unlimited' : user.creditsBalance}`);
    }

    console.log('\n🎉 You can now log in with these credentials!\n');
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createAdmin();
