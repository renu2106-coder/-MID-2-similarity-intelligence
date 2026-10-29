import React from 'react';

interface ScoreBadgeProps {
  score: number;
  showMeter?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, showMeter = true }) => {
  // Score is typically between -1.0 and 1.0; cosine similarity for text is usually 0.0 - 1.0
  const percentage = Math.max(0, Math.min(100, Math.round(score * 100)));

  let colorClass = 'var(--color-text-secondary)';
  let bgClass = '#F1F5F9';
  let level = 'Low Relevance';

  if (score >= 0.70) {
    colorClass = 'var(--color-success)';
    bgClass = 'var(--color-success-bg)';
    level = 'Strong Match';
  } else if (score >= 0.50) {
    colorClass = 'var(--color-primary-blue)';
    bgClass = 'var(--color-light-blue)';
    level = 'Moderate Match';
  } else if (score >= 0.35) {
    colorClass = 'var(--color-warning)';
    bgClass = 'var(--color-warning-bg)';
    level = 'Marginal Match';
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: '9999px',
            backgroundColor: bgClass,
            color: colorClass,
            fontSize: '13px',
            fontWeight: 700,
            border: `1px solid ${colorClass}22`,
            fontVariantNumeric: 'tabular-nums',
          }}
          title={`Cosine Similarity: ${score.toFixed(4)}`}
        >
          {score.toFixed(4)} ({percentage}%)
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {level}
        </span>
      </div>

      {showMeter && (
        <div
          style={{
            width: '100px',
            height: '4px',
            backgroundColor: '#E2E8F0',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: colorClass,
              transition: 'width 300ms ease',
            }}
          />
        </div>
      )}
    </div>
  );
};

