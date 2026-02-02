'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Card';
import { FileVideo, Calendar, Globe } from 'lucide-react';

export function VideoLibrary() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const handleDownload = (jobId: string, format: 'srt' | 'txt', type: 'original' | 'translated' = 'original') => {
        const endpoint = type === 'original'
            ? `${API_URL}/api/videos/${jobId}/script/download?format=${format}`
            : `${API_URL}/api/videos/${jobId}/script/download?format=${format}&target=true`;
        window.open(endpoint, '_blank');
    };

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
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                        {video.original_language || 'EN'}
                                    </Badge>
                                    {video.target_language && video.target_language !== 'en' && (
                                        <Badge variant="default" className="text-[9px] uppercase bg-accent text-white border-0 py-0 h-4">
                                            → {video.target_language}
                                        </Badge>
                                    )}
                                </div>
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

                            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                                {video.status === 'DONE' ? (
                                    <>
                                        {video.target_language && video.target_language !== 'en' ? (
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleDownload(video.id, 'srt', 'translated')}
                                                    className="w-full py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold shadow-md shadow-accent/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Globe className="h-3.5 w-3.5" />
                                                    DOWNLOAD {video.target_language.toUpperCase()} SRT
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(video.id, 'srt', 'original')}
                                                    className="w-full py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 text-[10px] font-semibold transition-colors border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg"
                                                >
                                                    English Reference
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleDownload(video.id, 'srt', 'original')}
                                                className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                DOWNLOAD SRT
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 py-2.5 text-zinc-400 italic text-xs">
                                        <div className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                                        {video.status.replace(/_/g, ' ')}...
                                    </div>
                                )}
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
