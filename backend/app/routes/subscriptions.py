import os
import hmac
import hashlib
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Optional

from ..database import get_session
from ..schemas import User, PaymentTransaction
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/subscriptions",
    tags=["subscriptions"]
)

def get_paystack_key():
    key = os.getenv("PAYSTACK_SECRET_KEY")
    if not key or key == "sk_test_placeholder":
        raise HTTPException(
            status_code=500, 
            detail="Paystack secret key is not configured or still using placeholder."
        )
    return key

# Amounts in kobo (NGN x 100)
PLAN_PRICES = {
    "pro": 95000,       # ₦950
    "premium": 200000,  # ₦2,000
    "max": 450000       # ₦4,500
}

PLAN_LIMITS = {
    "basic":   {"ai_queries_daily": 5,   "name": "Basic"},
    "pro":     {"ai_queries_daily": 50,  "name": "Pro"},
    "premium": {"ai_queries_daily": -1,  "name": "Premium"},  # -1 = unlimited
    "max":     {"ai_queries_daily": -1,  "name": "Max"},
}


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """DB drivers may return naive datetimes (SQLite, TIMESTAMP WITHOUT TIME ZONE);
    treat those as UTC so comparisons with aware datetimes don't raise TypeError."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def is_subscription_expired(user: User) -> bool:
    expiry = _as_utc(user.subscription_expiry)
    return bool(
        user.subscription_tier != "basic"
        and expiry
        and expiry < datetime.now(timezone.utc)
    )


def effective_tier(user: User) -> str:
    """The tier the user is actually entitled to right now (expired plans count as basic)."""
    tier = user.subscription_tier or "basic"
    if tier not in PLAN_LIMITS or is_subscription_expired(user):
        return "basic"
    return tier


def _apply_payment(session: Session, user: User, reference: str, plan: str, amount: int,
                   customer_code: Optional[str]) -> bool:
    """Upgrade the user for a successful payment. Returns False if this reference
    was already applied (idempotency guard against replays and verify+webhook double-processing)."""
    already = session.exec(
        select(PaymentTransaction).where(PaymentTransaction.reference == reference)
    ).first()
    if already:
        return False

    # Extend from the current expiry if the plan is still active, so renewing early isn't lost time
    now = datetime.now(timezone.utc)
    current_expiry = _as_utc(user.subscription_expiry)
    base = current_expiry if (current_expiry and current_expiry > now and user.subscription_tier == plan) else now

    user.subscription_tier = plan
    user.subscription_expiry = base + timedelta(days=30)
    if customer_code:
        user.paystack_customer_id = customer_code

    session.add(PaymentTransaction(reference=reference, user_id=user.id, plan=plan, amount=amount))
    session.add(user)
    session.commit()
    session.refresh(user)
    return True


class InitializeRequest(BaseModel):
    plan: str  # "pro", "premium", "max"


@router.get("/plans")
async def get_plans():
    """Return available plans and pricing info (public endpoint)."""
    return {
        "plans": [
            {
                "id": "basic",
                "name": "Basic",
                "price": 0,
                "description": "Entry, free forever",
                "features": [
                    "5 AI Tutor queries per day",
                    "Access to select Past Papers",
                    "Basic Community Access",
                    "Study Timer & Task Manager",
                    "AI-Generated Flashcards (3/day)",
                ],
                "not_included": [
                    "Unlimited AI Tutor",
                    "Priority Support",
                    "Advanced Analytics",
                ],
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 950,
                "description": "The default paid tier",
                "features": [
                    "50 AI Tutor queries per day",
                    "All Past Papers & Content",
                    "Full Community Access",
                    "AI-Generated Flashcards (20/day)",
                    "Detailed Progress Analytics",
                    "Priority Community Support",
                    "\"Pro\" Member Badge",
                ],
                "not_included": [
                    "Unlimited AI Tutor",
                    "Priority Support",
                ],
            },
            {
                "id": "premium",
                "name": "Premium",
                "price": 2000,
                "description": "For serious study",
                "features": [
                    "Unlimited AI Tutor Access 24/7",
                    "All Past Papers & Content",
                    "Full Community + Priority Access",
                    "Unlimited AI Flashcard Generation",
                    "Advanced Progress Analytics",
                    "Custom Study Plans",
                    "Priority Email Support",
                    "\"Premium Scholar\" Badge",
                ],
                "not_included": [],
            },
            {
                "id": "max",
                "name": "Max",
                "price": 4500,
                "description": "Everything unlocked",
                "features": [
                    "Everything in Premium",
                    "Dedicated Study Coach (AI)",
                    "VIP Community Status",
                    "Early Access to New Features",
                    "Priority Human Support",
                    "\"Max\" Exclusive Badge",
                    "Custom AI Persona Settings",
                ],
                "not_included": [],
            },
        ]
    }


@router.post("/initialize")
async def initialize_payment(
    request: InitializeRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Initialize a Paystack payment transaction."""
    plan = request.plan.lower()
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan selected")

    amount = PLAN_PRICES[plan]
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    paystack_key = get_paystack_key()

    headers = {
        "Authorization": f"Bearer {paystack_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "email": current_user.email,
        "amount": amount,
        "currency": "NGN",
        "metadata": {
            "user_id": current_user.id,
            "plan_id": plan,
            "cancel_action": f"{frontend_url}/pricing",
        },
        "callback_url": f"{frontend_url}/pricing?status=success",
    }

    # If the user selects a recurring plan, attach the Paystack Plan code
    plan_code = None
    if plan == "pro":
        plan_code = os.getenv("PAYSTACK_PLAN_PRO")
    elif plan == "premium":
        plan_code = os.getenv("PAYSTACK_PLAN_PREMIUM")
    elif plan == "max":
        plan_code = os.getenv("PAYSTACK_PLAN_MAX")

    if plan_code and not plan_code.startswith("PLN_placeholder"):
        payload["plan"] = plan_code

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.paystack.co/transaction/initialize",
            headers=headers,
            json=payload,
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to initialize Paystack payment: {response.text}",
        )

    data = response.json()
    return {
        "authorization_url": data["data"]["authorization_url"],
        "reference": data["data"]["reference"],
        "access_code": data["data"]["access_code"],
    }


@router.get("/verify/{reference}")
async def verify_payment(
    reference: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Verify a Paystack transaction by reference and upgrade the user's plan."""
    paystack_key = get_paystack_key()
    headers = {"Authorization": f"Bearer {paystack_key}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers=headers,
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Payment verification failed")

    data = response.json()
    tx = data.get("data") or {}

    if tx.get("status") != "success":
        return {"status": "failed", "message": "Payment was not successful"}

    # Extract plan from metadata
    metadata = tx.get("metadata") or {}
    plan = metadata.get("plan_id") or metadata.get("plan")
    user_id = metadata.get("user_id")

    # Security: the payment must have been initialized by this account. A missing
    # user_id is rejected too, otherwise any successful reference could be claimed.
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Payment does not belong to this account")

    if not plan or plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Payment is not for a recognised plan")

    amount = int(tx.get("amount") or 0)
    if amount < PLAN_PRICES[plan] or tx.get("currency", "NGN") != "NGN":
        raise HTTPException(status_code=400, detail="Payment amount does not match the selected plan")

    applied = _apply_payment(
        session, current_user, tx.get("reference") or reference, plan, amount,
        (tx.get("customer") or {}).get("customer_code"),
    )

    if not applied:
        session.refresh(current_user)

    return {
        "status": "success",
        "message": f"Payment verified. Your plan has been upgraded to {plan}.",
        "tier": current_user.subscription_tier,
        "expiry": current_user.subscription_expiry,
    }


@router.get("/status")
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
):
    """Return the current user's subscription status and limits."""
    # Downgrade expired subscriptions on the fly
    tier = effective_tier(current_user)

    return {
        "tier": tier,
        "expiry": current_user.subscription_expiry,
        "is_expired": is_subscription_expired(current_user),
        "limits": PLAN_LIMITS.get(tier),
        "ai_queries_used_today": current_user.ai_queries_today,
    }


@router.post("/webhook")
async def paystack_webhook(request: Request, session: Session = Depends(get_session)):
    """Handle Paystack webhook events (e.g., charge.success)."""
    raw_body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    # Verify webhook signature
    paystack_key = get_paystack_key()
    expected_sig = hmac.new(
        paystack_key.encode("utf-8"), raw_body, hashlib.sha512
    ).hexdigest()

    if not hmac.compare_digest(signature.encode(), expected_sig.encode()):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload = await request.json()
    event = payload.get("event")

    if event == "charge.success":
        data = payload.get("data") or {}
        # Paystack sends metadata as "" when none was attached
        metadata = data.get("metadata") or {}
        plan_id = metadata.get("plan_id") or metadata.get("plan")
        user_id = metadata.get("user_id")
        customer_email = (data.get("customer") or {}).get("email")

        user = None
        if user_id:
            user = session.exec(select(User).where(User.id == user_id)).first()
        if not user:
            # Try matching by stored Paystack customer ID for recurring charges
            customer_code = (data.get("customer") or {}).get("customer_code")
            if customer_code:
                user = session.exec(
                    select(User).where(User.paystack_customer_id == customer_code)
                ).first()

        if user:
            # Determine plan from paystack plan code if metadata plan_id is missing
            paystack_plan_code = data.get("plan", {}).get("plan_code") if isinstance(data.get("plan"), dict) else data.get("plan")
            
            if not plan_id and paystack_plan_code:
                 if paystack_plan_code == os.getenv("PAYSTACK_PLAN_PRO"): plan_id = "pro"
                 elif paystack_plan_code == os.getenv("PAYSTACK_PLAN_PREMIUM"): plan_id = "premium"
                 elif paystack_plan_code == os.getenv("PAYSTACK_PLAN_MAX"): plan_id = "max"
            
            # If still no plan_id, renew current active tier, else default to pro
            if not plan_id or plan_id not in PLAN_PRICES:
                 plan_id = user.subscription_tier if user.subscription_tier != "basic" else "pro"

            reference = data.get("reference")
            if reference:
                _apply_payment(
                    session, user, reference, plan_id, int(data.get("amount") or 0),
                    (data.get("customer") or {}).get("customer_code"),
                )

    return {"status": "success"}
