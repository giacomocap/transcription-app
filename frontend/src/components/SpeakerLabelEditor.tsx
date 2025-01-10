import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { Segment } from "@/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";

interface SpeakerLabelEditorProps {
  speakerLabel: string;
  segments: Segment[];
  audioUrl: string;
  onRename: (newLabel: string) => void;
}

export const SpeakerLabelEditor: React.FC<SpeakerLabelEditorProps> = ({
  speakerLabel,
  segments,
  audioUrl,
  onRename,
}) => {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localLabel, setLocalLabel] = useState(speakerLabel);

  useEffect(() => {
    setLocalLabel(speakerLabel);
  }, [speakerLabel]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !segments || !segments[currentSegmentIndex]) return;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= segments[currentSegmentIndex].end) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = segments[currentSegmentIndex].start;
      }
    };

    audio.src = audioUrl;
    audio.currentTime = segments[currentSegmentIndex].start;

    if (isPlaying) {
      audio.play();
    }

    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [currentSegmentIndex, segments, audioUrl, isPlaying]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
    }
  };

  const handleLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalLabel(event.target.value);
  };

  const handleLabelBlur = () => {
    if (localLabel !== speakerLabel) {
      onRename(localLabel);
    }
  };

  const handleLabelKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  return (
    <div className="space-y-2">
      <Label>{speakerLabel}</Label>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={currentSegmentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentSegmentIndex === segments.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <Input
        value={localLabel}
        onChange={handleLabelChange}
        onBlur={handleLabelBlur}
        onKeyDown={handleLabelKeyDown}
      />
    </div>
  );
};
