# AlfaHack CoPilot

> ИИ-ассистент: Backend (Litestar), Frontend (React + Bun), Agent (LangGraph + Gemma).

## Запуск всего стека (Docker)

```bash
git clone https://github.com/SaltyFrappuccino/AlfaHack-CoPilot.git
cd AlfaHack-CoPilot
docker compose up -d
```

Открыть http://localhost:3000

## Локальная разработка

```bash
# Backend + агент
cd backend
uv sync
uv run python -m app

# Frontend
cd ../web
bun install
bun dev
```

- Backend API: http://localhost:8000/alfa-future-assistaint
- Swagger: http://localhost:8000/alfa-future-assistaint/schema/swagger
- WebSocket: ws://localhost:8000/alfa-future-assistaint/api/agent/ws

