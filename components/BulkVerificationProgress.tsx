'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [status, setStatus] = useState('Starting...');
  const [retryCount, setRetryCount] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const pollingRef = useRef(false);

  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const pollAndProcess = useCallback(async () => {
    if (completedRef.current || pollingRef.current) return;
    pollingRef.current = true;

    try {
      const response = await fetch(`/api/verify/bulk/${taskId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          onErrorRef.current('Verification task not found.');
          pollingRef.current = false;
          return;
        }
        throw new Error(data.error || 'Failed to get verification status');
      }

      setRetryCount(0);

      if (data.status === 'running') {
        setProgress(data.progress || 0);
        setProcessedCount(data.processedCount || 0);
        setStatus(`Processing... (${data.processedCount}/${data.totalCount})`);
        // Poll again immediately - server does work on each poll
        pollingRef.current = false;
        if (!completedRef.current) {
          setTimeout(() => pollAndProcess(), 500);
        }
        return;
      } else if (data.status === 'completed') {
        completedRef.current = true;
        setProgress(100);
        setProcessedCount(totalEmails);
        setStatus('Completed');
        onCompleteRef.current(data.results, data.creditsConsumed, data.newBalance);
      }
    } catch (error) {
      console.error('Polling error:', error);
      const newRetry = retryCount + 1;
      setRetryCount(newRetry);
      if (newRetry >= 10) {
        onErrorRef.current('Unable to reach verification service. Please check your verification history for results.');
        pollingRef.current = false;
        return;
      }
      // Retry after a delay
      setTimeout(() => {
        pollingRef.current = false;
        pollAndProcess();
      }, 2000);
      return;
    }

    pollingRef.current = false;
  }, [taskId, totalEmails, retryCount]);

  // Start polling on mount
  useEffect(() => {
    if (completedRef.current) return;
    pollAndProcess();
  }, [pollAndProcess]);

  // Update elapsed time every second
  useEffect(() => {
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimateRemainingTime = () => {
    if (processedCount === 0) return 'Calculating...';
    const rate = elapsedTime / processedCount;
    const remaining = Math.ceil(rate * (totalEmails - processedCount));
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
          <p className="text-muted-foreground">Rate</p>
          <p className="font-medium">
            {processedCount > 0 ? `~${(processedCount / Math.max(elapsedTime, 1) * 60).toFixed(0)} emails/min` : '---'}
          </p>
        </div>
      </div>

      {retryCount > 0 && retryCount < 10 && (
        <Alert>
          <AlertDescription>
            Experiencing connection issues. Retrying... (Attempt {retryCount}/10)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
