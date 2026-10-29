import os
import time
import numpy as np
from typing import List, Dict, Any, Optional

# Singleton instance of model
_model = None

def get_embedding_model():
    """
    Loads sentence-transformers model locally.
    Uses 'all-MiniLM-L6-v2' (lightweight, 384 dimensions, CPU-friendly).
    """
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        # Load local or download once to standard huggingface cache
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def generate_embeddings_for_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generates normalized float32 embeddings for a list of chunk dicts.
    Assigns chunk['embedding'] = np.ndarray.
    """
    if not chunks:
        return []

    model = get_embedding_model()
    texts = [c["chunk_text"] for c in chunks]
    
    # encode with normalization for accurate cosine similarity
    embeddings = model.encode(texts, batch_size=32, show_progress_bar=False, normalize_embeddings=True)
    
    for i, emb in enumerate(embeddings):
        chunks[i]["embedding"] = emb.astype(np.float32)

    return chunks

def generate_query_embedding(query: str) -> np.ndarray:
    """
    Generates normalized float32 embedding for the query.
    """
    model = get_embedding_model()
    emb = model.encode(query, normalize_embeddings=True)
    return emb.astype(np.float32)

def compute_cosine_similarity(query_emb: np.ndarray, doc_embeddings: np.ndarray) -> np.ndarray:
    """
    Computes cosine similarity between a 1D query embedding (dim d)
    and a 2D matrix of document embeddings (N x d).
    Both are already L2 normalized, so similarity is dot product.
    """
    if doc_embeddings.ndim == 1:
        doc_embeddings = doc_embeddings.reshape(1, -1)
    
    # Dot product calculation
    sims = np.dot(doc_embeddings, query_emb)
    # Clip numerical precision fluctuations
    sims = np.clip(sims, -1.0, 1.0)
    return sims

def rank_chunks_by_similarity(
    query: str,
    chunks: List[Dict[str, Any]],
    top_k: int = 5,
    min_threshold: float = 0.0
) -> List[Dict[str, Any]]:
    """
    Ranks stored chunks by semantic cosine similarity against the query.
    Filters by minimum threshold, attaches rank, and returns top_k results.
    """
    if not chunks or not query.strip():
        return []

    query_emb = generate_query_embedding(query.strip())
    doc_embeddings = np.array([c["embedding"] for c in chunks], dtype=np.float32)

    similarities = compute_cosine_similarity(query_emb, doc_embeddings)

    scored_results = []
    for idx, sim in enumerate(similarities):
        score = float(sim)
        if score >= min_threshold:
            chunk = chunks[idx].copy()
            # Remove raw embedding array before sending back over API
            chunk.pop("embedding", None)
            chunk["similarity_score"] = round(score, 4)
            scored_results.append(chunk)

    # Sort descending by similarity score
    scored_results.sort(key=lambda x: x["similarity_score"], reverse=True)

    # Slice top_k and assign 1-indexed rank
    top_results = scored_results[:top_k]
    for rank, res in enumerate(top_results, start=1):
        res["rank"] = rank

    return top_results

