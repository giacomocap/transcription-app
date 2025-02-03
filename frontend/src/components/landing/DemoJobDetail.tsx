// frontend/src/components/landing/DemoJobDetail.tsx
import { useState, useRef, useEffect } from 'react';
import { Job } from '@/types';
import { JobStatus } from '@/components/JobStatus';
import { TranscriptionTabs } from '@/components/TranscriptionTabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AudioPlayer } from '@/components/AudioPlayer';
import { SignInModal } from '@/components/landing/SignInModal';
import {
    Play,
    Pause,
    RotateCcw,
    Trash,
    Edit,
    Share,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export const DemoJobDetail = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetch('/samples/demo_jobs.json')
            .then(response => response.json())
            .then(data => {
                setJobs(data);
                if (data.length > 0) {
                    setSelectedJob(data[0]);
                }
            })
            .catch(error => console.error('Error loading demo jobs:', error));
    }, []);

    // Audio control functions similar to JobDetailPage
    const handlePlayPause = () => {
        if (audioRef.current) {
            isPlaying ? audioRef.current.pause() : audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    if (!selectedJob) return null;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="max-w-[300px] w-full">
                    <Select
                        value={selectedJob.id}
                        onValueChange={(e) => setSelectedJob(jobs.find(j => j.id === e) || jobs[0])}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            {jobs.map((job) => (
                                <SelectItem key={job.id} value={job.id}>
                                    {job.file_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <JobStatus {...selectedJob} isMobile={false} transcriptionStatus={selectedJob.status} diarizationEnabled={selectedJob.diarization_enabled} />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSignInModal(true)}
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSignInModal(true)}
                    >
                        <Share className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowSignInModal(true)}
                    >
                        <Trash className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {selectedJob.file_url && (
                <div className="mb-6">
                    <AudioPlayer
                        audioRef={audioRef}
                        jobid={selectedJob.id}
                        joburl={selectedJob.file_url}
                        publicToken="demo"
                        handleLoadedMetadata={() => {
                            if (audioRef.current) setDuration(audioRef.current.duration);
                        }}
                        handleTimeUpdate={() => {
                            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                        }}
                        setIsPlaying={setIsPlaying}
                    />

                    {/* Add audio controls similar to JobDetailPage */}
                    <div className="flex items-center gap-4 mt-4">
                        <Button variant="outline" size="icon" onClick={() => {
                            if (audioRef.current) audioRef.current.currentTime = 0;
                        }}>
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button size="icon" onClick={handlePlayPause}>
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Slider
                            value={[currentTime]}
                            max={duration}
                            onValueChange={([val]) => {
                                if (audioRef.current) audioRef.current.currentTime = val;
                            }}
                            className="flex-1"
                        />
                    </div>
                </div>
            )}

            <TranscriptionTabs
                job={selectedJob}
                currentTime={currentTime}
                onTimeSelect={(time) => {
                    if (audioRef.current) {
                        audioRef.current.currentTime = time;
                        if (!isPlaying) {
                            audioRef.current.play();
                            setIsPlaying(true);
                        }
                    }
                }}
                isPlaying={isPlaying}
            />

            <SignInModal
                open={showSignInModal}
                onOpenChange={setShowSignInModal}
            />
        </div>
    );
};