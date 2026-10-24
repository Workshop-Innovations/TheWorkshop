#!/usr/bin/env bash

# Use gunicorn with uvicorn workers for production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000}
