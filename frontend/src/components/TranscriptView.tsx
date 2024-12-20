import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useRef, useState } from "react";
import { Job } from "../types/index";
import { DownloadOptions } from './DownloadOptions';

interface TranscriptViewProps {
    job: Job;
    currentTime: number;
    onTimeSelect: (time: number) => void;
    isPlaying: boolean;
}

interface Segment {
    index: number;
    startTime: number;
    endTime: number;
    text: string;
}

export const TranscriptView = ({ job, currentTime, onTimeSelect, isPlaying }: TranscriptViewProps) => {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [activeSegment, setActiveSegment] = useState<number | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const segmentRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const isAutoScrolling = useRef(false);

    useEffect(() => {
        if (job?.subtitle_content) {
            const parsedSegments = parseSRT(job.subtitle_content);
            setSegments(parsedSegments);
            segmentRefs.current = parsedSegments.map(() => null);
        }
    }, [job?.subtitle_content]);

    useEffect(() => {
        const activeIndex = segments.findIndex(
            segment => currentTime >= segment.startTime && currentTime <= segment.endTime
        );

        if (activeIndex !== -1 && activeIndex !== activeSegment) {
            setActiveSegment(activeIndex);
            if (autoScroll && isPlaying) {
                scrollToCenter(activeIndex);
            }
        }
    }, [currentTime, segments, isPlaying]);

    const scrollToCenter = (index: number) => {
        const container = containerRef.current;
        const segment = segmentRefs.current[index];
        
        if (container && segment) {
            isAutoScrolling.current = true;
            const containerHeight = container.clientHeight;
            const segmentTop = segment.offsetTop;
            const segmentHeight = segment.clientHeight;
            
            const targetScroll = segmentTop - (containerHeight / 2) + (segmentHeight / 2);
            
            container.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });

            setTimeout(() => {
                isAutoScrolling.current = false;
            }, 1000);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

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

    const getContentWithTimestamps = () => {
        return segments.map(segment => 
            `${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}\n${segment.text}`
        ).join('\n\n');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Raw Transcript</CardTitle>
                    <DownloadOptions
                        content={segments.map(s => s.text).join(' ')}
                        filename={`transcript-${job.file_name}`}
                        allowTimestamps={true}
                        getContentWithTimestamps={getContentWithTimestamps}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {segments.length > 0 ? (
                    <div className="relative">
                        <div 
                            ref={containerRef}
                            className="max-h-[500px] overflow-y-auto p-4"
                            onScroll={() => {
                                if (!isAutoScrolling.current && autoScroll && isPlaying) {
                                    setAutoScroll(false);
                                }
                            }}
                        >
                            <div className="text-gray-800 text-base leading-relaxed">
                                {segments.map((segment, index) => (
                                    <span
                                        key={segment.index}
                                        ref={el => segmentRefs.current[index] = el}
                                        onClick={() => onTimeSelect(segment.startTime)}
                                        className={`
                                            inline cursor-pointer hover:bg-gray-50 rounded px-0.5
                                            ${activeSegment === index ? 'bg-blue-100' : ''}
                                        `}
                                        title={`${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`}
                                    >
                                        {segment.text}{' '}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {!autoScroll && isPlaying && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                <button
                                    onClick={() => setAutoScroll(true)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors text-sm"
                                >
                                    Resume Auto-scroll
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
                        {job.transcript || (
                            <p className="text-gray-500 italic">No transcript available yet.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
