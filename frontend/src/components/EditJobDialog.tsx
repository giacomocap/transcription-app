import { useState, useEffect, useCallback } from "react";
import { Job, Segment } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "./ui/label";
import { SpeakerLabelEditor } from "./SpeakerLabelEditor";
import { useMediaQuery } from "@/hooks/use-media-query";
import { fetchAudioUrl } from "@/lib/audioutils";

interface EditJobDialogProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedJob: Partial<Job>) => void;
}

const DialogFormContent = ({
  job,
  editedJob,
  audioUrl,
  setEditedJob,
  uniqueSpeakers,
  handleRenameSpeaker,
  onClose,
  handleSave,
  className = ""
}: {
  job: Job;
  editedJob: Job;
  audioUrl: string;
  setEditedJob: (fn: (prev: Job) => Job) => void;
  uniqueSpeakers: string[];
  handleRenameSpeaker: (oldLabel: string, newLabel: string) => void;
  onClose: () => void;
  handleSave: () => void;
  className?: string;
}) => (
  <div className={`space-y-4 ${className}`}>
    <div className="space-y-2">
      <Label htmlFor="file-name">File Name</Label>
      <Input
        id="file-name"
        value={editedJob.file_name}
        onChange={(e) => setEditedJob(prev => ({ ...prev, file_name: e.target.value }))}
      />
    </div>
    {editedJob.speaker_segments && editedJob.speaker_segments.length > 0 && (
      <div className="space-y-2">
        <Label>Speaker Labels</Label>
        <p className="text-sm text-muted-foreground">
          Edit the speaker label to rename this speaker across all segments.
          Click Save to apply your changes.
        </p>
        {uniqueSpeakers.map((speakerLabel) => (
          <SpeakerLabelEditor
            key={speakerLabel}
            speakerLabel={speakerLabel}
            segments={editedJob.speaker_segments!.filter(
              (segment) => segment.speaker === speakerLabel
            )}
            audioUrl={audioUrl}
            onRename={(newLabel) =>
              handleRenameSpeaker(speakerLabel, newLabel)
            }
          />
        ))}
      </div>
    )}
    {job.diarization_enabled &&
      job.diarization_status === 'completed' &&
      job.refinement_pending && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-700">
            After saving, Claire AI will begin enhancing your transcription with:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Improved punctuation and formatting</li>
              <li>Enhanced readability</li>
              <li>Smart paragraph breaks</li>
              <li>Context-aware speaker attribution</li>
            </ul>
          </p>
        </div>
      )}
    <div className="flex justify-end gap-4 pt-4">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={handleSave}>Save</Button>
    </div>
  </div>
);

export const EditJobDialog = ({
  job,
  isOpen,
  onClose,
  onSave,
}: EditJobDialogProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [editedJob, setEditedJob] = useState<Job>(job);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [uniqueSpeakers, setUniqueSpeakers] = useState<string[]>([]);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const url = await fetchAudioUrl(job.id);
        setAudioUrl(url);
      } catch (error) {
        console.error('Error fetching audio URL:', error);
      }
    };

    fetchUrl();
  }, [job.id]);

  useEffect(() => {
    if (isOpen) {
      setEditedJob(job);
    }
  }, [isOpen, job]);

  useEffect(() => {
    setUniqueSpeakers(getUniqueSpeakers(editedJob.speaker_segments));
  }, [editedJob.speaker_segments]);

  const handleSave = () => {
    onSave({
      file_name: editedJob.file_name,
      speaker_segments: editedJob.speaker_segments,
      speaker_profiles: editedJob.speaker_profiles
    });
    onClose();
  };

  const getUniqueSpeakers = (segments: Segment[] = []): string[] => {
    if (!segments || segments.length === 0) return [];
    const uniqueSpeakers = new Set<string>();
    segments.forEach((segment) => {
      if (segment.speaker) {
        uniqueSpeakers.add(segment.speaker);
      }
    });
    // Sort only the first time when editedJob equals job (initial open)
    const speakerArray = Array.from(uniqueSpeakers);
    return editedJob === job ? speakerArray.sort() : speakerArray;
  };


  const handleRenameSpeaker = useCallback((oldLabel: string, newLabel: string) => {
    setEditedJob(prev => {
      // Create a new speaker_profiles object with the updated speaker name
      const updatedProfiles = prev.speaker_profiles ? { ...prev.speaker_profiles } : {};

      // Only update if the labels are different and old label exists
      if (oldLabel !== newLabel && prev.speaker_profiles?.[oldLabel]) {
        // Copy the stats from old label to new label
        updatedProfiles[newLabel] = updatedProfiles[oldLabel];
        // Remove the old label
        delete updatedProfiles[oldLabel];
      }

      // Update speaker segments
      const updatedSegments = prev.speaker_segments?.map(segment =>
        segment.speaker === oldLabel ? { ...segment, speaker: newLabel } : segment
      ) || [];

      return {
        ...prev,
        speaker_profiles: updatedProfiles,
        speaker_segments: updatedSegments
      };
    });
  }, []);

  const title = job.diarization_enabled &&
    job.diarization_status === 'completed' &&
    job.refinement_pending ? "Confirm Speaker Names" : "Edit";

  const description = job.diarization_enabled &&
    job.diarization_status === 'completed' &&
    job.refinement_pending
    ? "Please review and confirm the speaker names before AI enhancement begins. Once confirmed, Claire AI will start enhancing your transcription"
    : "Update the transcription's details";

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFormContent
            job={job}
            editedJob={editedJob}
            audioUrl={audioUrl}
            setEditedJob={setEditedJob}
            uniqueSpeakers={uniqueSpeakers}
            handleRenameSpeaker={handleRenameSpeaker}
            onClose={onClose}
            handleSave={handleSave}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DialogFormContent
          job={job}
          editedJob={editedJob}
          audioUrl={audioUrl}
          setEditedJob={setEditedJob}
          uniqueSpeakers={uniqueSpeakers}
          handleRenameSpeaker={handleRenameSpeaker}
          onClose={onClose}
          handleSave={handleSave}
          className="px-4"
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
