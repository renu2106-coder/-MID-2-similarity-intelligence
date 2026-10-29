import sys
import os
import json

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import init_db

def test_all():
    init_db()
    with TestClient(app) as client:
        print("=== 1. Testing Health Check ===")
        res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("Health check response:", res.json())

    print("\n=== 2. Seeding 6 Sample Academic Documents ===")
    res = client.post("/api/sample-data")
    assert res.status_code == 200, f"Seeding failed: {res.text}"
    seeded_data = res.json()
    print(f"Seeded {len(seeded_data['documents'])} documents successfully.")

    print("\n=== 3. Verifying Document Library ===")
    res = client.get("/api/documents")
    assert res.status_code == 200
    docs = res.json()
    print(f"Total documents in library: {len(docs)}")
    for d in docs:
        print(f" - {d['filename']}: {d['chunk_count']} chunks, status: {d['status']}")
        assert d['status'] == 'indexed'
        assert d['chunk_count'] > 0

    print("\n=== 4. Testing Required Queries ===")
    test_cases = [
        {
            "query": "How can AI identify people at risk of diabetes?",
            "expected_file": "diabetes_and_machine_learning.txt"
        },
        {
            "query": "How can hospitals improve patient follow-up after discharge?",
            "expected_file": "hospital_readmission_prevention.txt"
        },
        {
            "query": "How can missing and duplicate records affect EHR quality?",
            "expected_file": "electronic_health_record_data_quality.txt"
        },
        {
            "query": "How does cosine similarity retrieve relevant document passages?",
            "expected_file": "rag_and_semantic_similarity.txt"
        },
        {
            "query": "How can bacterial genomes support antimicrobial resistance surveillance?",
            "expected_file": "antimicrobial_resistance_surveillance.txt"
        },
        {
            "query": "How can renewable energy demand be forecast?",
            "expected_file": "renewable_energy_forecasting.txt"
        }
    ]

    for tc in test_cases:
        query = tc["query"]
        expected_file = tc["expected_file"]
        print(f"\nQuery: '{query}'")
        res = client.post("/api/search", json={
            "query": query,
            "threshold": 0.35,
            "top_k": 3
        })
        assert res.status_code == 200, f"Search failed: {res.text}"
        data = res.json()
        print(f"Matches found: {data['total_matches']}, Latency: {data['execution_time_ms']} ms")
        assert data["total_matches"] > 0, f"No matches found for {query}"
        
        top_match = data["results"][0]
        print(f"Top Match Rank #1: {top_match['filename']}")
        print(f" - Score: {top_match['similarity_score']}")
        print(f" - Paragraph: {top_match['paragraph_number']}, Lines: {top_match['line_start']}-{top_match['line_end']}")
        print(f" - Snippet: {top_match['chunk_text'][:120]}...")
        assert top_match["filename"] == expected_file, f"Expected {expected_file}, got {top_match['filename']}"

    print("\n=== 5. Testing Unrelated Query (Zero Matches Expected) ===")
    unrelated_query = "Medieval Byzantine architecture and mosaic techniques in Constantinople"
    res = client.post("/api/search", json={
        "query": unrelated_query,
        "threshold": 0.35,
        "top_k": 5
    })
    assert res.status_code == 200
    data = res.json()
    print(f"Query: '{unrelated_query}'")
    print(f"Matches found at threshold 0.35: {data['total_matches']}")
    assert data["total_matches"] == 0, f"Expected 0 matches for unrelated query, got {data['total_matches']}"
    print("Zero matches verified for unrelated query.")

    print("\n=== 6. Testing Analysis History & Dashboard ===")
    res_dash = client.get("/api/dashboard")
    assert res_dash.status_code == 200
    dash = res_dash.json()
    print(f"Dashboard total indexed documents: {dash['total_indexed_documents']}")
    print(f"Dashboard total analyses: {dash['total_completed_analyses']}")
    assert dash['total_indexed_documents'] == 6
    assert dash['total_completed_analyses'] >= 7

    res_hist = client.get("/api/history")
    assert res_hist.status_code == 200
    hist = res_hist.json()
    print(f"History records count: {len(hist)}")
    first_hist = hist[0]
    
    # Test retrieving single history entry
    res_entry = client.get(f"/api/history/{first_hist['id']}")
    assert res_entry.status_code == 200
    entry = res_entry.json()
    print(f"Retrieved archived analysis for query: '{entry['query']}' with {len(entry['results'])} reconstructed results.")

    print("\n=== 7. Testing Source Viewer Content Retrieval ===")
    doc_id = docs[0]["id"]
    res_content = client.get(f"/api/documents/{doc_id}/content")
    assert res_content.status_code == 200
    content_data = res_content.json()
    assert len(content_data["content"]) > 100
    print(f"Successfully retrieved raw content for '{content_data['filename']}' ({len(content_data['content'])} characters).")

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY! 100% VERIFIED.")

if __name__ == "__main__":
    test_all()
