import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Job } from "../types";

interface SummaryViewProps {
    job: Job;
}

export const SummaryView = ({ job }: SummaryViewProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm max-w-none">
                    {job.executive_summary ? (
                        <div dangerouslySetInnerHTML={{ __html: job.executive_summary }} />
                    ) : (
                        <p className="text-gray-500 italic">No summary available yet.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
