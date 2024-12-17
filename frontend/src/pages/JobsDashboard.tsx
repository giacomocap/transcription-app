// frontend/src/pages/JobsDashboard.tsx  
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Job } from '../types';

export const JobsDashboard = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobToDelete, setJobToDelete] = useState<string | null>(null);

    const fetchJobs = async () => {
        try {
            const response = await fetch('/api/jobs');
            const data = await response.json();
            setJobs(data);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        }
    };

    useEffect(() => {

        fetchJobs();
        const interval = setInterval(fetchJobs, 5000);
        return () => clearInterval(interval);
    }, []);

    const onDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/jobs/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));
            } else {
                console.error('Failed to delete job');
            }
        } catch (error) {
            console.error('Failed to delete job:', error);
        } finally {
            setJobToDelete(null);
        }
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Transcription Jobs</h1>
                <p className="text-gray-600 mt-2">
                    View and manage your audio transcription jobs.
                </p>
            </div>

            {/* Delete Confirmation Modal */}
            {jobToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Delete Transcription</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this transcription? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setJobToDelete(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => jobToDelete && onDelete(jobToDelete)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {jobs.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 mb-4">No transcriptions found...</p>
                        <Link 
                            to="/upload" 
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Upload an audio file
                        </Link>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div
                            key={job.id}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <Link
                                    to={`/jobs/${job.id}`}
                                    className="flex-1"
                                >
                                    <div>
                                        <p className="font-medium">{job.file_name}</p>
                                        <p className="text-sm text-gray-500">
                                            Created: {new Date(job.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                                <div className='flex gap-1 items-center'>
                                    <div className={`px-3 py-1 rounded-full text-sm ${job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                                            job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {job.status}
                                    </div>
                                    <button 
                                        className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setJobToDelete(job.id);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};