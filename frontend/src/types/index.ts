export interface Document {
  id: string;
  filename: string;
  file_type: 'pdf' | 'docx' | 'txt' | string;
  file_size: number;
  upload_date: string;
  chunk_count: number;
  status: 'indexed' | 'processing' | 'error';
  error_message?: string | null;
  raw_content?: string | null;
}

export interface ChunkResult {
  id: string;
  document_id: string;
  filename: string;
  file_type: string;
  chunk_index: number;
  chunk_text: string;
  page_number: number | null;
  paragraph_number: number | null;
  line_start: number | null;
  line_end: number | null;
  char_start: number | null;
  char_end: number | null;
  bbox: [number, number, number, number] | null;
  similarity_score: number;
  rank: number;
}

export interface SearchResult {
  analysis_id?: string;
  query: string;
  total_matches: number;
  documents_searched: number;
  execution_time_ms: number;
  threshold: number;
  results: ChunkResult[];
  message?: string;
}

export interface AnalysisHistoryItem {
  id: string;
  query: string;
  created_at: string;
  match_count: number;
  documents_searched: number;
  top_match_filename: string | null;
  top_score: number | null;
  threshold: number;
  execution_time_ms: number;
}

export interface AnalysisDetail extends AnalysisHistoryItem {
  results: ChunkResult[];
}

export interface DashboardStats {
  total_indexed_documents: number;
  total_completed_analyses: number;
  latest_analysis: AnalysisHistoryItem | null;
  recent_documents: Document[];
  recent_analyses: AnalysisHistoryItem[];
}

export interface DocumentContent {
  id: string;
  filename: string;
  file_type: string;
  content: string;
}

