from __future__ import annotations

import json
from pathlib import Path
from typing import List

import faiss
import numpy as np

from agent.config import DATA_DIR
from agent.core.embeddings import EmbeddingProvider, embeddings
from agent.tools.document_loader import DocumentLoader


class LegalRAGTool:

    name = "legal_retriever"
    description = (
        "Поиск по проиндексированным юридическим документам (index-documents) и выдача ключевых пунктов договоров."
    )

    def __init__(
        self,
        storage_dir: Path | None = None,
        embedder: EmbeddingProvider | None = None,
        loader: DocumentLoader | None = None,
    ) -> None:
        self.storage_dir = storage_dir or (DATA_DIR / "legal")
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.index_path = self.storage_dir / "legal.index"
        self.meta_path = self.storage_dir / "legal.meta.json"
        self._embedder = embedder or embeddings
        self._loader = loader or DocumentLoader()
        self._index: faiss.Index | None = None
        self._meta: List[dict] = []

    def index_documents(self, directory: str | Path) -> int:
        directory = Path(directory)
        if not directory.exists():
            raise FileNotFoundError(directory)

        docs = []
        for file in directory.rglob("*"):
            if file.is_file() and file.suffix.lower() in self._loader.SUPPORTED_SUFFIXES:
                docs.append(self._loader.load_file(file))

        if not docs:
            raise ValueError("В директории не найдено поддерживаемых документов")

        vectors = self._embedder.embed_documents([doc["text"] for doc in docs])
        matrix = np.array(vectors, dtype="float32")
        faiss.normalize_L2(matrix)

        index = faiss.IndexFlatIP(matrix.shape[1])
        index.add(matrix)
        faiss.write_index(index, str(self.index_path))
        self._index = index

        with self.meta_path.open("w", encoding="utf-8") as f:
            json.dump(docs, f, ensure_ascii=False, indent=2)
        self._meta = docs
        return len(docs)

    def _ensure_index(self) -> None:
        if self._index is not None and self._meta:
            return
        if not self.index_path.exists() or not self.meta_path.exists():
            raise RuntimeError("Индекс юридических документов пока не создан. Запустите команду index-documents.")
        self._index = faiss.read_index(str(self.index_path))
        with self.meta_path.open("r", encoding="utf-8") as f:
            self._meta = json.load(f)

    def search(self, query: str, k: int = 3) -> List[dict]:
        self._ensure_index()
        vector = np.array([self._embedder.embed_query(query)], dtype="float32")
        faiss.normalize_L2(vector)
        distances, indices = self._index.search(vector, min(k, len(self._meta)))
        results = []
        for score, idx in zip(distances[0], indices[0]):
            meta = self._meta[idx]
            results.append(
                {
                    "path": meta["path"],
                    "text": meta["text"][:2000],
                    "score": float(score),
                    "metadata": meta.get("metadata", {}),
                }
            )
        return results


legal_rag_tool = LegalRAGTool()


