export interface Stats {
    totalJobs: number;
    successfulJobs: number;
    failedJobs: number;
    successRate: string;
    errorRate: string;
    timings: {
        avgDuration: string;
        minDuration: string;
        maxDuration: string;
    };
    fileSizes: {
        avgFileSize: string;
        minFileSize: string;
        maxFileSize: string;
    };
    errors: Array<{
        transcript: string;
        refined_transcript: string;
    }>;
}
