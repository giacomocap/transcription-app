export interface UserData {
    id: string;
    google_id: string;
    email: string;
    display_name: string;
    profile_picture?: string;
    created_at: Date;
    updated_at: Date;
}

export interface UserSettings {
    preferred_transcription_language: string;
}