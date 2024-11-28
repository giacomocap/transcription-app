// frontend/src/pages/JobDetailPage.tsx  
import { useEffect, useState, useRef } from 'react';
import { Job } from '../types';
import { useParams } from 'react-router-dom';
import { Play, Pause, Download, Clock } from 'lucide-react';

interface Segment {
    index: number;
    startTime: number;
    endTime: number;
    text: string;
}

export const JobDetailPage = () => {
    const [job, setJob] = useState<Job | null>(null);
    const [refining, setRefining] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [activeSegment, setActiveSegment] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
    const { id } = useParams();

    useEffect(() => {
        const interval = setInterval(() => { fetchJob(); }, 5000);
        fetchJob();
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (job?.subtitle_content) {
            const parsedSegments = parseSRT(job.subtitle_content);
            setSegments(parsedSegments);
            segmentRefs.current = parsedSegments.map(() => null);
        }
    }, [job?.subtitle_content]);

    const parseSRT = (srtContent: string): Segment[] => {
        const segments: Segment[] = [];
        const blocks = srtContent.trim().split('\n\n');
        
        blocks.forEach(block => {
            const lines = block.split('\n');
            if (lines.length >= 3) {
                const index = parseInt(lines[0]);
                const [startTime, endTime] = lines[1].split(' --> ').map(timeStr => {
                    const [h, m, s] = timeStr.split(':');
                    const [seconds, ms] = s.split(',');
                    return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(seconds) + parseInt(ms) / 1000;
                });
                const text = lines.slice(2).join('\n');
                segments.push({ index, startTime, endTime, text });
            }
        });
        
        return segments;
    };

    const fetchJob = async () => {
        if (!id) return;

        const response = await fetch(`/api/jobs/${id}`);
        const data = await response.json();
        setJob(data);
    };

    const handleRefine = async () => {
        if (!job) return;

        setRefining(true);
        try {
            const response = await fetch(`/api/jobs/${job.id}/refine`, {
                method: 'POST'
            });
            const data = await response.json();
            setJob(data);
        } catch (error) {
            console.error('Refinement failed:', error);
        }
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
            
            // Find and scroll to active segment
            const activeIndex = segments.findIndex(
                segment => currentTime >= segment.startTime && currentTime <= segment.endTime
            );
            
            if (activeIndex !== -1 && activeIndex !== activeSegment) {
                setActiveSegment(activeIndex);
                segmentRefs.current[activeIndex]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    };

    const handleSpeedChange = (speed: number) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
    };

    const handleDownload = (withTimestamps: boolean) => {
        if (!job?.transcript) return;

        const text = withTimestamps ? job.transcript :
            job.transcript.replace(/\[\d{2}:\d{2}:\d{2}\]/g, '');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${job.file_name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {job && (
                <>
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold">{job.file_name}</h1>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                job.status === 'failed' ? 'bg-red-100 text-red-800' :
                                job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {job.status}
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => handleDownload(false)}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Plain Text
                            </button>
                            <button
                                onClick={() => handleDownload(true)}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                With Timestamps
                            </button>
                        </div>
                    </div>

                    {job.file_url && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <audio
                                ref={audioRef}
                                src={job.file_url}
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={() => setIsPlaying(false)}
                                className="hidden"
                            />
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handlePlayPause}
                                    className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                </button>
                                <div className="text-sm text-gray-600 font-medium">
                                    {formatTime(currentTime)}
                                </div>
                                <div className="flex items-center space-x-2">
                                    {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                                        <button
                                            key={speed}
                                            onClick={() => handleSpeedChange(speed)}
                                            className={`px-2 py-1 text-sm rounded ${
                                                playbackSpeed === speed
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
                        {segments.length > 0 ? (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Transcript</h2>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                    {segments.map((segment, index) => (
                                        <div
                                            key={segment.index}
                                            ref={el => segmentRefs.current[index] = el}
                                            className={`p-3 rounded transition-colors ${
                                                activeSegment === index
                                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="text-sm text-gray-500 mb-1">
                                                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                                            </div>
                                            <div className="text-gray-800">{segment.text}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Transcript</h2>
                                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-800 font-mono text-sm">
                                    {job.transcript}
                                </pre>
                            </div>
                        )}

                        {job.refined_transcript && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Refined Transcript</h2>
                                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-800 font-mono text-sm">
                                    {job.refined_transcript}
                                </pre>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};