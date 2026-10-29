import React from 'react';
import { 
  Info, 
  Layers, 
  Cpu, 
  FileText, 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Code
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px' }}>
      {/* Page Title */}
      <div>
        <h2 className="page-title" style={{ fontSize: '26px' }}>About Similarity Intelligence</h2>
        <p className="supporting-text" style={{ fontSize: '15px', marginTop: '4px' }}>
          Architectural documentation, technical specifications, and mathematical foundations of the RAG retrieval pipeline.
        </p>
      </div>

      {/* Disclaimers & Core Truths */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          backgroundColor: '#FFFBEB',
          borderColor: '#FDE68A',
          borderLeft: '4px solid var(--color-warning)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <AlertTriangle size={18} color="var(--color-warning)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#92400E' }}>
            Academic Assignment Notice & Evaluation Standard
          </h3>
        </div>
        <p style={{ fontSize: '14px', color: '#78350F', lineHeight: 1.6 }}>
          Semantic cosine similarity is an <strong>information retrieval metric</strong> that quantifies the geometric orientation of text embeddings in vector space. 
          A high similarity score demonstrates contextual and conceptual proximity; it does <strong>not</strong> constitute proof of factual correctness, ground truth validation, or automated plagiarism detection. 
          Retrieval relevance must always be evaluated in conjunction with human domain expertise.
        </p>
      </div>

      {/* Concept Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px' }}>
        {/* 1. What is RAG? */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'var(--color-light-blue)', padding: '8px', borderRadius: '8px' }}>
              <Layers size={20} color="var(--color-primary-blue)" />
            </div>
            <h3 className="section-title" style={{ fontSize: '17px' }}>
              Retrieval-Augmented Generation (RAG)
            </h3>
          </div>
          <p className="body-text" style={{ color: 'var(--color-text-secondary)' }}>
            Retrieval-Augmented Generation anchors language processing in verifiable external knowledge corpora. 
            Rather than relying solely on pre-trained parametric weights—which can suffer from hallucination and outdated knowledge—RAG dynamically indexes source documents, retrieves semantically relevant passages, and presents exact evidence for downstream tasks.
          </p>
        </div>

        {/* 2. Semantic Similarity vs Keyword Matching */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'var(--color-success-bg)', padding: '8px', borderRadius: '8px' }}>
              <Cpu size={20} color="var(--color-success)" />
            </div>
            <h3 className="section-title" style={{ fontSize: '17px' }}>
              Semantic Proximity vs Lexical Matching
            </h3>
          </div>
          <p className="body-text" style={{ color: 'var(--color-text-secondary)' }}>
            Traditional keyword search algorithms (e.g. BM25, TF-IDF) count shared word frequencies. In contrast, dense vector embeddings map words, phrases, and concepts into continuous high-dimensional geometric spaces where synonyms, paraphrases, and thematic relationships naturally cluster together.
          </p>
        </div>

        {/* 3. Document Chunking Strategy */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#F3E8FF', padding: '8px', borderRadius: '8px' }}>
              <FileText size={20} color="#7E22CE" />
            </div>
            <h3 className="section-title" style={{ fontSize: '17px' }}>
              Chunking & Boundary Preservation
            </h3>
          </div>
          <p className="body-text" style={{ color: 'var(--color-text-secondary)' }}>
            Documents are segmented into cohesive chunks of approximately <strong>500 tokens (~400 words)</strong> with a sliding overlap window of <strong>~75 tokens</strong>. 
            Unlike naive character-slicers, our pipeline preserves paragraph boundaries and sentence integrity to prevent context fragmentation.
          </p>
        </div>

        {/* 4. Exact Source Locator */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#FEF3C7', padding: '8px', borderRadius: '8px' }}>
              <MapPin size={20} color="var(--color-warning)" />
            </div>
            <h3 className="section-title" style={{ fontSize: '17px' }}>
              Exact Source Attribution
            </h3>
          </div>
          <p className="body-text" style={{ color: 'var(--color-text-secondary)' }}>
            Every chunk retains its strict pedigree: document identifier, original filename, PDF page number, paragraph sequence, character offsets, and 1-indexed extracted line ranges. 
            The system adheres strictly to the integrity rule: <em>never invent or fabricate an untracked line or page number</em>.
          </p>
        </div>
      </div>

      {/* Vector Mathematics & Embedding Details */}
      <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="section-title" style={{ fontSize: '18px' }}>
          Embedding Model & Cosine Similarity Mathematics
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-borders)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-primary-navy)', marginBottom: '6px' }}>
              Embedding Architecture
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Model: <code>sentence-transformers/all-MiniLM-L6-v2</code><br />
              Output Dimension: <strong>384 dimensions</strong><br />
              Execution: Local CPU inference with torch and numpy<br />
              API Cost: <strong>$0.00 (Self-contained, 100% offline ready)</strong>
            </p>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-borders)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-primary-navy)', marginBottom: '6px' }}>
              Cosine Similarity Formula
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Given normalized query vector <strong>u</strong> and document vector <strong>v</strong>:
              <br />
              <code style={{ display: 'block', margin: '6px 0', padding: '6px 10px', background: '#FFFFFF', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                cos(&theta;) = (u &bull; v) / (||u|| &times; ||v||) = &sum; (u_i &times; v_i)
              </code>
              Score Range: [-1.0, 1.0], where 1.0 is identical orientation.
            </p>
          </div>
        </div>
      </div>

      {/* Format Capabilities & Limitations */}
      <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="section-title" style={{ fontSize: '18px' }}>
          Supported File Formats & Known Limitations
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px', border: '1px solid var(--color-borders)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-primary-navy)', marginBottom: '4px' }}>
              TXT Plain Text
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Preserves 100% exact 1-indexed source line numbers and paragraph blank-line boundaries.
            </p>
          </div>

          <div style={{ padding: '14px', border: '1px solid var(--color-borders)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-primary-navy)', marginBottom: '4px' }}>
              PDF Documents
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Parsed via PyMuPDF (fitz) page-by-page. Extracts page numbers, block coordinates, and text streams.
            </p>
          </div>

          <div style={{ padding: '14px', border: '1px solid var(--color-borders)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-primary-navy)', marginBottom: '4px' }}>
              DOCX Word Documents
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Parsed via python-docx. Preserves sequential paragraph numbering and extracted lines.
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-borders)', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          <strong>Known System Limitations:</strong>
          <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
            <li>Image-only/scanned PDFs without embedded text layers require OCR and will report no extractable chunks.</li>
            <li>Word (.docx) files have dynamic flow layout dependent on printer drivers; paragraph indices are exact, but printed physical page numbers are not applicable.</li>
            <li>Extremely short documents under 100 characters may yield limited vector signal.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

