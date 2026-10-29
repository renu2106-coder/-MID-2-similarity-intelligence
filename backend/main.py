import os
import time
import uuid
import json
import shutil
from typing import List, Optional
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field

from database import (
    init_db,
    insert_document,
    update_document_status,
    get_documents,
    get_document,
    delete_document,
    insert_chunks,
    delete_chunks_for_document,
    get_all_indexed_chunks,
    save_analysis,
    get_analyses,
    get_analysis_by_id,
    delete_analysis,
    get_dashboard_summary,
)
from document_parser import parse_document
from similarity import generate_embeddings_for_chunks, rank_chunks_by_similarity
from sample_docs import create_sample_files, seed_sample_documents

# Project Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
SAMPLES_DIR = os.path.join(DATA_DIR, "sample_files")

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
ALLOWED_EXTENSIONS = {"txt", "pdf", "docx"}

# Ensure database and folders are initialized
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(SAMPLES_DIR, exist_ok=True)
init_db()
create_sample_files(SAMPLES_DIR)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    create_sample_files(SAMPLES_DIR)
    yield
    # Shutdown

app = FastAPI(
    title="Similarity Intelligence API",
    description="Professional RAG Document Workspace and Semantic Similarity Engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language search query")
    threshold: float = Field(0.35, ge=0.0, le=1.0, description="Minimum cosine similarity threshold")
    top_k: int = Field(5, ge=1, le=50, description="Number of results to return")
    document_ids: Optional[List[str]] = Field(None, description="Optional document IDs to filter search")

# ----------------- API ENDPOINTS -----------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Similarity Intelligence Backend",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/dashboard")
def get_dashboard():
    try:
        summary = get_dashboard_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")

# Sample Data Seeding Endpoint
@app.post("/api/sample-data")
def load_sample_data():
    """
    Populates and indexes the 6 required academic TXT files.
    """
    try:
        indexed_docs = seed_sample_documents(UPLOADS_DIR)
        return {
            "message": f"Successfully indexed {len(indexed_docs)} sample academic documents.",
            "documents": indexed_docs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed sample documents: {str(e)}")

# Document Upload & Management
@app.post("/api/documents/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided for upload.")

    results = []
    
    for file in files:
        original_filename = os.path.basename(file.filename or "uploaded_file")
        ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else ""

        if ext not in ALLOWED_EXTENSIONS:
            results.append({
                "filename": original_filename,
                "status": "error",
                "error": f"Unsupported file extension '.{ext}'. Supported types are TXT, PDF, DOCX."
            })
            continue

        # Read contents to check size and empty state
        contents = await file.read()
        file_size = len(contents)

        if file_size == 0:
            results.append({
                "filename": original_filename,
                "status": "error",
                "error": "File is completely empty (0 bytes)."
            })
            continue

        if file_size > MAX_FILE_SIZE_BYTES:
            results.append({
                "filename": original_filename,
                "status": "error",
                "error": f"File size ({round(file_size / (1024*1024), 2)} MB) exceeds 25 MB limit."
            })
            continue

        # Generate unique document ID and safe filename
        doc_id = str(uuid.uuid4())
        safe_filename = f"{doc_id}_{original_filename}"
        saved_path = os.path.join(UPLOADS_DIR, safe_filename)

        with open(saved_path, "wb") as f:
            f.write(contents)

        # Record in database as processing
        doc_data = {
            "id": doc_id,
            "filename": original_filename,
            "file_type": ext,
            "file_size": file_size,
            "file_path": saved_path,
            "upload_date": datetime.now().isoformat(),
            "chunk_count": 0,
            "status": "processing",
            "error_message": None,
            "raw_content": None
        }
        insert_document(doc_data)

        # Parse and Index Document
        try:
            chunks, raw_content = parse_document(saved_path, original_filename, ext)
            if not chunks:
                raise ValueError("No extractable chunks found in document.")

            for c in chunks:
                c["document_id"] = doc_id

            chunks_with_emb = generate_embeddings_for_chunks(chunks)
            insert_chunks(chunks_with_emb)
            update_document_status(doc_id, "indexed", len(chunks), None, raw_content)

            results.append({
                "document_id": doc_id,
                "filename": original_filename,
                "file_type": ext,
                "file_size": file_size,
                "chunks": len(chunks),
                "status": "indexed"
            })
        except Exception as e:
            update_document_status(doc_id, "error", 0, str(e))
            results.append({
                "document_id": doc_id,
                "filename": original_filename,
                "file_type": ext,
                "file_size": file_size,
                "chunks": 0,
                "status": "error",
                "error": str(e)
            })

    return {"uploaded": results}

@app.get("/api/documents")
def list_documents():
    docs = get_documents()
    return docs

@app.get("/api/documents/{document_id}")
def get_document_details(document_id: str):
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc

@app.get("/api/documents/{document_id}/content")
def get_document_content(document_id: str):
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    raw_content = doc.get("raw_content") or ""
    # If not in DB, try reading file directly
    if not raw_content and os.path.exists(doc.get("file_path", "")):
        try:
            with open(doc["file_path"], "r", encoding="utf-8", errors="ignore") as f:
                raw_content = f.read()
        except Exception:
            pass

    return {
        "id": doc["id"],
        "filename": doc["filename"],
        "file_type": doc["file_type"],
        "content": raw_content
    }

@app.get("/api/documents/{document_id}/file")
def get_document_file(document_id: str):
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    file_path = doc.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Original document file not found on server.")
    
    media_type = "application/pdf" if doc["file_type"] == "pdf" else "text/plain"
    return FileResponse(file_path, filename=doc["filename"], media_type=media_type)

@app.delete("/api/documents/{document_id}")
def remove_document(document_id: str):
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    success = delete_document(document_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document.")
    return {"message": f"Document '{doc['filename']}' and its associated vector chunks were successfully removed."}

@app.post("/api/documents/{document_id}/reindex")
def reindex_document(document_id: str):
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    file_path = doc.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File path does not exist on disk.")

    delete_chunks_for_document(document_id)
    update_document_status(document_id, "processing", 0, None)

    try:
        chunks, raw_content = parse_document(file_path, doc["filename"], doc["file_type"])
        for c in chunks:
            c["document_id"] = document_id
        chunks_with_emb = generate_embeddings_for_chunks(chunks)
        insert_chunks(chunks_with_emb)
        update_document_status(document_id, "indexed", len(chunks), None, raw_content)
        return {
            "message": f"Document '{doc['filename']}' reindexed successfully with {len(chunks)} chunks.",
            "chunk_count": len(chunks)
        }
    except Exception as e:
        update_document_status(document_id, "error", 0, str(e))
        raise HTTPException(status_code=500, detail=f"Reindexing failed: {str(e)}")

# Semantic Search Execution
@app.post("/api/search")
def search_similarity(req: SearchRequest):
    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    start_time = time.time()

    # Load stored chunks and their embeddings from SQLite
    chunks = get_all_indexed_chunks(req.document_ids)
    if not chunks:
        # No indexed documents available
        return {
            "query": query,
            "total_matches": 0,
            "documents_searched": 0,
            "execution_time_ms": 0.0,
            "threshold": req.threshold,
            "results": [],
            "message": "No indexed documents found in the document library. Please upload or index documents first."
        }

    # Unique documents count
    unique_doc_ids = set(c["document_id"] for c in chunks)
    documents_searched = len(unique_doc_ids)

    # Perform cosine similarity ranking and filtering
    try:
        ranked_results = rank_chunks_by_similarity(
            query=query,
            chunks=chunks,
            top_k=req.top_k,
            min_threshold=req.threshold
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similarity calculation failed: {str(e)}")

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    match_count = len(ranked_results)

    top_match = ranked_results[0] if match_count > 0 else None
    top_filename = top_match.get("filename") if top_match else None
    top_score = top_match.get("similarity_score") if top_match else None

    # Persist analysis in SQLite history
    analysis_id = str(uuid.uuid4())
    analysis_record = {
        "id": analysis_id,
        "query": query,
        "created_at": datetime.now().isoformat(),
        "match_count": match_count,
        "documents_searched": documents_searched,
        "top_match_filename": top_filename,
        "top_score": top_score,
        "threshold": req.threshold,
        "execution_time_ms": elapsed_ms,
        "results": ranked_results
    }
    save_analysis(analysis_record)

    return {
        "analysis_id": analysis_id,
        "query": query,
        "total_matches": match_count,
        "documents_searched": documents_searched,
        "execution_time_ms": elapsed_ms,
        "threshold": req.threshold,
        "results": ranked_results
    }

# Analysis History Endpoints
@app.get("/api/history")
def list_history(limit: int = Query(50, ge=1, le=100)):
    return get_analyses(limit=limit)

@app.get("/api/history/{analysis_id}")
def get_history_entry(analysis_id: str):
    entry = get_analysis_by_id(analysis_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return entry

@app.delete("/api/history/{analysis_id}")
def remove_history_entry(analysis_id: str):
    deleted = delete_analysis(analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis entry not found.")
    return {"message": "Analysis history record deleted successfully."}

# Static file serving for unified deployment (if frontend is built)
from fastapi.staticfiles import StaticFiles

FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/{full_path:path}")
def serve_frontend_spa(full_path: str):
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        raise HTTPException(status_code=404, detail="Not Found")
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Similarity Intelligence API is running. To serve frontend, run 'npm run build' inside frontend/"}

