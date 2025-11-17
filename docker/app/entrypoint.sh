#!/usr/bin/env bash

set -euo pipefail

wait-for-it "${ALFA_FUTURE_SERVICE_POSTGRES_HOST}:${ALFA_FUTURE_SERVICE_POSTGRES_PORT}"

exec "$@"
