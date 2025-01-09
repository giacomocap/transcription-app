import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Sparkles } from "lucide-react";
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

    return (
        <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="refined" className={`${showAnimation && "relative"}`}>
                    AI
                    <Sparkles className={`w-4 h-4 ml-2 text-yellow-500 ${showAnimation && "animate-bounce"} inline-block`} />
                    {showAnimation &&
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-ping" />}
                </TabsTrigger>
                <TabsTrigger value="summary" className={`${showAnimation && "relative"}`}>
                    Summary
                    <Sparkles className={`w-4 h-4 ml-2 text-yellow-500 ${showAnimation && "animate-bounce"} inline-block`} />
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
    );
};
