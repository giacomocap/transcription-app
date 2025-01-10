import { useState, useEffect, useCallback } from "react";
import { Job, Segment } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "./ui/label";
import { SpeakerLabelEditor } from "./SpeakerLabelEditor";

interface EditJobDialogProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedJob: Partial<Job>) => void;
}

export const EditJobDialog = ({
  job,
  isOpen,
  onClose,
  onSave,
}: EditJobDialogProps) => {
  const [editedJob, setEditedJob] = useState<Job>(job);

  useEffect(() => {
    if (isOpen) {
      setEditedJob(job);
    }
  }, [isOpen, job]);

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
    return Array.from(uniqueSpeakers);
  };

  const [uniqueSpeakers] = useState(getUniqueSpeakers(editedJob.speaker_segments));

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>
            Update the job's filename and speaker names.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
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
                  audioUrl={job.file_url || ""}
                  onRename={(newLabel) =>
                    handleRenameSpeaker(speakerLabel, newLabel)
                  }
                />
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
