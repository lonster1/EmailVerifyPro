'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseCSV, detectEmailColumn, extractEmails, validateCSVFile, ExtractedEmails } from '@/lib/csv';

interface CSVUploadProps {
  onUploadStart: (
    emails: string[],
    filename: string,
    originalData?: string[][],
    emailColumnIndex?: number
  ) => void;
  disabled?: boolean;
}

export function CSVUpload({ onUploadStart, disabled }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedEmails | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(async (selectedFile: File) => {
    setError('');
    setIsProcessing(true);

    try {
      // Validate file
      const validation = validateCSVFile(selectedFile);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setIsProcessing(false);
        return;
      }

      // Parse CSV
      const data = await parseCSV(selectedFile);

      if (data.length === 0) {
        setError('CSV file is empty. Please check your file.');
        setIsProcessing(false);
        return;
      }

      // Auto-detect email column
      const emailColumn = detectEmailColumn(data);

      if (emailColumn === null) {
        setError('No valid emails found. Please ensure your CSV has an email column with valid email addresses.');
        setIsProcessing(false);
        return;
      }

      // Extract emails with original data preserved
      const extracted = extractEmails(data, emailColumn, true);

      if (extracted.emails.length === 0) {
        setError('No valid emails found in the selected column.');
        setIsProcessing(false);
        return;
      }

      if (extracted.emails.length > 50000) {
        setError(`Too many emails (${extracted.emails.length} found). Maximum 50,000 per upload.`);
        setIsProcessing(false);
        return;
      }

      setFile(selectedFile);
      setExtractedData(extracted);
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
      setIsProcessing(false);
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, [processFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleStartVerification = useCallback(() => {
    if (file && extractedData && extractedData.emails.length > 0) {
      onUploadStart(
        extractedData.emails,
        file.name,
        extractedData.originalData,
        extractedData.emailColumnIndex
      );
    }
  }, [file, extractedData, onUploadStart]);

  const handleReset = useCallback(() => {
    setFile(null);
    setExtractedData(null);
    setError('');
  }, []);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!file && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <p className="text-sm text-muted-foreground mb-4">
            {isProcessing
              ? 'Processing CSV file...'
              : 'Drag and drop your CSV file here'}
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={disabled || isProcessing}
            className="hidden"
            id="csv-file-input"
          />
          <label htmlFor="csv-file-input">
            <Button
              disabled={disabled || isProcessing}
              type="button"
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              Choose File
            </Button>
          </label>
        </div>
      )}

      {file && extractedData && extractedData.emails.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-semibold mb-3">File Preview</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Filename</p>
                <p className="font-medium">{file.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">File Size</p>
                <p className="font-medium">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="font-medium">{extractedData.totalRows}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Emails</p>
                <p className="font-medium">{extractedData.emails.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duplicates Removed</p>
                <p className="font-medium">{extractedData.duplicatesRemoved}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits Required</p>
                <p className="font-medium">{extractedData.emails.length}</p>
              </div>
            </div>

            {extractedData.originalData && extractedData.originalData[0].length > 1 && (
              <div className="mb-4 p-3 bg-accent border border-accent-foreground/20 rounded text-sm text-accent-foreground">
                <p className="font-medium">Multi-column CSV detected</p>
                <p className="text-xs mt-1">
                  Original columns will be preserved in the export. Download your results before closing this page.
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-2">Preview (first 5 emails):</p>
              <ul className="space-y-1">
                {extractedData.emails.slice(0, 5).map((email, idx) => (
                  <li key={idx} className="text-sm font-mono">
                    {email}
                  </li>
                ))}
                {extractedData.emails.length > 5 && (
                  <li className="text-sm text-muted-foreground">
                    ...and {extractedData.emails.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleStartVerification}
              disabled={disabled}
              className="flex-1"
            >
              Start Verification ({extractedData.emails.length} emails)
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={disabled}
            >
              Choose Different File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
