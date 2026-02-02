import { getDictionary } from "@/get-dictionary";
import { ProfessionalUpload } from "@/components/ProfessionalUpload";
import { VideoLibrary } from "@/components/VideoLibrary";
import { AnalyticsOverview } from "@/components/AnalyticsOverview";
import { Navbar } from "@/components/Navbar";
import { Play } from "lucide-react";

export default async function Home() {
  const dict = await getDictionary('en');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black selection:bg-accent/30">
      <div className="fixed inset-0 mesh-gradient opacity-10 dark:opacity-20 pointer-events-none" />
      <Navbar />

      <main className="relative max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-6 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              v1.0.0 Now Live
            </div>
            <h1 className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 leading-[1.1]">
              {dict.welcome}
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8">
              {dict.subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start">
              <div className="flex -space-x-3 overflow-hidden">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-950 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700" />
                ))}
              </div>
              <p className="text-sm font-medium text-zinc-500">
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">140+</span> users localized content
              </p>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg">
            <ProfessionalUpload />
          </div>
        </section>

        {/* Analytics Section */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">{dict.analytics_title}</h2>
            <p className="text-zinc-500">Real-time system metrics and usage stats</p>
          </div>
          <AnalyticsOverview />
        </section>

        {/* Video Library Section */}
        <section>
          <VideoLibrary />
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-12 bg-white dark:bg-zinc-950/50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale brightness-50 dark:brightness-150 opacity-50">
            <div className="p-1 bg-black rounded shadow">
              <Play className="h-3 w-3 text-white fill-current" />
            </div>
            <span className="font-bold text-sm tracking-tighter">UNISCRIPT</span>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            {dict.connected_to}: {process.env.NEXT_PUBLIC_API_URL}
          </p>
          <div className="flex gap-6 text-xs font-medium text-zinc-500 uppercase tracking-widest">
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
