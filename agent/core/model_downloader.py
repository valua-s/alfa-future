from __future__ import annotations

import inspect
import logging
import shutil
from pathlib import Path
from typing import Optional

from huggingface_hub import hf_hub_download

from agent.config import LlamaConfig, ModelSpec, llama_config

try:
    from tqdm.rich import tqdm as rich_tqdm
except ImportError:
    rich_tqdm = None

logger = logging.getLogger(__name__)
_hf_supports_tqdm = "tqdm_class" in inspect.signature(hf_hub_download).parameters
_rich_tqdm_factory = None

if rich_tqdm is not None and _hf_supports_tqdm:

    def _make_rich_tqdm(*args, **kwargs):
        kwargs.setdefault("leave", False)
        kwargs.setdefault("dynamic_ncols", True)
        kwargs.setdefault("colour", "cyan")
        return rich_tqdm(*args, **kwargs)

    _rich_tqdm_factory = _make_rich_tqdm


class ModelDownloader:

    def __init__(self, config: LlamaConfig | None = None) -> None:
        self.config = config or llama_config

    def ensure(self, spec: ModelSpec, *, progress: bool = False) -> Path:

        target = self.config.base_dir / spec.filename
        if target.exists():
            return target

        logger.info("Downloading %s from %s", spec.filename, spec.repo_id)
        kwargs = {
            "repo_id": spec.repo_id,
            "filename": spec.repo_file,
            "local_dir": self.config.base_dir,
            "local_dir_use_symlinks": False,
            "force_download": True,
            "resume_download": True,
            "token": None,
        }
        if _rich_tqdm_factory:
            kwargs["tqdm_class"] = _rich_tqdm_factory

        try:
            temp_path = hf_hub_download(**kwargs)
        except TypeError:
            if "tqdm_class" in kwargs:
                kwargs.pop("tqdm_class", None)
                temp_path = hf_hub_download(**kwargs)
            else:
                raise
        downloaded = Path(temp_path)
        if downloaded != target:
            shutil.move(str(downloaded), target)
        return target


model_downloader = ModelDownloader()


