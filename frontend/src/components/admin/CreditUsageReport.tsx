import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { authFetch } from '@/utils/authFetch';

interface UsageStats {
    total_credits_used: number;
    transcription_credits: number;
    diarization_credits: number;
    transactions_by_day: Record<string, number>;
    users_by_usage: Record<string, number>;
}

export const CreditUsageReport = () => {
    const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        fetchUsageStats();
    }, []);

    const fetchUsageStats = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('start_date', startDate);
            if (endDate) queryParams.append('end_date', endDate);

            const response = await authFetch(`/api/admin/credits/usage?${queryParams}`);
            const data = await response.json();
            setUsageStats(data);
        } catch (error) {
            console.error('Error fetching usage stats:', error);
        }
    };

    const chartData = usageStats?.transactions_by_day
        ? Object.entries(usageStats.transactions_by_day).map(([date, credits]) => ({
            date,
            credits,
        }))
        : [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit Usage Report</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <Button onClick={fetchUsageStats}>
                            Update Report
                        </Button>
                    </div>

                    {usageStats && (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Total Credits Used</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">{usageStats.total_credits_used}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Transcription Credits</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">{usageStats.transcription_credits}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Diarization Credits</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">{usageStats.diarization_credits}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="h-[300px] mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="credits"
                                            stroke="#8884d8"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
