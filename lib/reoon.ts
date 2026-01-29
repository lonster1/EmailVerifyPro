/**
 * Reoon Email Verification API Client
 *
 * Uses Reoon's real-time single verification API (/verify/) for both
 * single and bulk operations. This avoids the bulk task queue which
 * requires instant credits and can delay processing indefinitely.
 *
 * API Documentation: https://reoon.com/email-verification-api-documentation
 */

const REOON_API_KEY = process.env.REOON_API_KEY || '';
const REOON_API_URL = process.env.REOON_API_URL || 'https://emailverifier.reoon.com/api/v1';

export interface ReoonVerificationResult {
  email: string;
  status: 'valid' | 'invalid' | 'risky' | 'unknown' | 'catch_all';
  score: number; // 0-100
  details: {
    syntax: boolean;
    domain: boolean;
    mx: boolean;
    smtp: boolean;
    disposable: boolean;
    role: boolean;
    free_provider: boolean;
    accept_all: boolean;
  };
  metadata?: {
    domain: string;
    provider?: string;
  };
}

interface ReoonAPIResponse {
  email: string;
  status: string;
  overall_score: number | string;
  is_valid_syntax: boolean | null;
  is_deliverable: boolean | null;
  is_disposable: boolean | null;
  is_role_account: boolean | null;
  is_catch_all: boolean | null;
  is_free_email: boolean | null;
  is_safe_to_send: boolean | null;
  mx_accepts_mail: boolean | null;
  can_connect_smtp: boolean | null;
  has_inbox_full: boolean | null;
  is_disabled: boolean | null;
  is_spamtrap: boolean | null;
  mx_records: string[] | null;
  domain: string;
  username: string;
}

/**
 * Map Reoon status to our app status
 * Reoon uses: "safe", "invalid", "risky", "catch_all"
 * We use: "valid", "invalid", "risky", "unknown", "catch_all"
 */
function mapReoonStatus(status: string): ReoonVerificationResult['status'] {
  const normalized = status.toLowerCase().trim();

  switch (normalized) {
    case 'safe':
      return 'valid';
    case 'invalid':
      return 'invalid';
    case 'risky':
      return 'risky';
    case 'catch_all':
    case 'catch-all':
      return 'catch_all';
    default:
      return 'unknown';
  }
}

/**
 * Normalize Reoon API response to our format
 * Real-time API returns score as NUMBER 0-100
 * Bulk API returns score as STRING 0-10
 */
export function normalizeReoonResponse(data: ReoonAPIResponse): ReoonVerificationResult {
  let score: number;
  if (typeof data.overall_score === 'string') {
    // Bulk API: string 0-10 scale
    score = Math.min(100, Math.max(0, parseInt(data.overall_score || '0') * 10));
  } else {
    // Real-time API: number 0-100 scale
    score = Math.min(100, Math.max(0, data.overall_score || 0));
  }

  return {
    email: data.email,
    status: mapReoonStatus(data.status),
    score,
    details: {
      syntax: data.is_valid_syntax ?? false,
      domain: data.mx_accepts_mail ?? false,
      mx: data.mx_records !== null && data.mx_records.length > 0,
      smtp: data.can_connect_smtp ?? false,
      disposable: data.is_disposable ?? false,
      role: data.is_role_account ?? false,
      free_provider: data.is_free_email ?? false,
      accept_all: data.is_catch_all ?? false,
    },
    metadata: {
      domain: data.domain,
    },
  };
}

/**
 * Verify a single email using Reoon's real-time API
 * Returns results in ~1-2 seconds, uses daily credits (no queuing)
 */
export async function verifySingleEmail(email: string): Promise<ReoonVerificationResult> {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email parameter');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Basic email syntax validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return {
      email: normalizedEmail,
      status: 'invalid',
      score: 0,
      details: {
        syntax: false,
        domain: false,
        mx: false,
        smtp: false,
        disposable: false,
        role: false,
        free_provider: false,
        accept_all: false,
      },
    };
  }

  if (!REOON_API_KEY) {
    throw new Error('REOON_API_KEY environment variable is not set');
  }

  const url = `${REOON_API_URL}/verify/?key=${encodeURIComponent(REOON_API_KEY)}&email=${encodeURIComponent(normalizedEmail)}&mode=power`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Reoon API error: ${response.statusText}`);
  }

  const data: ReoonAPIResponse = await response.json();

  if ((data as any).status === 'error') {
    throw new Error((data as any).reason || 'Verification failed');
  }

  return normalizeReoonResponse(data);
}

/**
 * Verify multiple emails sequentially using real-time API
 * Calls onProgress after each email completes
 */
export async function verifyBulkEmailsRealtime(
  emails: string[],
  onProgress?: (processed: number, total: number, result: ReoonVerificationResult) => void
): Promise<ReoonVerificationResult[]> {
  if (!emails || emails.length === 0) {
    return [];
  }

  const results: ReoonVerificationResult[] = [];

  for (let i = 0; i < emails.length; i++) {
    try {
      const result = await verifySingleEmail(emails[i]);
      results.push(result);
    } catch (error) {
      // On failure, mark as unknown and continue
      console.error(`Failed to verify ${emails[i]}:`, error);
      results.push({
        email: emails[i],
        status: 'unknown',
        score: 50,
        details: {
          syntax: true,
          domain: false,
          mx: false,
          smtp: false,
          disposable: false,
          role: false,
          free_provider: false,
          accept_all: false,
        },
        metadata: {
          domain: emails[i].split('@')[1] || '',
        },
      });
    }

    if (onProgress) {
      onProgress(i + 1, emails.length, results[results.length - 1]);
    }
  }

  return results;
}

/**
 * Check Reoon account balance
 */
export async function checkAccountBalance(): Promise<{
  dailyCredits: number;
  instantCredits: number;
  apiStatus: string;
}> {
  if (!REOON_API_KEY) {
    throw new Error('REOON_API_KEY environment variable is not set');
  }

  const url = `${REOON_API_URL}/check-account-balance/?key=${REOON_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to check balance: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'success') {
    throw new Error('Balance check failed');
  }

  return {
    dailyCredits: data.remaining_daily_credits,
    instantCredits: data.remaining_instant_credits,
    apiStatus: data.api_status,
  };
}
