import React, { useState } from 'react';
import { Upload } from 'lucide-react';

export const UploadPage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            window.location.href = `/jobs/${data.jobId}`;
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
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
                <div className="mt-4">
                    <p className="text-sm text-gray-600">Selected: {file.name}</p>
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Start Transcription'}
                    </button>
                </div>
            )}
        </div>
    );
};