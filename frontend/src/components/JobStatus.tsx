import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Status, TranscriptionStatus } from "../types";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface JobStatusProps {
  transcriptionStatus: TranscriptionStatus;
  diarizationEnabled: boolean;
  diarizationStatus?: Status;
}

const statusConfig = {
  pending: {
    variant: "secondary",
    label: "Pending",
    icon: Clock
  },
  running: {
    variant: "default",
    label: "Running",
    icon: Loader2
  },
  completed: {
    variant: "success",
    label: "Completed",
    icon: CheckCircle2
  },
  failed: {
    variant: "destructive",
    label: "Failed",
    icon: AlertCircle
  },
  transcribed: {
    variant: "success",
    label: "Transcribed",
    icon: CheckCircle2
  },
};

export const JobStatus = ({
  transcriptionStatus,
  diarizationEnabled,
  diarizationStatus,
}: JobStatusProps) => {
  const transcriptionConfig = statusConfig[transcriptionStatus];
  const diarizationConfig = diarizationStatus
    ? statusConfig[diarizationStatus]
    : null;

  const StatusIcon = transcriptionConfig.icon;
  const DiarizationIcon = diarizationConfig?.icon || AlertCircle;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge variant={transcriptionConfig.variant as any} className="gap-1.5 px-2.5 py-2.5">
              <StatusIcon
                className={`h-4 w-4 ${
                  transcriptionStatus === "running" ? "animate-spin" : ""
                }`}
              />
              {transcriptionConfig.label}
            </Badge>
            {diarizationEnabled && (
              <Badge
                variant={diarizationConfig?.variant as any || "secondary"}
                className="gap-1.5"
              >
                <DiarizationIcon
                  className={`h-4 w-4 ${
                    diarizationStatus === "running" ? "animate-spin" : ""
                  }`}
                />
                {diarizationConfig?.label || "Diarization"}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <div>
              <p className="font-medium">Transcription: {transcriptionConfig.label}</p>
              <p className="text-xs text-muted-foreground">
                {getStatusDescription(transcriptionStatus)}
              </p>
            </div>
            {diarizationEnabled && (
              <div>
                <p className="font-medium">
                  Diarization: {diarizationConfig?.label || "Not started"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getStatusDescription(diarizationStatus || "pending", true)}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

function getStatusDescription(
  status: Status | TranscriptionStatus,
  isDiarization = false
): string {
  const type = isDiarization ? "Speaker detection" : "Transcription";
  switch (status) {
    case "pending":
      return `${type} is waiting to start...`;
    case "running":
      return `${type} is currently in progress...`;
    case "completed":
      return `${type} has been successfully completed.`;
    case "failed":
      return `${type} encountered an error.`;
    case "transcribed":
      return "Audio has been successfully transcribed.";
    default:
      return `${type} status unknown.`;
  }
}
