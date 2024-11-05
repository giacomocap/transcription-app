export interface Job {
    id: string;
    file_name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    transcript?: string;
    refined_transcript?: string;
    created_at: string;
    updated_at: string;
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