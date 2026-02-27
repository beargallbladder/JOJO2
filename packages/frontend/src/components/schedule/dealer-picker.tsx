'use client';

import { DealerCard } from './dealer-card';
import type { Dealer } from '@gravity/shared';

interface DealerPickerProps {
  dealers: (Dealer & { is_preferred?: boolean })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DealerPicker({ dealers, selectedId, onSelect }: DealerPickerProps) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper mb-3">
        Select Dealer
      </div>
      <div className="space-y-2">
        {dealers.map((dealer, i) => (
          <DealerCard
            key={dealer.id}
            dealer={dealer}
            selected={dealer.id === selectedId}
            onSelect={() => onSelect(dealer.id)}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
