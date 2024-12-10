from enum import Enum
from pydantic import BaseModel
from typing import Optional

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Job(BaseModel):
    id: str
    status: JobStatus
    input_path: str
    output_path: str
    error: str | None = None

class EnhancementRequest(BaseModel):
    job_id: str
    file_path: str

class EnhancementResponse(BaseModel):
    job_id: str
    status: str
    enhanced_path: Optional[str] = None
    error: Optional[str] = None
