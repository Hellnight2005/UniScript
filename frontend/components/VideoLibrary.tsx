'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Card';
import { FileVideo, Calendar, Globe, Languages } from 'lucide-react';

export function VideoLibrary() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetch(`${API_URL}/api/videos`)
            .then(res => res.json())
            .then(data => {
                setVideos(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch videos:', err);
                setLoading(false);
            });
    }, [API_URL]);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />)}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Latest Uploads</h2>
                <Badge variant="default">{videos.length} Videos</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                    <Card key={video.id} className="group hover:border-zinc-400 dark:hover:border-zinc-500 transition-all">
                        <CardHeader className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-start justify-between gap-4">
                                <div className="p-2 bg-white dark:bg-zinc-950 rounded-lg shadow-sm">
                                    <FileVideo className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
                                </div>
                                <Badge variant="outline" className="text-[10px] uppercase">
                                    {video.original_language || 'EN'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate mb-2" title={video.title}>
                                {video.title}
                            </h3>

                            <div className="space-y-2">
                                <div className="flex items-center text-xs text-zinc-500 gap-2">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(video.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-xs text-zinc-500 gap-2">
                                    <Globe className="h-3 w-3" />
                                    {video.video_url === 'SUBTITLE_ONLY_UPLOAD' ? 'Subtitle Only' : 'Video Asset'}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                <button className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline">
                                    View Details
                                </button>
                                <div className="flex -space-x-1">
                                    <div className="h-5 w-5 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                        <Languages className="h-2.5 w-2.5" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {videos.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <p className="text-zinc-500">No videos uploaded yet.</p>
                </div>
            )}
        </div>
    );
}
