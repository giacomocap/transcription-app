import React, { useState } from 'react';
import { Upload, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip"

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
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Upload Media File</h1>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                />
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer block"
                >
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                        Drag and drop or click to upload audio/video files
                    </p>
                </label>
            </div>

            {file && (
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-gray-600">Selected: {file.name}</p>
                    
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

                    {uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                        {uploading ? `Uploading... ${uploadProgress}%` : 'Start Transcription'}
                    </button>
                </div>
            )}
        </div>
    );
};