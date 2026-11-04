"""
Tiny in-memory TTL cache for read-mostly data (subjects, topics, papers).

Each gunicorn worker has its own copy. Admin writes clear the cache in the worker
that handled them; the other workers pick up the change when their entry expires
(CONTENT_CACHE_TTL seconds, default 300). Set CONTENT_CACHE_TTL=0 to disable.
"""
import os
import time
import threading
from typing import Any, Callable

CONTENT_CACHE_TTL = int(os.getenv("CONTENT_CACHE_TTL", "300"))

_store: dict = {}
_lock = threading.Lock()


def cached(key: str, loader: Callable[[], Any], ttl: int = CONTENT_CACHE_TTL) -> Any:
    """Return the cached value for `key`, or call `loader()` and cache its result."""
    if ttl <= 0:
        return loader()
    now = time.monotonic()
    with _lock:
        hit = _store.get(key)
        if hit and hit[0] > now:
            return hit[1]
    value = loader()
    with _lock:
        _store[key] = (now + ttl, value)
    return value


def invalidate(prefix: str = "") -> None:
    """Drop every entry whose key starts with `prefix` ("" clears everything)."""
    with _lock:
        for key in [k for k in _store if k.startswith(prefix)]:
            del _store[key]


CONTENT_PREFIX = "content:"


def invalidate_content() -> None:
    """Call after any change to subjects, topics or past papers."""
    invalidate(CONTENT_PREFIX)
