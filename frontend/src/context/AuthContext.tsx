// frontend/src/context/AuthContext.tsx
import { createClient, Provider, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings as apiUpdateUserSettings } from '../services/userSettingsService';
import { UserSettings } from '@/types/auth';
import { authFetch } from '@/utils/authFetch';
import { useToast } from '@/hooks/use-toast';

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface Account {
    id: string;
    name: string;
    slug: string;
    personal_account: boolean;
    billing_status: string;
    plan: string;
    // ...other account fields
}

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
    accounts: Account[];
    currentAccount: Account | null;
    switchAccount: (account: Account) => void;
    updateAccountSettings: (settings: Partial<Account>) => Promise<Account>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [hasShownSignInToast, setHasShownSignInToast] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
    const { toast } = useToast();

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

    const fetchAccounts = async () => {
        if (!user) return;
        try {
            const response = await authFetch('/api/accounts', { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                setAccounts(data.accounts);
                // Set a default account – choose the personal account if available, otherwise first account
                if (data.accounts.length > 0) {
                    const defaultAccount =
                        data.accounts.find((acc: Account) => acc.personal_account) || data.accounts[0];
                    setCurrentAccount(defaultAccount);
                }
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
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
                    await fetchAccounts(); // fetch accounts on login
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

            if (event === 'SIGNED_IN' && !hasShownSignInToast) {
                toast({
                    title: "Welcome!",
                    description: "You have successfully signed in.",
                });
                setHasShownSignInToast(true);
            } else if (event === 'SIGNED_OUT') {
                toast({
                    title: "Goodbye!",
                    description: "You have been signed out successfully.",
                });
                setHasShownSignInToast(false);
            }
        });

        return () => authListener?.subscription.unsubscribe();
    }, [toast, hasShownSignInToast]);

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

    const switchAccount = (account: Account) => {
        setCurrentAccount(account);
    };

    const updateAccountSettings = async (settings: Partial<Account>): Promise<Account> => {
        if (!currentAccount) throw new Error('No account selected');
        try {
            const response = await authFetch(`/api/accounts/${currentAccount.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (!response.ok) {
                throw new Error('Failed to update account settings');
            }
            const { account: updatedAccount } = await response.json();
            // Update both currentAccount and the accounts array
            setCurrentAccount(updatedAccount);
            setAccounts((prev) =>
                prev.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc))
            );
            return updatedAccount;
        } catch (error) {
            console.error('Error updating account settings:', error);
            throw error;
        }
    };

    const deleteAccount = async () => {
        if (!user || !token) return;
        try {
            const response = await authFetch('/api/user/delete', {
                method: 'DELETE',
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
            deleteAccount,
            accounts,
            currentAccount,
            switchAccount,
            updateAccountSettings,
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