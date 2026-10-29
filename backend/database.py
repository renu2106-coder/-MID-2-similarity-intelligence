import sqlite3
import json
import os
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "similarity.db")

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        upload_date TEXT NOT NULL,
        chunk_count INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        error_message TEXT,
        raw_content TEXT
    )
    """)

    # Chunks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        page_number INTEGER,
        paragraph_number INTEGER,
        line_start INTEGER,
        line_end INTEGER,
        char_start INTEGER,
        char_end INTEGER,
        bbox TEXT,
        embedding BLOB NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
    )
    """)

    # Analysis History table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        created_at TEXT NOT NULL,
        match_count INTEGER NOT NULL,
        documents_searched INTEGER NOT NULL,
        top_match_filename TEXT,
        top_score REAL,
        threshold REAL NOT NULL,
        execution_time_ms REAL NOT NULL,
        results_json TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

# Document Operations
def insert_document(doc_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO documents 
        (id, filename, file_type, file_size, file_path, upload_date, chunk_count, status, error_message, raw_content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_data["id"],
        doc_data["filename"],
        doc_data["file_type"],
        doc_data["file_size"],
        doc_data["file_path"],
        doc_data["upload_date"],
        doc_data.get("chunk_count", 0),
        doc_data["status"],
        doc_data.get("error_message"),
        doc_data.get("raw_content")
    ))
    conn.commit()
    conn.close()

def update_document_status(doc_id: str, status: str, chunk_count: int = 0, error_message: Optional[str] = None, raw_content: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    if raw_content is not None:
        cursor.execute("""
            UPDATE documents 
            SET status = ?, chunk_count = ?, error_message = ?, raw_content = ?
            WHERE id = ?
        """, (status, chunk_count, error_message, raw_content, doc_id))
    else:
        cursor.execute("""
            UPDATE documents 
            SET status = ?, chunk_count = ?, error_message = ?
            WHERE id = ?
        """, (status, chunk_count, error_message, doc_id))
    conn.commit()
    conn.close()

def get_documents() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, file_type, file_size, upload_date, chunk_count, status, error_message FROM documents ORDER BY upload_date DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def delete_document(doc_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
    
    file_path = row["file_path"]
    cursor.execute("DELETE FROM chunks WHERE document_id = ?", (doc_id,))
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

    # Safely remove file on disk if it exists
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass
    return True

# Chunk Operations
def insert_chunks(chunks_data: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    for chunk in chunks_data:
        embedding_blob = chunk["embedding"].astype(np.float32).tobytes()
        bbox_json = json.dumps(chunk["bbox"]) if chunk.get("bbox") is not None else None
        cursor.execute("""
            INSERT INTO chunks 
            (id, document_id, chunk_index, chunk_text, page_number, paragraph_number, line_start, line_end, char_start, char_end, bbox, embedding)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            chunk["id"],
            chunk["document_id"],
            chunk["chunk_index"],
            chunk["chunk_text"],
            chunk.get("page_number"),
            chunk.get("paragraph_number"),
            chunk.get("line_start"),
            chunk.get("line_end"),
            chunk.get("char_start"),
            chunk.get("char_end"),
            bbox_json,
            embedding_blob
        ))
    conn.commit()
    conn.close()

def delete_chunks_for_document(doc_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chunks WHERE document_id = ?", (doc_id,))
    conn.commit()
    conn.close()

def get_all_indexed_chunks(document_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    
    if document_ids and len(document_ids) > 0:
        placeholders = ",".join("?" for _ in document_ids)
        query = f"""
            SELECT c.*, d.filename, d.file_type 
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.status = 'indexed' AND c.document_id IN ({placeholders})
        """
        cursor.execute(query, document_ids)
    else:
        query = """
            SELECT c.*, d.filename, d.file_type 
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.status = 'indexed'
        """
        cursor.execute(query)
    
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        item = dict(r)
        item["embedding"] = np.frombuffer(item["embedding"], dtype=np.float32)
        if item.get("bbox"):
            try:
                item["bbox"] = json.loads(item["bbox"])
            except Exception:
                item["bbox"] = None
        results.append(item)
    return results

# Analysis Operations
def save_analysis(analysis_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO analyses 
        (id, query, created_at, match_count, documents_searched, top_match_filename, top_score, threshold, execution_time_ms, results_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        analysis_data["id"],
        analysis_data["query"],
        analysis_data["created_at"],
        analysis_data["match_count"],
        analysis_data["documents_searched"],
        analysis_data.get("top_match_filename"),
        analysis_data.get("top_score"),
        analysis_data["threshold"],
        analysis_data["execution_time_ms"],
        json.dumps(analysis_data["results"])
    ))
    conn.commit()
    conn.close()

def get_analyses(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, query, created_at, match_count, documents_searched, top_match_filename, top_score, threshold, execution_time_ms
        FROM analyses 
        ORDER BY created_at DESC 
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_analysis_by_id(analysis_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    res = dict(row)
    res["results"] = json.loads(res["results_json"])
    return res

def delete_analysis(analysis_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# Dashboard Summary
def get_dashboard_summary() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM documents WHERE status = 'indexed'")
    total_indexed_documents = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM analyses")
    total_completed_analyses = cursor.fetchone()["count"]

    cursor.execute("SELECT * FROM analyses ORDER BY created_at DESC LIMIT 1")
    latest_analysis_row = cursor.fetchone()
    latest_analysis = dict(latest_analysis_row) if latest_analysis_row else None
    if latest_analysis and "results_json" in latest_analysis:
        del latest_analysis["results_json"]

    cursor.execute("SELECT id, filename, file_type, file_size, upload_date, chunk_count, status FROM documents ORDER BY upload_date DESC LIMIT 5")
    recent_documents = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT id, query, created_at, match_count, top_match_filename, top_score FROM analyses ORDER BY created_at DESC LIMIT 5")
    recent_analyses = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "total_indexed_documents": total_indexed_documents,
        "total_completed_analyses": total_completed_analyses,
        "latest_analysis": latest_analysis,
        "recent_documents": recent_documents,
        "recent_analyses": recent_analyses
    }

