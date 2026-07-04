'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center space-y-4 max-w-sm">
        <div className="h-16 w-16 rounded-2xl bg-[#091426] flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-2xl font-bold text-[#091426]">You&apos;re offline</h1>
        <p className="text-muted-foreground text-sm">
          Check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2.5 bg-[#091426] text-white text-sm font-medium rounded-xl hover:bg-[#091426]/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
