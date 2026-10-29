import React, { useState, useEffect, useRef } from 'react';
import { ChunkResult, DocumentContent } from '../types';
import { api } from '../services/api';
import { Modal } from './Modal';
import { ScoreBadge } from './ScoreBadge';
import { 
  FileText, 
  MapPin, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

interface SourceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunk: ChunkResult | null;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({
  isOpen,
  onClose,
  chunk,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [docContent, setDocContent] = useState<DocumentContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const highlightLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !chunk) {
      setDocContent(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api.getDocumentContent(chunk.document_id)
      .then((data) => {
        if (isMounted) {
          setDocContent(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load document source content.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, chunk]);

  // Auto-scroll to highlighted lines once rendered
  useEffect(() => {
    if (!loading && highlightLineRef.current) {
      setTimeout(() => {
        highlightLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [loading, docContent]);

  const handleCopyChunk = () => {
    if (chunk?.chunk_text) {
      navigator.clipboard.writeText(chunk.chunk_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!chunk) return null;

  const lines = docContent?.content ? docContent.content.split('\n') : [];
  const lineStart = chunk.line_start ?? -1;
  const lineEnd = chunk.line_end ?? -1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exact Source Passage Locator"
      maxWidth="880px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} color="var(--color-primary-blue)" />
            {chunk.file_type === 'pdf' ? (
              <span>PDF coordinates and extracted text regions are tracked per page.</span>
            ) : chunk.file_type === 'docx' ? (
              <span>Word paragraphs and order are preserved from the source document.</span>
            ) : (
              <span>Exact 1-indexed lines and character boundaries are preserved directly.</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {chunk.file_type === 'pdf' && (
              <a
                href={`/api/documents/${chunk.document_id}/file`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={14} /> Open Original PDF
              </a>
            )}
            <button onClick={handleCopyChunk} className="btn btn-secondary btn-sm">
              {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Passage'}
            </button>
            <button onClick={onClose} className="btn btn-primary btn-sm">
              Done
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Source Metadata Header */}
        <div
          style={{
            backgroundColor: 'var(--color-light-blue)',
            border: '1px solid var(--color-borders)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <FileText size={18} color="var(--color-primary-blue)" />
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-primary-navy)' }}>
                {chunk.filename}
              </span>
              <span className="badge badge-gray" style={{ textTransform: 'uppercase' }}>
                {chunk.file_type}
              </span>
              <span className="badge badge-blue">
                Rank #{chunk.rank}
              </span>
            </div>
            
            {/* Location Indicators */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--color-text-primary)' }}>
              <div>
                <strong>Page:</strong>{' '}
                {chunk.page_number !== null ? `Page ${chunk.page_number}` : 'N/A (Document has no fixed pages)'}
              </div>
              <div>
                <strong>Paragraph:</strong>{' '}
                {chunk.paragraph_number !== null ? `¶ ${chunk.paragraph_number}` : 'Location unavailable'}
              </div>
              <div>
                <strong>Extracted Lines:</strong>{' '}
                {chunk.line_start !== null && chunk.line_end !== null
                  ? `Lines ${chunk.line_start}–${chunk.line_end}`
                  : 'Location unavailable'}
              </div>
              {chunk.bbox && (
                <div>
                  <strong>BBox Coordinates:</strong>{' '}
                  <code style={{ fontSize: '11px', background: '#E2E8F0', padding: '2px 5px', borderRadius: '4px' }}>
                    [{chunk.bbox.join(', ')}]
                  </code>
                </div>
              )}
            </div>
          </div>

          <div>
            <ScoreBadge score={chunk.similarity_score} />
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={28} color="var(--color-primary-blue)" />
            <p className="supporting-text" style={{ marginTop: '8px' }}>
              Retrieving document text and locating source passage...
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-error-bg)',
              border: '1px solid var(--color-error-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertCircle size={20} color="var(--color-error)" />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--color-error)' }}>Could not load full source</p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Source Text View with Line Numbers & Highlighting */}
        {!loading && docContent && (
          <div
            style={{
              border: '1px solid var(--color-borders)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FFFFFF',
              maxHeight: '440px',
              overflowY: 'auto',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
          >
            {lines.length > 0 ? (
              lines.map((lineText, idx) => {
                const currentLineNum = idx + 1;
                const isHighlighted =
                  lineStart > 0 &&
                  lineEnd > 0 &&
                  currentLineNum >= lineStart &&
                  currentLineNum <= lineEnd;

                const isFirstHighlight = isHighlighted && currentLineNum === lineStart;

                return (
                  <div
                    key={idx}
                    ref={isFirstHighlight ? highlightLineRef : undefined}
                    style={{
                      display: 'flex',
                      backgroundColor: isHighlighted ? '#FEF9C3' : idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE',
                      borderLeft: isHighlighted ? '4px solid #EAB308' : '4px solid transparent',
                      transition: 'background-color 150ms ease',
                    }}
                  >
                    {/* Line number gutter */}
                    <div
                      style={{
                        width: '54px',
                        padding: '2px 10px 2px 6px',
                        textAlign: 'right',
                        color: isHighlighted ? '#854D0E' : '#94A3B8',
                        fontWeight: isHighlighted ? 700 : 400,
                        backgroundColor: isHighlighted ? '#FEF08A' : '#F1F5F9',
                        borderRight: '1px solid var(--color-borders)',
                        userSelect: 'none',
                        flexShrink: 0,
                      }}
                    >
                      {currentLineNum}
                    </div>

                    {/* Line Text */}
                    <div
                      style={{
                        padding: '2px 12px',
                        flex: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: isHighlighted ? '#713F12' : 'var(--color-text-primary)',
                      }}
                    >
                      {isFirstHighlight && (
                        <div
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#EAB308',
                            color: '#FFFFFF',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            marginRight: '8px',
                            fontFamily: 'sans-serif',
                            textTransform: 'uppercase',
                          }}
                        >
                          Matching Passage
                        </div>
                      )}
                      {lineText || ' '}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                {chunk.chunk_text}
              </div>
            )}
          </div>
        )}

        {/* Fallback Display if docContent couldn't be loaded */}
        {!loading && !docContent && !error && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#FAFCFE',
              border: '1px solid var(--color-borders)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Extracted Passage Text:
            </div>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.6 }}>
              {chunk.chunk_text}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

