# Codebase Summary

This document provides a summary of the services and applications found in this codebase.

## Backend Service
├── Purpose
    The backend service is responsible for handling API requests, managing data persistence, processing audio files, refining transcriptions, and managing background jobs. It provides the core logic for the application.
├── Key Functionalities
    - Handles audio file uploads and conversion to the Opus format.
    - Manages database interactions using Prisma.
    - Refines transcriptions using OpenAI's API.
    - Processes background jobs for audio enhancement and transcription.

## Frontend Service
├── Purpose
    The frontend service provides the user interface for the application, allowing users to upload audio files, view transcriptions, manage jobs, and interact with the application's features.
├── Key Functionalities
    - Provides a user interface for uploading audio files and managing transcription jobs.
    - Displays transcriptions, summaries, and other relevant information.
    - Manages user authentication and authorization.
    - Provides a responsive and interactive user experience.

## Diarization Service
├── Purpose
    The diarization service is responsible for identifying and segmenting audio based on speaker changes. It provides the functionality to determine who spoke when in an audio recording.
├── Key Functionalities
    - Performs audio diarization using pyannote.audio.
    - Manages diarization progress using Redis.
    - Converts video files to audio for processing.
├── Dependencies and External Services
    - fastapi
    - uvicorn
    - redis
    - pyannote.audio
    - python-dotenv
    - pydantic
    - pydantic-settings
    - torch
    - moviepy
