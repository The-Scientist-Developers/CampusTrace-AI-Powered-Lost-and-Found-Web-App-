
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator
from typing import List, Optional

class Settings(BaseSettings):
    PYTHON_SUPABASE_URL: str
    PYTHON_SUPABASE_KEY: str
    GEMINI_API_KEY: Optional[str] = None
    EMAIL_CONFIRM_REDIRECT: str = "http://localhost:5173/dashboard"
    RESEND_API_KEY: Optional[str] = None # <-- Add this line
    RESEND_SENDER_EMAIL: str = "CampusTrace <noreply@yourdomain.com>"
    RECAPTCHA_SECRET_KEY: Optional[str] = None
    PRELOAD_MODELS: bool = False
    CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost:5173", "http://127.0.0.1:5173", "https://campustrace.site"]
    DEBUG: bool = False
    EMAIL_CONFIRM_REDIRECT: str = "http://localhost:5173/dashboard"
    PENDING_APPROVAL_REDIRECT: str = "http://localhost:5173/pending-approval"

    class Config:   
        env_file = ".env"
        env_file_encoding = "utf-8"

    @validator("CORS_ORIGINS", pre=True)
    def _split_cors(cls, v):
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

@lru_cache()
def get_settings() -> Settings:
    return Settings()