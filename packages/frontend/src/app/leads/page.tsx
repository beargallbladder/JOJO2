'use client';

import { useState } from 'react';
import { useLeads } from '@/hooks/use-leads';
import { LeadTable } from '@/components/leads/lead-table';
import { BandFilter } from '@/components/leads/band-filter';
import { SubsystemFilter } from '@/components/leads/subsystem-filter';
import { VoiceOverlay } from '@/components/voice/voice-overlay';
import { VoiceTrigger } from '@/components/voice/voice-trigger';
import { Header } from '@/components/layout/header';

export default function LeadsPage() {
  const [band, setBand] = useState<string | null>(null);
  const [subsystem, setSubsystem] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const limit = 50;

  const { data, isLoading } = useLeads({
    band: band || undefined,
    subsystem: subsystem || undefined,
    page,
    limit,
  });

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-lg font-medium tracking-wide">Command Board</h1>
          <p className="text-sm text-gravity-text-secondary mt-1">
            {data ? `${data.total} vehicles ranked by posterior probability` : 'Loading fleet data...'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <BandFilter selected={band} onSelect={(b) => { setBand(b); setPage(1); }} />
          <div className="w-px h-8 bg-gravity-border self-center" />
          <SubsystemFilter selected={subsystem} onSelect={(s) => { setSubsystem(s); setPage(1); }} />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-14 bg-gravity-surface rounded-lg animate-shimmer shimmer-bg" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        ) : data ? (
          <>
            <LeadTable leads={data.leads} page={page} limit={limit} />

            {/* Pagination */}
            {data.total > limit && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-xs font-medium uppercase tracking-wider bg-gravity-surface rounded-md disabled:opacity-30 hover:bg-gravity-elevated transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm font-mono text-gravity-text-secondary">
                  Page {page} of {Math.ceil(data.total / limit)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= data.total}
                  className="px-4 py-2 text-xs font-medium uppercase tracking-wider bg-gravity-surface rounded-md disabled:opacity-30 hover:bg-gravity-elevated transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* Voice */}
      <VoiceTrigger onClick={() => setVoiceOpen(true)} mode="fleet" />
      <VoiceOverlay open={voiceOpen} onClose={() => setVoiceOpen(false)} scope="fleet" />
    </>
  );
}
