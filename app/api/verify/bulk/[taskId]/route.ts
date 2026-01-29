import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deductCredits } from '@/lib/credits';
import { getBulkVerificationResults, normalizeReoonResponse } from '@/lib/reoon';

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Get userId from middleware headers
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const taskId = parseInt(params.taskId);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    // Find verification record
    const verification = await prisma.verification.findFirst({
      where: {
        resultsData: {
          contains: `"taskId":${taskId}`,
        },
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
      return NextResponse.json({
        status: 'completed',
        results: cachedResults?.results || cachedResults || [],
        summary: {
          totalCount: verification.totalCount,
          validCount: verification.validCount,
          invalidCount: verification.invalidCount,
          riskyCount: verification.riskyCount,
          unknownCount: verification.unknownCount,
          catchallCount: verification.catchallCount,
        },
        creditsConsumed: verification.creditsConsumed,
        newBalance: (await prisma.user.findUnique({
          where: { id: userId },
          select: { creditsBalance: true },
        }))?.creditsBalance || 0,
        processingTimeSeconds: verification.processingTimeSeconds,
      });
    }

    // Update status to PROCESSING if still PENDING
    if (verification.status === 'PENDING') {
      await prisma.verification.update({
        where: { id: verification.id },
        data: { status: 'PROCESSING' },
      });
    }

    // Poll Reoon API for results
    let reoonResults;
    try {
      reoonResults = await getBulkVerificationResults(taskId);
    } catch (error) {
      console.error('Reoon API error:', error);
      return NextResponse.json(
        { error: 'Failed to get verification results' },
        { status: 500 }
      );
    }

    // If still running, return progress
    if (reoonResults.status === 'waiting' || reoonResults.status === 'running') {
      const progress = reoonResults.progress || 0;
      const processedCount = Math.floor((progress / 100) * verification.totalCount);

      return NextResponse.json({
        status: 'running',
        progress,
        processedCount,
        totalCount: verification.totalCount,
      });
    }

    // If failed, update record and return error
    if (reoonResults.status === 'failed') {
      await prisma.verification.update({
        where: { id: verification.id },
        data: {
          status: 'FAILED',
          errorMessage: 'Verification task failed',
        },
      });

      return NextResponse.json(
        { error: 'Verification task failed' },
        { status: 500 }
      );
    }

    // Task completed - process results
    const rawResults = reoonResults.results
      ? Object.values(reoonResults.results)
      : [];

    // Normalize results to our format
    const results = rawResults.map((r: any) => normalizeReoonResponse(r));

    // Calculate counts
    const validCount = results.filter(r => r.status === 'valid').length;
    const invalidCount = results.filter(r => r.status === 'invalid').length;
    const riskyCount = results.filter(r => r.status === 'risky').length;
    const unknownCount = results.filter(r => r.status === 'unknown').length;
    const catchallCount = results.filter(r => r.status === 'catch_all').length;

    // Calculate credits consumed (unknown results are free)
    const creditsConsumed = results.filter(r => r.status !== 'unknown').length;

    // Deduct credits
    const newBalance = await deductCredits(
      userId,
      creditsConsumed,
      `Bulk email verification: ${verification.filename} (${creditsConsumed} emails)`,
      verification.id
    );

    // Calculate processing time
    const processingTimeSeconds = (Date.now() - verification.createdAt.getTime()) / 1000;

    // Update verification record
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
        resultsData: JSON.stringify({ taskId, results }),
        completedAt: new Date(),
        processingTimeSeconds,
      },
    });

    return NextResponse.json({
      status: 'completed',
      results,
      summary: {
        totalCount: verification.totalCount,
        validCount,
        invalidCount,
        riskyCount,
        unknownCount,
        catchallCount,
      },
      creditsConsumed,
      newBalance,
      processingTimeSeconds,
    });
  } catch (error) {
    console.error('Polling error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
