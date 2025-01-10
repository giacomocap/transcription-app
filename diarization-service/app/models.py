from pydantic import BaseModel
from typing import List, Dict

class DiarizationRequest(BaseModel):
    job_id: str
    file_path: str

class Segment(BaseModel):
    start: float
    end: float
    speaker: str

class DiarizationResult(BaseModel):
    job_id: str
    segments: List[Segment]
    speaker_profiles: Dict[str, dict]
