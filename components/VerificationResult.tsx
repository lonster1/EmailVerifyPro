'use client';

interface VerificationResultProps {
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
  onVerifyAnother?: () => void;
}

export function VerificationResult({
  email,
  status,
  score,
  details,
  creditsConsumed,
  onVerifyAnother,
}: VerificationResultProps) {
  // Status badge styling
  const statusConfig = {
    valid: {
      label: 'Valid',
      className: 'badge-valid',
      icon: '✓',
    },
    invalid: {
      label: 'Invalid',
      className: 'badge-invalid',
      icon: '✗',
    },
    risky: {
      label: 'Risky',
      className: 'badge-risky',
      icon: '⚠',
    },
    unknown: {
      label: 'Unknown',
      className: 'badge-unknown',
      icon: '?',
    },
    catch_all: {
      label: 'Catch-All',
      className: 'badge-catchall',
      icon: '◎',
    },
  };

  const config = statusConfig[status];

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-score-high';
    if (score >= 50) return 'text-score-medium';
    return 'text-score-low';
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold ${config.className}`}
            >
              <span className="text-lg">{config.icon}</span>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground break-all">{email}</p>
        </div>
      </div>

      {/* Quality Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Quality Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              score >= 80 ? 'bg-score-high' : score >= 50 ? 'bg-score-medium' : 'bg-score-low'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-foreground">Verification Details</h4>

        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Syntax" value={details.syntax} />
          <DetailItem label="Domain" value={details.domain} />
          <DetailItem label="MX Records" value={details.mx} />
          <DetailItem label="SMTP" value={details.smtp} />
          <DetailItem label="Disposable" value={!details.disposable} />
          <DetailItem label="Role-based" value={!details.role} />
          <DetailItem label="Free Provider" value={!details.free_provider} />
          <DetailItem label="Catch-All" value={!details.accept_all} />
        </div>
      </div>

      {/* Credits Info */}
      <div className="flex items-center justify-between pt-4 border-t">
        <span className="text-sm text-muted-foreground">
          Credits Used: <span className="font-semibold text-foreground">{creditsConsumed}</span>
        </span>
        {onVerifyAnother && (
          <button
            onClick={onVerifyAnother}
            className="text-sm font-medium text-primary hover:underline"
          >
            Verify Another Email
          </button>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
        {value ? '✓' : '✗'}
      </span>
    </div>
  );
}
