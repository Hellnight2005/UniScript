'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Video, FileText, Activity, Zap } from 'lucide-react';

export function AnalyticsOverview() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetch(`${API_URL}/api/videos/analytics`)
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch analytics:', err);
                setLoading(false);
            });
    }, [API_URL]);

    const stats = [
        {
            label: 'Total Videos',
            value: data?.total_videos || 0,
            icon: Video,
            description: 'Uploaded assets',
            color: 'bg-blue-500/10 text-blue-600'
        },
        {
            label: 'Total Scripts',
            value: data?.total_scripts || 0,
            icon: FileText,
            description: 'Transcribed content',
            color: 'bg-emerald-500/10 text-emerald-600'
        },
        {
            label: 'Avg Speed',
            value: '2.4x',
            icon: Zap,
            description: 'Processing latency',
            color: 'bg-amber-500/10 text-amber-600'
        },
        {
            label: 'System Load',
            value: 'Normal',
            icon: Activity,
            description: 'Health status',
            color: 'bg-purple-500/10 text-purple-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            {loading ? (
                                <div className="h-4 w-8 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                            ) : (
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">LIVE</span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                                {loading ? '...' : stat.value}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">{stat.description}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
