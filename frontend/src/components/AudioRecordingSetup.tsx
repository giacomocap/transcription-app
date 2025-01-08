import React, { useState, useEffect, useRef } from 'react';
import { Mic, Info, Settings, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useWebSocket } from '../context/WebSocketContext';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface AudioRecordingSetupProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

export const AudioRecordingSetup: React.FC<AudioRecordingSetupProps> = ({
  onRecordingComplete,
}) => {
  const {
    sendMessage,
    isRecording,
    setIsRecording,
    micSources,
    systemSources,
    isAppInstalled,
  } = useWebSocket();
  const [selectedMicSource, setSelectedMicSource] = useState<
    MediaDeviceInfo | string | null
  >(localStorage.getItem('selectedMicSource') || null);
  const [selectedMeetingSource, setSelectedMeetingSource] = useState<
    MediaDeviceInfo | string | null
  >(localStorage.getItem('selectedMeetingSource') || null);
  const [browserMicSources, setBrowserMicSources] = useState<MediaDeviceInfo[]>([]);
  const [browserSystemSources, setBrowserSystemSources] = useState<MediaDeviceInfo[]>([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<BlobPart[]>([]);

  useEffect(() => {
    const getBrowserSources = async () => {
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((device) => device.kind === 'audioinput');
        const speakers = devices.filter((device) => device.kind === 'audiooutput');
        setBrowserMicSources(mics);
        setBrowserSystemSources(speakers);
      } catch (error) {
        console.error('Error enumerating media devices:', error);
      }
    };

    if (!isAppInstalled) {
      getBrowserSources();
    }
  }, [isAppInstalled]);

  useEffect(() => {
    if (micSources.length === 0 && isAppInstalled) {
      sendMessage({ type: 'GET_SOURCES' });
    }
  }, [micSources, isAppInstalled]);

  const startRecording = async () => {
    if (!isAppInstalled) {
      // Browser-based recording logic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId:
              typeof selectedMicSource === 'string'
                ? undefined
                : selectedMicSource?.deviceId,
          },
        });

        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.current.push(event.data);
          }
        };
        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(recordedChunks.current, {
            type: 'audio/wav',
          });
          onRecordingComplete(audioBlob);
          recordedChunks.current = [];
        };

        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting browser recording:', error);
      }
    } else {
      // Companion app recording logic
      sendMessage({
        type: 'START_RECORDING',
        payload: {
          micId: selectedMicSource,
          systemId: selectedMeetingSource,
        },
      });
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (!isAppInstalled) {
      // Browser-based recording logic
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
        setIsRecording(false);
      }
    } else {
      // Companion app recording logic
      sendMessage({ type: 'STOP_RECORDING' });
      setIsRecording(false);
    }
  };

  const handleSelectMicSource = (source: MediaDeviceInfo | string) => {
    setSelectedMicSource(source);
    const sourceId = typeof source === 'string' ? source : source.deviceId;
    localStorage.setItem('selectedMicSource', sourceId);
  };

  const handleSelectMeetingSource = (source: MediaDeviceInfo | string) => {
    setSelectedMeetingSource(source);
    const sourceId = typeof source === 'string' ? source : source.deviceId;
    localStorage.setItem('selectedMeetingSource', sourceId);
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Audio Recording Setup</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] p-4">
                <p>
                  Configure your audio recording settings here. You can select
                  which application's audio to capture (e.g., Zoom, Teams, or
                  your entire system).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {!isAppInstalled && (
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Companion App Not Installed</AlertTitle>
            <AlertDescription>
              For optimal performance, please install the companion desktop
              application.
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium">Mic Source</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between truncate"
                  >
                    <span className="truncate">
                      {isAppInstalled
                        ? selectedMicSource && typeof selectedMicSource === 'string'
                          ? micSources.find((s) => s.id === selectedMicSource)?.name
                          : 'Select Mic Source'
                        : selectedMicSource &&
                          typeof selectedMicSource !== 'string'
                        ? selectedMicSource.label
                        : 'Select Mic Source'}
                    </span>
                    <Settings className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {(isAppInstalled ? micSources : browserMicSources).map(
                    (source) => (
                      <DropdownMenuItem
                        key={typeof source === 'string' ? source : source.deviceId}
                        onSelect={() => handleSelectMicSource(source)}
                        title={
                          typeof source === 'string' ? source : source.label
                        }
                      >
                        <span className="truncate">
                          {typeof source === 'string'
                            ? micSources.find((s) => s.id === source)?.name
                            : source.label}
                        </span>
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <h3 className="text-sm font-medium">Meeting Audio Source</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between truncate"
                  >
                    <span className="truncate">
                      {isAppInstalled
                        ? selectedMeetingSource && typeof selectedMeetingSource === 'string'
                          ? systemSources.find((s) => s.id === selectedMeetingSource)?.name
                          : 'Select Meeting Audio Source'
                        : selectedMeetingSource &&
                          typeof selectedMeetingSource !== 'string'
                        ? selectedMeetingSource.label
                        : 'Select Meeting Audio Source'}
                    </span>
                    <Settings className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {(isAppInstalled
                    ? systemSources
                    : browserSystemSources
                  ).map((source) => (
                    <DropdownMenuItem
                      key={typeof source === 'string' ? source : source.deviceId}
                      onSelect={() => handleSelectMeetingSource(source)}
                      title={
                        typeof source === 'string' ? source : source.label
                      }
                    >
                      <span className="truncate">
                        {typeof source === 'string'
                          ? systemSources.find((s) => s.id === source)?.name
                          : source.label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Button onClick={startRecording} disabled={isRecording} className="w-full">
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
          {isRecording && (
            <Button onClick={stopRecording} variant="destructive" className="w-full">
              Stop Recording
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
