'use client';

import { useState, useEffect } from 'react';
import { Upload, FileVideo, FileText, CheckCircle2, AlertCircle, Loader2, X, Copy, Check, Search, Globe, ChevronRight, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const LANGUAGES = [
    { name: 'English', code: 'en', icon: '🇺🇸' },
    { name: 'Hindi', code: 'hi', icon: '🇮🇳' },
    { name: 'Bengali', code: 'bn', icon: '🇮🇳' },
    { name: 'Spanish', code: 'es', icon: '🇪🇸' },
    { name: 'French', code: 'fr', icon: '🇫🇷' },
    { name: 'German', code: 'de', icon: '🇩🇪' },
    { name: 'Japanese', code: 'ja', icon: '🇯🇵' },
    { name: 'Chinese (Simplified)', code: 'zh-CN', icon: '🇨🇳' },
    { name: 'Chinese (Traditional)', code: 'zh-TW', icon: '🇹🇼' },
    { name: 'Portuguese', code: 'pt', icon: '🇵🇹' },
    { name: 'Italian', code: 'it', icon: '🇮🇹' },
    { name: 'Russian', code: 'ru', icon: '🇷🇺' },
    { name: 'Korean', code: 'ko', icon: '🇰🇷' },
    { name: 'Arabic', code: 'ar', icon: '🇸🇦' },
    { name: 'Turkish', code: 'tr', icon: '🇹🇷' },
    { name: 'Dutch', code: 'nl', icon: '🇳🇱' },
    { name: 'Polish', code: 'pl', icon: '🇵🇱' },
    { name: 'Vietnamese', code: 'vi', icon: '🇻🇳' },
    { name: 'Thai', code: 'th', icon: '🇹🇭' },
    { name: 'Indonesian', code: 'id', icon: '🇮🇩' },
    { name: 'Greek', code: 'el', icon: '🇬🇷' },
    { name: 'Hebrew', code: 'he', icon: '🇮🇱' },
    { name: 'Swedish', code: 'sv', icon: '🇸🇪' },
    { name: 'Danish', code: 'da', icon: '🇩🇰' },
    { name: 'Finnish', code: 'fi', icon: '🇫🇮' },
    { name: 'Norwegian', code: 'no', icon: '🇳🇴' },
    { name: 'Gujarati', code: 'gu', icon: '🇮🇳' },
    { name: 'Marathi', code: 'mr', icon: '🇮🇳' },
    { name: 'Tamil', code: 'ta', icon: '🇮🇳' },
    { name: 'Telugu', code: 'te', icon: '🇮🇳' },
    { name: 'Malayalam', code: 'ml', icon: '🇮🇳' },
    { name: 'Punjabi', code: 'pa', icon: '🇮🇳' },
];

export function ProfessionalUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'pending_selection' | 'polling' | 'success' | 'error'>('idle');
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [response, setResponse] = useState<any>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [isLoadingScript, setIsLoadingScript] = useState(false);
    const [scriptContent, setScriptContent] = useState<any>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLanguages = LANGUAGES.filter(lang =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        setResponse((prev: any) => ({
                            ...prev,
                            video: { ...prev?.video, ...data }
                        }));
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
            setStatus('pending_selection');
        } catch (error) {
            console.error('Upload error:', error);
            setStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = (format: 'srt' | 'txt', type: 'original' | 'translated' = 'original') => {
        if (!jobId) return;
        const endpoint = type === 'original'
            ? `${API_URL}/api/videos/${jobId}/script/download?format=${format}`
            : `${API_URL}/api/videos/${jobId}/script/download?format=${format}&target=true`;
        window.open(endpoint, '_blank');
    };

    const handleStartProcessing = async (languageCode: string) => {
        if (!jobId) return;

        try {
            const res = await fetch(`${API_URL}/api/videos/${jobId}/start-processing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetLanguage: languageCode }),
            });

            if (!res.ok) throw new Error('Failed to start processing');

            const data = await res.json();
            setResponse((prev: any) => ({
                ...prev,
                video: { ...prev?.video, ...data.video }
            }));

            setStatus('polling');
            setStatusText('Initializing pipeline');
        } catch (error) {
            console.error('Start processing error:', error);
            setStatus('error');
        }
    };

    const handleViewScript = async () => {
        if (!jobId) return;
        setIsLoadingScript(true);
        try {
            const res = await fetch(`${API_URL}/api/videos/${jobId}/script`);
            if (!res.ok) throw new Error('Failed to fetch script');
            const data = await res.json();

            // Fetch translations too if they exist
            const transRes = await fetch(`${API_URL}/api/videos/${jobId}/translations`);
            const translations = transRes.ok ? await transRes.json() : [];

            setScriptContent({
                ...data,
                translations: translations
            });
            setIsViewerOpen(true);
        } catch (error) {
            console.error('Error fetching script:', error);
        } finally {
            setIsLoadingScript(false);
        }
    };

    const handleCopyScript = () => {
        const translations = (scriptContent as any)?.translations;
        const mainTranslation = translations && translations.length > 0 ? translations[0] : null;

        const textToCopy = mainTranslation
            ? mainTranslation.translated_text
            : (scriptContent as any)?.content?.cleaned_text || (scriptContent as any)?.content?.raw_transcript?.text;

        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
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
                        {status === 'polling' ? 'PROCESSING' : status === 'pending_selection' ? 'SELECT LANGUAGE' : status.toUpperCase()}
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

                {status === 'pending_selection' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto w-full">
                        <div className="text-center mb-8">
                            <div className="inline-flex p-3 bg-emerald-500/10 rounded-full mb-4">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold italic">File Uploaded!</h3>
                            <p className="text-zinc-500">Search and select a target language for translation</p>
                        </div>

                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search 50+ languages (e.g. Hindi, Japanese...)"
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-accent outline-none transition-all text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredLanguages.length > 0 ? (
                                filteredLanguages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleStartProcessing(lang.code)}
                                        className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-accent hover:bg-accent/5 transition-all text-sm font-semibold active:scale-95 group text-left"
                                    >
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{lang.icon}</span>
                                        <div className="flex flex-col">
                                            <span>{lang.name}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{lang.code}</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-auto text-zinc-300 group-hover:text-accent transition-colors" />
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                                    <Globe className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                    No languages found matching "{searchQuery}"
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                            <button
                                onClick={() => handleStartProcessing('en')}
                                className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline underline-offset-4"
                            >
                                Continue with Original English only
                            </button>
                        </div>
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
                            <Button
                                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black"
                                onClick={handleViewScript}
                                isLoading={isLoadingScript}
                            >
                                View Full Script
                            </Button>
                            {response?.video?.target_language && response?.video?.target_language !== 'en' && (
                                <div className="flex flex-col gap-2 mb-2 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Translated Deliverables ({response.video.target_language})</p>
                                        <Badge variant="outline" className="text-[9px] h-4 border-accent/20 text-accent uppercase">Priority</Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button className="flex-1 h-11 text-sm bg-accent hover:bg-accent/90 text-white border-0 shadow-lg shadow-accent/20" onClick={() => handleDownload('srt', 'translated')}>Download {response.video.target_language.toUpperCase()} SRT</Button>
                                        <Button variant="outline" className="flex-1 h-11 text-sm border-accent/20 hover:bg-accent/5" onClick={() => handleDownload('txt', 'translated')}>TXT</Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Original Reference (English)</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => handleDownload('srt', 'original')}>Download SRT</Button>
                                    <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => handleDownload('txt', 'original')}>TXT</Button>
                                </div>
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

            {/* Premium Side-Canvas Script Viewer */}
            {isViewerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500"
                        onClick={() => setIsViewerOpen(false)}
                    />

                    <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 h-full border-l border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in slide-in-from-right duration-500 ease-out flex flex-col">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div>
                                <Badge variant="outline" className="mb-2">SCRIPT CANVAS</Badge>
                                <h2 className="text-2xl font-bold italic flex items-center gap-2">
                                    <FileText className="h-6 w-6 text-accent" />
                                    Processed Transcript
                                </h2>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsViewerOpen(false)} className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800">
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="max-w-prose mx-auto">
                                {/* Priority View: Translation */}
                                {(scriptContent as any)?.translations?.length > 0 ? (
                                    <div className="space-y-8">
                                        <div className="p-10 rounded-[2rem] bg-accent/5 border border-accent/10 shadow-inner leading-relaxed relative overflow-hidden">
                                            <div className="absolute top-4 right-6">
                                                <Badge variant="default" className="bg-accent text-white border-0 text-[10px]">TRANSLATION: {(scriptContent as any).translations[0].target_language.toUpperCase()}</Badge>
                                            </div>
                                            <p className="text-xl text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap font-serif">
                                                {(scriptContent as any).translations[0].translated_text}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-tighter text-zinc-400 px-2 flex items-center gap-2">
                                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                                Original English Reference
                                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                            </h4>
                                            <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 opacity-60 hover:opacity-100 transition-opacity">
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap italic">
                                                    {(scriptContent as any)?.content?.cleaned_text || (scriptContent as any)?.content?.raw_transcript?.text}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-10 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 shadow-inner leading-relaxed">
                                        <p className="text-lg text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-serif italic">
                                            {(scriptContent as any)?.content?.cleaned_text || (scriptContent as any)?.content?.raw_transcript?.text || "Generating script contents..."}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-12 space-y-4">
                                    <h4 className="text-sm font-bold uppercase tracking-tighter text-zinc-400 px-2">Timestamped Segments</h4>
                                    <div className="space-y-3">
                                        {/* Use translated segments if available, otherwise original */}
                                        {((scriptContent as any)?.translations?.[0]?.segments || (scriptContent as any)?.content?.raw_transcript?.segments || []).map((seg: any, idx: number) => (
                                            <div key={idx} className="group p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-accent/5 border border-transparent hover:border-zinc-100 dark:hover:border-accent/10 transition-all flex gap-4">
                                                <span className="text-xs font-mono text-accent pt-1 shrink-0">
                                                    [{Math.floor(seg.start)}s]
                                                </span>
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                                                    {seg.text}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex gap-3">
                            <div className="flex flex-col gap-2 flex-1">
                                <Button className="w-full h-12 rounded-xl text-md font-bold italic" onClick={handleCopyScript}>
                                    {isCopying ? <Check className="h-5 w-5 mr-2" /> : <Copy className="h-5 w-5 mr-2" />}
                                    {isCopying ? 'COPIED TO CLIPBOARD' : 'COPY FULL SCRIPT'}
                                </Button>
                                <div className="flex gap-2">
                                    {response?.video?.target_language && response?.video?.target_language !== 'en' && (
                                        <Button variant="outline" className="flex-1 h-12 rounded-xl group text-sm gap-2 border-accent bg-accent/5 font-bold" onClick={() => handleDownload('srt', 'translated')}>
                                            <Globe className="h-5 w-5 text-accent animate-pulse" />
                                            DOWNLOAD {response.video.target_language.toUpperCase()} SRT
                                        </Button>
                                    )}
                                    <Button variant="outline" className="flex-1 h-12 rounded-xl group text-xs gap-2 opacity-50 hover:opacity-100" onClick={() => handleDownload('srt', 'original')}>
                                        <FileText className="h-4 w-4 group-hover:text-accent transition-colors" />
                                        ORIGINAL (EN)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
