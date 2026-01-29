#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  const email = 'lonnie.phillips@n2open.com';
  const password = 'B!g0Butt';
  const hasUnlimitedCredits = true;

  console.log('🔧 Setting up admin account...\n');
  console.log(`   Email: ${email}`);
  console.log(`   Role: ADMIN`);
  console.log(`   Unlimited Credits: Yes\n`);

  const prisma = new PrismaClient();

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  User already exists. Updating to admin...\n');

      const passwordHash = await bcrypt.hash(password, 10);

      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role: 'ADMIN',
          hasUnlimitedCredits: true,
          creditsBalance: 999999999
        }
      });

      console.log('✅ User updated successfully!');
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Credits: Unlimited\n`);
    } else {
      console.log('🔐 Hashing password...');
      const passwordHash = await bcrypt.hash(password, 10);

      console.log('💾 Creating admin user...');
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'ADMIN',
          creditsBalance: 999999999,
          hasUnlimitedCredits: true,
          isVerified: true
        }
      });

      console.log('\n✅ Admin user created successfully!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Credits: Unlimited\n`);
    }

    console.log('🎉 You can now log in at your production site!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
