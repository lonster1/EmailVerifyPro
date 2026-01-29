'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResultsTableProps {
  results: any[];
  compact?: boolean;
  showSummary?: boolean;
}

export function ResultsTable({
  results,
  compact = false,
  showSummary = true,
}: ResultsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = compact ? 20 : 50;

  // Calculate summary stats
  const summary = useMemo(() => {
    const total = results.length;
    const valid = results.filter(r => r.status === 'valid').length;
    const invalid = results.filter(r => r.status === 'invalid').length;
    const risky = results.filter(r => r.status === 'risky').length;
    const unknown = results.filter(r => r.status === 'unknown').length;
    const catchAll = results.filter(r => r.status === 'catch_all').length;

    return {
      total,
      valid,
      invalid,
      risky,
      unknown,
      catchAll,
      validPercent: total > 0 ? ((valid / total) * 100).toFixed(1) : '0',
      invalidPercent: total > 0 ? ((invalid / total) * 100).toFixed(1) : '0',
      riskyPercent: total > 0 ? ((risky / total) * 100).toFixed(1) : '0',
      unknownPercent: total > 0 ? ((unknown / total) * 100).toFixed(1) : '0',
      catchAllPercent: total > 0 ? ((catchAll / total) * 100).toFixed(1) : '0',
    };
  }, [results]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (statusFilter === 'all') return results;
    return results.filter(r => r.status === statusFilter);
  }, [results, statusFilter]);

  // Paginate results
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage, resultsPerPage]);

  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      valid: 'default',
      invalid: 'destructive',
      risky: 'secondary',
      unknown: 'outline',
      catch_all: 'secondary',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status === 'catch_all' ? 'Catch-All' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-score-high dark:text-green-400';
    if (score >= 50) return 'text-score-medium dark:text-yellow-400';
    return 'text-score-low dark:text-red-400';
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No results available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats Grid (optional) */}
      {showSummary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Valid</p>
            <p className="text-lg font-bold text-score-high">{summary.valid}</p>
            <p className="text-xs text-muted-foreground">{summary.validPercent}%</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Invalid</p>
            <p className="text-lg font-bold text-score-low">{summary.invalid}</p>
            <p className="text-xs text-muted-foreground">{summary.invalidPercent}%</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Risky</p>
            <p className="text-lg font-bold text-score-medium">{summary.risky}</p>
            <p className="text-xs text-muted-foreground">{summary.riskyPercent}%</p>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
        >
          All ({summary.total})
        </Button>
        <Button
          variant={statusFilter === 'valid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('valid');
            setCurrentPage(1);
          }}
        >
          Valid ({summary.valid})
        </Button>
        <Button
          variant={statusFilter === 'invalid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('invalid');
            setCurrentPage(1);
          }}
        >
          Invalid ({summary.invalid})
        </Button>
        <Button
          variant={statusFilter === 'risky' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('risky');
            setCurrentPage(1);
          }}
        >
          Risky ({summary.risky})
        </Button>
        {summary.unknown > 0 && (
          <Button
            variant={statusFilter === 'unknown' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('unknown');
              setCurrentPage(1);
            }}
          >
            Unknown ({summary.unknown})
          </Button>
        )}
        {summary.catchAll > 0 && (
          <Button
            variant={statusFilter === 'catch_all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('catch_all');
              setCurrentPage(1);
            }}
          >
            Catch-All ({summary.catchAll})
          </Button>
        )}
      </div>

      {/* Results Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Score</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedResults.map((result, idx) => (
                <tr key={idx} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-mono">{result.email}</td>
                  <td className="px-4 py-3">{getStatusBadge(result.status)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${getScoreColor(result.score)}`}>
                      {result.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {result.details?.syntax && '✓ Syntax '}
                    {result.details?.domain && '✓ Domain '}
                    {result.details?.mx && '✓ MX '}
                    {result.details?.smtp && '✓ SMTP'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * resultsPerPage) + 1} to{' '}
              {Math.min(currentPage * resultsPerPage, filteredResults.length)} of{' '}
              {filteredResults.length} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
