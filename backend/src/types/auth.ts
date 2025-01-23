import { User as SupabaseUser } from '@supabase/supabase-js';
import { Request } from 'express';

export interface UserData {
    id: string;
    email?: string;
    profile_picture?: string;
    created_at: string;
    updated_at: string;
}

declare global {
    namespace Express {
        interface User extends SupabaseUser { }
    }
}

export interface AuthenticatedRequest extends Request {
    user?: SupabaseUser;
}