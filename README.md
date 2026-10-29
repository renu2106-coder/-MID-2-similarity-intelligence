# Similarity Intelligence — RAG Document Workspace

A professional, full-stack web application for semantic document retrieval, vector similarity analysis, and exact source-passage attribution built for academic research and assignment evaluation.

to check the user interface, click in URL:https://mid-2-similarity-intelligence.onrender.com

---

## 🌟 Key Features

1. **Zero-API-Key Local Semantic Search**:
   - Uses `sentence-transformers/all-MiniLM-L6-v2` locally to project queries and document text chunks into 384-dimensional dense vector embeddings.
   - 100% offline-capable, CPU-friendly, zero paid API keys required.
2. **True Mathematical Cosine Similarity**:
   - Calculates the geometric dot product of normalized embedding vectors:
     $$\text{similarity} = \frac{u \cdot v}{\|u\|_2 \cdot \|v\|_2}$$
   - Outputs verifiable semantic similarity scores between -1.0 and 1.0 (0% - 100%).
3. **Exact Source Passage Locator**:
   - **TXT**: Preserves exact 1-indexed line numbers (`line_start` to `line_end`), character boundaries, and paragraph separations.
   - **PDF**: Page-by-page extraction using PyMuPDF (`pymupdf`), tracking page numbers, paragraph blocks, line ranges, and bounding box coordinates `[x0, y0, x1, y1]`.
   - **DOCX**: Preserves structural paragraph order and sequential line mapping using `python-docx`.
   - **Integrity Rule**: Never hallucinates or fabricates line/page numbers. Displays "Location unavailable" if a coordinate cannot be determined reliably.
4. **Interactive In-Browser Source Viewer**:
   - Click **"View Source"** on any match to inspect the source file with line numbers in a dedicated gutter and the matched passage highlighted.
5. **Document Library & Corpus Management**:
   - Multi-file drag-and-drop upload for PDF, DOCX, and TXT files.
   - File size validation, duplicate handling, and empty-file detection.
   - Real-time indexing status, chunk counters, and safe deletion (removes chunk embeddings from active index).
   - Instant 1-click loading for the 6 pre-configured academic assignment test files.
6. **Analysis History & Persistence**:
   - Completed queries, matched passages, scores, and thresholds are persistently recorded in SQLite (`data/similarity.db`).
   - One-click re-opening and export of past analyses.
7. **Export Capabilities**:
   - Export structured results as formatted **CSV** or complete metadata **JSON**.

---

## 🏗️ Technology Stack

- **Frontend**:
  - React 18 & TypeScript
  - Vite for ultra-fast builds
  - Custom CSS Design System (clean SaaS aesthetic adhering to strict palette `#142D4E`, `#2563EB`, `#F4F7FB`, `#FFFFFF`)
  - Lucide React icons
  - React Router DOM v6
- **Backend**:
  - Python 3.10+ (tested with Python 3.14)
  - FastAPI & Uvicorn
  - PyMuPDF (`pymupdf`)
  - python-docx
  - sentence-transformers (`all-MiniLM-L6-v2`)
  - NumPy for vector dot products
  - SQLite3 for persistent metadata & chunk embeddings

---

## 📋 Folder Structure

```text
rag ui/
├── frontend/                     # React + TypeScript + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── types/index.ts        # TypeScript interfaces
│       ├── services/api.ts       # Backend REST API client
│       ├── styles/globals.css    # Unified design system & variables
│       ├── components/           # Reusable UI components
│       │   ├── Layout.tsx
│       │   ├── Sidebar.tsx
│       │   ├── Header.tsx
│       │   ├── Modal.tsx
│       │   ├── ScoreBadge.tsx
│       │   ├── ResultCard.tsx
│       │   └── SourceViewerModal.tsx
│       └── pages/                # Application routes
│           ├── DashboardPage.tsx
│           ├── NewAnalysisPage.tsx
│           ├── DocumentLibraryPage.tsx
│           ├── HistoryPage.tsx
│           └── AboutPage.tsx
├── backend/                      # FastAPI Python backend
│   ├── requirements.txt
│   ├── main.py                   # REST endpoints & server lifecycle
│   ├── database.py               # SQLite schema & persistence logic
│   ├── document_parser.py        # PDF, DOCX, TXT parsers & chunkers
│   ├── similarity.py             # SentenceTransformer embeddings & cosine sim
│   ├── sample_docs.py            # The 6 academic test files & seeding
│   └── venv/                     # Python virtual environment (gitignored)
├── data/                         # Local data storage
│   ├── uploads/                  # Uploaded document files
│   ├── sample_files/             # Seed sample TXT files
│   └── similarity.db             # SQLite database file
├── README.md
└── .gitignore
```

---

## 🚀 Quickstart Guide (Windows)

Follow these simple steps in PowerShell or Windows Command Prompt.

### Step 1: Open Terminal in Project Root
```powershell
cd "c:\Users\HI\OneDrive\Desktop\RAG UI"
```

### Step 2: Set Up and Run the Python Backend

```powershell
# 1. Navigate to backend
cd backend

# 2. Activate existing virtual environment (or create if needed: python -m venv venv)
.\venv\Scripts\Activate.ps1

# (Optional: install dependencies if not already installed)
# pip install -r requirements.txt

# 3. Start the FastAPI server on port 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at: `http://127.0.0.1:8000`  
Interactive Swagger docs: `http://127.0.0.1:8000/docs`

### Step 3: Run the React Frontend

Open a **second** PowerShell terminal window:

```powershell
cd "c:\Users\HI\OneDrive\Desktop\RAG UI\frontend"

# Start the Vite development server
npm run dev
```

The frontend will be accessible at: `http://localhost:5173`

---

## 🧪 Testing the 6 Academic Topics

The application includes 6 pre-configured academic text corpora:

1. **Diabetes and Machine Learning** (`diabetes_and_machine_learning.txt`)
2. **Hospital Readmission Prevention** (`hospital_readmission_prevention.txt`)
3. **Electronic Health Record Data Quality** (`electronic_health_record_data_quality.txt`)
4. **RAG and Semantic Similarity Mechanics** (`rag_and_semantic_similarity.txt`)
5. **Antimicrobial Resistance Genomic Surveillance** (`antimicrobial_resistance_surveillance.txt`)
6. **Renewable Energy Demand Forecasting** (`renewable_energy_forecasting.txt`)

### How to Test:
1. Open `http://localhost:5173`.
2. On the **Dashboard** or **New Analysis** page, click **"Load 6 Sample Files"**. The system will chunk and embed all 6 files into the SQLite database.
3. In the **New Analysis** workspace, click any of the one-click sample query pills:
   - *"How can AI identify people at risk of diabetes?"* &rarr; Matches `diabetes_and_machine_learning.txt` (¶ 2, lines 10-18).
   - *"How can hospitals improve patient follow-up after discharge?"* &rarr; Matches `hospital_readmission_prevention.txt` (¶ 2, lines 10-18).
   - *"How can missing and duplicate records affect EHR quality?"* &rarr; Matches `electronic_health_record_data_quality.txt` (¶ 2, lines 10-19).
   - *"How does cosine similarity retrieve relevant document passages?"* &rarr; Matches `rag_and_semantic_similarity.txt` (¶ 2, lines 10-19).
   - *"How can bacterial genomes support antimicrobial resistance surveillance?"* &rarr; Matches `antimicrobial_resistance_surveillance.txt` (¶ 2, lines 10-19).
   - *"How can renewable energy demand be forecast?"* &rarr; Matches `renewable_energy_forecasting.txt` (¶ 2, lines 10-19).
4. Click **"View Source"** to inspect the full document and observe exact line highlighting.
5. Test the unrelated query:
   - *"Medieval Byzantine architecture and mosaic techniques"*
   - With threshold $\ge 0.35$, it returns **0 matches** ("No sufficiently similar passages were found"), verifying that the engine never fabricates matches.

---

## 🔒 Security & Privacy

- All document processing occurs strictly within the local environment.
- No text is transmitted to external proprietary AI APIs (OpenAI, Anthropic, Google).
- Secure random UUIDs are assigned for all stored files and chunks to avoid directory traversal.

---

## ⚖️ Academic Attribution & Disclaimer

Semantic similarity scores measure geometric distance between vector projections; they reflect semantic relevance within the indexed corpora and are **not** an automated proof of factual veracity or plagiarism.

