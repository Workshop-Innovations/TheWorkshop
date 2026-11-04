"""
Outgoing email over SMTP, plus email-verification tokens.

Configure with environment variables:
    SMTP_HOST, SMTP_PORT (default 587), SMTP_USERNAME, SMTP_PASSWORD,
    SMTP_FROM_EMAIL, SMTP_FROM_NAME (default "The Workshop"),
    SMTP_USE_SSL ("true" for port 465; otherwise STARTTLS is used),
    APP_URL (public frontend URL used in links, e.g. https://workshop.com.ng)

While SMTP_HOST is unset, email verification is switched off: new accounts are
marked verified immediately so sign-ups keep working.
"""
import os
import ssl
import smtplib
import logging
from html import escape
from email.message import EmailMessage
from email.utils import formataddr
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

from .dependencies import settings

logger = logging.getLogger(__name__)

VERIFY_TOKEN_TYPE = "verify_email"
VERIFY_TOKEN_HOURS = 24


def smtp_configured() -> bool:
    return bool(os.getenv("SMTP_HOST"))


def email_verification_enabled() -> bool:
    return smtp_configured()


def app_url() -> str:
    url = os.getenv("APP_URL") or settings.FRONTEND_URLS.split(",")[0]
    return url.strip().rstrip("/")


# --- Tokens ---
def create_verification_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=VERIFY_TOKEN_HOURS)
    # Binding the email means the link stops working if the address changes.
    payload = {"uid": user_id, "email": email, "type": VERIFY_TOKEN_TYPE, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_verification_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != VERIFY_TOKEN_TYPE or not payload.get("uid"):
        return None
    return payload


# --- Sending ---
def send_email(to: str, subject: str, text_body: str, html_body: Optional[str] = None) -> bool:
    if not smtp_configured():
        logger.warning("SMTP is not configured; not sending email '%s' to %s", subject, to)
        return False

    host = os.getenv("SMTP_HOST")
    use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
    port = int(os.getenv("SMTP_PORT", "465" if use_ssl else "587"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL") or username
    from_name = os.getenv("SMTP_FROM_NAME", "The Workshop")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, from_email))
    msg["To"] = to
    msg.set_content(text_body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    context = ssl.create_default_context()
    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, context=context, timeout=20) as server:
                if username:
                    server.login(username, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=20) as server:
                server.starttls(context=context)
                if username:
                    server.login(username, password)
                server.send_message(msg)
        logger.info("Sent email '%s' to %s", subject, to)
        return True
    except Exception:
        logger.exception("Failed to send email '%s' to %s", subject, to)
        return False


def send_verification_email(user_id: str, email: str, username: str) -> bool:
    link = f"{app_url()}/verify-email?token={create_verification_token(user_id, email)}"
    text = (
        f"Hi {username},\n\n"
        "Welcome to The Workshop! Please confirm your email address by opening this link:\n\n"
        f"{link}\n\n"
        f"The link expires in {VERIFY_TOKEN_HOURS} hours. "
        "If you didn't create an account, you can ignore this email.\n"
    )
    html = f"""\
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
  <h2 style="margin:0 0 16px">Confirm your email</h2>
  <p>Hi {escape(username)},</p>
  <p>Welcome to Workshop! Click the button below to confirm your email address.</p>
  <p style="margin:28px 0">
    <a href="{escape(link)}" style="background:#0f172a;color:#ffffff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold">Verify email</a>
  </p>
  <p style="font-size:13px;color:#64748b">Or paste this link into your browser:<br>{escape(link)}</p>
  <p style="font-size:13px;color:#64748b">The link expires in {VERIFY_TOKEN_HOURS} hours. If you didn't create an account, you can ignore this email.</p>
</div>"""
    return send_email(email, "Verify your email for The Workshop", text, html)


# --- Password reset ---
RESET_TOKEN_TYPE = "reset_password"
RESET_TOKEN_MINUTES = 60


def _password_fingerprint(hashed_password: Optional[str]) -> str:
    # Part of the current hash: once the password changes, older reset links
    # stop matching, so each link works only once.
    return (hashed_password or "")[-16:]


def create_reset_token(user_id: str, email: str, hashed_password: Optional[str]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_MINUTES)
    payload = {
        "uid": user_id,
        "email": email,
        "pw": _password_fingerprint(hashed_password),
        "type": RESET_TOKEN_TYPE,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_reset_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != RESET_TOKEN_TYPE or not payload.get("uid"):
        return None
    return payload


def reset_token_matches(payload: dict, email: str, hashed_password: Optional[str]) -> bool:
    return payload.get("email") == email and payload.get("pw") == _password_fingerprint(hashed_password)


def send_password_reset_email(user_id: str, email: str, username: str, hashed_password: Optional[str]) -> bool:
    link = f"{app_url()}/reset-password?token={create_reset_token(user_id, email, hashed_password)}"
    text = (
        f"Hi {username},\n\n"
        "We received a request to set a new password for your Workshop account. "
        "Open this link to choose one:\n\n"
        f"{link}\n\n"
        f"The link expires in {RESET_TOKEN_MINUTES} minutes and works once. "
        "If you didn't ask for this, you can ignore this email; your password won't change.\n"
    )
    html = f"""\
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
  <h2 style="margin:0 0 16px">Set a new password</h2>
  <p>Hi {escape(username)},</p>
  <p>We received a request to set a new password for your Workshop account.</p>
  <p style="margin:28px 0">
    <a href="{escape(link)}" style="background:#0f172a;color:#ffffff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold">Choose a new password</a>
  </p>
  <p style="font-size:13px;color:#64748b">Or paste this link into your browser:<br>{escape(link)}</p>
  <p style="font-size:13px;color:#64748b">The link expires in {RESET_TOKEN_MINUTES} minutes and works once. If you didn't ask for this, you can ignore this email; your password won't change.</p>
</div>"""
    return send_email(email, "Set a new password for The Workshop", text, html)
