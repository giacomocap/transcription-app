import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Job } from "../types";
import { Button } from "../components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Trash } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DeleteJobAlert from "@/components/DeleteJobAlert";

export const JobsDashboard = () => {
    useEffect(() => {
        document.title = 'Transcriptions - Claire.AI';
    }, []);

    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobToDelete, setJobToDelete] = useState<string | null>(null);

    const fetchJobs = async () => {
        try {
            const response = await fetch("/api/jobs");
            const data = await response.json();
            setJobs(data);
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
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
                method: "DELETE",
            });
            if (response.ok) {
                setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));
            } else {
                console.error("Failed to delete job");
            }
        } catch (error) {
            console.error("Failed to delete job:", error);
        } finally {
            setJobToDelete(null);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto flex flex-col gap-4 md:gap-6">
            <h1 className="text-2xl md:text-3xl font-bold">Transcriptions</h1>

            <div className="grid gap-4">
                {jobs.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                        <p className="text-muted-foreground mb-2 md:mb-4">
                            No transcriptions found...
                        </p>
                        <Button asChild>
                            <Link to="/upload">Upload an audio file</Link>
                        </Button>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <Card key={job.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link
                                                        to={`/jobs/${job.id}`}
                                                        className="flex-1"
                                                    >
                                                        {job.file_name}
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{job.file_name}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="flex gap-1 items-center">
                                        <Badge
                                            variant="secondary"
                                            className={`text-xs px-2 py-1 rounded-full ${job.status === "completed"
                                                ? "bg-green-100 text-green-800"
                                                : job.status === "failed"
                                                    ? "bg-red-100 text-red-800"
                                                    : job.status === "running"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {job.status}
                                        </Badge>
                                        <DeleteJobAlert cancelAction={() => setJobToDelete(null)} confirmAction={() => jobToDelete && onDelete(jobToDelete)}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setJobToDelete(job.id);
                                                }}
                                            >Delete
                                                <Trash className="w-4 h-4 md:w-5 md:h-5" />
                                            </Button>
                                        </DeleteJobAlert>
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    Created: {new Date(job.created_at).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
