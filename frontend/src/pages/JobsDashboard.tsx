// frontend/src/pages/JobsDashboard.tsx  
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Job } from '../types';

export const JobsDashboard = () => {
    const [jobs, setJobs] = useState<Job[]>([]);


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
            await fetch(`/api/jobs/${id}`, {
                method: 'DELETE'
            });
            setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));

            fetchJobs();
        } catch (error) {
            console.error('Failed to delete job:', error);
        }
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Transcription Jobs</h1>

            <div className="grid gap-4">
                {jobs.map((job) => (
                    <Link
                        key={job.id}
                        to={`/jobs/${job.id}`}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{job.file_name}</p>
                                <p className="text-sm text-gray-500">
                                    Created: {new Date(job.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className='flex gap-1'>
                                <div className={`px-3 py-1 rounded-full text-sm ${job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {job.status}
                                </div>
                                <button className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200" onClick={() => onDelete(job.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};