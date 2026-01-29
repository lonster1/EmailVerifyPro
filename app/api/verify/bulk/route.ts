import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasSufficientCredits } from '@/lib/credits';

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emails, filename } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Emails array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (emails.length > 50000) {
      return NextResponse.json(
        { error: `Too many emails (${emails.length}). Maximum 50,000 per upload.` },
        { status: 400 }
      );
    }

    const hasCredits = await hasSufficientCredits(userId, emails.length);
    if (!hasCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${emails.length} credits to verify these emails.` },
        { status: 402 }
      );
    }

    const normalizedEmails = emails.map((email: string) =>
      typeof email === 'string' ? email.trim().toLowerCase() : ''
    ).filter(Boolean);

    // Create verification record - emails are processed incrementally via GET polling
    const verification = await prisma.verification.create({
      data: {
        userId,
        type: 'BULK',
        filename: filename || 'bulk_upload.csv',
        totalCount: normalizedEmails.length,
        validCount: 0,
        invalidCount: 0,
        riskyCount: 0,
        unknownCount: 0,
        catchallCount: 0,
        creditsConsumed: 0,
        status: 'PROCESSING',
        resultsData: JSON.stringify({ emails: normalizedEmails, results: [], processedCount: 0 }),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      verificationId: verification.id,
      taskId: verification.id,
      totalEmails: normalizedEmails.length,
      status: 'pending',
    });
  } catch (error) {
    console.error('Bulk verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
