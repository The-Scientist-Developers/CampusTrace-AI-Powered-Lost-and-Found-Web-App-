# app/config.py
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import List, Optional, Union

class Settings(BaseSettings):
    PYTHON_SUPABASE_URL: str
    PYTHON_SUPABASE_KEY: str

    GEMINI_API_KEY: Optional[str] = None 

    JINA_API_KEY: Optional[str] = None

    RESEND_API_KEY: Optional[str] = None
    RESEND_SENDER_EMAIL: str = "CampusTrace <noreply@campustrace.site>"
    RECAPTCHA_SECRET_KEY: Optional[str] = None
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:5173", "http://127.0.0.1:5173", "https://campustrace.site"]
    DEBUG: bool = False
    EMAIL_CONFIRM_REDIRECT: Union[str, List[str]] = ["http://localhost:5173/confirm-email", "https://campustrace.site/confirm-email"]
    PENDING_APPROVAL_REDIRECT_URL: Union[str, List[str]] = ["http://localhost:5173/pending-approval", "https://campustrace.site/pending-approval"]
    
    MAX_ID_IMAGE_SIZE: int = 10485760  # 10MB in bytes
    MAX_IMAGE_SIZE: int = Field(5242880, env="MAX_IMAGE_SIZE")

    class Config:   
        env_file = ".env"
        env_file_encoding = "utf-8"

    @field_validator("CORS_ORIGINS", "EMAIL_CONFIRM_REDIRECT", "PENDING_APPROVAL_REDIRECT_URL", mode='before')
    @classmethod
    def _split_comma_separated_list(cls, v):
        """Splits a comma-separated string from .env into a list of strings, or wraps single string in list."""
        if isinstance(v, str):
            if ',' in v:
                return [x.strip() for x in v.split(",") if x.strip()]
            return [v.strip()] if v.strip() else []
        return v

@lru_cache()
def get_settings() -> Settings:
    s = Settings()
    if not s.GEMINI_API_KEY:
         print(" WARNING: GEMINI_API_KEY missing. AI description/tag features will be disabled.")
    if not s.JINA_API_KEY:
        print(" WARNING: JINA_API_KEY missing. Embedding features will be disabled.")
    return s