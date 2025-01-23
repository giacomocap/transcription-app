import { supabase } from '../context/AuthContext';

export const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers = new Headers(init?.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(input, { ...init, headers });

    if (response.status === 401) {
        await supabase.auth.signOut();
        window.location.reload(); // Clear stale tokens
    }

    return response;
};