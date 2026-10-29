import React, { useState } from 'react';
import { ChunkResult } from '../types';
import { ScoreBadge } from './ScoreBadge';
import { 
  FileText, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Eye,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';

interface ResultCardProps {
  result: ChunkResult;
  query?: string;
  onViewSource: (chunk: ChunkResult) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  query,
  onViewSource,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(result.chunk_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText size={18} color="#DC2626" />;
      case 'docx':
      case 'doc':
        return <FileCode size={18} color="#2563EB" />;
      default:
        return <FileText size={18} color="#0F766E" />;
    }
  };

  // Simple query term highlighter
  const highlightTerms = (text: string, searchQuery?: string) => {
    if (!searchQuery || !searchQuery.trim()) return text;
    
    // Extract search words with 3+ characters to avoid highlighting small stop words
    const words = searchQuery
      .trim()
      .split(/\s+/)
      .map((w) => w.replace(/[^\w]/g, ''))
      .filter((w) => w.length > 2);

    if (words.length === 0) return text;

    try {
      const regex = new RegExp(`(${words.join('|')})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, i) => {
        const matches = words.some((w) => w.toLowerCase() === part.toLowerCase());
        return matches ? (
          <mark
            key={i}
            style={{
              backgroundColor: '#FEF08A',
              color: '#854D0E',
              fontWeight: 600,
              padding: '1px 3px',
              borderRadius: '2px',
            }}
          >
            {part}
          </mark>
        ) : (
          part
        );
      });
    } catch {
      return text;
    }
  };

  // Preview snippet length
  const SNIPPET_LIMIT = 280;
  const shouldTruncate = result.chunk_text.length > SNIPPET_LIMIT;
  const displayText = !isExpanded && shouldTruncate
    ? result.chunk_text.slice(0, SNIPPET_LIMIT) + '...'
    : result.chunk_text;

  return (
    <div
      className="card"
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'all 180ms ease',
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid var(--color-borders)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              backgroundColor: 'var(--color-primary-navy)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '12px',
              padding: '4px 9px',
              borderRadius: '6px',
            }}
          >
            #{result.rank}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {getFileIcon(result.file_type)}
            <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-primary-navy)' }}>
              {result.filename}
            </span>
          </div>

          <span className="badge badge-gray" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
            {result.file_type}
          </span>
        </div>

        {/* Similarity Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScoreBadge score={result.similarity_score} />
        </div>
      </div>

      {/* Source Location Metadata Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 14px',
          fontSize: '12.5px',
          color: 'var(--color-text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Page:</strong>{' '}
          {result.page_number !== null ? `Page ${result.page_number}` : 'N/A (Document flow)'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Paragraph:</strong>{' '}
          {result.paragraph_number !== null ? `¶ ${result.paragraph_number}` : 'Location unavailable'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Extracted Lines:</strong>{' '}
          {result.line_start !== null && result.line_end !== null
            ? `Lines ${result.line_start}–${result.line_end}`
            : 'Location unavailable'}
        </div>

        {result.bbox && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Coordinates:</strong>{' '}
            <code style={{ fontSize: '11px' }}>[{result.bbox.join(', ')}]</code>
          </div>
        )}
      </div>

      {/* Matched Text Passage */}
      <div
        style={{
          fontSize: '14.5px',
          lineHeight: '1.65',
          color: 'var(--color-text-primary)',
          whiteSpace: 'pre-wrap',
          backgroundColor: '#FCFDFF',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          borderLeft: '3px solid var(--color-primary-blue)',
        }}
      >
        {highlightTerms(displayText, query)}
      </div>

      {/* Actions Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          paddingTop: '6px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '12.5px' }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={14} /> Show Less
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> Expand Full Passage ({result.chunk_text.length} chars)
                </>
              )}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            title="Copy matched passage text"
          >
            {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>

          <button
            onClick={() => onViewSource(result)}
            className="btn btn-primary btn-sm"
            title="View exact source location in document"
          >
            <Eye size={14} /> View Source
          </button>
        </div>
      </div>
    </div>
  );
};

