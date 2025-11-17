from __future__ import annotations

import threading
from typing import Iterable, List

import numpy as np
from sentence_transformers import SentenceTransformer

from agent.config import llama_config


class EmbeddingProvider:

    def __init__(self, model_name: str | None = None) -> None:
        self.model_name = model_name or llama_config.embed_model_name
        self._model: SentenceTransformer | None = None
        self._lock = threading.RLock()

    def _ensure_model(self) -> SentenceTransformer:
        with self._lock:
            if self._model is None:
                self._model = SentenceTransformer(self.model_name, device="cpu")
            return self._model

    def embed_documents(self, texts: Iterable[str]) -> List[List[float]]:
        model = self._ensure_model()
        vectors = model.encode(
            list(texts),
            convert_to_numpy=True,
            normalize_embeddings=True,
            batch_size=32,
        )
        return vectors.astype(np.float32).tolist()

    def embed_query(self, text: str) -> List[float]:
        model = self._ensure_model()
        vector = model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        return vector.astype(np.float32).tolist()


embeddings = EmbeddingProvider()


