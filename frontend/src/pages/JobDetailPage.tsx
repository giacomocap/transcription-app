// frontend/src/pages/JobDetailPage.tsx  
import { useEffect, useState, useRef } from 'react';
import { Job } from '../types/index';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Trash } from 'lucide-react';
import { JobStatus } from '../components/JobStatus';
import { TranscriptionTabs } from '../components/TranscriptionTabs';

export const JobDetailPage = () => {
    const [job, setJob] = useState<Job | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [duration, setDuration] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => { fetchJob(); }, 5000);
        fetchJob();
        return () => clearInterval(interval);
    }, []);

    const fetchJob = async () => {
        if (!id) return;

        const response = await fetch(`/api/jobs/${id}`);
        const data = await response.json();
        setJob(data);
    };

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const currentTime = audioRef.current.currentTime;
            setCurrentTime(currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current) {
            const bounds = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - bounds.left;
            const percentage = x / bounds.width;
            const time = percentage * duration;
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleSpeedChange = (speed: number) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
    };

    const handleRewind = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
        }
    };

    const handleDelete = async () => {
        if (!job) return;
        
        try {
            const response = await fetch(`/api/jobs/${job.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                navigate('/jobs', { replace: true });
            } else {
                console.error('Failed to delete job');
            }
        } catch (error) {
            console.error('Error deleting job:', error);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {job && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">{job.file_name}</h1>
                        <div className="flex items-center gap-4">
                            <JobStatus
                                transcriptionStatus={job.status}
                                diarizationEnabled={job.diarization_enabled}
                                diarizationStatus={job.diarization_status}
                            />
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <Trash className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                <h3 className="text-lg font-semibold mb-4">Delete Transcription</h3>
                                <p className="text-gray-600 mb-6">
                                    Are you sure you want to delete this transcription? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Remove the download buttons section */}
                    <div className="flex justify-end items-center">
                        <div className="flex space-x-3">
                            {/* Delete these two buttons */}
                        </div>
                    </div>

                    {job.file_url && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <audio
                                ref={audioRef}
                                src={`${job.file_url}`}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => setIsPlaying(false)}
                                className="hidden"
                            />
                            <div className="flex flex-col space-y-4 w-full">
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handleRewind}
                                        className="p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                                        title="Rewind to start"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handlePlayPause}
                                        className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>
                                    <div className="text-sm text-gray-600 font-medium">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                                            <button
                                                key={speed}
                                                onClick={() => handleSpeedChange(speed)}
                                                className={`px-2 py-1 text-sm rounded ${playbackSpeed === speed
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {speed}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div 
                                    className="h-2 bg-gray-200 rounded-full cursor-pointer relative"
                                    onClick={handleSeek}
                                >
                                    <div 
                                        className="absolute h-full bg-blue-500 rounded-full"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <TranscriptionTabs
                        job={job}
                        currentTime={currentTime}
                        onTimeSelect={(time) => {
                            if (audioRef.current) {
                                audioRef.current.currentTime = time;
                                setCurrentTime(time);
                                if (!isPlaying) {
                                    audioRef.current.play();
                                    setIsPlaying(true);
                                }
                            }
                        }}
                        isPlaying={isPlaying}
                    />
                </div>
            )}
        </div>
    );
};