import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    # JWT Configuration
    jwt_secret: str = os.getenv("JWT_SECRET", "your-secret-key-here")
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # Application Configuration
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = environment == "development"
    
    # CORS Configuration
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://sukun-slide.vercel.app",  # Your production frontend URL
    ]
    
    # File Upload Configuration
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_file_types: List[str] = [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ]
    
    # Database Configuration
    database_url: str = os.getenv("DATABASE_URL", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Create settings instance
settings = Settings()
