import logging
from pathlib import Path
import redis
import subprocess
import os
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile
from fastapi.responses import FileResponse
from pydantic_settings import BaseSettings
from models import EnhancementRequest, EnhancementResponse, Job, JobStatus
from audio_processor import AudioProcessor
import uuid

class Settings(BaseSettings):
    upload_dir: str = "/tmp/uploads"
    redis_host: str = "localhost"
    redis_port: int = 6379
    models_dir: str = "/app/rnnoise-models"
    rnnoise_model_path: str = "somnolent-hogwash-2018-09-01/sh.rnnn"

    class Config:
        env_prefix = ""

# Initialize FastAPI app
app = FastAPI(title="Audio Enhancement Service")
settings = Settings()

# Initialize Redis client
redis_client = redis.Redis(host=settings.redis_host, port=settings.redis_port, decode_responses=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ensure_models():
    """Ensure RNNoise models are available."""
    models_path = Path(settings.models_dir)
    model_file = models_path / settings.rnnoise_model_path
    
    if not model_file.exists():
        logger.info("RNNoise models not found. Downloading...")
        models_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            # Clone the repository
            subprocess.run([
                "git", "clone", "https://github.com/GregorR/rnnoise-models.git",
                str(models_path)
            ], check=True)
            
            if not model_file.exists():
                raise Exception("Model file not found after download")
                
            logger.info("RNNoise models downloaded successfully")
        except Exception as e:
            logger.error(f"Failed to download RNNoise models: {str(e)}")
            raise Exception("Failed to initialize audio enhancement models")
    else:
        logger.info("RNNoise models found")

@app.on_event("startup")
async def startup_event():
    """Initialize service on startup."""
    # Ensure upload directory exists
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    
    # Ensure models are available
    ensure_models()

async def process_enhancement(job_id: str, file_path: str):
    try:
        # Update status in Redis
        redis_client.hset(f"enhancement:{job_id}", mapping={
            "status": "processing",
            "progress": 0
        })
        
        # Process the audio
        output_path = f"uploads/enhanced_{Path(file_path).name}"
        success = AudioProcessor.enhance_audio(file_path, output_path)
        
        if success:
            # Store result in Redis with 1 hour expiration
            redis_client.hset(f"enhancement:{job_id}", mapping={
                "status": "completed",
                "progress": 100,
                "enhanced_path": output_path
            })
        else:
            raise Exception("Audio enhancement failed")
            
        redis_client.expire(f"enhancement:{job_id}", 3600)  # 1 hour expiration
        
    except Exception as e:
        logger.error(f"Error processing enhancement for job {job_id}: {str(e)}")
        redis_client.hset(f"enhancement:{job_id}", mapping={
            "status": "failed",
            "error": str(e)
        })

@app.post("/enhance", response_model=EnhancementResponse)
async def enhance(file: UploadFile, background_tasks: BackgroundTasks):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Save uploaded file
    input_path = f"uploads/{file.filename}"
    with open(input_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    job_id = str(uuid.uuid4())
    
    # Initialize status in Redis
    redis_client.hset(f"enhancement:{job_id}", mapping={
        "status": "queued",
        "progress": 0
    })
    
    # Add task to background
    background_tasks.add_task(process_enhancement, job_id, input_path)
    
    return EnhancementResponse(
        success=True,
        message="Job created successfully",
        job_id=job_id
    )

@app.get("/status/{job_id}", response_model=Job)
async def get_status(job_id: str):
    status = redis_client.hgetall(f"enhancement:{job_id}")
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    job = Job(
        id=job_id,
        status=status["status"],
        input_path="",
        output_path=status.get("enhanced_path", ""),
        error=status.get("error", "")
    )
    return job

@app.get("/download/{job_id}")
async def download_enhanced_file(job_id: str):
    status = redis_client.hgetall(f"enhancement:{job_id}")
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    if status["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")
    
    output_path = status.get("enhanced_path", "")
    if not output_path:
        raise HTTPException(status_code=404, detail="Enhanced file not found")
    
    return FileResponse(output_path)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "audio-enhancement"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3003,
        reload=True
    )
