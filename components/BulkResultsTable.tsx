'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { exportResultsToCSV, exportMergedCSV, mergeVerificationResults } from '@/lib/csv';

interface BulkResultsTableProps {
  results: any[];
  filename: string;
  creditsConsumed: number;
  originalData?: string[][] | null;
  emailColumnIndex?: number | null;
  onStartNew: () => void;
}

export function BulkResultsTable({
  results,
  filename,
  creditsConsumed,
  originalData,
  emailColumnIndex,
  onStartNew,
}: BulkResultsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 50;

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
      validPercent: ((valid / total) * 100).toFixed(1),
      invalidPercent: ((invalid / total) * 100).toFixed(1),
      riskyPercent: ((risky / total) * 100).toFixed(1),
      unknownPercent: ((unknown / total) * 100).toFixed(1),
      catchAllPercent: ((catchAll / total) * 100).toFixed(1),
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
  }, [filteredResults, currentPage]);

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
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleExport = () => {
    if (originalData && emailColumnIndex !== null && emailColumnIndex !== undefined) {
      // Multi-column CSV: Merge and export with original columns
      const mergedData = mergeVerificationResults(
        originalData,
        emailColumnIndex,
        results,
        true
      );
      exportMergedCSV(mergedData, filename);
    } else {
      // Simple CSV: Export verification results only (existing behavior)
      exportResultsToCSV(results, filename);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Verified</p>
          <p className="text-2xl font-bold">{summary.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Credits Used</p>
          <p className="text-2xl font-bold">{creditsConsumed}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 col-span-2 md:col-span-1">
          <p className="text-sm text-muted-foreground">Valid Rate</p>
          <p className="text-2xl font-bold text-score-high dark:text-green-400">
            {summary.validPercent}%
          </p>
        </div>
      </div>

      {/* Multi-column CSV indicator */}
      {originalData && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <p className="font-medium">Original columns preserved</p>
          <p className="text-xs mt-1">
            Your exported CSV will include all original columns plus verification results.
          </p>
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
                    {result.details.syntax && '✓ Syntax '}
                    {result.details.domain && '✓ Domain '}
                    {result.details.mx && '✓ MX '}
                    {result.details.smtp && '✓ SMTP'}
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

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleExport} variant="outline">
          Export CSV
        </Button>
        <Button onClick={onStartNew} variant="default">
          Verify Another CSV
        </Button>
      </div>
    </div>
  );
}
