import { supabase } from '../context/AuthContext';

export const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers = new Headers(init?.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    //add also re.user?.id to headers
    if (session?.user?.id) headers.set('X-User-Id', session.user.id);

    const response = await fetch(input, { ...init, headers });

    if (response.status === 401) {
        await supabase.auth.signOut();
        window.location.reload(); // Clear stale tokens
    }

    return response;
};

export const createAuthXHR = async (method: string, url: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onerror = () => {
        if (xhr.status === 401) {
            supabase.auth.signOut();
            window.location.reload(); // Clear stale tokens
        }
    };

    return xhr;
};