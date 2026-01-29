import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get userId from middleware
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') as 'SINGLE' | 'BULK' | null;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: any = {
      userId: userId, // userId is a String, not Int
    };

    if (type) {
      where.type = type;
    }

    // Query verifications with pagination
    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        where,
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          completedAt: true,
          filename: true,
          validCount: true,
          invalidCount: true,
          riskyCount: true,
          unknownCount: true,
          catchallCount: true,
          creditsConsumed: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        take: limit,
        skip: offset,
      }),
      prisma.verification.count({
        where,
      }),
    ]);

    // Enrich verification data
    const enrichedVerifications = verifications.map(v => {
      const totalEmails =
        (v.validCount || 0) +
        (v.invalidCount || 0) +
        (v.riskyCount || 0) +
        (v.unknownCount || 0) +
        (v.catchallCount || 0);

      return {
        id: v.id.toString(),
        type: v.type,
        status: v.status,
        createdAt: v.createdAt.toISOString(),
        completedAt: v.completedAt?.toISOString() || null,
        filename: v.filename,
        totalEmails,
        validCount: v.validCount || 0,
        invalidCount: v.invalidCount || 0,
        riskyCount: v.riskyCount || 0,
        unknownCount: v.unknownCount || 0,
        catchallCount: v.catchallCount || 0,
        creditsUsed: v.creditsConsumed || 0,
      };
    });

    return NextResponse.json({
      verifications: enrichedVerifications,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}
