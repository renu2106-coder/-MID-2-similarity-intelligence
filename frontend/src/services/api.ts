import { 
  Document, 
  SearchResult, 
  AnalysisHistoryItem, 
  AnalysisDetail, 
  DashboardStats,
  DocumentContent 
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL as string).replace(/\/+$/, '') : '') + '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'An unexpected server error occurred.';
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' 
          ? errorJson.detail 
          : JSON.stringify(errorJson.detail);
      }
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health & Dashboard
  async checkHealth(): Promise<{ status: string; service: string; timestamp: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async getDashboard(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard`);
    return handleResponse(res);
  },

  // Document Management
  async getDocuments(): Promise<Document[]> {
    const res = await fetch(`${API_BASE}/documents`);
    return handleResponse(res);
  },

  async getDocument(id: string): Promise<Document> {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    return handleResponse(res);
  },

  async getDocumentContent(id: string): Promise<DocumentContent> {
    const res = await fetch(`${API_BASE}/documents/${id}/content`);
    return handleResponse(res);
  },

  async uploadDocuments(files: File[]): Promise<{ uploaded: Array<any> }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async deleteDocument(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async reindexDocument(id: string): Promise<{ message: string; chunk_count: number }> {
    const res = await fetch(`${API_BASE}/documents/${id}/reindex`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Sample Documents Seeding
  async loadSampleData(): Promise<{ message: string; documents: Document[] }> {
    const res = await fetch(`${API_BASE}/sample-data`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Similarity Search
  async search(
    query: string, 
    threshold: number = 0.35, 
    top_k: number = 5,
    document_ids?: string[]
  ): Promise<SearchResult> {
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        threshold,
        top_k,
        document_ids: document_ids && document_ids.length > 0 ? document_ids : undefined,
      }),
    });
    return handleResponse(res);
  },

  // Analysis History
  async getHistory(limit: number = 50): Promise<AnalysisHistoryItem[]> {
    const res = await fetch(`${API_BASE}/history?limit=${limit}`);
    return handleResponse(res);
  },

  async getHistoryEntry(id: string): Promise<AnalysisDetail> {
    const res = await fetch(`${API_BASE}/history/${id}`);
    return handleResponse(res);
  },

  async deleteHistoryEntry(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
};

