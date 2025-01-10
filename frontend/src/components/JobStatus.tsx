import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Status, TranscriptionStatus } from "../types";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface JobStatusProps {
  transcriptionStatus: TranscriptionStatus;
  diarizationEnabled: boolean;
  diarizationStatus?: Status;
  diarizationProgress?: number;
  isMobile: boolean;
}

const statusConfig = {
  pending: {
    variant: "secondary",
    label: "Pending",
    icon: Clock,
  },
  running: {
    variant: "default",
    label: "Running",
    icon: Loader2,
  },
  completed: {
    variant: "success",
    label: "Completed",
    icon: CheckCircle2,
  },
  failed: {
    variant: "destructive",
    label: "Failed",
    icon: AlertCircle,
  },
  transcribed: {
    variant: "success",
    label: "Transcribed",
    icon: CheckCircle2,
  },
};

export const JobStatus = ({
  transcriptionStatus,
  diarizationEnabled,
  diarizationStatus,
  diarizationProgress,
  isMobile,
}: JobStatusProps) => {
  const transcriptionConfig = statusConfig[transcriptionStatus];
  const diarizationConfig = diarizationStatus
    ? statusConfig[diarizationStatus]
    : null;

  const StatusIcon = transcriptionConfig.icon;
  const DiarizationIcon = diarizationConfig?.icon || AlertCircle;


  const combinedStatusDescription = (
    <div className="space-y-2">
      <div>
        <p className="font-medium">
          Transcription: {transcriptionConfig.label}
        </p>
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
            {getStatusDescription(diarizationStatus || "pending", true)}{" "}
            {diarizationProgress && `(${diarizationProgress}%)`}
          </p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    // Simplified label for mobile
    const mobileLabel =
      transcriptionStatus === "running" || diarizationStatus === "running"
        ? "Processing..."
        : transcriptionStatus === "completed" && diarizationEnabled
          ? "Transcribed"
          : transcriptionConfig.label;

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Badge
            variant={transcriptionConfig.variant as any}
            className="gap-1.5 p-2.5"
          >
            <StatusIcon
              className={`h-4 w-4 ${transcriptionStatus === "running" ? "animate-spin" : ""}`}
            />
            {mobileLabel}
          </Badge>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Job Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Transcription</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusIcon
                  className={`h-4 w-4 ${transcriptionStatus === "running" ? "animate-spin" : ""}`}
                />
                <p className="text-sm">{transcriptionConfig.label}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getStatusDescription(transcriptionStatus)}
              </p>
            </div>
            {diarizationEnabled && (
              <div>
                <p className="font-medium">Diarization</p>
                <div className="flex items-center gap-2 mt-1">
                  <DiarizationIcon
                    className={`h-4 w-4 ${diarizationStatus === "running" ? "animate-spin" : ""}`}
                  />
                  <p className="text-sm">
                    {diarizationConfig?.label || "Not started"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getStatusDescription(diarizationStatus || "pending", true)}{" "}
                  {diarizationProgress && `(${diarizationProgress}%)`}
                </p>
                {diarizationStatus === "running" && diarizationProgress && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${diarizationProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  } else {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Badge
                variant={transcriptionConfig.variant as any}
                className="gap-1.5 p-2.5"
              >
                <StatusIcon
                  className={`h-4 w-4 ${transcriptionStatus === "running" ? "animate-spin" : ""
                    }`}
                />
                {transcriptionConfig.label}
              </Badge>
              {diarizationEnabled && (
                <Badge
                  variant={diarizationConfig?.variant as any || "secondary"}
                  className="gap-1.5 p-2.5"
                >
                  <DiarizationIcon
                    className={`h-4 w-4 ${diarizationStatus === "running" ? "animate-spin" : ""
                      }`}
                  />
                  {diarizationConfig?.label || "Diarization"}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>{combinedStatusDescription}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
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
