from fastapi import FastAPI, BackgroundTasks, HTTPException
from pathlib import Path
import redis
import logging
import json
from typing import Dict

from .config import settings
from .models import DiarizationRequest, DiarizationResult
from .diarizer import Diarizer

app = FastAPI(title="Diarization Service")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info(f"Connecting to Redis at {settings.redis_host}:{settings.redis_port}")

# Initialize Redis client
redis_client = redis.Redis(
    host=settings.redis_host, 
    port=settings.redis_port, 
    decode_responses=True
)

# Initialize diarizer
diarizer = Diarizer(redis_client)

async def process_diarization(request: DiarizationRequest):
    """Background task to process diarization"""
    try:
        # Update status in Redis
        redis_client.hset(
            f"diarization:{request.job_id}",
            mapping={
                "status": "processing",
                "progress": 0
            }
        )
        
        # Perform diarization
        result = await diarizer.diarize_audio(request)
        
        # Store result in Redis with 1 hour expiration
        redis_client.hset(
            f"diarization:{request.job_id}",
            mapping={
                "status": "completed",
                "progress": 100,
                "result": json.dumps(result)  # Convert result to JSON string
            }
        )
        redis_client.expire(f"diarization:{request.job_id}", 3600)  # 1 hour expiration
        
    except Exception as e:
        logger.error(f"Error processing diarization for job {request.job_id}: {str(e)}")
        redis_client.hset(
            f"diarization:{request.job_id}",
            mapping={
                "status": "failed",
                "error": str(e)
            }
        )

@app.post("/diarize")
async def diarize(request: DiarizationRequest, background_tasks: BackgroundTasks) -> Dict:
    """
    Endpoint to start diarization process
    Returns job_id and initial status
    """
    # Validate file path exists
    if not Path(request.file_path).exists():
        raise HTTPException(
            status_code=404,
            detail=f"Audio file not found at path: {request.file_path}"
        )
    
    # Initialize status in Redis
    redis_client.hset(
        f"diarization:{request.job_id}",
        mapping={
            "status": "queued",
            "progress": 0
        }
    )
    
    # Add task to background
    background_tasks.add_task(process_diarization, request)
    
    return {"job_id": request.job_id, "status": "queued"}

@app.get("/status/{job_id}")
async def get_status(job_id: str) -> Dict:
    """
    Get the status and results of a diarization job
    """
    status = redis_client.hgetall(f"diarization:{job_id}")
    if not status:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )
    
    # Parse result JSON if status is completed
    if status.get("status") == "completed" and "result" in status:
        status["result"] = json.loads(status["result"])
    
    return status

@app.get("/health")
async def health_check() -> Dict:
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "service": "diarization",
        "redis_connected": redis_client.ping()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
