'use client';

import { useEffect } from 'react';
import { CheckCircle, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface BulkCompletionSummaryProps {
  totalEmails: number;
  validCount: number;
  invalidCount: number;
  riskyCount: number;
  unknownCount: number;
  catchallCount: number;
  creditsUsed: number;
  onContinue: () => void;
  onDownload: () => void;
}

export function BulkCompletionSummary({
  totalEmails,
  validCount,
  invalidCount,
  riskyCount,
  unknownCount,
  catchallCount,
  creditsUsed,
  onContinue,
  onDownload,
}: BulkCompletionSummaryProps) {
  // Removed auto-dismiss - user must click button manually

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-2xl w-full space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Verification Complete!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your bulk email verification has finished processing
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-2xl font-bold text-foreground">
                  {totalEmails} emails verified
                </p>

                <p className="text-sm text-foreground/80">
                  <span className="font-medium text-score-high">{validCount} valid</span>
                  {' • '}
                  <span className="font-medium text-score-low">{invalidCount} invalid</span>
                  {' • '}
                  <span className="font-medium text-score-medium">{riskyCount} risky</span>
                  {unknownCount > 0 && (
                    <>
                      {' • '}
                      <span className="font-medium text-muted-foreground">{unknownCount} unknown</span>
                    </>
                  )}
                  {catchallCount > 0 && (
                    <>
                      {' • '}
                      <span className="font-medium text-primary">{catchallCount} catch-all</span>
                    </>
                  )}
                </p>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="rounded-lg bg-white/50 p-3">
                    <p className="text-xs text-muted-foreground">Total Verified</p>
                    <p className="text-lg font-bold text-foreground">{totalEmails}</p>
                  </div>
                  <div className="rounded-lg bg-white/50 p-3">
                    <p className="text-xs text-muted-foreground">Valid Emails</p>
                    <p className="text-lg font-bold text-score-high">{validCount}</p>
                  </div>
                  <div className="rounded-lg bg-white/50 p-3">
                    <p className="text-xs text-muted-foreground">Credits Used</p>
                    <p className="text-lg font-bold text-foreground">{creditsUsed}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={onDownload} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
                <Button onClick={onContinue} className="flex-1">
                  Upload new CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-accent border-accent-foreground/20 p-4">
          <p className="text-sm text-accent-foreground font-medium">
            ✓ Results saved to verification history
          </p>
          <p className="text-xs text-accent-foreground/80 mt-1">
            View detailed results and download CSV from Recent Verifications section below
          </p>
        </div>
      </div>
    </div>
  );
}
