
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator
from typing import List, Optional

class Settings(BaseSettings):
    PYTHON_SUPABASE_URL: str
    PYTHON_SUPABASE_KEY: str
    GEMINI_API_KEY: Optional[str] = None
    RECAPTCHA_SECRET_KEY: Optional[str] = None # Add this line
    CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    DEBUG: bool = False

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