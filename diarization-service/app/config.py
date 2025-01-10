import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from pathlib import Path
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

# Load the .env file
load_dotenv(ENV_FILE)
        
class Settings(BaseSettings):
    redis_host: str = "redis"
    redis_port: int = 6379
    upload_dir: str = "/app/uploads"
    hf_token: str = ""

    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = False
        extra = "ignore" 
        
settings = Settings()