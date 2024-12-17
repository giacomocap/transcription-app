import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Job } from "../types";
import { TranscriptView } from "./TranscriptView";
import { SummaryView } from "./SummaryView";
import { TasksView } from "./TasksView";
import { NotesView } from "./NotesView";
import { ActionsView } from "./ActionsView";
import { RefinedTranscriptView } from "./RefinedTranscriptView";

interface TranscriptionTabsProps {
    job: Job;
    currentTime: number;
    onTimeSelect: (time: number) => void;
    isPlaying: boolean;
}

export const TranscriptionTabs = ({ job, currentTime, onTimeSelect, isPlaying }: TranscriptionTabsProps) => {
    return (
        <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="transcript">Raw Transcript</TabsTrigger>
                <TabsTrigger value="refined">Refined</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
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
            <TabsContent value="tasks">
                <TasksView job={job} />
            </TabsContent>
            <TabsContent value="notes">
                <NotesView job={job} />
            </TabsContent>
            <TabsContent value="actions">
                <ActionsView job={job} />
            </TabsContent>
        </Tabs>
    );
};
