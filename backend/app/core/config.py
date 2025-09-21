from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # FastAPI settings
    PROJECT_NAME: str = "Intelligent Loan Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # Supabase settings
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # Claude AI settings
    ANTHROPIC_API_KEY: str = ""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database settings
    DATABASE_URL: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()