import logging
from pyannote.audio import Pipeline
from .config import settings
import torch
import torchaudio
from moviepy import VideoFileClip
import os
import tempfile
import asyncio
from concurrent.futures import ThreadPoolExecutor
from .diarizationprogress import DiarizationProgressHook

logger = logging.getLogger(__name__)

class Diarizer:
    def __init__(self, redis_client):
        logger.info("Initializing Diarizer...")
        self.redis_client = redis_client
        self._executor = ThreadPoolExecutor(max_workers=3)  # Limit concurrent diarizations
        
        try:
            logger.debug(f"Using HF token: {settings.hf_token[:4]}...")
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            logger.info(f"Using device: {self.device}")
            
            self.pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=settings.hf_token
            ).to(self.device)
            
            logger.info("Diarizer initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize diarizer: {str(e)}")
            raise

    def _convert_video_to_audio(self, video_path):
        """Convert video to audio - runs in executor"""
        try:
            logger.info(f"Converting video file {video_path} to audio...")
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio_file:
                temp_audio_path = temp_audio_file.name
                video_clip = VideoFileClip(video_path)
                audio_clip = video_clip.audio
                audio_clip.write_audiofile(temp_audio_path, codec='pcm_s16le')
                audio_clip.close()
                video_clip.close()
                logger.info(f"Audio file created at {temp_audio_path}")
                return temp_audio_path
        except Exception as e:
            logger.error(f"Failed to convert video to audio: {str(e)}")
            raise

    def _run_diarization(self, file_path, hook):
        """Run diarization in executor"""
        waveform, sample_rate = torchaudio.load(file_path)
        waveform = waveform.to(self.device)
        return self.pipeline({"waveform": waveform, "sample_rate": sample_rate}, hook=hook)

    async def diarize_audio(self, request):
        """Async method to handle diarization process"""
        try:
            logger.info(f"Starting diarization for job {request.job_id}")
            
            # Create progress hook
            hook = DiarizationProgressHook(self.redis_client, request.job_id)

            # Handle video conversion if needed
            file_path = request.file_path
            delete_after_process = False
            
            if file_path.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
                file_path = await asyncio.get_event_loop().run_in_executor(
                    self._executor,
                    self._convert_video_to_audio,
                    file_path
                )
                delete_after_process = True

            # Run diarization in thread pool
            diarization = await asyncio.get_event_loop().run_in_executor(
                self._executor,
                self._run_diarization,
                file_path,
                hook
            )

            # Process results
            segments = []
            speaker_profiles = {}

            for turn, _, speaker in diarization.itertracks(yield_label=True):
                segments.append({
                    "start": turn.start,
                    "end": turn.end,
                    "speaker": speaker
                })

                if speaker not in speaker_profiles:
                    speaker_profiles[speaker] = {
                        "total_duration": 0,
                        "segments_count": 0
                    }

                speaker_profiles[speaker]["total_duration"] += turn.duration
                speaker_profiles[speaker]["segments_count"] += 1

            # Cleanup
            if delete_after_process and os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Temporary audio file {file_path} deleted.")

            return {
                "segments": segments,
                "speaker_profiles": speaker_profiles
            }

        except Exception as e:
            logger.error(f"Error during diarization: {str(e)}")
            raise