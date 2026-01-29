import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasSufficientCredits } from '@/lib/credits';
import { createBulkVerificationTask } from '@/lib/reoon';

export async function POST(request: NextRequest) {
  try {
    // Get userId from middleware headers
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emails, filename } = body;

    // Validate request
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Emails array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Check max limit (50,000 emails per Reoon API)
    if (emails.length > 50000) {
      return NextResponse.json(
        { error: `Too many emails (${emails.length}). Maximum 50,000 per upload.` },
        { status: 400 }
      );
    }

    // Check if user has sufficient credits
    const hasCredits = await hasSufficientCredits(userId, emails.length);
    if (!hasCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${emails.length} credits to verify these emails.` },
        { status: 402 }
      );
    }

    // Normalize emails (lowercase, trim)
    const normalizedEmails = emails.map(email =>
      typeof email === 'string' ? email.trim().toLowerCase() : ''
    ).filter(Boolean);

    // Call Reoon API to create bulk verification task
    let taskId: number;
    try {
      const result = await createBulkVerificationTask(normalizedEmails);
      taskId = result.taskId;
    } catch (error) {
      console.error('Reoon API error:', error);
      return NextResponse.json(
        { error: 'Email verification service is unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Create Verification record in database
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
        status: 'PENDING',
        resultsData: JSON.stringify({ taskId, emails: normalizedEmails }),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return NextResponse.json({
      verificationId: verification.id,
      taskId,
      totalEmails: normalizedEmails.length,
      estimatedCredits: normalizedEmails.length,
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
