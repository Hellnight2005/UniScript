'use client';

import { useState } from 'react';
import { Upload, FileVideo, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Card'; // Reusing from same file for simplicity here
import { cn } from '@/lib/utils';

export function ProfessionalUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [response, setResponse] = useState<any>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setStatus('idle');
            setResponse(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setStatus('idle');

        const formData = new FormData();
        formData.append('video', file);

        try {
            const res = await fetch(`${API_URL}/api/videos/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setResponse(data);
            setStatus('success');
        } catch (error) {
            console.error('Upload error:', error);
            setStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto overflow-hidden">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Content Pipeline</CardTitle>
                        <CardDescription>Upload video or subtitle file for processing</CardDescription>
                    </div>
                    <Badge variant={status === 'success' ? 'success' : status === 'error' ? 'error' : 'default'}>
                        {status.toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pt-8">
                <div
                    className={cn(
                        "group relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer",
                        file ? "border-zinc-400 bg-zinc-50 dark:bg-zinc-900/20" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700"
                    )}
                    onClick={() => document.getElementById('file-input')?.click()}
                >
                    <input
                        id="file-input"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="video/*,.srt,.vtt"
                    />

                    {file ? (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            {file.type.startsWith('video/') ? (
                                <FileVideo className="h-12 w-12 text-zinc-900 dark:text-zinc-50 mb-4" />
                            ) : (
                                <FileText className="h-12 w-12 text-zinc-900 dark:text-zinc-50 mb-4" />
                            )}
                            <p className="font-medium text-center">{file.name}</p>
                            <p className="text-sm text-zinc-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-4 text-zinc-500 hover:text-red-500"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                }}
                            >
                                Remove file
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                            </div>
                            <p className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">Click to upload or drag and drop</p>
                            <p className="text-zinc-500 text-sm mt-1">Supports MP4, MKV, SRT (Max 1GB)</p>
                        </>
                    )}
                </div>

                <div className="mt-8 flex gap-4">
                    <Button
                        className="w-full h-12 text-base font-semibold"
                        disabled={!file || isUploading}
                        isLoading={isUploading}
                        onClick={handleUpload}
                    >
                        {isUploading ? 'Processing...' : 'Start Pipeline'}
                    </Button>
                </div>

                {status === 'success' && response && (
                    <div className="mt-6 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-semibold">Pipeline started successfully</span>
                        </div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-500 mb-2">
                            Processing started. {response.estimated_processing_time && `Estimated time: ${response.estimated_processing_time}`}
                        </p>
                        <div className="text-xs font-mono bg-white dark:bg-black/40 p-2 rounded border border-emerald-500/10 text-zinc-600 dark:text-zinc-400">
                            ID: {response.video?.id || response.id}
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-6 p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-semibold">Upload failed. Please try again.</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
