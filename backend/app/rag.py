"""Document-local BM25 retrieval. No embedding download required."""

import io
import math
import re
import zipfile
from collections import Counter
from pathlib import Path
from pypdf import PdfReader
from docx import Document
from . import store

STOP = set(
    "the a an is are was were to of and or for in on at with from this that what how can do does me please based document".split()
)


def tokens(text):
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if t not in STOP]


def extract(filename, data):
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise ValueError(
                "Encrypted PDFs are not supported. Upload an unlocked copy."
            )
        if len(reader.pages) > 100:
            raise ValueError("Maximum 100 PDF pages per upload.")
        pages = [(i + 1, p.extract_text() or "") for i, p in enumerate(reader.pages)]
    elif suffix == ".docx":
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            if sum(x.file_size for x in z.infolist()) > 30_000_000:
                raise ValueError("DOCX expanded contents exceed 30 MB.")
        doc = Document(io.BytesIO(data))
        lines = [p.text for p in doc.paragraphs]
        lines += [
            " | ".join(c.text for c in row.cells) for t in doc.tables for row in t.rows
        ]
        pages = [(1, "\n".join(lines))]
    elif suffix in (".txt", ".md"):
        pages = [(1, data.decode("utf-8-sig"))]
    else:
        raise ValueError("Supported uploads: PDF, DOCX, TXT and Markdown.")
    total = sum(len(text) for _, text in pages)
    if total > 250_000:
        raise ValueError(
            "Extracted text exceeds 250,000 characters; split the document."
        )
    if total < 30:
        raise ValueError(
            "No usable text found. Scanned PDFs require OCR before upload."
        )
    chunks = []
    for page, text in pages:
        text = re.sub(r"\s+", " ", text).strip()
        for start in range(0, len(text), 1000):
            part = text[start : start + 1200].strip()
            if len(part) > 20:
                chunks.append(
                    {"id": f"C{len(chunks)+1:04d}", "page": page, "text": part}
                )
    return chunks


def retrieve(chunks, query, k=4):
    query_tokens = set(tokens(query))
    docs = [tokens(c["text"]) for c in chunks]
    avg = sum(map(len, docs)) / max(len(docs), 1)
    df = Counter(t for doc in docs for t in set(doc))
    ranked = []
    for chunk, words in zip(chunks, docs):
        counts = Counter(words)
        score = 0
        for term in query_tokens:
            tf = counts[term]
            idf = math.log(1 + (len(docs) - df[term] + 0.5) / (df[term] + 0.5))
            score += (
                idf * tf * 2.5 / (tf + 1.5 * (0.25 + 0.75 * len(words) / max(avg, 1)))
            )
        if score > 0:
            ranked.append({**chunk, "score": round(score, 4)})
    return sorted(ranked, key=lambda c: c["score"], reverse=True)[:k]


def normalize(s):
    return re.sub(r"\s+", " ", s).strip().casefold()


def validate_case(case, requirements, source):
    issues = []
    valid_ids = {r["id"] for r in requirements}
    if any(x not in valid_ids for x in case["requirement_ids"]):
        issues.append("Unknown requirement ID")
    if normalize(case["source_quote"]) not in normalize(source):
        issues.append("Source quote is not present in the supplied evidence")
    if len(set((s["action"], s["expected"]) for s in case["steps"])) != len(
        case["steps"]
    ):
        issues.append("Duplicate test steps")
    key = case["automation_key"]
    data = case["test_data"]
    if key != "manual":
        if any(x not in data for x in ("username", "password")):
            issues.append("Automation needs username and password in test_data")
        allowed = {
            "username",
            "password",
            "expected_error",
            "product",
            "first_name",
            "last_name",
            "postal_code",
        }
        if set(data) - allowed:
            issues.append(
                "Unsupported automation data keys: "
                + ", ".join(sorted(set(data) - allowed))
            )
        if key in ("cart_add", "checkout") and not data.get("product"):
            issues.append("Cart/checkout automation needs an exact product name")
        if key == "checkout" and any(
            not data.get(x) for x in ("first_name", "last_name", "postal_code")
        ):
            issues.append("Checkout needs first_name, last_name and postal_code")
    return issues
