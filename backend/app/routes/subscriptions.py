import os
import hmac
import hashlib
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone

from ..database import get_session
from ..schemas import User
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/subscriptions",
    tags=["subscriptions"]
)

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "sk_test_placeholder")

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
                "description": "Entry — free forever",
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

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "email": current_user.email,
        "amount": amount,
        "currency": "NGN",
        "metadata": {
            "user_id": current_user.id,
            "plan": plan,
            "cancel_action": f"{frontend_url}/pricing",
        },
        "callback_url": f"{frontend_url}/pricing?status=success&ref={{reference}}",
    }

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
    headers = {"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers=headers,
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Payment verification failed")

    data = response.json()

    if data["data"]["status"] != "success":
        return {"status": "failed", "message": "Payment was not successful"}

    # Extract plan from metadata
    metadata = data["data"].get("metadata", {})
    plan = metadata.get("plan")
    user_id = metadata.get("user_id")

    # Security: ensure the verified payment belongs to the current user
    if user_id and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Payment does not belong to this account")

    if plan and plan in PLAN_PRICES:
        current_user.subscription_tier = plan
        current_user.subscription_expiry = datetime.now(timezone.utc) + timedelta(days=30)
        # Store Paystack customer code if available
        customer = data["data"].get("customer", {})
        if customer.get("customer_code"):
            current_user.paystack_customer_id = customer["customer_code"]

        session.add(current_user)
        session.commit()
        session.refresh(current_user)

    return {
        "status": "success",
        "message": f"Payment verified. Your plan has been upgraded to {plan}.",
        "tier": plan,
        "expiry": current_user.subscription_expiry,
    }


@router.get("/status")
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
):
    """Return the current user's subscription status and limits."""
    limits = PLAN_LIMITS.get(current_user.subscription_tier, PLAN_LIMITS["basic"])
    is_expired = (
        current_user.subscription_expiry
        and current_user.subscription_expiry < datetime.now(timezone.utc)
        and current_user.subscription_tier != "basic"
    )

    # Downgrade expired subscriptions on the fly
    effective_tier = current_user.subscription_tier
    if is_expired:
        effective_tier = "basic"

    return {
        "tier": effective_tier,
        "expiry": current_user.subscription_expiry,
        "is_expired": is_expired,
        "limits": PLAN_LIMITS.get(effective_tier),
        "ai_queries_used_today": current_user.ai_queries_today,
    }


@router.post("/webhook")
async def paystack_webhook(request: Request, session: Session = Depends(get_session)):
    """Handle Paystack webhook events (e.g., charge.success)."""
    raw_body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    # Verify webhook signature
    expected_sig = hmac.new(
        PAYSTACK_SECRET_KEY.encode("utf-8"), raw_body, hashlib.sha512
    ).hexdigest()

    if signature != expected_sig:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload = await request.json()
    event = payload.get("event")

    if event == "charge.success":
        data = payload.get("data", {})
        metadata = data.get("metadata", {})
        plan = metadata.get("plan")
        user_id = metadata.get("user_id")

        if user_id and plan and plan in PLAN_PRICES:
            from sqlmodel import select
            user = session.exec(select(User).where(User.id == user_id)).first()
            if user:
                user.subscription_tier = plan
                user.subscription_expiry = datetime.now(timezone.utc) + timedelta(days=30)
                session.add(user)
                session.commit()

    return {"status": "success"}
