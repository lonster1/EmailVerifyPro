import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get userId from middleware
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verification = await prisma.verification.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        resultsData: true,
        status: true,
        filename: true,
      },
    });

    // Verify ownership
    if (!verification || verification.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (verification.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Verification not completed', status: verification.status },
        { status: 400 }
      );
    }

    // Parse resultsData
    const parsedData = JSON.parse(verification.resultsData || '{}');
    const results = parsedData.results || parsedData;

    return NextResponse.json({
      results,
      filename: verification.filename,
    });
  } catch (error) {
    console.error('Error fetching verification results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification results' },
      { status: 500 }
    );
  }
}
