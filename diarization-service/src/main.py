import logging
from pathlib import Path
from typing import List, Dict, Optional
import json
import redis
import torch
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from nemo.collections.asr.models.msdd_models import NeuralDiarizer
from pydub import AudioSegment
from pydantic_settings import BaseSettings

from src.helpers import create_config, cleanup

class Settings(BaseSettings):
    upload_dir: str = "/tmp/uploads"
    model_dir: str = "/tmp/models"
    temp_dir: str = "/tmp/diarization"
    max_audio_length: int = 7200  # 2 hours in seconds
    min_speakers: int = 1
    max_speakers: int = 20
    redis_host: str = "localhost"
    redis_port: int = 6379

    class Config:
        env_prefix = ""

# Initialize FastAPI app
app = FastAPI(title="Diarization Service")
settings = Settings()

# Initialize Redis client
redis_client = redis.Redis(host=settings.redis_host, port=settings.redis_port, decode_responses=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DiarizationRequest(BaseModel):
    job_id: str
    file_path: str
    num_speakers: Optional[int] = None

class SpeakerSegment(BaseModel):
    start: float
    end: float
    speaker: str

class SpeakerProfile(BaseModel):
    speaker_id: str
    embedding: List[float]

class DiarizationResult(BaseModel):
    job_id: str
    segments: List[SpeakerSegment]
    speaker_profiles: List[SpeakerProfile]

class Diarizer:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")

    async def process_audio(self, file_path: str, num_speakers: Optional[int] = None) -> Dict:
        try:
            # Convert audio to mono for NeMo compatibility
            sound = AudioSegment.from_file(file_path).set_channels(1)
            
            # Create temporary directory for processing
            temp_path = Path(settings.temp_dir) / "diarization"
            temp_path.mkdir(parents=True, exist_ok=True)
            
            # Export mono audio
            mono_path = temp_path / "mono_file.wav"
            sound.export(str(mono_path), format="wav")

            # Initialize NeMo MSDD diarization model with configuration
            config = create_config(str(temp_path))
            if num_speakers:
                config.diarizer.clustering.parameters.num_speakers = num_speakers

            msdd_model = NeuralDiarizer(cfg=config).to(self.device)
            
            # Perform diarization
            msdd_model.diarize()

            # Read the diarization results
            with open(temp_path / "pred_rttms" / "mono_file.rttm", "r") as f:
                segments = []
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 4:
                        start = float(parts[3])
                        duration = float(parts[4])
                        speaker = parts[7]
                        segments.append(
                            SpeakerSegment(
                                start=start,
                                end=start + duration,
                                speaker=speaker
                            )
                        )

            # Get speaker embeddings (profiles)
            speaker_profiles = []
            embeddings_file = temp_path / "speaker_embeddings.json"
            if embeddings_file.exists():
                with open(embeddings_file, "r") as f:
                    embeddings_data = json.load(f)
                    for speaker_id, embedding in embeddings_data.items():
                        speaker_profiles.append(
                            SpeakerProfile(
                                speaker_id=speaker_id,
                                embedding=embedding
                            )
                        )

            # Cleanup temporary files
            cleanup(str(temp_path))

            return {
                "segments": segments,
                "speaker_profiles": speaker_profiles
            }

        except Exception as e:
            logger.error(f"Error in diarization process: {str(e)}")
            raise e

    async def diarize_audio(self, request: DiarizationRequest):
        file_path = str(Path(settings.upload_dir) / request.file_path)
        return await self.process_audio(file_path, request.num_speakers)

# Initialize diarizer
diarizer = Diarizer()

async def process_diarization(request: DiarizationRequest):
    try:
        # Update status in Redis
        redis_client.hset(f"diarization:{request.job_id}", mapping={
            "status": "processing",
            "progress": 0
        })
        
        result = await diarizer.diarize_audio(request)
        
        # Store result in Redis with 1 hour expiration
        redis_client.hset(f"diarization:{request.job_id}", mapping={
            "status": "completed",
            "progress": 100,
            "result": DiarizationResult(
                job_id=request.job_id,
                segments=result['segments'],
                speaker_profiles=result['speaker_profiles']
            ).json()
        })
        redis_client.expire(f"diarization:{request.job_id}", 3600)  # 1 hour expiration
        
    except Exception as e:
        logger.error(f"Error processing diarization for job {request.job_id}: {str(e)}")
        redis_client.hset(f"diarization:{request.job_id}", mapping={
            "status": "failed",
            "error": str(e)
        })

@app.post("/diarize")
async def diarize(request: DiarizationRequest, background_tasks: BackgroundTasks):
    if not Path(settings.upload_dir).exists():
        raise HTTPException(status_code=404, detail="Upload directory not found")
    
    # Initialize status in Redis
    redis_client.hset(f"diarization:{request.job_id}", mapping={
        "status": "queued",
        "progress": 0
    })
    
    # Add task to background
    background_tasks.add_task(process_diarization, request)
    
    return {"job_id": request.job_id, "status": "queued"}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    status = redis_client.hgetall(f"diarization:{job_id}")
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return status

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "diarization"}