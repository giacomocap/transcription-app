import { useEffect, useState, useRef } from 'react';
import { Job } from '../types/index';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Pause, RotateCcw, Trash, Edit, Share } from 'lucide-react';
import { JobStatus } from '../components/JobStatus';
import { TranscriptionTabs } from '../components/TranscriptionTabs';
import { Button } from '../components/ui/button';
import { CardTitle } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import DeleteJobAlert from '@/components/DeleteJobAlert';
import { EditJobDialog } from '@/components/EditJobDialog';
import { ShareModal } from '../components/ShareModal';
import { Badge } from '../components/ui/badge';

export const JobDetailPage = () => {
  const [job, setJob] = useState<Job | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [duration, setDuration] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [hasDialogBeenShown, setHasDialogBeenShown] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const isPublicAccess = searchParams.has('token');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Don't poll while edit dialog is open
    if (!isEditDialogOpen) {
      const interval = setInterval(() => {
        fetchJob();
      }, 5000);
      fetchJob();
      return () => clearInterval(interval);
    }
  }, [isEditDialogOpen]);

  // Auto-open edit dialog only on first load when diarization is complete and refinement is pending
  useEffect(() => {
    if (job &&
      job.diarization_enabled &&
      job.diarization_status === 'completed' &&
      job.refinement_pending &&
      !isEditDialogOpen &&
      !hasDialogBeenShown) {
      setIsEditDialogOpen(true);
      setHasDialogBeenShown(true);
    }
  }, [job, isEditDialogOpen, hasDialogBeenShown]);

  const fetchJob = async () => {
    if (!id) return;
    const response = await fetch(`/api/jobs/${id}${isPublicAccess ? '?token=' + searchParams.get('token') : ''}`);
    const data = await response.json();
    setJob(data);
  };

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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setCurrentTime(currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleDelete = async () => {
    if (!job) return;

    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        navigate('/jobs', { replace: true });
      } else {
        console.error('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="px-6 max-w-4xl mx-auto space-y-4 md:space-y-6">
      {job && (
        <div className="space-y-4">
          {isPublicAccess ? (
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <CardTitle className="mb-2">{job.file_name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Shared</Badge>
                  <JobStatus
                    transcriptionStatus={job.status}
                    diarizationEnabled={job.diarization_enabled}
                    diarizationStatus={job.diarization_status}
                    diarizationProgress={job.diarization_progress}
                    isMobile
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <CardTitle>{job.file_name}</CardTitle>
              <div className="flex items-center gap-2 md:gap-4">
                <JobStatus
                  transcriptionStatus={job.status}
                  diarizationEnabled={job.diarization_enabled}
                  diarizationStatus={job.diarization_status}
                  diarizationProgress={job.diarization_progress}
                  isMobile
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
                <DeleteJobAlert confirmAction={handleDelete}>
                  <Button variant="outline" size="icon">
                    <Trash className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </DeleteJobAlert>
                <EditJobDialog
                  job={job}
                  isOpen={isEditDialogOpen}
                  onClose={() => setIsEditDialogOpen(false)}
                  onSave={async ({ file_name, speaker_profiles, speaker_segments }) => {
                    try {
                      const updatedFields = {
                        ...(file_name !== job.file_name && { file_name }),
                        ...(JSON.stringify(speaker_profiles) !== JSON.stringify(job.speaker_profiles) && { speaker_profiles }),
                        ...(JSON.stringify(speaker_segments) !== JSON.stringify(job.speaker_segments) && { speaker_segments }),
                      };

                      if (Object.keys(updatedFields).length > 0) {
                        const response = await fetch(`/api/jobs/${job.id}/update`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(updatedFields),
                        });

                        if (!response.ok) {
                          throw new Error('Failed to update job');
                        }
                      }

                      setJob(prevJob => {
                        if (!prevJob) return null;
                        return {
                          ...prevJob,
                          file_name: file_name ?? prevJob.file_name,
                          speaker_profiles: speaker_profiles ?? prevJob.speaker_profiles,
                          speaker_segments: speaker_segments ?? prevJob.speaker_segments,
                        };
                      });
                      setIsEditDialogOpen(false);
                      fetchJob();
                    } catch (error) {
                      console.error('Error updating job:', error);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {job.file_url && (
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
              <audio
                ref={audioRef}
                src={`${job.file_url}`}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex flex-col space-y-2 md:space-y-4 w-full">
                <div className="flex items-center space-x-2 md:space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRewind}
                    title="Rewind to start"
                  >
                    <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                  <Button size="icon" onClick={handlePlayPause}>
                    {isPlaying ? (
                      <Pause className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <Play className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </Button>
                  <div className="text-sm text-gray-600 font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  <div className="flex justify-end flex-1">
                    {isMobile ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            {playbackSpeed}x
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                            <DropdownMenuItem
                              key={speed}
                              onSelect={() => handleSpeedChange(speed)}
                            >
                              {speed}x
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                          <Button
                            key={speed}
                            variant={playbackSpeed === speed ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => handleSpeedChange(speed)}
                            className="text-xs"
                          >
                            {speed}x
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration}
                  step={0.1}
                  onValueChange={(value) => handleSeek(value[0])}
                  className="relative flex items-center w-full touch-none"
                  aria-label="Seek"
                />
              </div>
            </div>
          )}

          <TranscriptionTabs
            job={job}
            currentTime={currentTime}
            onTimeSelect={(time) => {
              if (audioRef.current) {
                audioRef.current.currentTime = time;
                setCurrentTime(time);
                if (!isPlaying) {
                  audioRef.current.play();
                  setIsPlaying(true);
                }
              }
            }}
            isPlaying={isPlaying}
          />

          <ShareModal
            jobId={job.id}
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
