'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VerificationResult } from '@/components/VerificationResult';
import { CSVUpload } from '@/components/CSVUpload';
import { BulkVerificationProgress } from '@/components/BulkVerificationProgress';
import { BulkCompletionSummary } from '@/components/BulkCompletionSummary';
import { VerificationHistoryList } from '@/components/VerificationHistoryList';
import { exportResultsToCSV, exportMergedCSV, mergeVerificationResults } from '@/lib/csv';

interface VerificationData {
  email: string;
  status: 'valid' | 'invalid' | 'risky' | 'unknown' | 'catch_all';
  score: number;
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
  creditsConsumed: number;
  newBalance: number;
}

export default function DashboardPage() {
  const { user, token, updateCredits } = useAuth();
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bulk verification state
  const [bulkStep, setBulkStep] = useState<'upload' | 'progress' | 'summary'>('upload');
  const [bulkEmails, setBulkEmails] = useState<string[]>([]);
  const [bulkFilename, setBulkFilename] = useState('');
  const [bulkTaskId, setBulkTaskId] = useState<string | null>(null);
  const [bulkResults, setBulkResults] = useState<any[] | null>(null);
  const [bulkCreditsUsed, setBulkCreditsUsed] = useState(0);
  const [bulkOriginalData, setBulkOriginalData] = useState<string[][] | null>(null);
  const [bulkEmailColumnIndex, setBulkEmailColumnIndex] = useState<number | null>(null);

  // History refresh mechanism
  const [historyKey, setHistoryKey] = useState(0);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/verify/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Verification failed');
      }

      // Update local credit balance
      updateCredits(data.newBalance);

      // Display results
      setResult(data);
      setEmail(''); // Clear input

      // Trigger history refresh to show latest verification
      setHistoryKey(prev => prev + 1);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyAnother = () => {
    setResult(null);
    setError(null);
    setEmail('');
  };

  // Bulk verification handlers
  const handleBulkUploadStart = async (
    emails: string[],
    filename: string,
    originalData?: string[][],
    emailColumnIndex?: number
  ) => {
    setError(null);
    setBulkEmails(emails);
    setBulkFilename(filename);
    setBulkOriginalData(originalData || null);
    setBulkEmailColumnIndex(emailColumnIndex ?? null);

    try {
      const response = await fetch('/api/verify/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ emails, filename }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start bulk verification');
      }

      setBulkTaskId(data.taskId);
      setBulkStep('progress');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setBulkStep('upload');
    }
  };

  const handleBulkComplete = (results: any[], creditsUsed: number, newBalance: number) => {
    setBulkResults(results);
    setBulkCreditsUsed(creditsUsed);
    updateCredits(newBalance);
    setBulkStep('summary');
    // Trigger history refresh to show latest verification
    setHistoryKey(prev => prev + 1);
  };

  const handleBulkError = (error: string) => {
    setError(error);
    setBulkStep('upload');
  };

  const handleBulkStartNew = () => {
    setBulkStep('upload');
    setBulkEmails([]);
    setBulkFilename('');
    setBulkTaskId(null);
    setBulkResults(null);
    setBulkCreditsUsed(0);
    setBulkOriginalData(null);
    setBulkEmailColumnIndex(null);
    setError(null);
  };

  const refreshVerificationHistory = useCallback(() => {
    setHistoryKey(prev => prev + 1);
  }, []);

  const handleBulkDownload = useCallback(() => {
    if (!bulkResults || bulkResults.length === 0) {
      return;
    }

    // Check if we have original data for multi-column export
    if (bulkOriginalData && bulkEmailColumnIndex !== null) {
      // Multi-column export: merge original data with verification results
      const mergedData = mergeVerificationResults(
        bulkOriginalData,
        bulkEmailColumnIndex,
        bulkResults,
        true
      );
      exportMergedCSV(mergedData, bulkFilename || 'bulk_verification');
    } else {
      // Simple export: verification columns only
      exportResultsToCSV(bulkResults, bulkFilename || 'bulk_verification');
    }
  }, [bulkResults, bulkOriginalData, bulkEmailColumnIndex, bulkFilename]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Single Email Verification */}
        <Card>
          <CardHeader>
            <CardTitle>Verify Single Email</CardTitle>
            <CardDescription>
              Quickly verify a single email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="test@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isVerifying}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isVerifying || !email.trim()}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Email'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Costs 1 credit per verification (unknown results are free)
                </p>
              </form>
            ) : (
              <VerificationResult
                email={result.email}
                status={result.status}
                score={result.score}
                details={result.details}
                creditsConsumed={result.creditsConsumed}
                onVerifyAnother={handleVerifyAnother}
              />
            )}
          </CardContent>
        </Card>

        {/* CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>
              Verify emails in bulk from a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && bulkStep === 'upload' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 mb-4">
                {error}
              </div>
            )}

            {bulkStep === 'upload' && (
              <CSVUpload
                onUploadStart={handleBulkUploadStart}
                disabled={isVerifying}
              />
            )}

            {bulkStep === 'progress' && bulkTaskId && (
              <BulkVerificationProgress
                taskId={bulkTaskId}
                totalEmails={bulkEmails.length}
                onComplete={handleBulkComplete}
                onError={handleBulkError}
              />
            )}

            {bulkStep === 'summary' && bulkResults && (
              <BulkCompletionSummary
                totalEmails={bulkResults.length}
                validCount={bulkResults.filter(r => r.status === 'valid').length}
                invalidCount={bulkResults.filter(r => r.status === 'invalid').length}
                riskyCount={bulkResults.filter(r => r.status === 'risky').length}
                unknownCount={bulkResults.filter(r => r.status === 'unknown').length}
                catchallCount={bulkResults.filter(r => r.status === 'catch_all').length}
                creditsUsed={bulkCreditsUsed}
                onDownload={handleBulkDownload}
                onContinue={() => {
                  handleBulkStartNew();
                  refreshVerificationHistory();
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Empty State */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verifications</CardTitle>
          <CardDescription>
            Your latest email verification jobs (last 20)
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto">
          {token && <VerificationHistoryList token={token} key={historyKey} />}
        </CardContent>
      </Card>
    </div>
  );
}
