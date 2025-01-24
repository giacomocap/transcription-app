import { useState, useEffect } from 'react';
import { Info, Upload, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { authFetch, createAuthXHR } from '@/utils/authFetch';
import { LANGUAGES } from '../constants/languages';

export const UploadPage = () => {
    useEffect(() => {
        document.title = 'Upload - Claire.AI';
    }, []);

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [diarizationEnabled, setDiarizationEnabled] = useState(false);
    const [language, setLanguage] = useState<string | undefined>(undefined);
    const [creditsBalance, setCreditsBalance] = useState<number>(0);
    const [estimatedCredits, setEstimatedCredits] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);

    useEffect(() => {
        // Fetch user's credit balance
        const fetchCredits = async () => {
            try {
                const response = await authFetch('/api/credits/balance');
                const data = await response.json();
                setCreditsBalance(data.balance);
            } catch (error) {
                console.error('Failed to fetch credits:', error);
            }
        };
        fetchCredits();
    }, []);

    // Calculate estimated credits when file or diarization changes
    useEffect(() => {
        if (file) {
            // Create audio element to get duration
            const audio = document.createElement('audio');
            audio.src = URL.createObjectURL(file);
            audio.onloadedmetadata = () => {
                const durationMinutes = Math.ceil(audio.duration / 60);
                setDuration(durationMinutes);
                setEstimatedCredits(diarizationEnabled ? durationMinutes * 1.5 : durationMinutes);
            };
        }
    }, [file, diarizationEnabled]);

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('diarization', diarizationEnabled.toString());
        if (language) {
            formData.append('language', language);
        }

        const xhr = await createAuthXHR('POST', '/api/upload');

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(progress);
                if (progress === 100) {
                    setProcessing(true);
                }
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                window.location.href = `/jobs/${data.jobId}`;
            } else {
                console.error('Upload failed');
                setUploading(false);
                setProcessing(false);
            }
        };

        xhr.onerror = () => {
            console.error('Upload failed');
            setUploading(false);
            setProcessing(false);
        };

        xhr.send(formData);
    };

    // Processing overlay component
    const ProcessingOverlay = () => (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
            <div className="flex flex-col items-center gap-4 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                    <p className="font-medium">Processing your file</p>
                    <p className="text-sm text-muted-foreground">This may take a few moments...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-2xl mx-auto flex flex-col gap-4 md:gap-6">
            <h1 className="text-2xl md:text-3xl font-bold">Upload Media File</h1>

            <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">Available Credits: {creditsBalance}</p>
                {file && (
                    <div className="mt-2">
                        <p className="text-sm text-blue-800">
                            Estimated duration: {duration} minutes
                        </p>
                        <p className="text-sm text-blue-800">
                            Required credits: {estimatedCredits}
                        </p>
                        {creditsBalance < estimatedCredits && (
                            <p className="text-sm text-red-600 mt-2">
                                Insufficient credits. Please purchase more credits to continue.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <Card className="relative">
                {processing && <ProcessingOverlay />}
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
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
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
                        <div className="w-full space-y-4">
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

                            <div className="space-y-2">
                                <Label>Audio Language (optional)</Label>
                                <div className="flex items-center gap-2">
                                    <Select onValueChange={setLanguage} value={language}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Auto-detect" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LANGUAGES.map((lang) => (
                                                <SelectItem key={lang.value} value={lang.value}>
                                                    {lang.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-gray-500 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[300px] p-4">
                                                <p>Selecting the audio language can improve transcription accuracy. If no language is selected, the system will attempt to automatically detect the language.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </div>

                        {uploading && <Progress value={uploadProgress} className="w-full" />}
                        <Button
                            onClick={handleUpload}
                            disabled={uploading || processing || creditsBalance < estimatedCredits}
                            className="w-full"
                        >
                            {uploading
                                ? `Uploading... ${uploadProgress}%`
                                : processing
                                    ? 'Processing...'
                                    : 'Start Transcription'
                            }
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
};

export default UploadPage;