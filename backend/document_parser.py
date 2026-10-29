import os
import re
import uuid
from typing import List, Dict, Any, Tuple, Optional

# Constants for chunking
CHUNK_TARGET_CHARS = 1600   # ~400 words / ~500 tokens
CHUNK_OVERLAP_CHARS = 300   # ~60-75 tokens
MIN_CHUNK_CHARS = 100

def split_into_sentences(text: str) -> List[str]:
    """Splits text into sentences while keeping punctuation."""
    sentence_endings = re.compile(r'(?<=[.!?])\s+')
    sentences = sentence_endings.split(text)
    return [s.strip() for s in sentences if s.strip()]

def parse_txt_file(file_path: str) -> Tuple[List[Dict[str, Any]], str]:
    """
    Parses a TXT file preserving exact 1-indexed line numbers,
    character offsets, and paragraph boundaries.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            content = f.read()

    if not content.strip():
        raise ValueError("Document is empty or contains only whitespace.")

    lines = content.splitlines(keepends=True)
    
    # Identify paragraphs with their start/end lines and offsets
    paragraphs = []
    current_para_lines = []
    current_para_start_line = 1
    current_para_start_char = 0
    current_char_offset = 0

    line_idx = 1
    while line_idx <= len(lines):
        line = lines[line_idx - 1]
        line_len = len(line)

        if line.strip():  # non-empty line
            if not current_para_lines:
                current_para_start_line = line_idx
                current_para_start_char = current_char_offset
            current_para_lines.append(line)
        else:  # blank line: paragraph separator
            if current_para_lines:
                para_text = "".join(current_para_lines).strip()
                para_end_line = line_idx - 1
                para_end_char = current_char_offset
                if para_text:
                    paragraphs.append({
                        "paragraph_number": len(paragraphs) + 1,
                        "text": para_text,
                        "line_start": current_para_start_line,
                        "line_end": para_end_line,
                        "char_start": current_para_start_char,
                        "char_end": para_end_char
                    })
                current_para_lines = []

        current_char_offset += line_len
        line_idx += 1

    # Add final paragraph if pending
    if current_para_lines:
        para_text = "".join(current_para_lines).strip()
        if para_text:
            paragraphs.append({
                "paragraph_number": len(paragraphs) + 1,
                "text": para_text,
                "line_start": current_para_start_line,
                "line_end": len(lines),
                "char_start": current_para_start_char,
                "char_end": current_char_offset
            })

    if not paragraphs:
        raise ValueError("No readable paragraphs found in the text file.")

    # Now create chunks from paragraphs
    chunks = []
    chunk_index = 0

    current_chunk_paras = []
    current_chunk_len = 0

    for para in paragraphs:
        para_len = len(para["text"])

        # If a single paragraph is larger than CHUNK_TARGET_CHARS, we subdivide it
        if para_len > CHUNK_TARGET_CHARS:
            # First flush any accumulated smaller paragraphs
            if current_chunk_paras:
                chunks.append(_create_txt_chunk(current_chunk_paras, chunk_index))
                chunk_index += 1
                current_chunk_paras = []
                current_chunk_len = 0

            # Subdivide large paragraph by sentences
            sentences = split_into_sentences(para["text"])
            sub_sentences = []
            sub_len = 0
            for sent in sentences:
                sub_sentences.append(sent)
                sub_len += len(sent) + 1
                if sub_len >= CHUNK_TARGET_CHARS:
                    sub_text = " ".join(sub_sentences)
                    chunks.append({
                        "id": str(uuid.uuid4()),
                        "chunk_index": chunk_index,
                        "chunk_text": sub_text,
                        "page_number": None,
                        "paragraph_number": para["paragraph_number"],
                        "line_start": para["line_start"],
                        "line_end": para["line_end"],
                        "char_start": para["char_start"],
                        "char_end": para["char_end"],
                        "bbox": None
                    })
                    chunk_index += 1
                    # Retain last sentence for overlap
                    sub_sentences = sub_sentences[-1:] if len(sub_sentences) > 1 else []
                    sub_len = sum(len(s) for s in sub_sentences)
            if sub_sentences:
                sub_text = " ".join(sub_sentences)
                if len(sub_text) >= MIN_CHUNK_CHARS:
                    chunks.append({
                        "id": str(uuid.uuid4()),
                        "chunk_index": chunk_index,
                        "chunk_text": sub_text,
                        "page_number": None,
                        "paragraph_number": para["paragraph_number"],
                        "line_start": para["line_start"],
                        "line_end": para["line_end"],
                        "char_start": para["char_start"],
                        "char_end": para["char_end"],
                        "bbox": None
                    })
                    chunk_index += 1
        else:
            if current_chunk_len + para_len > CHUNK_TARGET_CHARS and current_chunk_paras:
                chunks.append(_create_txt_chunk(current_chunk_paras, chunk_index))
                chunk_index += 1
                # Overlap: keep the last paragraph if small enough
                if len(current_chunk_paras[-1]["text"]) < CHUNK_OVERLAP_CHARS:
                    current_chunk_paras = [current_chunk_paras[-1], para]
                    current_chunk_len = sum(len(p["text"]) for p in current_chunk_paras)
                else:
                    current_chunk_paras = [para]
                    current_chunk_len = para_len
            else:
                current_chunk_paras.append(para)
                current_chunk_len += para_len

    if current_chunk_paras:
        chunks.append(_create_txt_chunk(current_chunk_paras, chunk_index))

    return chunks, content

def _create_txt_chunk(para_list: List[Dict[str, Any]], chunk_index: int) -> Dict[str, Any]:
    text = "\n\n".join(p["text"] for p in para_list)
    return {
        "id": str(uuid.uuid4()),
        "chunk_index": chunk_index,
        "chunk_text": text,
        "page_number": None,  # TXT files have no page numbers
        "paragraph_number": para_list[0]["paragraph_number"],
        "line_start": para_list[0]["line_start"],
        "line_end": para_list[-1]["line_end"],
        "char_start": para_list[0]["char_start"],
        "char_end": para_list[-1]["char_end"],
        "bbox": None
    }


def parse_pdf_file(file_path: str) -> Tuple[List[Dict[str, Any]], str]:
    """
    Parses a PDF file using PyMuPDF (fitz) page-by-page.
    Extracts text blocks, page numbers, extracted line ranges, and bounding boxes.
    """
    try:
        import pymupdf as fitz
    except ImportError:
        try:
            import fitz
        except ImportError:
            raise ImportError("PyMuPDF (pymupdf) is not installed.")

    doc = fitz.open(file_path)
    if len(doc) == 0:
        doc.close()
        raise ValueError("PDF document has 0 pages.")

    chunks = []
    chunk_index = 0
    full_text_parts = []
    global_extracted_line = 1

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_number = page_idx + 1  # 1-indexed

        # Extract blocks: (x0, y0, x1, y1, "text", block_no, block_type)
        blocks = page.get_text("blocks")
        page_text = page.get_text("text")
        full_text_parts.append(f"--- [Page {page_number}] ---\n{page_text}")

        # Filter text blocks
        text_blocks = [b for b in blocks if b[6] == 0 and b[4].strip()]

        for block_idx, b in enumerate(text_blocks, start=1):
            x0, y0, x1, y1, text, b_no, _ = b
            clean_text = text.strip()
            if not clean_text or len(clean_text) < 15:
                continue

            block_lines = clean_text.splitlines()
            line_count = len(block_lines)
            line_start = global_extracted_line
            line_end = global_extracted_line + line_count - 1
            global_extracted_line += line_count

            # If block is very long, break it down
            if len(clean_text) > CHUNK_TARGET_CHARS:
                sentences = split_into_sentences(clean_text)
                sub_sentences = []
                sub_len = 0
                for sent in sentences:
                    sub_sentences.append(sent)
                    sub_len += len(sent) + 1
                    if sub_len >= CHUNK_TARGET_CHARS:
                        chunks.append({
                            "id": str(uuid.uuid4()),
                            "chunk_index": chunk_index,
                            "chunk_text": " ".join(sub_sentences),
                            "page_number": page_number,
                            "paragraph_number": block_idx,
                            "line_start": line_start,
                            "line_end": line_end,
                            "char_start": None,
                            "char_end": None,
                            "bbox": [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)]
                        })
                        chunk_index += 1
                        sub_sentences = sub_sentences[-1:]
                        sub_len = sum(len(s) for s in sub_sentences)
                if sub_sentences:
                    sub_text = " ".join(sub_sentences)
                    if len(sub_text) >= MIN_CHUNK_CHARS:
                        chunks.append({
                            "id": str(uuid.uuid4()),
                            "chunk_index": chunk_index,
                            "chunk_text": sub_text,
                            "page_number": page_number,
                            "paragraph_number": block_idx,
                            "line_start": line_start,
                            "line_end": line_end,
                            "char_start": None,
                            "char_end": None,
                            "bbox": [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)]
                        })
                        chunk_index += 1
            else:
                chunks.append({
                    "id": str(uuid.uuid4()),
                    "chunk_index": chunk_index,
                    "chunk_text": clean_text,
                    "page_number": page_number,
                    "paragraph_number": block_idx,
                    "line_start": line_start,
                    "line_end": line_end,
                    "char_start": None,
                    "char_end": None,
                    "bbox": [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)]
                })
                chunk_index += 1

    doc.close()

    raw_content = "\n\n".join(full_text_parts)
    if not chunks:
        raise ValueError("Could not extract any text blocks from PDF (file may be scanned/image-only).")

    return chunks, raw_content


def parse_docx_file(file_path: str) -> Tuple[List[Dict[str, Any]], str]:
    """
    Parses a DOCX file preserving paragraph order, paragraph index,
    and extracted line tracking.
    """
    try:
        import docx
    except ImportError:
        raise ImportError("python-docx is not installed.")

    doc = docx.Document(file_path)
    
    paragraphs = []
    full_text_lines = []
    line_counter = 1

    for p_idx, p in enumerate(doc.paragraphs, start=1):
        text = p.text.strip()
        if text:
            # approximate lines within paragraph
            lines_in_para = text.splitlines() or [text]
            p_line_start = line_counter
            p_line_end = line_counter + len(lines_in_para) - 1
            line_counter = p_line_end + 1

            paragraphs.append({
                "paragraph_number": p_idx,
                "text": text,
                "line_start": p_line_start,
                "line_end": p_line_end
            })
            full_text_lines.append(f"[Para {p_idx}] {text}")

    if not paragraphs:
        raise ValueError("Document contains no readable paragraphs.")

    chunks = []
    chunk_index = 0
    current_paras = []
    current_len = 0

    for para in paragraphs:
        para_len = len(para["text"])
        if current_len + para_len > CHUNK_TARGET_CHARS and current_paras:
            chunks.append({
                "id": str(uuid.uuid4()),
                "chunk_index": chunk_index,
                "chunk_text": "\n\n".join(p["text"] for p in current_paras),
                "page_number": None,  # Word documents do not have fixed printed page numbers
                "paragraph_number": current_paras[0]["paragraph_number"],
                "line_start": current_paras[0]["line_start"],
                "line_end": current_paras[-1]["line_end"],
                "char_start": None,
                "char_end": None,
                "bbox": None
            })
            chunk_index += 1
            current_paras = [para]
            current_len = para_len
        else:
            current_paras.append(para)
            current_len += para_len

    if current_paras:
        chunks.append({
            "id": str(uuid.uuid4()),
            "chunk_index": chunk_index,
            "chunk_text": "\n\n".join(p["text"] for p in current_paras),
            "page_number": None,
            "paragraph_number": current_paras[0]["paragraph_number"],
            "line_start": current_paras[0]["line_start"],
            "line_end": current_paras[-1]["line_end"],
            "char_start": None,
            "char_end": None,
            "bbox": None
        })

    return chunks, "\n\n".join(full_text_lines)


def parse_document(file_path: str, filename: str, file_type: str) -> Tuple[List[Dict[str, Any]], str]:
    """
    Dispatches file parsing to the appropriate format parser.
    Ensures absolute integrity of source tracking.
    """
    file_type = file_type.lower().strip().replace(".", "")
    
    if file_type == "txt":
        return parse_txt_file(file_path)
    elif file_type == "pdf":
        return parse_pdf_file(file_path)
    elif file_type in ("docx", "doc"):
        return parse_docx_file(file_path)
    else:
        raise ValueError(f"Unsupported file format: '.{file_type}'. Supported formats are: TXT, PDF, DOCX.")
