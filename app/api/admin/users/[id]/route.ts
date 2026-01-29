import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = request.headers.get('x-user-role');
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { role: newRole, hasUnlimitedCredits } = body;

  const updateData: Record<string, any> = {};
  if (newRole !== undefined) updateData.role = newRole;
  if (hasUnlimitedCredits !== undefined) updateData.hasUnlimitedCredits = hasUnlimitedCredits;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      role: true,
      creditsBalance: true,
      hasUnlimitedCredits: true,
    },
  });

  return NextResponse.json(user);
}
