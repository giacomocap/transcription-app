export interface TranscriptionConfig {
    openai_api_url: string;
    openai_api_key: string;
    model_name: string;
    max_concurrent_jobs: number;
}

export interface RefinementConfig {
    openai_api_url: string;
    openai_api_key: string;
    model_name: string;
    fast_model_name: string;
    system_prompt: string;
}

export interface Job {
    id: string;
    file_name: string;
    file_url?: string;
    status: TranscriptionStatus;
    transcript?: string;
    refined_transcript?: string;
    subtitle_content?: string;
    diarization_enabled: boolean;
    diarization_status?: Status;
    speaker_profiles?: any[];
    audio_hash?: string;
    created_at: string;
    updated_at: string;
}

export type Status = 'pending' | 'running' | 'completed' | 'failed';

export type TranscriptionStatus = Status | 'transcribed';