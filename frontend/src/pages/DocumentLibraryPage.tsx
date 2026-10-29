import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Document, DocumentContent } from '../types';
import { Modal } from '../components/Modal';
import { 
  BookOpen, 
  Search, 
  Trash2, 
  RefreshCw, 
  FileText, 
  FileCode, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  Sparkles,
  Database,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DocumentLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Modals & Actions state
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  
  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  // Sample data seeding state
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    try {
      await api.deleteDocument(deleteDoc.id);
      setDeleteDoc(null);
      await fetchDocuments();
    } catch (err: any) {
      alert(`Failed to delete document: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReindex = async (doc: Document) => {
    setReindexingId(doc.id);
    try {
      await api.reindexDocument(doc.id);
      await fetchDocuments();
    } catch (err: any) {
      alert(`Reindexing failed: ${err.message}`);
    } finally {
      setReindexingId(null);
    }
  };

  const handleOpenPreview = async (doc: Document) => {
    setPreviewDoc(doc);
    setLoadingPreview(true);
    setPreviewContent(null);
    try {
      const res = await api.getDocumentContent(doc.id);
      setPreviewContent(res.content);
    } catch (err: any) {
      setPreviewContent(`Failed to load raw text: ${err.message}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSeedSamples = async () => {
    setIsSeeding(true);
    try {
      await api.loadSampleData();
      await fetchDocuments();
    } catch (err: any) {
      alert(`Failed to seed sample documents: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.file_type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Title & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="page-title" style={{ fontSize: '24px' }}>Document Library</h2>
          <p className="supporting-text">
            Corpus indexing repository. Manage documents, inspect chunks, and oversee vector generation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSeedSamples}
            disabled={isSeeding}
            className="btn btn-secondary btn-sm"
          >
            {isSeeding ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} color="var(--color-primary-blue)" />}
            {isSeeding ? 'Indexing Samples...' : 'Load 6 Sample Files'}
          </button>

          <button
            onClick={() => navigate('/new-analysis')}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} /> Upload Documents
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <Search size={16} color="var(--color-text-secondary)" />
          <input
            type="text"
            className="text-input"
            placeholder="Filter documents by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13.5px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Format:
          </span>
          <select
            className="select-input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13px', width: 'auto' }}
          >
            <option value="all">All Formats</option>
            <option value="txt">TXT Plain Text</option>
            <option value="pdf">PDF Documents</option>
            <option value="docx">DOCX Word Documents</option>
          </select>
        </div>
      </div>

      {/* Documents Table / Card List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 className="animate-spin" size={32} color="var(--color-primary-blue)" />
          <p className="supporting-text" style={{ marginTop: '10px' }}>Loading document catalog...</p>
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--color-borders)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Document Name</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Size</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Indexed Chunks</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Upload Date</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const isReindexing = reindexingId === doc.id;
                  const dateStr = new Date(doc.upload_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={doc.id}
                      style={{
                        borderBottom: '1px solid var(--color-borders)',
                        transition: 'background-color 150ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {getFileIcon(doc.file_type)}
                          <span style={{ fontWeight: 600, color: 'var(--color-primary-navy)' }}>
                            {doc.filename}
                          </span>
                        </div>
                        {doc.error_message && (
                          <div style={{ fontSize: '11.5px', color: 'var(--color-error)', marginTop: '2px' }}>
                            {doc.error_message}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge-gray" style={{ textTransform: 'uppercase' }}>
                          {doc.file_type}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)' }}>
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge-blue">
                          {doc.chunk_count} chunks
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {doc.status === 'indexed' ? (
                          <span className="badge badge-success">
                            <CheckCircle2 size={12} /> Indexed
                          </span>
                        ) : doc.status === 'processing' ? (
                          <span className="badge badge-warning">
                            <Loader2 size={12} className="animate-spin" /> Processing
                          </span>
                        ) : (
                          <span className="badge badge-error">
                            <AlertCircle size={12} /> Error
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontSize: '12.5px' }}>
                        {dateStr}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenPreview(doc)}
                            className="btn btn-ghost btn-sm"
                            title="Inspect extracted raw content"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => handleReindex(doc)}
                            disabled={isReindexing}
                            className="btn btn-ghost btn-sm"
                            title="Re-run chunking and generate fresh embeddings"
                          >
                            <RefreshCw size={15} className={isReindexing ? 'animate-spin' : ''} />
                          </button>

                          <button
                            onClick={() => setDeleteDoc(doc)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-error)' }}
                            title="Delete document and remove all vector chunks"
                          >
                            <Trash2 size={15} />
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
        /* Empty State */
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
            <BookOpen size={28} />
          </div>

          <div style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-primary-navy)' }}>
              No Documents in Library
            </h3>
            <p className="supporting-text" style={{ marginTop: '6px' }}>
              {searchTerm || typeFilter !== 'all'
                ? 'No documents matched your current search filters.'
                : 'Your corpus library is currently empty. Populate it using the 6 sample academic files or upload custom files.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSeedSamples}
              disabled={isSeeding}
              className="btn btn-primary"
            >
              {isSeeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isSeeding ? 'Indexing Samples...' : 'Load 6 Sample Files'}
            </button>
            <button
              onClick={() => navigate('/new-analysis')}
              className="btn btn-secondary"
            >
              <Plus size={16} /> Upload Custom Documents
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteDoc !== null}
        onClose={() => setDeleteDoc(null)}
        title="Confirm Document Deletion"
        footer={
          <>
            <button onClick={() => setDeleteDoc(null)} className="btn btn-secondary btn-sm" disabled={isDeleting}>
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} className="btn btn-danger btn-sm" disabled={isDeleting}>
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {isDeleting ? 'Deleting...' : 'Delete Document & Vectors'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
          Are you sure you want to delete <strong>{deleteDoc?.filename}</strong>?
        </p>
        <p className="supporting-text" style={{ marginTop: '8px' }}>
          This action will permanently remove this file and its <strong>{deleteDoc?.chunk_count}</strong> indexed vector chunks from the database. Future searches will no longer return matches from this document.
        </p>
      </Modal>

      {/* Document Content Preview Modal */}
      <Modal
        isOpen={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        title={`Extracted Content: ${previewDoc?.filename || ''}`}
        maxWidth="800px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {previewDoc?.chunk_count} vector chunks generated
            </div>
            <button onClick={() => setPreviewDoc(null)} className="btn btn-primary btn-sm">
              Close
            </button>
          </div>
        }
      >
        {loadingPreview ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={28} color="var(--color-primary-blue)" />
            <p className="supporting-text" style={{ marginTop: '8px' }}>Loading document text...</p>
          </div>
        ) : (
          <div
            style={{
              maxHeight: '450px',
              overflowY: 'auto',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--color-borders)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}
          >
            {previewContent || 'No extracted text available.'}
          </div>
        )}
      </Modal>
    </div>
  );
};

