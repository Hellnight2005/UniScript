'use client';

import { Sparkles } from 'lucide-react';

export function Navbar() {
    return (
        <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-black dark:bg-white rounded-lg">
                        <Sparkles className="h-5 w-5 text-white dark:text-black" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">UniScript</span>
                </div>

                <div className="flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Documentation</a>
                    <a href="#" className="hover:text-black dark:hover:text-white transition-colors">GitHub</a>
                    <a href="#" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 transition-opacity">
                        Get Started
                    </a>
                </div>
            </div>
        </nav>
    );
}
