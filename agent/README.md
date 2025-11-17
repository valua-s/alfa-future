# Agent CLI

## Установка

```bash
python -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\activate
pip install -r agent/requirements.txt
```

## Запуск

```bash
python -m agent.cli query "Запрос" --files path/to/file.xlsx
python -m agent.cli interactive
python -m agent.cli index-documents agent/data/legal
```

## Модели

```bash
python -m agent.cli models status
python -m agent.cli models download
```

По умолчанию веса сохраняются в `agent/models/`. Настраиваемые переменные: `MODEL_DIR`, `LLAMA_CTX`, `LLAMA_GPU_LAYERS`, `LLAMA_BATCH`.

