import logging
from typing import Any, Optional, Mapping, Text
import redis

logger = logging.getLogger(__name__)

class DiarizationProgressHook:
    def __init__(self, redis_client: redis.Redis, job_id: str):
        self.redis_client = redis_client
        self.job_id = job_id
        # Dictionary to track progress of each step
        self.steps = {
            "voice activity detection": 0,
            "embedding": 0,
            "clustering": 0,
            "segmentation": 0
        }
    
    def __call__(
        self,
        step_name: Text,
        step_artifact: Any,
        file: Optional[Mapping] = None,
        total: Optional[int] = None,
        completed: Optional[int] = None,
    ):
        """Called during pipeline execution to update progress"""
        if total is not None and completed is not None:
            # Calculate progress percentage for current step
            step_progress = int((completed / total) * 100)
            self.steps[step_name] = step_progress
            
            # Calculate overall progress based on all steps
            total_progress = sum(self.steps.values()) // len(self.steps)
            
            logger.info(f"Step: {step_name} - Progress: {step_progress}% - Overall: {total_progress}%")
            
            # Update progress in Redis
            self.redis_client.hset(
                f"diarization:{self.job_id}",
                mapping={
                    "status": "processing",
                    "progress": total_progress,
                    "current_step": f"{step_name} ({step_progress}%)"
                }
            )