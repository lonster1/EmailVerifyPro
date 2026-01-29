import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = request.headers.get('x-user-role');
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { amount, description } = await request.json();

  if (!amount || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { creditsBalance: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const newBalance = user.creditsBalance + amount;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: params.id },
      data: { creditsBalance: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: params.id,
        amount,
        type: 'ADMIN_ADJUSTMENT',
        balanceAfter: newBalance,
        description: description || `Admin credit adjustment: ${amount > 0 ? '+' : ''}${amount}`,
      },
    }),
  ]);

  return NextResponse.json({ newBalance });
}
