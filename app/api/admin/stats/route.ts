import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role');
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [totalUsers, totalVerifications, creditsAgg] = await Promise.all([
    prisma.user.count(),
    prisma.verification.count(),
    prisma.verification.aggregate({ _sum: { creditsConsumed: true } }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalVerifications,
    totalCreditsConsumed: creditsAgg._sum.creditsConsumed || 0,
  });
}
