import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Job } from "../types";
import { DownloadOptions } from "./DownloadOptions";
import { useEffect, useState } from "react";

interface SummaryViewProps {
    job: Job;
}

export const SummaryView = ({ job }: SummaryViewProps) => {
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        if (job.summary) {
            setIsNew(true);
            setTimeout(() => setIsNew(false), 2000);
        }
    }, [job.summary]);
    return (
        <Card className={isNew ? "animate-highlight" : ""}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Summary</CardTitle>
                    {job.summary && (
                        <DownloadOptions
                            content={job.summary}
                            filename={`summary-${job.file_name}`}
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="max-h-[500px] overflow-y-auto p-4">
                    {job.diarization_enabled && job.diarization_status !== 'completed' ? (
                        <div className="text-gray-500 italic space-y-2">
                            <p>AI summary will be available after speaker identification is complete.</p>
                            <p>Current status: {job.diarization_status === 'running' ? 'Identifying speakers...' : 'Waiting to process...'}</p>
                        </div>
                    ) : job.diarization_enabled && job.refinement_pending ? (
                        <div className="text-gray-500 italic">
                            <p>Please review and confirm speaker names to begin AI processing.</p>
                        </div>
                    ) : job.summary ? (
                        <div className="text-gray-800 text-base leading-relaxed">
                            {job.summary.split('\n\n').map((paragraph, index) => (
                                <div key={index} className="mb-4">
                                    {paragraph}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">
                            No summary available.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
