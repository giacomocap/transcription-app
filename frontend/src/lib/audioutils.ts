import { authFetch } from "@/utils/authFetch";

export const fetchAudioUrl = async (jobid: string, publicToken?:string) => {
    try {
        const response = await authFetch(`/api/jobs/${jobid}/presignedaudio${publicToken ? `?token=${publicToken}` : ''}`);
        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error('Error fetching audio URL:', error);
    }
};