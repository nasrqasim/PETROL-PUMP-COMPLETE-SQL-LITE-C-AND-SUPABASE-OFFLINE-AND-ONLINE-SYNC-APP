"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ur" dir="ltr">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-lg p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center">
            <span className="text-3xl">🛑</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Application Error</h2>
          <p className="text-sm text-slate-500">
            {error?.message || "A critical error occurred. Please try refreshing."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow transition"
            >
              🔄 Refresh
            </button>
            <a
              href="/dashboard"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl shadow transition"
            >
              🏠 Dashboard
            </a>
          </div>
          <p className="text-[10px] text-slate-400 pt-2">
            Software by Roonjha Developer: 03152914836
          </p>
        </div>
      </body>
    </html>
  );
}
