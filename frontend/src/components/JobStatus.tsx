import { AlertCircle, CheckCircle2, Clock, HelpCircle, Info, Loader2 } from "lucide-react";
import { Status, TranscriptionStatus } from "../types";
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
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    label: "Pending",
  },
  running: {
    icon: Loader2,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    label: "Running",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-50",
    label: "Completed",
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-50",
    label: "Failed",
  },
  transcribed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-50",
    label: "Transcribed",
  },
};

export const JobStatus = ({
  transcriptionStatus,
  diarizationEnabled,
  diarizationStatus,
}: JobStatusProps) => {
  const transcriptionConfig = statusConfig[transcriptionStatus];
  const diarizationConfig = diarizationStatus ? statusConfig[diarizationStatus] : null;

  const StatusIcon = transcriptionConfig.icon;
  const DiarStatusIcon = diarizationConfig?.icon || HelpCircle;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="inline-flex items-center gap-2 rounded-lg border p-2 shadow-sm">
            <div
              className={`flex items-center gap-1.5 rounded-md ${transcriptionConfig.bgColor} px-2 py-1`}
            >
              <StatusIcon
                className={`${transcriptionConfig.color} h-4 w-4 ${
                  transcriptionStatus === "running" ? "animate-spin" : ""
                }`}
              />
              <span className={`text-sm ${transcriptionConfig.color}`}>
                {transcriptionConfig.label}
              </span>
            </div>

            {diarizationEnabled && (
              <div
                className={`flex items-center gap-1.5 rounded-md ${
                  diarizationConfig?.bgColor || "bg-gray-50"
                } px-2 py-1`}
              >
                <DiarStatusIcon
                  className={`${
                    diarizationConfig?.color || "text-gray-400"
                  } h-4 w-4 ${
                    diarizationStatus === "running" ? "animate-spin" : ""
                  }`}
                />
                <span
                  className={`text-sm ${
                    diarizationConfig?.color || "text-gray-400"
                  }`}
                >
                  {diarizationConfig?.label || "Diarization"}
                </span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-3 bg-white border shadow-lg">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Transcription: {transcriptionConfig.label}</p>
                <p className="text-xs text-gray-500">
                  {getStatusDescription(transcriptionStatus)}
                </p>
              </div>
            </div>
            {diarizationEnabled && (
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">
                    Diarization: {diarizationConfig?.label || "Not started"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getStatusDescription(diarizationStatus || "pending", true)}
                  </p>
                </div>
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
