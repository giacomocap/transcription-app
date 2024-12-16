import { Request } from 'express';

export interface UserData {
    id: string;
    google_id: string;
    email: string;
    display_name: string;
    profile_picture?: string;
    created_at: Date;
    updated_at: Date;
}

declare global {
    namespace Express {
        interface User extends UserData {}
    }
}

export interface AuthenticatedRequest extends Request {
    user?: UserData;
}