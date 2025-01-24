import { UserSettings } from "@/types/auth";
import { authFetch } from "@/utils/authFetch";

export const getUserSettings = async (): Promise<UserSettings> => {
    const response = await authFetch(`/api/user/settings`);

    if (!response.ok) {
        throw new Error('Failed to fetch user settings');
    }

    return response.json();
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await authFetch(`/api/user/settings`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
    });

    if (!response.ok) {
        throw new Error('Failed to update user settings');
    }

    return response.json();
};
