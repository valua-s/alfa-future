# Backend

### dev
```bash
cd backend
uv sync
uv run alembic upgrade head
uv run python -m app
```

### docker
```bash
docker compose up -d postgres backend
```

API: http://localhost:8000/alfa-future-assistaint  
Swagger: http://localhost:8000/alfa-future-assistaint/schema/swagger