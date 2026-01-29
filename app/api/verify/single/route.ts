import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySingleEmail } from '@/lib/reoon';
import { getBalance, deductCredits } from '@/lib/credits';

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/verify/single
 *
 * Verify a single email address
 *
 * Request body:
 * {
 *   "email": "test@example.com"
 * }
 *
 * Response:
 * {
 *   "email": "test@example.com",
 *   "status": "valid" | "invalid" | "risky" | "unknown" | "catch_all",
 *   "score": 95,
 *   "details": {...},
 *   "creditsConsumed": 1,
 *   "newBalance": 99,
 *   "verificationId": "uuid"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware (injected into headers)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate email parameter
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email syntax validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check user has sufficient credits
    const currentBalance = await getBalance(userId);

    if (currentBalance < 1) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          message: 'You need at least 1 credit to verify an email. Please purchase more credits.',
          currentBalance,
        },
        { status: 402 } // Payment Required
      );
    }

    // Call Reoon API to verify email
    const startTime = Date.now();
    const result = await verifySingleEmail(normalizedEmail);
    const processingTime = (Date.now() - startTime) / 1000; // Convert to seconds

    // Calculate credits consumed
    // Unknown results are free (no credits deducted)
    const creditsConsumed = result.status === 'unknown' ? 0 : 1;

    // Create verification record in database
    const verification = await prisma.verification.create({
      data: {
        userId,
        type: 'SINGLE',
        totalCount: 1,
        validCount: result.status === 'valid' ? 1 : 0,
        invalidCount: result.status === 'invalid' ? 1 : 0,
        riskyCount: result.status === 'risky' ? 1 : 0,
        unknownCount: result.status === 'unknown' ? 1 : 0,
        catchallCount: result.status === 'catch_all' ? 1 : 0,
        creditsConsumed,
        status: 'COMPLETED',
        resultsData: JSON.stringify([result]), // Store result as JSON string for SQLite
        processingTimeSeconds: processingTime,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Deduct credits from user account (if credits were consumed)
    let newBalance = currentBalance;
    if (creditsConsumed > 0) {
      newBalance = await deductCredits(
        userId,
        creditsConsumed,
        `Single email verification: ${normalizedEmail}`,
        verification.id
      );
    }

    // Return verification result
    return NextResponse.json(
      {
        email: result.email,
        status: result.status,
        score: result.score,
        details: result.details,
        metadata: result.metadata,
        creditsConsumed,
        newBalance,
        verificationId: verification.id,
        processingTime,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Single email verification error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('REOON_API_KEY')) {
        return NextResponse.json(
          { error: 'Email verification service is not configured' },
          { status: 503 } // Service Unavailable
        );
      }

      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          { error: 'Verification service rate limit exceeded. Please try again later.' },
          { status: 429 } // Too Many Requests
        );
      }

      if (error.message.includes('Insufficient credits')) {
        return NextResponse.json(
          { error: error.message },
          { status: 402 } // Payment Required
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Failed to verify email',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
