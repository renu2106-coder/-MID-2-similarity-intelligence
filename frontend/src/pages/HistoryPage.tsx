import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { AnalysisHistoryItem, AnalysisDetail, ChunkResult } from '../types';
import { Modal } from '../components/Modal';
import { ResultCard } from '../components/ResultCard';
import { SourceViewerModal } from '../components/SourceViewerModal';
import { ScoreBadge } from '../components/ScoreBadge';
import { 
  History, 
  Search, 
  Clock, 
  Trash2, 
  Eye, 
  Loader2, 
  AlertCircle, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Analysis Detail
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [activeViewerChunk, setActiveViewerChunk] = useState<ChunkResult | null>(null);

  // Deletion modal state
  const [itemToDelete, setItemToDelete] = useState<AnalysisHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const items = await api.getHistory(50);
      setHistoryItems(items);
    } catch (err: any) {
      console.error('Failed to load analysis history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle auto-opening via URL query parameter `?selected=<id>`
  useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (selectedId) {
      handleOpenAnalysis(selectedId);
    }
  }, [searchParams]);

  const handleOpenAnalysis = async (id: string) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getHistoryEntry(id);
      setSelectedAnalysis(detail);
    } catch (err: any) {
      alert(`Could not load historical analysis: ${err.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteHistoryEntry(itemToDelete.id);
      setItemToDelete(null);
      if (selectedAnalysis?.id === itemToDelete.id) {
        setSelectedAnalysis(null);
      }
      await fetchHistory();
    } catch (err: any) {
      alert(`Failed to delete record: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportJSON = () => {
    if (!selectedAnalysis) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedAnalysis, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `history_analysis_${selectedAnalysis.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredHistory = historyItems.filter((item) =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.top_match_filename && item.top_match_filename.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Title */}
      <div>
        <h2 className="page-title" style={{ fontSize: '24px' }}>Analysis History</h2>
        <p className="supporting-text">
          Audit trail of past semantic queries, matched passages, threshold parameters, and attribution logs.
        </p>
      </div>

      {/* Search Input Filter */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Search size={16} color="var(--color-text-secondary)" />
        <input
          type="text"
          className="text-input"
          placeholder="Filter history by query or matched filename..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px', fontSize: '13.5px' }}
        />
      </div>

      {/* History Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 className="animate-spin" size={32} color="var(--color-primary-blue)" />
          <p className="supporting-text" style={{ marginTop: '10px' }}>Loading past analysis records...</p>
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--color-borders)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Query</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Matches</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Corpora Searched</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Top Matched Document</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Top Similarity</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Date & Time</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--color-borders)',
                        transition: 'background-color 150ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    >
                      <td style={{ padding: '14px 20px', maxWidth: '300px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--color-primary-navy)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.query}
                        >
                          "{item.query}"
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          Threshold &ge; {item.threshold.toFixed(2)} &bull; {item.execution_time_ms} ms
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge-blue">
                          {item.match_count} matches
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)' }}>
                        {item.documents_searched} doc(s)
                      </td>

                      <td style={{ padding: '14px 16px', maxWidth: '200px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            color: 'var(--color-text-primary)',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={item.top_match_filename || 'None'}
                        >
                          {item.top_match_filename || '—'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {item.top_score !== null ? (
                          <ScoreBadge score={item.top_score} showMeter={false} />
                        ) : (
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenAnalysis(item.id)}
                            className="btn btn-secondary btn-sm"
                            title="Re-open analysis and inspect matched passages"
                          >
                            <Eye size={14} /> View Results
                          </button>

                          <button
                            onClick={() => setItemToDelete(item)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-error)' }}
                            title="Delete history record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: '48px',
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
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-light-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-blue)',
            }}
          >
            <History size={28} />
          </div>

          <div style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-primary-navy)' }}>
              No Analysis History Found
            </h3>
            <p className="supporting-text" style={{ marginTop: '6px' }}>
              Whenever you execute a similarity query from the New Analysis page, the results, thresholds, and provenance data are preserved here.
            </p>
          </div>
        </div>
      )}

      {/* Historical Analysis Detail Modal */}
      <Modal
        isOpen={selectedAnalysis !== null}
        onClose={() => setSelectedAnalysis(null)}
        title="Archived Analysis Results"
        maxWidth="920px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Executed: {selectedAnalysis ? new Date(selectedAnalysis.created_at).toLocaleString() : ''}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleExportJSON} className="btn btn-secondary btn-sm">
                <Download size={14} /> Export JSON
              </button>
              <button onClick={() => setSelectedAnalysis(null)} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        }
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={28} color="var(--color-primary-blue)" />
            <p className="supporting-text" style={{ marginTop: '8px' }}>Loading analysis results...</p>
          </div>
        ) : selectedAnalysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Query Summary Card */}
            <div
              style={{
                backgroundColor: 'var(--color-light-blue)',
                border: '1px solid var(--color-borders)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Historical Query
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-primary-navy)' }}>
                "{selectedAnalysis.query}"
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '10px', fontSize: '13px' }}>
                <div>
                  <strong>Matches:</strong> <span className="badge badge-blue">{selectedAnalysis.match_count}</span>
                </div>
                <div>
                  <strong>Threshold:</strong> &ge; {selectedAnalysis.threshold.toFixed(2)}
                </div>
                <div>
                  <strong>Latency:</strong> {selectedAnalysis.execution_time_ms} ms
                </div>
                <div>
                  <strong>Documents:</strong> {selectedAnalysis.documents_searched}
                </div>
              </div>
            </div>

            {/* Reconstructed Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {selectedAnalysis.results && selectedAnalysis.results.length > 0 ? (
                selectedAnalysis.results.map((res) => (
                  <ResultCard
                    key={res.id}
                    result={res}
                    query={selectedAnalysis.query}
                    onViewSource={(chunk) => setActiveViewerChunk(chunk)}
                  />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                  No matches met the threshold during this analysis run.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Record Confirmation */}
      <Modal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        title="Delete Analysis Record"
        footer={
          <>
            <button onClick={() => setItemToDelete(null)} className="btn btn-secondary btn-sm" disabled={isDeleting}>
              Cancel
            </button>
            <button onClick={handleDeleteHistory} className="btn btn-danger btn-sm" disabled={isDeleting}>
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {isDeleting ? 'Deleting...' : 'Delete Record'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
          Are you sure you want to remove the analysis record for query:
          <br />
          <strong>"{itemToDelete?.query}"</strong>?
        </p>
      </Modal>

      {/* Source Viewer Modal */}
      <SourceViewerModal
        isOpen={activeViewerChunk !== null}
        onClose={() => setActiveViewerChunk(null)}
        chunk={activeViewerChunk}
      />
    </div>
  );
};

