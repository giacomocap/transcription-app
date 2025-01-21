import { fetchAudioUrl } from '@/lib/audioutils';
import { useEffect, useState } from 'react';
export interface AudioPlayerProps {
    jobid: string;
    handleTimeUpdate: () => void;
    handleLoadedMetadata: () => void;
    audioRef: React.RefObject<HTMLAudioElement>;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

const AudioPlayer = ({ jobid, handleTimeUpdate, audioRef, handleLoadedMetadata, setIsPlaying }: AudioPlayerProps) => {
    const [audioUrl, setAudioUrl] = useState<string>('');

    useEffect(() => {
        const fetchUrl = async () => {
            try {
                const url = await fetchAudioUrl(jobid);
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