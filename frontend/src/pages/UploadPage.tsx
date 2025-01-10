import { useState } from 'react';
import { Info, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const UploadPage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [diarizationEnabled, setDiarizationEnabled] = useState(false);

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('diarization', diarizationEnabled.toString());

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload', true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(progress);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                window.location.href = `/jobs/${data.jobId}`;
            } else {
                console.error('Upload failed');
                setUploading(false);
            }
        };

        xhr.onerror = () => {
            console.error('Upload failed');
            setUploading(false);
        };

        xhr.send(formData);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto flex flex-col gap-4 md:gap-6">
            <h1 className="text-2xl md:text-3xl font-bold">Upload Media File</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Upload</CardTitle>
                    <CardDescription>Drag and drop or click to upload audio/video files</CardDescription>
                </CardHeader>
                <CardContent
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        setFile(e.dataTransfer.files?.[0] || null);
                    }}
                >
                    <Label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2 border-2 border-dashed p-4"
                    >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Drag and drop or click to choose file
                        </span>
                    </Label>
                    <Input
                        type="file"
                        accept="audio/mpeg, audio/wav, audio/ogg, audio/aac, audio/webm, audio/x-m4a, audio/amr, video/mp4, video/ogg, video/webm, video/x-matroska"
                        // capture="user"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                        id="file-upload"
                    />
                </CardContent>
                {file && (
                    <CardFooter className="flex-col items-start gap-2">
                        <div className="w-full flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Selected:</span>
                            <span className="text-sm">{file.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={diarizationEnabled}
                                onChange={(e) => setDiarizationEnabled(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-600">Enable Speaker Identification</span>
                        </label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[300px] p-4">
                                    <div className="space-y-2">
                                        <p className="font-semibold">Speaker Identification</p>
                                        <p>This feature analyzes the audio to identify different speakers in the conversation.</p>
                                        <div className="space-y-1">
                                            <p className="text-yellow-600 font-medium">Important Notes:</p>
                                            <ul className="list-disc list-inside text-sm">
                                                <li>Only enable if your recording has multiple speakers</li>
                                                <li>This process can take significantly longer than regular transcription</li>
                                                <li>Other features like summary and refinement will be delayed until speaker identification is complete</li>
                                            </ul>
                                        </div>
                                        <p className="text-sm italic">Example output: "Speaker 1: Hello" / "Speaker 2: Hi there"</p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                        {uploading && <Progress value={uploadProgress} className="w-full" />}
                        <Button onClick={handleUpload} disabled={uploading} className="w-full">
                            {uploading ? `Uploading... ${uploadProgress}%` : 'Start Transcription'}
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
};
