// frontend/src/pages/JobDetailPage.tsx  
import { useEffect, useState } from 'react';
import { Job } from '../types';
import { useParams } from 'react-router-dom';

export const JobDetailPage = () => {
    const [job, setJob] = useState<Job | null>(null);
    const [refining, setRefining] = useState(false);
    const { id } = useParams();

    useEffect(() => {
        setInterval(() => { fetchJob(); }, 5000);
        fetchJob();
    }, []);


    const fetchJob = async () => {
        if (!id) return;

        const response = await fetch(`/api/jobs/${id}`);
        const data = await response.json();
        setJob(data);
    };

    const handleRefine = async () => {
        if (!job) return;

        setRefining(true);
        try {
            const response = await fetch(`/api/jobs/${job.id}/refine`, {
                method: 'POST'
            });
            const data = await response.json();
            setJob(data);
        } catch (error) {
            console.error('Refinement failed:', error);
        } finally {
            setRefining(false);
        }
    };

    const handleDownload = (withTimestamps: boolean) => {
        if (!job?.transcript) return;

        const text = withTimestamps ? job.transcript :
            job.transcript.replace(/\[\d{2}:\d{2}:\d{2}\]/g, '');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${job.file_name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {job && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex space-x-2">
                            <h1 className="text-2xl font-bold">{job.file_name}</h1>
                            <div className={`px-3 py-1 rounded-full text-sm ${job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                job.status === 'failed' ? 'bg-red-100 text-red-800' :
                                    job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {job.status}
                            </div>
                        </div>
                        <div className="space-x-2">
                            <button
                                onClick={() => handleDownload(false)}
                                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Download Plain Text
                            </button>
                            <button
                                onClick={() => handleDownload(true)}
                                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Download with Timestamps
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-medium mb-4">Transcript</h2>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
                            {job.transcript}
                        </pre>

                        {job.status === 'completed' && !job.refined_transcript && (
                            <button
                                onClick={handleRefine}
                                disabled={refining}
                                className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                {refining ? 'Refining...' : 'Refine with LLM'}
                            </button>
                        )}

                        {job.refined_transcript && (
                            <div className="mt-6">
                                <h2 className="text-lg font-medium mb-4">Refined Transcript</h2>
                                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
                                    {job.refined_transcript}
                                </pre>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};