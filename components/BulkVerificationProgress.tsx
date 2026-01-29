'use client';

import { useState, useEffect, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkVerificationProgressProps {
  taskId: string;
  totalEmails: number;
  onComplete: (results: any[], creditsUsed: number, newBalance: number) => void;
  onError: (error: string) => void;
}

export function BulkVerificationProgress({
  taskId,
  totalEmails,
  onComplete,
  onError,
}: BulkVerificationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [status, setStatus] = useState('Waiting...');
  const [retryCount, setRetryCount] = useState(0);

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/verify/bulk/${taskId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          onError('Verification task not found. Please start a new verification.');
        } else {
          throw new Error(data.error || 'Failed to get verification status');
        }
        return;
      }

      if (data.status === 'running') {
        setProgress(data.progress || 0);
        setProcessedCount(data.processedCount || 0);
        setStatus('Processing...');
        setRetryCount(0); // Reset retry count on successful poll
      } else if (data.status === 'completed') {
        setProgress(100);
        setProcessedCount(totalEmails);
        setStatus('Completed');
        onComplete(data.results, data.creditsConsumed, data.newBalance);
      }
    } catch (error) {
      console.error('Polling error:', error);
      // Exponential backoff: 1s, 2s, 5s, 10s
      const backoffDelays = [1000, 2000, 5000, 10000];
      if (retryCount < backoffDelays.length) {
        setRetryCount(retryCount + 1);
      } else {
        onError('Verification is taking longer than expected. Please try again later.');
      }
    }
  }, [taskId, totalEmails, onComplete, onError, retryCount]);

  // Poll for status updates every 2 seconds
  useEffect(() => {
    const pollInterval = setInterval(pollStatus, 2000);
    // Initial poll
    pollStatus();

    return () => clearInterval(pollInterval);
  }, [pollStatus]);

  // Update elapsed time every second
  useEffect(() => {
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Timeout after 5 minutes
  useEffect(() => {
    const timeout = setTimeout(() => {
      onError('Verification timeout. Please check back later or contact support.');
    }, 5 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [onError]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimateRemainingTime = () => {
    if (progress === 0) return 'Calculating...';
    const rate = elapsedTime / progress;
    const remaining = Math.ceil(rate * (100 - progress));
    return formatTime(remaining);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{status}</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Processed</p>
          <p className="font-medium">
            {processedCount} of {totalEmails} emails
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Elapsed Time</p>
          <p className="font-medium">{formatTime(elapsedTime)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Estimated Remaining</p>
          <p className="font-medium">{estimateRemainingTime()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Status</p>
          <p className="font-medium">{status}</p>
        </div>
      </div>

      {retryCount > 0 && (
        <Alert>
          <AlertDescription>
            Experiencing connection issues. Retrying... (Attempt {retryCount}/4)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
