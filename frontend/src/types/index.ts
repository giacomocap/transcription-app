export interface Segment {
  start: number;
  end: number;
  speaker?: string;
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
  diarization_progress?: number;
  speaker_profiles?: {
    [key: string]: {
      segments_count: number;
      total_duration: number;
    };
  };
  speaker_segments?: any[];
  audio_hash?: string;
  created_at: string;
  updated_at: string;
  summary: string;
}

export interface AdminSettings {
  apiKey: string;
  openaiUrl: string;
  maxConcurrentJobs: number;
  whisperParams: {
    model: string;
    language: string;
  };
}

export type Status = 'pending' | 'running' | 'completed' | 'failed';

export type TranscriptionStatus = Status | 'transcribed';
