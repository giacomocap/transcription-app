from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    RNNOISE_MODEL_PATH: str = "rnnoise-models/somnolent-hogwash-2018-09-01/sh.rnnn"
    models_dir: str = "./models"
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    
settings = Settings()
