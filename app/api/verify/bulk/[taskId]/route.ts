import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deductCredits } from '@/lib/credits';
import { verifySingleEmail, ReoonVerificationResult } from '@/lib/reoon';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// How many emails to process per poll request
const BATCH_SIZE = 5;

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const taskId = params.taskId;

    // Find verification record by ID
    const verification = await prisma.verification.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification task not found' },
        { status: 404 }
      );
    }

    // If already completed, return cached results
    if (verification.status === 'COMPLETED') {
      const cachedResults = verification.resultsData ? JSON.parse(verification.resultsData) : null;
      const userBalance = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true },
      });

      return NextResponse.json({
        status: 'completed',
        results: cachedResults?.results || [],
        summary: {
          totalCount: verification.totalCount,
          validCount: verification.validCount,
          invalidCount: verification.invalidCount,
          riskyCount: verification.riskyCount,
          unknownCount: verification.unknownCount,
          catchallCount: verification.catchallCount,
        },
        creditsConsumed: verification.creditsConsumed,
        newBalance: userBalance?.creditsBalance || 0,
        processingTimeSeconds: verification.processingTimeSeconds,
      });
    }

    if (verification.status === 'FAILED') {
      return NextResponse.json(
        { error: verification.errorMessage || 'Verification failed' },
        { status: 500 }
      );
    }

    // Parse current state
    const state = JSON.parse(verification.resultsData || '{}');
    const emails: string[] = state.emails || [];
    const results: ReoonVerificationResult[] = state.results || [];
    const processedCount = state.processedCount || 0;

    // If all emails are processed, finalize
    if (processedCount >= emails.length) {
      const creditsConsumed = results.filter((r: ReoonVerificationResult) => r.status !== 'unknown').length;
      const processingTimeSeconds = (Date.now() - verification.createdAt.getTime()) / 1000;

      const validCount = results.filter((r: ReoonVerificationResult) => r.status === 'valid').length;
      const invalidCount = results.filter((r: ReoonVerificationResult) => r.status === 'invalid').length;
      const riskyCount = results.filter((r: ReoonVerificationResult) => r.status === 'risky').length;
      const unknownCount = results.filter((r: ReoonVerificationResult) => r.status === 'unknown').length;
      const catchallCount = results.filter((r: ReoonVerificationResult) => r.status === 'catch_all').length;

      // Deduct credits
      const newBalance = await deductCredits(
        userId,
        creditsConsumed,
        `Bulk email verification: ${verification.filename} (${creditsConsumed} emails)`,
        verification.id
      );

      // Mark as completed
      await prisma.verification.update({
        where: { id: verification.id },
        data: {
          status: 'COMPLETED',
          validCount,
          invalidCount,
          riskyCount,
          unknownCount,
          catchallCount,
          creditsConsumed,
          resultsData: JSON.stringify({ results }),
          completedAt: new Date(),
          processingTimeSeconds,
        },
      });

      return NextResponse.json({
        status: 'completed',
        results,
        summary: { totalCount: emails.length, validCount, invalidCount, riskyCount, unknownCount, catchallCount },
        creditsConsumed,
        newBalance,
        processingTimeSeconds,
      });
    }

    // Process next batch of emails
    const batchEnd = Math.min(processedCount + BATCH_SIZE, emails.length);
    console.log(`[BULK] Processing emails ${processedCount + 1}-${batchEnd} of ${emails.length}`);

    for (let i = processedCount; i < batchEnd; i++) {
      try {
        const result = await verifySingleEmail(emails[i]);
        results.push(result);
      } catch (error) {
        console.error(`[BULK] Failed to verify ${emails[i]}:`, error);
        results.push({
          email: emails[i],
          status: 'unknown',
          score: 50,
          details: { syntax: true, domain: false, mx: false, smtp: false, disposable: false, role: false, free_provider: false, accept_all: false },
          metadata: { domain: emails[i].split('@')[1] || '' },
        });
      }
    }

    const newProcessedCount = batchEnd;

    // Update progress in DB
    const validCount = results.filter((r: ReoonVerificationResult) => r.status === 'valid').length;
    const invalidCount = results.filter((r: ReoonVerificationResult) => r.status === 'invalid').length;
    const riskyCount = results.filter((r: ReoonVerificationResult) => r.status === 'risky').length;
    const unknownCount = results.filter((r: ReoonVerificationResult) => r.status === 'unknown').length;
    const catchallCount = results.filter((r: ReoonVerificationResult) => r.status === 'catch_all').length;

    await prisma.verification.update({
      where: { id: verification.id },
      data: {
        resultsData: JSON.stringify({
          emails,
          results,
          processedCount: newProcessedCount,
        }),
        validCount,
        invalidCount,
        riskyCount,
        unknownCount,
        catchallCount,
      },
    });

    const progress = (newProcessedCount / emails.length) * 100;

    return NextResponse.json({
      status: 'running',
      progress,
      processedCount: newProcessedCount,
      totalCount: emails.length,
    });
  } catch (error: any) {
    console.error('[BULK] Polling error:', error?.message || error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
