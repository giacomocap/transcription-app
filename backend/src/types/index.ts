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
    system_prompt: string;
}