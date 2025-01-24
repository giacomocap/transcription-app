// frontend/src/context/AuthContext.tsx
import { createClient, Provider, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings as apiUpdateUserSettings } from '../services/userSettingsService';
import { UserSettings } from '@/types/auth';
import { authFetch } from '@/utils/authFetch';

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider: Provider) => void;
    logout: () => void;
    userSettings: UserSettings | null;
    needsOnboarding: boolean;
    updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
    completeOnboarding: () => void;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    const fetchUserSettings = async () => {
        try {
            const data = await getUserSettings();
            if (!data) {
                setNeedsOnboarding(true);
                return;
            }
            setUserSettings(data);
            setNeedsOnboarding(false);
        } catch (error) {
            console.error('Error fetching user settings:', error);
            setNeedsOnboarding(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Check initial session
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
                setToken(session?.access_token ?? null);

                if (session?.user && session?.access_token) {
                    await fetchUserSettings();
                } else {
                    setUserSettings(null);
                    setNeedsOnboarding(false);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error checking session:', error);
                setIsLoading(false);
            }
        };

        initializeAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setToken(session?.access_token ?? null);
            // setIsLoading(false);
        });

        return () => authListener?.subscription.unsubscribe();
    }, []);

    const updateUserSettings = async (settings: Partial<UserSettings>) => {
        if (!user || !token) return;

        try {
            const updatedSettings = await apiUpdateUserSettings(settings);
            setUserSettings(updatedSettings);
        } catch (error) {
            console.error('Error updating user settings:', error);
            throw error;
        }
    };

    const completeOnboarding = () => {
        setNeedsOnboarding(false);
    };

    const login = async (provider: Provider = 'google') => {
        await supabase.auth.signInWithOAuth({
            provider
        });
    };

    const logout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            console.log('Logged out successfully'); // Debug log
        } catch (error) {
            console.error('Error during logout:', error);
            throw error; // Rethrow if you want components to handle it
        }
    };

    const deleteAccount = async () => {
        if (!user || !token) return;

        try {
            const response = await authFetch('/api/user/delete', {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            await logout();
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            userSettings,
            needsOnboarding,
            updateUserSettings,
            completeOnboarding,
            deleteAccount
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};