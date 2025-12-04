import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseModel):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-for-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Prioritize DATABASE_URL from environment for production, fallback to SQLite for local dev
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database.db") # Default to SQLite for local
    
    # FIX: Use FRONTEND_URLS to support local dev and live Render URL (comma-separated)
    FRONTEND_URLS: str = os.getenv("FRONTEND_URLS", "http://localhost:5173,http://localhost:3000") 

settings = Settings()
