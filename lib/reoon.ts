/**
 * Reoon Email Verification API Client (BULK API)
 *
 * IMPORTANT: This uses Reoon's bulk verification API.
 * Single email verification also uses the bulk API with 1 email.
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
  overall_score: string; // STRING, 0-10 scale!
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
 * Sleep helper for polling
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create bulk verification task
 * API key must be in the REQUEST BODY, not headers!
 */
export async function createBulkVerificationTask(
  emails: string[]
): Promise<{ taskId: number; status: string }> {
  if (!REOON_API_KEY) {
    throw new Error('REOON_API_KEY environment variable is not set');
  }

  if (!emails || emails.length === 0) {
    throw new Error('At least one email address is required');
  }

  const response = await fetch(`${REOON_API_URL}/create-bulk-verification-task/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Task ${Date.now()}`,
      emails: emails,
      key: REOON_API_KEY, // API key in BODY, not headers!
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Reoon API error: ${errorBody.reason || response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'success') {
    throw new Error(`Task creation failed: ${data.reason || 'Unknown error'}`);
  }

  return {
    taskId: data.task_id,
    status: data.status,
  };
}

/**
 * Get bulk verification task results
 * API key must be in QUERY PARAMS, not headers!
 */
export async function getBulkVerificationResults(taskId: number): Promise<{
  status: 'waiting' | 'running' | 'completed' | 'failed';
  progress: number;
  results?: Record<string, ReoonAPIResponse>;
}> {
  if (!REOON_API_KEY) {
    throw new Error('REOON_API_KEY environment variable is not set');
  }

  const url = `${REOON_API_URL}/get-result-bulk-verification-task/?key=${REOON_API_KEY}&task_id=${taskId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get results: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status === 'error') {
    throw new Error(data.reason || 'Unknown error');
  }

  return {
    status: data.status,
    progress: data.progress_percentage || 0,
    results: data.results,
  };
}

/**
 * Poll task until completed with exponential backoff
 */
async function pollUntilComplete(
  taskId: number,
  maxWaitTime = 300000 // 5 minutes max
): Promise<ReoonVerificationResult[]> {
  const startTime = Date.now();
  const delays = [1000, 2000, 3000, 5000, 10000]; // Exponential backoff

  let delayIndex = 0;
  while (Date.now() - startTime < maxWaitTime) {
    const result = await getBulkVerificationResults(taskId);

    if (result.status === 'completed' && result.results) {
      // Convert results object to array
      return Object.values(result.results).map(normalizeReoonResponse);
    }

    if (result.status === 'failed') {
      throw new Error('Verification task failed');
    }

    // Still waiting/running - wait before next poll
    const delay = delays[Math.min(delayIndex, delays.length - 1)];
    await sleep(delay);
    delayIndex++;
  }

  throw new Error('Verification task timeout');
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
 * IMPORTANT: Score is a STRING 0-10, we convert to NUMBER 0-100
 */
export function normalizeReoonResponse(data: ReoonAPIResponse): ReoonVerificationResult {
  // Convert score from 0-10 string to 0-100 number
  const scoreInt = parseInt(data.overall_score || '0');
  const score = Math.min(100, Math.max(0, scoreInt * 10)); // Scale and clamp

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
 * Verify a single email address
 * Uses bulk API with 1 email for consistency
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

  try {
    // Create bulk task with single email
    const task = await createBulkVerificationTask([normalizedEmail]);

    // Poll for results
    const results = await pollUntilComplete(task.taskId);

    return results[0];
  } catch (error) {
    console.error('Single email verification error:', error);

    // Return unknown status on error
    return {
      email: normalizedEmail,
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
        domain: normalizedEmail.split('@')[1] || '',
      },
    };
  }
}

/**
 * Verify multiple emails in bulk
 */
export async function verifyBulkEmails(
  emails: string[]
): Promise<ReoonVerificationResult[]> {
  if (!emails || emails.length === 0) {
    return [];
  }

  // Normalize emails
  const normalizedEmails = emails.map(e => e.trim().toLowerCase());

  try {
    // Create bulk task
    const task = await createBulkVerificationTask(normalizedEmails);

    // Poll for results
    return await pollUntilComplete(task.taskId);
  } catch (error) {
    console.error('Bulk email verification error:', error);
    throw error;
  }
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
