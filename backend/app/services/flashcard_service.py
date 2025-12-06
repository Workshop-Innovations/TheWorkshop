import os
import httpx
from fastapi import HTTPException, status
from ..schemas import FlashcardContent

MAKE_WEBHOOK_URL = os.getenv("MAKE_FLASHCARD_WEBHOOK")
MAKE_VERIFICATION_TOKEN = os.getenv("MAKE_VERIFICATION_TOKEN", "default-secret-token")


async def fetch_cards_from_file(file_url: str, file_name: str, user_id: str) -> list[FlashcardContent]:
    """
    Fetches generated flashcards from Make.com webhook using a file URL.
    """
    if not MAKE_WEBHOOK_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Make.com Webhook URL is not configured."
        )

    payload = {
        "file_url": file_url,
        "file_name": file_name,
        "user_id": user_id,
        "verification_token": MAKE_VERIFICATION_TOKEN
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(MAKE_WEBHOOK_URL, json=payload, timeout=60.0) # Longer timeout for file processing
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Make.com returned an error: {e.response.status_code}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to connect to Make.com: {str(e)}"
            )

    try:
        data = response.json()
        # Expected: { "cards": [ { "term": "...", "definition": "..." }, ... ] }
        
        cards_data = data.get("cards", [])
        validated_cards = [FlashcardContent(**c) for c in cards_data]
        return validated_cards
        
    except Exception as e:
        # Capture raw text for debugging
        raw_text = response.text
        print(f"DEBUG: Raw response from Make.com: {raw_text}") # Log to console
        
        detail_msg = f"Invalid response from Make.com: {str(e)}"
        if "Expecting value" in str(e):
             detail_msg += f". Raw response was: '{raw_text[:200]}'" # Show first 200 chars

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail_msg
        )
