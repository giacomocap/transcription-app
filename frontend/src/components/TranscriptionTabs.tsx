import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Sparkles, AlertCircle } from "lucide-react";
import { Job } from "../types";
import { TranscriptView } from "./TranscriptView";
import { SummaryView } from "./SummaryView";
// import { TasksView } from "./TasksView";
// import { NotesView } from "./NotesView";
// import { ActionsView } from "./ActionsView";
import { RefinedTranscriptView } from "./RefinedTranscriptView";

interface TranscriptionTabsProps {
    job: Job;
    currentTime: number;
    onTimeSelect: (time: number) => void;
    isPlaying: boolean;
}

export const TranscriptionTabs = ({ job, currentTime, onTimeSelect, isPlaying }: TranscriptionTabsProps) => {
    const [previousRefinedStatus, setPreviousRefinedStatus] = useState<boolean>(false);
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        if (!previousRefinedStatus && job.refined_transcript) {
            setShowAnimation(true);
            setPreviousRefinedStatus(true);

            // Auto hide animation after 5 seconds
            setTimeout(() => {
                setShowAnimation(false);
            }, 5000);
        }
    }, [job.refined_transcript, previousRefinedStatus]);

    const showAiProcessingMessage = job.diarization_enabled && (job.diarization_status !== 'completed' || job.refinement_pending);
    const aiStatusMessage = job.diarization_enabled && job.diarization_status !== 'completed'
        ? "AI features will be available after speaker identification is complete"
        : job.diarization_enabled && job.refinement_pending
            ? "Please review and confirm speaker names to enable AI features. Click the 'Edit' button at the topright to start reviewing"
            : "";

    return (
        <div className="space-y-2">
            <Tabs defaultValue="transcript" className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger
                        value="refined"
                        className={`${showAnimation && "relative"}`}
                        disabled={showAiProcessingMessage}
                    >
                        AI
                        {showAiProcessingMessage ? (
                            <AlertCircle className="w-4 h-4 ml-2 text-gray-400" />
                        ) : (
                            <Sparkles className={`w-4 h-4 ml-2 text-yellow-500 ${showAnimation && "animate-bounce"} inline-block`} />
                        )}
                        {showAnimation &&
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-ping" />}
                    </TabsTrigger>
                    <TabsTrigger
                        value="summary"
                        className={`${showAnimation && "relative"}`}
                        disabled={showAiProcessingMessage}
                    >
                        Summary
                        {showAiProcessingMessage ? (
                            <AlertCircle className="w-4 h-4 ml-2 text-gray-400" />
                        ) : (
                            <Sparkles className={`w-4 h-4 ml-2 text-yellow-500 ${showAnimation && "animate-bounce"} inline-block`} />
                        )}
                        {showAnimation &&
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-ping" />}
                    </TabsTrigger>
                    {/* <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger> */}
                </TabsList>
                <TabsContent value="transcript">
                    <TranscriptView
                        job={job}
                        currentTime={currentTime}
                        onTimeSelect={onTimeSelect}
                        isPlaying={isPlaying}
                    />
                </TabsContent>
                <TabsContent value="refined">
                    <RefinedTranscriptView job={job} />
                </TabsContent>
                <TabsContent value="summary">
                    <SummaryView job={job} />
                </TabsContent>
                {/* <TabsContent value="tasks">
                <TasksView job={job} />
            </TabsContent>
            <TabsContent value="notes">
                <NotesView job={job} />
            </TabsContent>
            <TabsContent value="actions">
                <ActionsView job={job} />
            </TabsContent> */}
            </Tabs>
            {showAiProcessingMessage && (
                <div className="text-sm text-gray-500 flex items-center gap-2 px-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{aiStatusMessage}</span>
                </div>
            )}
        </div>
    );
};
