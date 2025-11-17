from __future__ import annotations

from pathlib import Path
from typing import List, Sequence

import pandas as pd
from docx import Document as DocxDocument
from pypdf import PdfReader


class DocumentLoader:

    SUPPORTED_SUFFIXES = {".csv", ".tsv", ".xlsx", ".xls", ".pdf", ".docx", ".txt"}

    def __init__(self, max_rows: int = 200) -> None:
        self.max_rows = max_rows

    def load_many(self, paths: Sequence[str | Path]) -> List[dict]:
        contexts = []
        for path in paths:
            try:
                contexts.append(self.load_file(path))
            except Exception as exc:
                contexts.append(
                    {
                        "path": str(path),
                        "text": "",
                        "metadata": {"error": str(exc)},
                    }
                )
        return contexts

    def load_file(self, path: str | Path) -> dict:
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(path)

        suffix = path.suffix.lower()
        if suffix not in self.SUPPORTED_SUFFIXES:
            raise ValueError(f"Unsupported file type: {suffix}")

        if suffix in {".csv", ".tsv"}:
            return self._read_dataframe(pd.read_csv(path, nrows=self.max_rows), path)
        if suffix in {".xlsx", ".xls"}:
            return self._read_dataframe(pd.read_excel(path, nrows=self.max_rows), path)
        if suffix == ".pdf":
            return self._read_pdf(path)
        if suffix == ".docx":
            return self._read_docx(path)

        # plain text fallback
        return {
            "path": str(path),
            "text": path.read_text(encoding="utf-8"),
            "metadata": {"type": "text"},
        }

    def _read_dataframe(self, df: pd.DataFrame, path: Path) -> dict:
        preview = df.head(self.max_rows)
        preview = preview.fillna("")
        text = preview.to_csv(index=False)
        stats = {
            "columns": list(preview.columns),
            "row_count": len(preview),
            "dtype": {c: str(preview[c].dtype) for c in preview.columns},
        }
        return {
            "path": str(path),
            "text": text,
            "metadata": {"type": "table", "stats": stats},
        }

    def _read_pdf(self, path: Path) -> dict:
        reader = PdfReader(str(path))
        pages = []
        for page in reader.pages[:20]:
            pages.append(page.extract_text() or "")
        return {
            "path": str(path),
            "text": "\n".join(pages),
            "metadata": {"type": "pdf", "pages": len(pages)},
        }

    def _read_docx(self, path: Path) -> dict:
        doc = DocxDocument(str(path))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return {
            "path": str(path),
            "text": "\n".join(paragraphs),
            "metadata": {"type": "docx", "paragraphs": len(paragraphs)},
        }


document_loader = DocumentLoader()


