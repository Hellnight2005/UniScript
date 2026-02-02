import { getDictionary } from "@/get-dictionary";

export default async function Home() {
  const dict = await getDictionary('en'); // Defaulting to EN for demonstration

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-zinc-50 dark:bg-black text-black dark:text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">{dict.welcome}</h1>
        <p className="mt-4 text-xl">{dict.subtitle}</p>
        <p className="mt-8 text-sm text-zinc-500">
          (This text is localized via Lingo.dev! Check <code>frontend/i18n/en.json</code>)
        </p>
      </div>
    </main>
  );
}
