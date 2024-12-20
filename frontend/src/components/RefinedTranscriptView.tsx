import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Job } from "../types/index";
import { useEffect, useState } from "react";
import { DownloadOptions } from "./DownloadOptions";

interface RefinedTranscriptViewProps {
    job: Job;
}

export const RefinedTranscriptView = ({ job }: RefinedTranscriptViewProps) => {
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        if (job.refined_transcript) {
            setIsNew(true);
            setTimeout(() => setIsNew(false), 2000);
        }
    }, [job.refined_transcript]);

    return (
        <Card className={isNew ? "animate-highlight" : ""}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Refined Transcript</CardTitle>
                    {job.refined_transcript && (
                        <DownloadOptions
                            content={job.refined_transcript}
                            filename={`refined-transcript-${job.file_name}`}
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="max-h-[500px] overflow-y-auto p-4">
                    {job.refined_transcript ? (
                        <div className="text-gray-800 text-base leading-relaxed">
                            {job.refined_transcript.split('\n\n').map((paragraph, index) => (
                                <div key={index} className="mb-4">
                                    {paragraph}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">
                            No refined transcript available.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
