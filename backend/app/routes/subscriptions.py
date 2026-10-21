import os
import hmac
import hashlib
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from ..database import get_session
from ..models import User
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])


def get_paystack_key():
    key = os.getenv("PAYSTACK_SECRET_KEY")
    if not key or key == "sk_test_placeholder":
        raise HTTPException(
            status_code=500,
            detail="Paystack secret key is not configured or still using placeholder.",
        )
    return key


from ..schemas.billing import InitializeRequest
from ..services.subscriptions import (
    _apply_payment,
    PLAN_PRICES,
    PLAN_LIMITS,
    effective_tier,
    is_subscription_expired,
)


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
                    '"Pro" Member Badge',
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
                    '"Premium Scholar" Badge',
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
                    '"Max" Exclusive Badge',
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

    metadata = tx.get("metadata") or {}
    plan = metadata.get("plan_id") or metadata.get("plan")
    user_id = metadata.get("user_id")

    if user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Payment does not belong to this account"
        )

    if not plan or plan not in PLAN_PRICES:
        raise HTTPException(
            status_code=400, detail="Payment is not for a recognised plan"
        )

    amount = int(tx.get("amount") or 0)
    if amount < PLAN_PRICES[plan] or tx.get("currency", "NGN") != "NGN":
        raise HTTPException(
            status_code=400, detail="Payment amount does not match the selected plan"
        )

    _apply_payment(
        session,
        current_user,
        tx.get("reference") or reference,
        plan,
        amount,
        (tx.get("customer") or {}).get("customer_code"),
    )

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

        metadata = data.get("metadata") or {}
        plan_id = metadata.get("plan_id") or metadata.get("plan")
        user_id = metadata.get("user_id")
        customer_email = (data.get("customer") or {}).get("email")

        user = None
        if user_id:
            user = session.exec(select(User).where(User.id == user_id)).first()
        if not user and customer_email:

            user = session.exec(
                select(User).where(User.email == customer_email)
            ).first()

        if user:

            paystack_plan_code = (
                data.get("plan", {}).get("plan_code")
                if isinstance(data.get("plan"), dict)
                else data.get("plan")
            )

            if not plan_id and paystack_plan_code:
                if paystack_plan_code == os.getenv("PAYSTACK_PLAN_PRO"):
                    plan_id = "pro"
                elif paystack_plan_code == os.getenv("PAYSTACK_PLAN_PREMIUM"):
                    plan_id = "premium"
                elif paystack_plan_code == os.getenv("PAYSTACK_PLAN_MAX"):
                    plan_id = "max"

            if not plan_id or plan_id not in PLAN_PRICES:
                plan_id = (
                    user.subscription_tier
                    if user.subscription_tier != "basic"
                    else "pro"
                )

            reference = data.get("reference")
            if reference:
                _apply_payment(
                    session,
                    user,
                    reference,
                    plan_id,
                    int(data.get("amount") or 0),
                    (data.get("customer") or {}).get("customer_code"),
                )

    return {"status": "success"}
