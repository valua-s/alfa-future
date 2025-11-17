from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"


@dataclass(slots=True)
class LangSmithConfig:
    """Configuration for LangSmith observability."""

    api_key: str | None = os.getenv("LANGCHAIN_API_KEY")
    project: str = os.getenv("LANGCHAIN_PROJECT", "alpha-agent")
    tracing_v2: bool = os.getenv("LANGCHAIN_TRACING_V2", "true").lower() in {"1", "true", "yes"}
    endpoint: str | None = os.getenv("LANGCHAIN_ENDPOINT")

    def apply(self) -> None:
        """Ensure required env vars are set for LangSmith SDK."""

        tracing_enabled = self.tracing_v2 and bool(self.api_key)
        os.environ["LANGCHAIN_TRACING_V2"] = "true" if tracing_enabled else "false"
        os.environ.setdefault("LANGCHAIN_PROJECT", self.project)

        if not tracing_enabled:
            # Без API-ключа LangSmith не нужен — убираем шум в консоли.
            return

        os.environ.setdefault("LANGCHAIN_API_KEY", self.api_key or "")
        if self.endpoint:
            os.environ.setdefault("LANGCHAIN_ENDPOINT", self.endpoint)


@dataclass(slots=True)
class ModelSpec:
    """Descriptor of a GGUF artifact hosted on Hugging Face."""

    filename: str
    repo_id: str
    repo_file: str


def _spec_from_env(prefix: str, default_repo: str, default_file: str) -> ModelSpec:
    return ModelSpec(
        filename=os.getenv(f"{prefix}_FILE", default_file),
        repo_id=os.getenv(f"{prefix}_REPO", default_repo),
        repo_file=os.getenv(f"{prefix}_REPO_FILE", default_file),
    )


@dataclass(slots=True)
class LlamaConfig:
    """Configuration block used by the new llama.cpp runtime."""

    base_dir: Path = Path(os.getenv("MODEL_DIR", ROOT_DIR / "models"))
    context_size: int = int(os.getenv("LLAMA_CTX", "8192"))
    gpu_layers: int = int(os.getenv("LLAMA_GPU_LAYERS", "35"))
    batch_size: int = int(os.getenv("LLAMA_BATCH", "512"))
    seed: int = int(os.getenv("LLAMA_SEED", "1337"))

    orchestrator: ModelSpec = field(
        default_factory=lambda: _spec_from_env(
            "ORCHESTRATOR_MODEL",
            default_repo="bartowski/gemma-2-9b-it-GGUF",
            default_file="gemma-2-9b-it-Q4_K_M.gguf",
        )
    )
    executor: ModelSpec = field(
        default_factory=lambda: _spec_from_env(
            "EXECUTOR_MODEL",
            default_repo="bartowski/gemma-3-4b-it-GGUF",
            default_file="gemma-3-4b-it-Q4_K_M.gguf",
        )
    )
    embed_model_name: str = os.getenv("EMBEDDER_MODEL", "sentence-transformers/all-MiniLM-L6-v2")


langsmith_config = LangSmithConfig()
llama_config = LlamaConfig()


def bootstrap_environment() -> None:
    """Call once at process start to apply global settings."""

    langsmith_config.apply()
    llama_config.base_dir.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    os.environ.setdefault("HF_HUB_ENABLE_HF_TRANSFER", "1")
    # Prefer UTF-8 encoding for consistent CLI output
    os.environ.setdefault("PYTHONUTF8", "1")


