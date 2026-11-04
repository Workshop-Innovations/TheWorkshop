"""
Shared rate limiter (slowapi), importable from main.py and route modules alike.

Anonymous endpoints (login, register, ...) are limited per client IP.
Authenticated endpoints (AI, chat, payments) are limited per *user*, so people
sharing a network (a school, an office) don't use up each other's allowance.

Every limited endpoint must take a `request: Request` parameter (slowapi needs it).
"""
import os
from typing import Optional

from fastapi import Request
from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address

from .dependencies import settings

# Behind a reverse proxy (e.g. Render) every request can appear to come from the
# proxy's IP. Set RATE_LIMIT_TRUST_FORWARDED=true to use the address the proxy
# reports instead (the right-most X-Forwarded-For entry, which the proxy appends
# and clients can't forge).
_TRUST_FORWARDED = os.getenv("RATE_LIMIT_TRUST_FORWARDED", "false").lower() == "true"


def client_ip(request: Request) -> str:
    if _TRUST_FORWARDED:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[-1].strip()
    return get_remote_address(request)


def _user_id_from_request(request: Request) -> Optional[str]:
    """Read the user id from the bearer token without touching the database.
    An invalid token just falls back to IP limiting; the endpoint itself still
    rejects it."""
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    try:
        payload = jwt.decode(auth[7:], settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    return payload.get("uid") or payload.get("sub")


def user_or_ip(request: Request) -> str:
    uid = _user_id_from_request(request)
    return f"user:{uid}" if uid else f"ip:{client_ip(request)}"


limiter = Limiter(key_func=client_ip)

# Limits from the efficiency plan
AI_LIMIT = "10/minute"        # each call costs Gemini credits
MESSAGE_LIMIT = "30/minute"   # community messages, replies, DMs
PAYMENT_LIMIT = "3/minute"    # Paystack initialize
UPLOAD_LIMIT = "10/minute"    # file uploads
