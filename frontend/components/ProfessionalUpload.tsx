import { useState, useEffect } from 'react';
import { Upload, FileVideo, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function ProfessionalUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'polling' | 'success' | 'error'>('idle');
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [response, setResponse] = useState<any>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Polling Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (status === 'polling' && jobId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${API_URL}/api/videos/${jobId}/status`);
                    if (!res.ok) throw new Error('Failed to fetch status');

                    const data = await res.json();
                    setProgress(data.progress);
                    setStatusText(data.status.replace(/_/g, ' '));

                    if (data.status === 'DONE') {
                        setStatus('success');
                        clearInterval(interval);
                    } else if (data.status === 'ERROR') {
                        setStatus('error');
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, 2000); // Poll every 2 seconds
        }

        return () => clearInterval(interval);
    }, [status, jobId, API_URL]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setStatus('idle');
            setResponse(null);
            setProgress(0);
            setStatusText('');
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
            setJobId(data.video.id);
            setStatus('polling');
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
                    <Badge variant={status === 'success' ? 'success' : status === 'error' ? 'error' : 'default'} className="animate-pulse">
                        {status === 'polling' ? 'PROCESSING' : status.toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pt-8">
                {status === 'idle' && (
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
                )}

                {(status === 'polling' || isUploading) && (
                    <div className="p-8 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-accent/10 rounded-lg animate-bounce">
                                <Loader2 className="h-6 w-6 text-accent animate-spin" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{isUploading ? 'Uploading Video...' : 'AI Processing...'}</h3>
                                <p className="text-sm text-zinc-500 capitalize">{statusText || 'Initializing pipeline'}</p>
                            </div>
                        </div>

                        <div className="relative w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-accent transition-all duration-500 ease-out shadow-[0_0_15px_rgba(109,40,217,0.5)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs font-bold font-mono text-zinc-500">
                            <span>PROGRESS</span>
                            <span>{progress}%</span>
                        </div>
                    </div>
                )}

                {status === 'idle' && (
                    <div className="mt-8 flex gap-4">
                        <Button
                            className="w-full h-12 text-base font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-[0.98] transition-all bg-accent hover:bg-accent/90 text-white border-0"
                            disabled={!file || isUploading}
                            isLoading={isUploading}
                            onClick={handleUpload}
                        >
                            Start Pipeline
                        </Button>
                    </div>
                )}

                {status === 'success' && response && (
                    <div className="mt-6 p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 mb-4">
                            <CheckCircle2 className="h-6 w-6" />
                            <span className="font-bold text-lg">Processing Complete!</span>
                        </div>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-500/80 mb-6 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                            Your transcript and subtitles are ready to view and download.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black">
                                View Full Script
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1">Download SRT</Button>
                                <Button variant="outline" className="flex-1">Download TXT</Button>
                            </div>
                            <Button
                                variant="ghost"
                                className="mt-4 text-zinc-500"
                                onClick={() => setStatus('idle')}
                            >
                                Process another video
                            </Button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-6 p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <div>
                            <span className="font-semibold block">Processing Failed</span>
                            <p className="text-xs opacity-80 mt-1">Please try again or contact support.</p>
                        </div>
                        <Button variant="ghost" className="ml-auto" onClick={() => setStatus('idle')}>Retry</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
