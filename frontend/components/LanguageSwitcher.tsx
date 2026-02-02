import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'ar', name: 'العربية' },
    { code: 'ko', name: '한국어' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'tr', name: 'Türkçe' },
];

export function LanguageSwitcher() {
    const [locale, setLocaleState] = useState('en');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Simple cookie reader
        const match = document.cookie.match(new RegExp('(^| )lingo-locale=([^;]+)'));
        if (match) setLocaleState(match[2]);
    }, []);

    const setLocale = (newLocale: string) => {
        document.cookie = `lingo-locale=${newLocale}; path=/; max-age=31536000`;
        setLocaleState(newLocale);
        window.location.reload(); // Force reload to apply new locale via RSC
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-sm font-semibold shadow-sm"
            >
                <span className="uppercase text-xs text-zinc-500">{locale}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-48 z-50 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setLocale(lang.code);
                                            setIsOpen(false);
                                        }}
                                        className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                {lang.code.toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-medium">
                                                {lang.name}
                                            </span>
                                        </div>
                                        {locale === lang.code && (
                                            <Check className="h-4 w-4 text-accent" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
