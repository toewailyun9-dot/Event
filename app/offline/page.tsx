import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 p-4">
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            You Are Offline
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            Internet connection lost. Don&apos;t worry — you can still submit
            registration data. It will sync automatically when you&apos;re back
            online.
          </p>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              How it works:
            </span>
            <br />
            1. Fill in the registration form
            <br />
            2. Data is saved locally on your device
            <br />
            3. Auto-syncs when connection is restored
          </p>
        </div>

        <Link
          href="/"
          className="inline-block w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium rounded-lg text-sm transition text-center"
        >
          Back to Registration
        </Link>
      </div>
    </div>
  )
}
