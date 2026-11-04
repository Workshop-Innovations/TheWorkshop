#!/usr/bin/env bash

# Production server: gunicorn managing ONE Uvicorn worker.
# One worker is required for live chat: each worker keeps its own list of
# connected WebSocket users, so with several workers a message only reaches
# the people connected to the same worker. One async worker still handles
# many requests at once. Do not raise -w unless Redis pub/sub is added.
exec gunicorn app.main:app -w 1 -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:${PORT:-8000} --timeout 120 --graceful-timeout 30
