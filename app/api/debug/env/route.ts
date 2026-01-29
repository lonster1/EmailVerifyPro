import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const diagnostics = {
      reoonApiKey: process.env.REOON_API_KEY ? 'Set (length: ' + process.env.REOON_API_KEY.length + ')' : 'NOT SET',
      reoonApiUrl: process.env.REOON_API_URL || 'NOT SET',
      databaseUrl: process.env.DATABASE_URL ? 'Set (PostgreSQL)' : 'NOT SET',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
    };

    // Test Reoon API connection
    let reoonTest = 'Not tested';
    if (process.env.REOON_API_KEY) {
      try {
        const response = await fetch(
          `${process.env.REOON_API_URL}/check-account-balance/?key=${process.env.REOON_API_KEY}`
        );
        if (response.ok) {
          const data = await response.json();
          reoonTest = `Connected - ${data.remaining_daily_credits} credits remaining`;
        } else {
          reoonTest = `Failed - HTTP ${response.status}`;
        }
      } catch (error: any) {
        reoonTest = `Error - ${error.message}`;
      }
    }

    return NextResponse.json({
      status: 'ok',
      environment: diagnostics,
      reoonApiTest: reoonTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
    }, { status: 500 });
  }
}
