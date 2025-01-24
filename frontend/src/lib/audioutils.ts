import { authFetch } from "@/utils/authFetch";

export const fetchAudioUrl = async (jobid: string) => {
    try {
        const response = await authFetch(`/api/jobs/${jobid}/presignedaudio`);
        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error('Error fetching audio URL:', error);
    }
};