import json
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "IIIT Pune College ERP Portal"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "dev_secret_key_iiit_pune_erp_2026_super_secure_hash"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/iiitp_erp"
    SQLITE_FALLBACK_URL: str = "sqlite:///./erp_dev.db"

    # Storage
    UPLOAD_STORAGE_DIR: str = "../storage/uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 5242880  # 5 MB

    # Integration URLs
    SBI_COLLECT_URL: str = "https://www.onlinesbi.sbi/sbicollect/"
    ANTI_RAGGING_FORM_URL: str = "https://www.antiragging.in/"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            if isinstance(v, str):
                return json.loads(v)
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
