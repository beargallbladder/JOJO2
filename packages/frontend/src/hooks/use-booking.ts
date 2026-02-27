'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { BookingDraftResponse, BookingHoldResponse } from '@gravity/shared';

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<BookingDraftResponse, Error, { vin_id: string; dealer_id: string; slot_id: string; contact?: Record<string, string> }>({
    mutationFn: (body) => api.bookingDraft(body) as Promise<BookingDraftResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fsr-slots'] });
    },
  });
}

export function useHoldBooking() {
  return useMutation<BookingHoldResponse, Error, { booking_id: string }>({
    mutationFn: (body) => api.bookingHold(body) as Promise<BookingHoldResponse>,
  });
}
