import Papa from 'papaparse';
import { ReoonVerificationResult } from '@/lib/reoon';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ParsedCSV {
  data: string[][];
  emailColumn: number | null;
  error?: string;
}

export interface ExtractedEmails {
  emails: string[];
  totalRows: number;
  duplicatesRemoved: number;
  originalData?: string[][];
  emailColumnIndex?: number;
  headers?: string[];
  hasHeaders?: boolean;
}

export interface MergedCSVRow {
  [key: string]: string | number | boolean;
}

/**
 * Parse CSV file using papaparse
 */
export function parseCSV(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        // Filter out empty rows
        const filtered = data.filter(row =>
          row.some(cell => cell && cell.trim().length > 0)
        );
        resolve(filtered);
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
      skipEmptyLines: true,
    });
  });
}

/**
 * Auto-detect email column by checking which column has >70% valid emails
 */
export function detectEmailColumn(data: string[][]): number | null {
  if (data.length === 0) return null;

  const sampleSize = Math.min(10, data.length - 1);
  const sampleRows = data.slice(1, sampleSize + 1);

  for (let col = 0; col < data[0].length; col++) {
    let emailCount = 0;
    for (const row of sampleRows) {
      if (row[col] && EMAIL_REGEX.test(row[col].trim())) {
        emailCount++;
      }
    }

    // If >70% of sample rows contain emails, it's likely the email column
    if (emailCount / sampleRows.length > 0.7) {
      return col;
    }
  }

  return null;
}

/**
 * Extract and deduplicate emails from CSV data
 */
export function extractEmails(
  data: string[][],
  columnIndex: number,
  preserveOriginal = false
): ExtractedEmails {
  const emailSet = new Set<string>();
  let totalRows = 0;

  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    totalRows++;
    const cell = data[i][columnIndex];
    if (cell && EMAIL_REGEX.test(cell.trim())) {
      emailSet.add(cell.trim().toLowerCase());
    }
  }

  const emails = Array.from(emailSet);
  const duplicatesRemoved = totalRows - emails.length;

  const result: ExtractedEmails = {
    emails,
    totalRows,
    duplicatesRemoved,
  };

  if (preserveOriginal) {
    result.originalData = data;
    result.emailColumnIndex = columnIndex;
    result.headers = data[0];
    result.hasHeaders = true;
  }

  return result;
}

/**
 * Export verification results to CSV format
 */
export function exportResultsToCSV(
  results: any[],
  filename: string
): void {
  const csv = Papa.unparse({
    fields: [
      'Email', 'Status', 'Score',
      'Syntax', 'Domain', 'MX', 'SMTP',
      'Disposable', 'Role', 'Free Provider', 'Catch-All'
    ],
    data: results.map(r => [
      r.email,
      r.status,
      r.score,
      r.details.syntax,
      r.details.domain,
      r.details.mx,
      r.details.smtp,
      r.details.disposable,
      r.details.role,
      r.details.free_provider,
      r.details.accept_all,
    ]),
  });

  // Create blob and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.csv', '') + '_results.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate CSV file before processing
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: 'Please upload a CSV file (.csv format only)' };
  }

  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum 10MB or 50,000 emails' };
  }

  return { valid: true };
}

/**
 * Merge verification results with original CSV data
 */
export function mergeVerificationResults(
  originalData: string[][],
  emailColumnIndex: number,
  verificationResults: ReoonVerificationResult[],
  hasHeaders = true
): MergedCSVRow[] {
  // Create email -> verification result map
  const resultMap = new Map<string, ReoonVerificationResult>();
  verificationResults.forEach(result => {
    resultMap.set(result.email.toLowerCase(), result);
  });

  const startRow = hasHeaders ? 1 : 0;
  const headers = hasHeaders
    ? originalData[0]
    : originalData[0].map((_, i) => `column_${i}`);

  const merged: MergedCSVRow[] = [];
  const processedEmails = new Set<string>();

  for (let i = startRow; i < originalData.length; i++) {
    const row = originalData[i];
    const email = row[emailColumnIndex]?.trim().toLowerCase();

    // Skip duplicate emails (only include first occurrence)
    if (email && processedEmails.has(email)) {
      continue;
    }

    if (email) {
      processedEmails.add(email);
    }

    const verificationResult = email ? resultMap.get(email) : null;

    const mergedRow: MergedCSVRow = {};

    // Add original columns
    headers.forEach((header, index) => {
      mergedRow[header] = row[index] || '';
    });

    // Add verification columns
    if (verificationResult) {
      mergedRow['verification_status'] = verificationResult.status;
      mergedRow['verification_score'] = verificationResult.score;
      mergedRow['syntax_valid'] = verificationResult.details.syntax;
      mergedRow['domain_valid'] = verificationResult.details.domain;
      mergedRow['mx_valid'] = verificationResult.details.mx;
      mergedRow['smtp_valid'] = verificationResult.details.smtp;
      mergedRow['is_disposable'] = verificationResult.details.disposable;
      mergedRow['is_role'] = verificationResult.details.role;
      mergedRow['is_free_provider'] = verificationResult.details.free_provider;
      mergedRow['is_catch_all'] = verificationResult.details.accept_all;
    } else {
      // No verification result (invalid email or not verified)
      mergedRow['verification_status'] = 'not_verified';
      mergedRow['verification_score'] = 0;
      mergedRow['syntax_valid'] = false;
      mergedRow['domain_valid'] = false;
      mergedRow['mx_valid'] = false;
      mergedRow['smtp_valid'] = false;
      mergedRow['is_disposable'] = false;
      mergedRow['is_role'] = false;
      mergedRow['is_free_provider'] = false;
      mergedRow['is_catch_all'] = false;
    }

    merged.push(mergedRow);
  }

  return merged;
}

/**
 * Export merged CSV with original columns + verification columns
 */
export function exportMergedCSV(mergedData: MergedCSVRow[], filename: string): void {
  if (mergedData.length === 0) return;

  const headers = Object.keys(mergedData[0]);

  const csvContent = [
    headers.join(','),
    ...mergedData.map(row =>
      headers
        .map(h => {
          const value = row[h];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.csv', '') + '_verified.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
