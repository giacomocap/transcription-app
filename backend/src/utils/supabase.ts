// backend/src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
console.log(supabaseUrl, supabaseServiceKey);
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and Service Key must be defined in environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});