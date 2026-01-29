import { prisma } from './prisma';

// Transaction types (matching database schema)
export type TransactionType = 'PURCHASE' | 'USAGE' | 'REFUND' | 'ADMIN_ADJUSTMENT';

/**
 * Get user's current credit balance
 */
export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsBalance: true },
  });

  return user?.creditsBalance ?? 0;
}

/**
 * Add credits to user account
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
  stripePaymentId?: string
): Promise<number> {
  // Get current balance
  const currentBalance = await getBalance(userId);
  const newBalance = currentBalance + amount;

  // Update user balance and create transaction in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditsBalance: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount,
        type,
        balanceAfter: newBalance,
        description,
        stripePaymentId,
      },
    }),
  ]);

  return newBalance;
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  verificationId?: string
): Promise<number> {
  // Check if user has unlimited credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasUnlimitedCredits: true, role: true, creditsBalance: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Skip deduction for unlimited users
  if (user.hasUnlimitedCredits || user.role === 'ADMIN') {
    // Still log transaction for audit trail with amount = 0
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: 0, // No deduction
        type: 'USAGE',
        balanceAfter: user.creditsBalance,
        description: `${description} (unlimited account)`,
        verificationId,
      },
    });

    return user.creditsBalance; // Return unchanged balance
  }

  // Normal credit deduction logic
  const currentBalance = user.creditsBalance;

  if (currentBalance < amount) {
    throw new Error('Insufficient credits');
  }

  const newBalance = currentBalance - amount;

  // Update user balance and create transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditsBalance: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: -amount, // Negative for deduction
        type: 'USAGE',
        balanceAfter: newBalance,
        description,
        verificationId,
      },
    }),
  ]);

  return newBalance;
}

/**
 * Check if user has sufficient credits
 */
export async function hasSufficientCredits(
  userId: string,
  requiredAmount: number
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsBalance: true, hasUnlimitedCredits: true, role: true },
  });

  if (!user) return false;

  // Check unlimited credits flag OR admin role
  if (user.hasUnlimitedCredits || user.role === 'ADMIN') {
    return true;
  }

  return user.creditsBalance >= requiredAmount;
}

/**
 * Get user's transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  const total = await prisma.creditTransaction.count({
    where: { userId },
  });

  return {
    transactions,
    total,
    hasMore: total > offset + limit,
  };
}
