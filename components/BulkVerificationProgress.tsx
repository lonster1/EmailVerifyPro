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
  const [status, setStatus] = useState('Queued...');
  const [retryCount, setRetryCount] = useState(0);
  const [isQueued, setIsQueued] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const pollStatus = useCallback(async () => {
    if (completedRef.current) return;

    try {
      const response = await fetch(`/api/verify/bulk/${taskId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          onErrorRef.current('Verification task not found. Please start a new verification.');
          return;
        }
        throw new Error(data.error || 'Failed to get verification status');
      }

      setRetryCount(0); // Reset on any successful response

      if (data.status === 'running') {
        const p = data.progress || 0;
        setProgress(p);
        setProcessedCount(data.processedCount || 0);
        if (p === 0) {
          setIsQueued(true);
          setStatus('Queued - waiting for processing...');
        } else {
          setIsQueued(false);
          setStatus('Processing...');
        }
      } else if (data.status === 'completed') {
        completedRef.current = true;
        setProgress(100);
        setProcessedCount(totalEmails);
        setStatus('Completed');
        setIsQueued(false);
        onCompleteRef.current(data.results, data.creditsConsumed, data.newBalance);
      }
    } catch (error) {
      console.error('Polling error:', error);
      setRetryCount(prev => {
        if (prev >= 10) {
          onErrorRef.current('Unable to reach verification service. Please check your verification history for results.');
          return prev;
        }
        return prev + 1;
      });
    }
  }, [taskId, totalEmails]);

  // Poll for status updates - slower interval when queued
  useEffect(() => {
    if (completedRef.current) return;

    const interval = isQueued ? 5000 : 2000; // Poll less frequently when queued
    const pollInterval = setInterval(pollStatus, interval);
    pollStatus(); // Initial poll

    return () => clearInterval(pollInterval);
  }, [pollStatus, isQueued]);

  // Update elapsed time every second
  useEffect(() => {
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // No hard timeout - let it run until completion or network failure

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

      {isQueued && elapsedTime > 30 && (
        <Alert>
          <AlertDescription>
            Your verification is queued with the email verification provider.
            This can happen when multiple tasks are submitted. You can safely
            close this page and check your results later in your verification history.
          </AlertDescription>
        </Alert>
      )}

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
