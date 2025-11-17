# syntax=docker.io/docker/dockerfile:1

FROM docker.io/node:lts-bookworm-slim AS node-build

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    --mount=source=package.json,target=package.json \
    --mount=source=package-lock.json,target=package-lock.json \
    --mount=source=swagger.mjs,target=swagger.mjs \
    npm ci --omit=dev \
    && node swagger.mjs \
    && rm -rf node_modules


FROM docker.io/python:3.13-slim-bookworm AS base

ENV \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN rm -f /etc/apt/apt.conf.d/docker-clean \
    && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache


FROM base AS builder

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update \
    && apt-get install -y --no-install-recommends build-essential

ENV \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0

RUN --mount=from=ghcr.io/astral-sh/uv,source=/uv,target=/bin/uv \
    --mount=type=cache,target=/root/.cache/uv,sharing=locked \
    --mount=source=pyproject.toml,target=pyproject.toml \
    --mount=source=uv.lock,target=uv.lock \
    uv sync --no-dev --no-install-project --locked


FROM base AS final

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update \
    && apt-get install -y --no-install-recommends wait-for-it

ARG \
    UID=1000 \
    GID=1000

RUN groupadd --gid "${GID}" app \
    && useradd --gid "${GID}" --no-log-init --uid "${UID}" app

COPY --from=node-build --chown=${UID}:${GID} --link /app/dist /app/static
COPY --from=builder --chown=${UID}:${GID} --link /app/.venv /app/.venv

ENV PATH="/app/.venv/bin:$PATH"

USER app:app

COPY --chown=${UID}:${GID} --link . .

ENTRYPOINT ["bash", "/app/docker/app/entrypoint.sh"]

CMD ["bash", "/app/docker/app/start.sh"]
