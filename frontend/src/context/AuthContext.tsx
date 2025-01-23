// frontend/src/context/AuthContext.tsx
import { createClient, Provider } from '@supabase/supabase-js';
import React, { createContext, useContext, useState, useEffect } from 'react';

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AuthContextType {
    user: any;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider: Provider) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setToken(session?.access_token ?? null); // Track token here
            setIsLoading(false);
        });

        return () => authListener?.subscription.unsubscribe();
    }, []);

    const login = async (provider: Provider = 'google') => {
        await supabase.auth.signInWithOAuth({
            provider
        });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};