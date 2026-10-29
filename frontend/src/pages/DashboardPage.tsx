import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { 
  Search, 
  Files, 
  History, 
  Clock, 
  ArrowRight, 
  UploadCloud, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Database
} from 'lucide-react';
import { ScoreBadge } from '../components/ScoreBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboard();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSeedSamples = async () => {
    try {
      setSeeding(true);
      await api.loadSampleData();
      await fetchDashboardData();
    } catch (err: any) {
      alert(`Error loading sample documents: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--color-primary-blue)" />
        <p className="supporting-text" style={{ marginTop: '12px' }}>Loading workspace metrics...</p>
      </div>
    );
  }

  const hasDocuments = stats && stats.total_indexed_documents > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          padding: '32px',
          background: 'linear-gradient(135deg, #142D4E 0%, #1E3A8A 100%)',
          color: '#FFFFFF',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Academic Assignment &bull; RAG Engine
            </span>
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
            Semantic Document Retrieval & Exact Source Attribution
          </h2>

          <p style={{ color: '#E2E8F0', fontSize: '15px', lineHeight: 1.6 }}>
            Similarity Intelligence indexes academic corpora using local 384-dimensional sentence-transformers
            embeddings. Query documents in natural language, evaluate cosine similarity scores, and pin-point
            exact source passages, page numbers, and line numbers without third-party API dependencies.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={() => navigate('/new-analysis')}
            className="btn btn-primary"
            style={{ backgroundColor: '#2563EB', borderColor: '#3B82F6', fontWeight: 600 }}
          >
            <Search size={16} /> Start New Analysis
          </button>

          {!hasDocuments && (
            <button
              onClick={handleSeedSamples}
              disabled={seeding}
              className="btn btn-secondary"
              style={{ fontWeight: 600 }}
            >
              {seeding ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
              {seeding ? 'Indexing 6 Samples...' : 'Load 6 Sample Documents'}
            </button>
          )}

          <button
            onClick={() => navigate('/library')}
            className="btn btn-secondary"
            style={{ fontWeight: 500 }}
          >
            <Files size={16} /> Open Document Library
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {/* Total Indexed Documents */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="supporting-text" style={{ fontWeight: 600 }}>Total Indexed Documents</span>
            <div style={{ backgroundColor: 'var(--color-light-blue)', padding: '8px', borderRadius: '8px' }}>
              <Files size={20} color="var(--color-primary-blue)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-primary-navy)' }}>
            {stats?.total_indexed_documents || 0}
          </div>
          <p className="caption-text" style={{ marginTop: '6px' }}>
            Corpora ready for real-time vector search
          </p>
        </div>

        {/* Total Analyses */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="supporting-text" style={{ fontWeight: 600 }}>Completed Analyses</span>
            <div style={{ backgroundColor: '#F0FDF4', padding: '8px', borderRadius: '8px' }}>
              <History size={20} color="var(--color-success)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-primary-navy)' }}>
            {stats?.total_completed_analyses || 0}
          </div>
          <p className="caption-text" style={{ marginTop: '6px' }}>
            Queries executed and saved in SQLite
          </p>
        </div>

        {/* Latest Analysis */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="supporting-text" style={{ fontWeight: 600 }}>Latest Query Executed</span>
            <div style={{ backgroundColor: '#FFFBEB', padding: '8px', borderRadius: '8px' }}>
              <Clock size={20} color="var(--color-warning)" />
            </div>
          </div>
          {stats?.latest_analysis ? (
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-primary-navy)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={stats.latest_analysis.query}
              >
                "{stats.latest_analysis.query}"
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span className="badge badge-blue">
                  {stats.latest_analysis.match_count} matches
                </span>
                {stats.latest_analysis.top_score !== null && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Top: {(stats.latest_analysis.top_score * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontStyle: 'italic', marginTop: '6px' }}>
              No analyses executed yet
            </div>
          )}
        </div>
      </div>

      {/* Empty State when no documents are uploaded */}
      {!hasDocuments && (
        <div
          className="card"
          style={{
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            borderStyle: 'dashed',
            borderColor: '#CBD5E1',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-light-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-blue)',
            }}
          >
            <UploadCloud size={30} />
          </div>

          <div style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
              No Documents Indexed Yet
            </h3>
            <p className="supporting-text">
              To search semantic similarities and test exact source locations, index documents into the library.
              You can instantly load the six pre-configured academic assignment text files or upload custom PDFs, DOCXs, and TXTs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={handleSeedSamples}
              disabled={seeding}
              className="btn btn-primary"
            >
              {seeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {seeding ? 'Generating Embeddings...' : 'Load 6 Sample Documents (One Click)'}
            </button>
            <button
              onClick={() => navigate('/new-analysis')}
              className="btn btn-secondary"
            >
              <UploadCloud size={16} /> Upload Custom Documents
            </button>
          </div>
        </div>
      )}

      {/* Dual Column: Recently Uploaded Documents & Recent History */}
      {hasDocuments && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Recently Uploaded Documents */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 className="section-title" style={{ fontSize: '17px' }}>Recently Indexed Documents</h3>
              <button
                onClick={() => navigate('/library')}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '13px' }}
              >
                View Library <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats?.recent_documents && stats.recent_documents.length > 0 ? (
                stats.recent_documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--color-borders)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <FileText size={18} color="var(--color-primary-blue)" style={{ flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {doc.filename}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {doc.chunk_count} vector chunks &bull; {(doc.file_size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>

                    <span className="badge badge-success" style={{ fontSize: '11px' }}>
                      <CheckCircle2 size={12} /> Indexed
                    </span>
                  </div>
                ))
              ) : (
                <p className="supporting-text" style={{ fontStyle: 'italic' }}>No documents uploaded yet.</p>
              )}
            </div>
          </div>

          {/* Recent Analysis History */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 className="section-title" style={{ fontSize: '17px' }}>Recent Analyses</h3>
              <button
                onClick={() => navigate('/history')}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '13px' }}
              >
                View All History <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats?.recent_analyses && stats.recent_analyses.length > 0 ? (
                stats.recent_analyses.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/history?selected=${item.id}`)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--color-borders)',
                      cursor: 'pointer',
                      transition: 'border-color 150ms ease, background-color 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#EFF6FF';
                      e.currentTarget.style.borderColor = '#BFDBFE';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#F8FAFC';
                      e.currentTarget.style.borderColor = 'var(--color-borders)';
                    }}
                  >
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-primary-navy)', marginBottom: '4px' }}>
                      "{item.query}"
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                      <span>
                        {item.match_count} matches {item.top_match_filename && `&bull; Top: ${item.top_match_filename}`}
                      </span>
                      {item.top_score !== null && (
                        <span style={{ fontWeight: 700, color: 'var(--color-primary-blue)' }}>
                          {(item.top_score * 100).toFixed(1)}% similarity
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="supporting-text" style={{ fontStyle: 'italic' }}>
                  No analyses run yet. Go to New Analysis to query indexed texts.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

