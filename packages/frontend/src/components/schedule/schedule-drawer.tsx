'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { DealerPicker } from './dealer-picker';
import { AvailabilitySlots } from './availability-slots';
import { BookingSummary } from './booking-summary';
import { useDealers } from '@/hooks/use-dealers';
import { useFSRSlots } from '@/hooks/use-fsr-slots';
import { useCreateBooking, useHoldBooking } from '@/hooks/use-booking';
import type { Vin } from '@gravity/shared';

interface ScheduleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vin: Vin;
}

type Step = 'dealer' | 'slots' | 'summary';

export function ScheduleDrawer({ open, onOpenChange, vin }: ScheduleDrawerProps) {
  const [step, setStep] = useState<Step>('dealer');
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const { data: dealerData } = useDealers({
    vin_id: vin.id,
    home_area: vin.home_area || undefined,
    max: 4,
  });

  const { data: slotData } = useFSRSlots({
    dealer_ids: selectedDealerId ? [selectedDealerId] : [],
    home_area: vin.home_area || undefined,
    enabled: !!selectedDealerId && step !== 'dealer',
  });

  const createBooking = useCreateBooking();
  const holdBooking = useHoldBooking();

  const handleDealerContinue = () => {
    if (selectedDealerId) setStep('slots');
  };

  const handleSlotContinue = async () => {
    if (!selectedDealerId || !selectedSlotId) return;
    const result = await createBooking.mutateAsync({
      vin_id: vin.id,
      dealer_id: selectedDealerId,
      slot_id: selectedSlotId,
    });
    if (result.booking) {
      setStep('summary');
    }
  };

  const handleHold = async () => {
    if (createBooking.data?.booking) {
      await holdBooking.mutateAsync({ booking_id: createBooking.data.booking.id });
    }
  };

  const selectedSlot = slotData?.slots.find(s => s.id === selectedSlotId);
  const selectedDealer = dealerData?.dealers.find(d => d.id === selectedDealerId);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="bg-gravity-elevated rounded-t-2xl border-t border-gravity-border max-h-[85vh] overflow-hidden flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gravity-border" />
            </div>

            {/* Gradient header border */}
            <div className="h-px bg-gradient-to-r from-transparent via-gravity-accent/40 to-transparent" />

            {/* Header */}
            <div className="px-6 py-4">
              <Drawer.Title className="text-sm font-medium tracking-wide">Schedule Service</Drawer.Title>
              <p className="text-xs text-gravity-text-secondary mt-1 font-mono">
                {vin.vin_code} — {vin.year} {vin.make} {vin.model}
              </p>
            </div>

            {/* Steps indicator */}
            <div className="px-6 pb-4 flex gap-2">
              {(['dealer', 'slots', 'summary'] as Step[]).map((s, i) => (
                <div key={s} className={cn(
                  'h-0.5 flex-1 rounded-full transition-colors',
                  i <= ['dealer', 'slots', 'summary'].indexOf(step)
                    ? 'bg-gravity-accent'
                    : 'bg-gravity-border'
                )} />
              ))}
            </div>

            {/* Content */}
            <div className="px-6 pb-6 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                {step === 'dealer' && dealerData && (
                  <motion.div key="dealer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <DealerPicker
                      dealers={dealerData.dealers as any}
                      selectedId={selectedDealerId}
                      onSelect={setSelectedDealerId}
                    />
                    <button
                      onClick={handleDealerContinue}
                      disabled={!selectedDealerId}
                      className="w-full mt-4 py-3 bg-gravity-accent hover:bg-gravity-accent/90 disabled:opacity-30 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Continue to Availability
                    </button>
                  </motion.div>
                )}

                {step === 'slots' && slotData && (
                  <motion.div key="slots" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <AvailabilitySlots
                      slots={slotData.slots as any}
                      selectedId={selectedSlotId}
                      onSelect={setSelectedSlotId}
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setStep('dealer')}
                        className="flex-1 py-3 bg-gravity-surface border border-gravity-border text-sm font-medium rounded-lg hover:bg-gravity-elevated transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSlotContinue}
                        disabled={!selectedSlotId || createBooking.isPending}
                        className="flex-1 py-3 bg-gravity-accent hover:bg-gravity-accent/90 disabled:opacity-30 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {createBooking.isPending ? 'Creating...' : 'Create Draft'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'summary' && createBooking.data?.booking && (
                  <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <BookingSummary
                      booking={createBooking.data.booking}
                      dealerName={selectedDealer?.name}
                      slotDate={selectedSlot?.date}
                      slotTime={selectedSlot?.time_block}
                    />
                    {createBooking.data.booking.status === 'draft' && (
                      <button
                        onClick={handleHold}
                        disabled={holdBooking.isPending}
                        className="w-full mt-4 py-3 bg-risk-medium/20 hover:bg-risk-medium/30 text-risk-medium text-sm font-medium rounded-lg transition-colors border border-risk-medium/20"
                      >
                        {holdBooking.isPending ? 'Holding...' : 'Hold Slot'}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
