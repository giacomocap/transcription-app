// src/components/StatsDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Stats } from '../types/stats';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { authFetch } from '@/utils/authFetch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

const StatsView: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await authFetch('/api/admin/stats').then((res) => res.json());
      setStats(data);
    };
    loadStats();
  }, []);

  if (!stats) {
    return <div>Loading...</div>;
  }

  // Data for the bar chart
  const chartData = [
    { name: 'Successful Jobs', value: stats.successfulJobs },
    { name: 'Failed Jobs', value: stats.failedJobs },
  ];

  return (
    <div>
      {/* General Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Jobs Card */}
        <Card>
          <CardHeader>
            <CardTitle>Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalJobs}</p>
          </CardContent>
        </Card>

        {/* Success Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.successRate}</p>
          </CardContent>
        </Card>

        {/* Error Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle>Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.errorRate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Job Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Errors Table */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transcript</TableHead>
                  <TableHead>Refined Transcript</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.errors?.map((error, index) => (
                  <TableRow key={index}>
                    <TableCell>{error.transcript}</TableCell>
                    <TableCell>{error.refined_transcript}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Stats Per User Table */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Stats Per User</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Total Jobs</TableHead>
                  <TableHead>Successful Jobs</TableHead>
                  <TableHead>Failed Jobs</TableHead>
                  <TableHead>Avg Duration (s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.statsPerUser?.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>{user.display_name} ({user.email})</TableCell>
                    <TableCell>{user.total_jobs}</TableCell>
                    <TableCell>{user.successful_jobs}</TableCell>
                    <TableCell>{user.failed_jobs}</TableCell>
                    <TableCell>{parseFloat(user.avg_duration_per_user).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* User Stats Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users Card */}
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.usersStats.totalUsers}</p>
          </CardContent>
        </Card>

        {/* New Users (Last 7 Days) Card */}
        <Card>
          <CardHeader>
            <CardTitle>New Users (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.usersStats.newUsersLast7Days}</p>
          </CardContent>
        </Card>

        {/* New Users (Last 30 Days) Card */}
        <Card>
          <CardHeader>
            <CardTitle>New Users (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.usersStats.newUsersLast30Days}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsView;