from __future__ import annotations

import gc
import logging
import threading
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Generator, Literal, Optional

from llama_cpp import Llama

from agent.config import LlamaConfig, ModelSpec, llama_config
from agent.core.model_downloader import ModelDownloader, model_downloader

logger = logging.getLogger(__name__)

ModelSlot = Literal["orchestrator", "executor"]


@dataclass(slots=True)
class LoadedModel:
    slot: ModelSlot
    path: Path
    llm: Llama
    gpu_layers: int


class ModelManager:

    def __init__(
        self,
        config: LlamaConfig | None = None,
        downloader: ModelDownloader | None = None,
    ) -> None:
        self._config = config or llama_config
        self._downloader = downloader or model_downloader
        self._lock = threading.RLock()
        self._loaded: Optional[LoadedModel] = None
        self._backend_usage: dict[ModelSlot, int] = {"orchestrator": -1, "executor": -1}

    def _instantiate(self, path: Path, gpu_layers: int) -> Llama:
        return Llama(
            model_path=str(path),
            n_ctx=self._config.context_size,
            n_gpu_layers=gpu_layers,
            n_batch=self._config.batch_size,
            seed=self._config.seed,
            chat_format="gemma",
            logits_all=False,
            verbose=False,
        )

    def _create_instance(self, path: Path) -> tuple[Llama, int]:
        logger.info("Loading model from %s", path)
        desired_layers = self._config.gpu_layers
        try:
            llm = self._instantiate(path, desired_layers)
            return llm, desired_layers
        except Exception as exc:
            if desired_layers <= 0:
                raise
            tried_fallback = True
            logger.warning(
                "Failed to load %s with GPU acceleration (%s). Falling back to CPU.",
                path.name,
                exc,
            )
        llm = self._instantiate(path, 0)
        return llm, 0

    def _load(self, slot: ModelSlot, spec: ModelSpec) -> Llama:
        with self._lock:
            if self._loaded and self._loaded.slot == slot:
                return self._loaded.llm

            self._release_locked()
            path = self._downloader.ensure(spec)
            llm, used_layers = self._create_instance(path)
            self._loaded = LoadedModel(slot=slot, path=path, llm=llm, gpu_layers=used_layers)
            self._backend_usage[slot] = used_layers
            return llm

    def _release_locked(self) -> None:
        if not self._loaded:
            return
        logger.info("Unloading model %s", self._loaded.path.name)
        try:
            self._loaded.llm.reset()
        except Exception:
            pass
        self._loaded = None
        gc.collect()

    def unload(self) -> None:
        with self._lock:
            self._release_locked()

    def get_orchestrator(self) -> Llama:
        return self._load("orchestrator", self._config.orchestrator)

    def get_executor(self) -> Llama:
        return self._load("executor", self._config.executor)

    @contextmanager
    def use(self, slot: ModelSlot) -> Generator[Llama, None, None]:
        llm = self.get_orchestrator() if slot == "orchestrator" else self.get_executor()
        try:
            yield llm
        finally:
            pass

    def backend_report(self) -> dict[ModelSlot, int]:
        return dict(self._backend_usage)


model_manager = ModelManager()

