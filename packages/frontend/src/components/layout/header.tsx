'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-gravity-border bg-gravity-bg/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/leads" className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="font-semibold text-sm tracking-wide">GRAVITY</span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-gravity-text-whisper ml-1">Vehicle Health</span>
        </Link>
        <div className="flex items-center gap-4 text-xs text-gravity-text-secondary">
          <span className="font-mono">Battery 12V · Oil · Brakes</span>
        </div>
      </div>
    </header>
  );
}
