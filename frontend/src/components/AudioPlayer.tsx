import { fetchAudioUrl } from '@/lib/audioutils';
import { useEffect, useState } from 'react';
export interface AudioPlayerProps {
    jobid: string;
    joburl?: string;
    publicToken?: string;
    handleTimeUpdate: () => void;
    handleLoadedMetadata: () => void;
    audioRef: React.RefObject<HTMLAudioElement>;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

const AudioPlayer = ({ jobid, joburl, publicToken, handleTimeUpdate, audioRef, handleLoadedMetadata, setIsPlaying }: AudioPlayerProps) => {
    const [audioUrl, setAudioUrl] = useState<string>('');

    useEffect(() => {
        const fetchUrl = async () => {
            try {
                if (joburl) {
                    setAudioUrl(joburl);
                    return;
                }
                const url = await fetchAudioUrl(jobid, publicToken);
                setAudioUrl(url);
            } catch (error) {
                console.error('Error fetching audio URL:', error);
            }
        };

        fetchUrl();
    }, [jobid]);

    return (
        <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
        />
    );
};

export { AudioPlayer };