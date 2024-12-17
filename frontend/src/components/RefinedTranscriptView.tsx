import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { Job } from "../types";

interface RefinedTranscriptViewProps {
    job: Job;
}

export const RefinedTranscriptView = ({ job }: RefinedTranscriptViewProps) => {
    const handleRefine = async () => {
        // API call to refine transcript
        try {
            const response = await fetch(`/api/jobs/${job.id}/refine`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error('Failed to refine transcript');
            }
            // Handle success (e.g., refresh job data)
        } catch (error) {
            console.error('Error refining transcript:', error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Refined Transcript</CardTitle>
                    {!job.refined_transcript && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleRefine}
                        >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Refine Transcript
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm max-w-none">
                    {job.refined_transcript ? (
                        <div className="whitespace-pre-wrap font-mono text-sm">
                            {job.refined_transcript}
                        </div>
                    ) : (
                        <div className="text-gray-500 italic">
                            No refined transcript available. Click "Refine Transcript" to generate one.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
