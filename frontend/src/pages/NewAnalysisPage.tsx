import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Document, ChunkResult, SearchResult } from '../types';
import { ResultCard } from '../components/ResultCard';
import { SourceViewerModal } from '../components/SourceViewerModal';
import { 
  Search, 
  UploadCloud, 
  Sliders, 
  RotateCcw, 
  FileText, 
  FileCode, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Download, 
  Sparkles,
  Info,
  Clock,
  Check
} from 'lucide-react';

const SAMPLE_QUERIES = [
  "How can AI identify people at risk of diabetes?",
  "How can hospitals improve patient follow-up after discharge?",
  "How can missing and duplicate records affect EHR quality?",
  "How does cosine similarity retrieve relevant document passages?",
  "How can bacterial genomes support antimicrobial resistance surveillance?",
  "How can renewable energy demand be forecast?",
  "Medieval Byzantine architecture and mosaic techniques (Unrelated Test)"
];

export const NewAnalysisPage: React.FC = () => {
  // Query state
  const [query, setQuery] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(0.35);
  const [topK, setTopK] = useState<number>(5);

  // Document state
  const [libraryDocuments, setLibraryDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search state
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Source Viewer Modal state
  const [activeViewerChunk, setActiveViewerChunk] = useState<ChunkResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load available documents from library
  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setLibraryDocuments(docs);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Upload handler
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    setUploadStatusMsg(null);

    try {
      const res = await api.uploadDocuments(fileArray);
      const successes = res.uploaded.filter((u) => u.status === 'indexed');
      const failures = res.uploaded.filter((u) => u.status === 'error');

      if (successes.length > 0 && failures.length === 0) {
        setUploadStatusMsg({
          type: 'success',
          text: `Successfully uploaded and indexed ${successes.length} document(s).`,
        });
      } else if (failures.length > 0) {
        const errorDetails = failures.map((f) => `${f.filename}: ${f.error}`).join(' | ');
        setUploadStatusMsg({
          type: 'error',
          text: `Processed with notices: ${errorDetails}`,
        });
      }

      await loadDocuments();
    } catch (err: any) {
      setUploadStatusMsg({
        type: 'error',
        text: err.message || 'File upload failed.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Search execution
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchError('Please enter a query to run semantic search.');
      return;
    }

    const indexedDocs = libraryDocuments.filter((d) => d.status === 'indexed');
    if (indexedDocs.length === 0) {
      setSearchError('There are no indexed documents in the library. Please upload or seed documents first.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await api.search(
        trimmedQuery,
        threshold,
        topK,
        selectedDocIds.length > 0 ? selectedDocIds : undefined
      );
      setSearchResult(res);

      // Scroll to results section smoothly
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setSearchError(err.message || 'An error occurred while executing semantic similarity search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setThreshold(0.35);
    setTopK(5);
    setSelectedDocIds([]);
    setSearchResult(null);
    setSearchError(null);
  };

  const handleExportJSON = () => {
    if (!searchResult) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(searchResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `similarity_results_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    if (!searchResult || !searchResult.results) return;
    const headers = ['Rank', 'Filename', 'FileType', 'SimilarityScore', 'PageNumber', 'ParagraphNumber', 'LineStart', 'LineEnd', 'MatchedPassage'];
    const rows = searchResult.results.map((r) => [
      r.rank,
      `"${r.filename.replace(/"/g, '""')}"`,
      r.file_type,
      r.similarity_score,
      r.page_number ?? 'N/A',
      r.paragraph_number ?? 'N/A',
      r.line_start ?? 'N/A',
      r.line_end ?? 'N/A',
      `"${r.chunk_text.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `similarity_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const indexedCount = libraryDocuments.filter((d) => d.status === 'indexed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Workspace Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="page-title" style={{ fontSize: '24px' }}>Semantic Analysis Workspace</h2>
          <p className="supporting-text">
            Search document passages by meaning and concept, review cosine similarity rankings, and verify source boundaries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleReset} className="btn btn-secondary btn-sm" title="Reset all inputs and search parameters">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Main Grid: Query & Documents on Left, Search Controls on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }} id="analysis-grid">
        {/* Left Column: Query Input & Document Upload/Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section A: Text Query Input */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label htmlFor="query-input" className="input-label" style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                Enter Your Query <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '12px', padding: '2px 8px', color: 'var(--color-text-secondary)' }}
                >
                  <X size={13} /> Clear Text
                </button>
              )}
            </div>

            <textarea
              id="query-input"
              className="text-area"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (searchError) setSearchError(null);
              }}
              placeholder="Describe what you are looking for or enter a question... (e.g. 'How can AI identify people at risk of diabetes?')"
              rows={4}
              style={{ fontSize: '15px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Natural language query will be encoded into a 384d normalized vector.
              </div>
              <div style={{ fontSize: '12px', color: query.length > 500 ? 'var(--color-warning)' : 'var(--color-text-secondary)', fontWeight: 500 }}>
                {query.length} characters
              </div>
            </div>

            {/* Quick Test Queries Dropdown / Pills */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-borders)', paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary-navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="var(--color-primary-blue)" />
                Sample Academic Queries (One-Click Test):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SAMPLE_QUERIES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(sample);
                      if (searchError) setSearchError(null);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: '11.5px',
                      padding: '4px 10px',
                      backgroundColor: query === sample ? 'var(--color-light-blue)' : '#FFFFFF',
                      borderColor: query === sample ? 'var(--color-primary-blue)' : 'var(--color-borders)',
                      color: query === sample ? 'var(--color-primary-blue)' : 'var(--color-text-primary)',
                      textAlign: 'left',
                    }}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section B: Document Upload & Scope Selector */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 className="section-title" style={{ fontSize: '16px' }}>Upload Documents</h3>
                <p className="caption-text">Supported formats: PDF, DOCX, TXT (Max 25 MB)</p>
              </div>

              <span className="badge badge-blue">
                {indexedCount} indexed in library
              </span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--color-primary-blue)' : '#CBD5E1'}`,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isDragging ? 'var(--color-light-blue)' : '#FAFCFE',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.pdf,.docx"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) handleUploadFiles(e.target.files);
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-light-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary-blue)',
                  }}
                >
                  {isUploading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <UploadCloud size={24} />
                  )}
                </div>

                <div>
                  <p style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--color-primary-navy)' }}>
                    {isUploading ? 'Extracting text and generating vector chunks...' : 'Drag and drop files here, or browse'}
                  </p>
                  <p className="caption-text" style={{ marginTop: '4px' }}>
                    Automatic chunking (~500 tokens), paragraph boundary tracking, and local MiniLM embeddings
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isUploading}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '4px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse Files
                </button>
              </div>
            </div>

            {/* Upload Feedback Notice */}
            {uploadStatusMsg && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: uploadStatusMsg.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                  border: `1px solid ${uploadStatusMsg.type === 'success' ? 'var(--color-success-border)' : 'var(--color-error-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                }}
              >
                {uploadStatusMsg.type === 'success' ? (
                  <CheckCircle2 size={16} color="var(--color-success)" />
                ) : (
                  <AlertCircle size={16} color="var(--color-error)" />
                )}
                <span style={{ color: uploadStatusMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 500 }}>
                  {uploadStatusMsg.text}
                </span>
              </div>
            )}

            {/* Document Selection / Scope */}
            {libraryDocuments.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-navy)' }}>
                    Search Scope:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                      onClick={() => setSelectedDocIds([])}
                    >
                      Search All ({indexedCount})
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: '11px' }}
                      onClick={() => setSelectedDocIds(libraryDocuments.filter(d => d.status === 'indexed').map(d => d.id))}
                    >
                      Select All
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: '170px',
                    overflowY: 'auto',
                    border: '1px solid var(--color-borders)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  {libraryDocuments.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    const isIndexed = doc.status === 'indexed';

                    return (
                      <label
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderBottom: '1px solid #F1F5F9',
                          cursor: isIndexed ? 'pointer' : 'not-allowed',
                          backgroundColor: isSelected ? 'var(--color-light-blue)' : '#FFFFFF',
                          opacity: isIndexed ? 1 : 0.6,
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={!isIndexed}
                          checked={selectedDocIds.length === 0 || isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedDocIds.length === 0) {
                                // Transitioning from "All" to specific
                                setSelectedDocIds([doc.id]);
                              } else {
                                setSelectedDocIds([...selectedDocIds, doc.id]);
                              }
                            } else {
                              if (selectedDocIds.length === 0) {
                                // If was searching all, now unchecking this one means all except this one
                                const allIndexed = libraryDocuments.filter(d => d.status === 'indexed').map(d => d.id);
                                setSelectedDocIds(allIndexed.filter(id => id !== doc.id));
                              } else {
                                setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                              }
                            }
                          }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.filename}
                        </span>
                        <span className="caption-text">
                          {isIndexed ? `${doc.chunk_count} chunks` : doc.status}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Search Settings & Execute Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-borders)', paddingBottom: '12px' }}>
              <Sliders size={18} color="var(--color-primary-blue)" />
              <h3 className="section-title" style={{ fontSize: '16px' }}>Search Parameters</h3>
            </div>

            {/* Threshold Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="input-label" style={{ fontSize: '13.5px', margin: 0 }}>
                  Similarity Threshold
                </label>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--color-primary-blue)',
                    backgroundColor: 'var(--color-light-blue)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {threshold.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min="0.0"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                <span>0.0 (Permissive)</span>
                <span>Default: 0.35</span>
                <span>0.95 (Strict)</span>
              </div>
            </div>

            {/* Top-K Results */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="input-label" style={{ fontSize: '13.5px', margin: 0 }}>
                  Maximum Results
                </label>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--color-primary-navy)',
                    backgroundColor: '#F1F5F9',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Top {topK}
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                <span>1</span>
                <span>5 (Standard)</span>
                <span>20</span>
              </div>
            </div>

            {/* Metric Convention Note */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                border: '1px solid var(--color-borders)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.5',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--color-primary-navy)', marginBottom: '4px' }}>
                <Info size={14} color="var(--color-primary-blue)" />
                Cosine Metric Convention
              </div>
              Scores measure vector angle in high-dimensional semantic space. 1.0 represents identical orientation; it is an information retrieval relevance score, not a proof of factual correctness.
            </div>

            {/* Validation Notice / Error */}
            {searchError && (
              <div
                style={{
                  backgroundColor: 'var(--color-error-bg)',
                  border: '1px solid var(--color-error-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  fontSize: '13px',
                  color: 'var(--color-error)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{searchError}</span>
              </div>
            )}

            {/* Find Similarity Action Button */}
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                backgroundColor: 'var(--color-primary-blue)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              {isSearching ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Searching Vectors...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Find Similarity</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- SECTION 8: RESULTS DASHBOARD ----------------- */}
      <div ref={resultsRef}>
        {searchResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            {/* Results Summary Bar */}
            <div
              className="card"
              style={{
                padding: '20px 24px',
                backgroundColor: '#FFFFFF',
                borderLeft: '4px solid var(--color-primary-blue)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Query Submitted:
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-primary-navy)' }}>
                  "{searchResult.query}"
                </h3>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  <div>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Matches Found:</strong>{' '}
                    <span className="badge badge-blue">{searchResult.total_matches}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Corpora Searched:</strong>{' '}
                    {searchResult.documents_searched} documents
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Latency:</strong>{' '}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> {searchResult.execution_time_ms} ms
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Active Threshold:</strong>{' '}
                    &ge; {searchResult.threshold.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Export & New Search */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleExportCSV}
                  disabled={searchResult.total_matches === 0}
                  className="btn btn-secondary btn-sm"
                  title="Export results table to CSV"
                >
                  <Download size={14} /> Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={searchResult.total_matches === 0}
                  className="btn btn-secondary btn-sm"
                  title="Export complete result metadata as JSON"
                >
                  <Download size={14} /> Export JSON
                </button>
                <button
                  onClick={handleReset}
                  className="btn btn-secondary btn-sm"
                >
                  Start New Analysis
                </button>
              </div>
            </div>

            {/* Results List or Empty State */}
            {searchResult.total_matches > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {searchResult.results.map((res) => (
                  <ResultCard
                    key={res.id}
                    result={res}
                    query={searchResult.query}
                    onViewSource={(chunk) => setActiveViewerChunk(chunk)}
                  />
                ))}
              </div>
            ) : (
              /* Empty results when nothing meets threshold */
              <div
                className="card"
                style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                  }}
                >
                  <AlertCircle size={28} />
                </div>

                <div style={{ maxWidth: '520px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-primary-navy)' }}>
                    No sufficiently similar passages were found.
                  </h3>
                  <p className="supporting-text" style={{ marginTop: '6px' }}>
                    None of the passage embeddings met your active minimum similarity threshold of &ge;{' '}
                    <strong>{searchResult.threshold.toFixed(2)}</strong>.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    onClick={() => {
                      setThreshold(0.20);
                      setTimeout(() => handleSearch(), 50);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Lower Threshold to 0.20 & Retry
                  </button>
                  <button
                    onClick={() => {
                      const inputElem = document.getElementById('query-input');
                      inputElem?.focus();
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    Revise Query
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Source Viewer Modal */}
      <SourceViewerModal
        isOpen={activeViewerChunk !== null}
        onClose={() => setActiveViewerChunk(null)}
        chunk={activeViewerChunk}
      />
    </div>
  );
};

