'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ResultsTable } from '@/components/ResultsTable';
import { exportResultsToCSV } from '@/lib/csv';
import { cn } from '@/lib/utils';

interface Verification {
  id: string;
  type: 'SINGLE' | 'BULK';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt: string | null;
  filename: string | null;
  totalEmails: number;
  validCount: number;
  invalidCount: number;
  riskyCount: number;
  unknownCount: number;
  catchallCount: number;
  creditsUsed: number;
}

interface VerificationHistoryListProps {
  token: string;
}

export function VerificationHistoryList({ token }: VerificationHistoryListProps) {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [filter, setFilter] = useState<'all' | 'single' | 'bulk'>('all');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Expandable sections state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadedResults, setLoadedResults] = useState<Record<string, any[]>>({});
  const [loadingResults, setLoadingResults] = useState<Set<string>>(new Set());
  const [resultsErrors, setResultsErrors] = useState<Record<string, string>>({});

  const fetchVerifications = useCallback(async (reset = false) => {
    // Don't fetch if token is not available yet
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const typeParam = filter !== 'all' ? `&type=${filter.toUpperCase()}` : '';
      const response = await fetch(
        `/api/verifications?limit=20&offset=${currentOffset}${typeParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch verification history');
      }

      const data = await response.json();

      setVerifications(prev =>
        reset ? data.verifications : [...prev, ...data.verifications]
      );
      setHasMore(data.hasMore);
      setOffset(reset ? 20 : currentOffset + 20);
    } catch (err) {
      console.error('Verification history fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [token, filter, offset]);

  useEffect(() => {
    fetchVerifications(true);
  }, [filter, token]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const loadResults = useCallback(async (verificationId: string) => {
    // Skip if already loaded or currently loading
    if (loadedResults[verificationId] || loadingResults.has(verificationId)) {
      return loadedResults[verificationId];
    }

    setLoadingResults(prev => new Set([...prev, verificationId]));
    setResultsErrors(prev => ({ ...prev, [verificationId]: '' }));

    try {
      const response = await fetch(
        `/api/verifications/${verificationId}/results`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load results');
      }

      const data = await response.json();
      setLoadedResults(prev => ({ ...prev, [verificationId]: data.results }));
      return data.results;
    } catch (err) {
      console.error('Failed to load results:', err);
      setResultsErrors(prev => ({
        ...prev,
        [verificationId]: err instanceof Error ? err.message : 'Failed to load results'
      }));
      return null;
    } finally {
      setLoadingResults(prev => {
        const newSet = new Set(prev);
        newSet.delete(verificationId);
        return newSet;
      });
    }
  }, [token, loadedResults, loadingResults]);

  const handleDownload = useCallback((verification: Verification) => {
    const results = loadedResults[verification.id];
    if (!results || results.length === 0) {
      return;
    }

    exportResultsToCSV(results, verification.filename || 'verification');
  }, [loadedResults]);

  const handleLoadAndDownload = useCallback(async (verification: Verification) => {
    // If already loaded, download immediately
    if (loadedResults[verification.id]) {
      handleDownload(verification);
      return;
    }

    // Otherwise, load first then download
    const results = await loadResults(verification.id);
    if (results && results.length > 0) {
      exportResultsToCSV(results, verification.filename || 'verification');
    }
  }, [loadedResults, loadResults, handleDownload]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'FAILED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading && verifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (verifications.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No verifications yet. Start by verifying a single email or uploading a CSV file.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'single' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('single')}
        >
          Single
        </Button>
        <Button
          variant={filter === 'bulk' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('bulk')}
        >
          Bulk
        </Button>
      </div>

      {/* Verification list */}
      <div className="space-y-3">
        {verifications.map(v => (
          <Collapsible
            key={v.id}
            open={expandedId === v.id}
            onOpenChange={() => toggleExpand(v.id)}
          >
            <CollapsibleTrigger asChild>
              <Card className="p-4 hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={v.type === 'BULK' ? 'default' : 'secondary'}>
                      {v.type}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {v.type === 'BULK' && v.filename
                          ? v.filename
                          : v.type === 'BULK'
                          ? 'Bulk Verification'
                          : 'Single Email'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(v.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="font-medium">{v.totalEmails}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>

                    <div className="flex gap-2">
                      <div className="text-center">
                        <p className="font-medium text-score-high">{v.validCount}</p>
                        <p className="text-xs text-muted-foreground">Valid</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-score-low">{v.invalidCount}</p>
                        <p className="text-xs text-muted-foreground">Invalid</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-score-medium">{v.riskyCount}</p>
                        <p className="text-xs text-muted-foreground">Risky</p>
                      </div>
                      {v.unknownCount > 0 && (
                        <div className="text-center">
                          <p className="font-medium text-muted-foreground">{v.unknownCount}</p>
                          <p className="text-xs text-muted-foreground">Unknown</p>
                        </div>
                      )}
                      {v.catchallCount > 0 && (
                        <div className="text-center">
                          <p className="font-medium text-primary">{v.catchallCount}</p>
                          <p className="text-xs text-muted-foreground">Catchall</p>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-medium">{v.creditsUsed}</p>
                      <p className="text-xs text-muted-foreground">Credits</p>
                    </div>

                    <Badge variant={getStatusBadgeVariant(v.status)}>{v.status}</Badge>

                    {v.status === 'COMPLETED' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadAndDownload(v);
                        }}
                        variant="outline"
                        size="sm"
                        disabled={loadingResults.has(v.id)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {loadingResults.has(v.id) ? 'Loading...' : 'CSV'}
                      </Button>
                    )}

                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform",
                        expandedId === v.id && "rotate-180"
                      )}
                    />
                  </div>
                </div>
              </Card>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Card className="mt-2 p-4 bg-muted/30">
                <div className="space-y-4">
                  {/* Summary stats */}
                  <div className="grid grid-cols-5 gap-3">
                    <div className="rounded-lg bg-background p-3">
                      <p className="text-xs text-muted-foreground">Valid</p>
                      <p className="text-xl font-bold text-score-high">{v.validCount}</p>
                    </div>
                    <div className="rounded-lg bg-background p-3">
                      <p className="text-xs text-muted-foreground">Invalid</p>
                      <p className="text-xl font-bold text-score-low">{v.invalidCount}</p>
                    </div>
                    <div className="rounded-lg bg-background p-3">
                      <p className="text-xs text-muted-foreground">Risky</p>
                      <p className="text-xl font-bold text-score-medium">{v.riskyCount}</p>
                    </div>
                    <div className="rounded-lg bg-background p-3">
                      <p className="text-xs text-muted-foreground">Unknown</p>
                      <p className="text-xl font-bold text-muted-foreground">{v.unknownCount}</p>
                    </div>
                    <div className="rounded-lg bg-background p-3">
                      <p className="text-xs text-muted-foreground">Catchall</p>
                      <p className="text-xl font-bold text-primary">{v.catchallCount}</p>
                    </div>
                  </div>

                  {/* Download button */}
                  {v.status === 'COMPLETED' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!loadedResults[v.id]) {
                            loadResults(v.id);
                          } else {
                            handleDownload(v);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        disabled={loadingResults.has(v.id)}
                        className="flex-1"
                      >
                        {loadingResults.has(v.id) ? (
                          'Loading...'
                        ) : loadedResults[v.id] ? (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download Results CSV
                          </>
                        ) : (
                          'Load Results to Download'
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Results error */}
                  {resultsErrors[v.id] && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      {resultsErrors[v.id]}
                      <Button
                        onClick={() => loadResults(v.id)}
                        variant="link"
                        size="sm"
                        className="ml-2"
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {/* View individual results */}
                  {loadedResults[v.id] && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Individual Results</h4>
                      <ResultsTable results={loadedResults[v.id]} compact showSummary={false} />
                    </div>
                  )}

                  {/* Processing status */}
                  {v.status === 'PROCESSING' && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Verification in progress...
                    </div>
                  )}

                  {/* Failed status */}
                  {v.status === 'FAILED' && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      Verification failed. Please try again.
                    </div>
                  )}
                </div>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => fetchVerifications(false)} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
