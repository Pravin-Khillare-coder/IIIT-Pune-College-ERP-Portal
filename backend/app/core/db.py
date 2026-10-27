import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("erp.db")

# Determine engine parameters based on database dialect
db_url = settings.DATABASE_URL
engine_kwargs = {}

try:
    if db_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    else:
        # Test connection to PostgreSQL or fallback if connection fails
        engine_kwargs["pool_pre_ping"] = True
    
    engine = create_engine(db_url, **engine_kwargs)
    # Ping database to verify connection
    with engine.connect() as conn:
        pass
    logger.info(f"Connected to primary database: {db_url}")
except Exception as e:
    logger.warning(f"Could not connect to primary database ({db_url}): {e}")
    logger.info(f"Falling back to SQLite database: {settings.SQLITE_FALLBACK_URL}")
    db_url = settings.SQLITE_FALLBACK_URL
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {},
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
    """Dependency for obtaining database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
