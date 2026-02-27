'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { FSRAvailabilityResponse } from '@gravity/shared';

export function useFSRSlots(params: {
  dealer_ids: string[];
  preferred_dealer_id?: string;
  home_area?: string;
  enabled?: boolean;
}) {
  return useQuery<FSRAvailabilityResponse>({
    queryKey: ['fsr-slots', params.dealer_ids, params.preferred_dealer_id],
    queryFn: () => api.fsrAvailability({
      dealer_ids: params.dealer_ids,
      preferred_dealer_id: params.preferred_dealer_id,
      home_area: params.home_area,
    }) as Promise<FSRAvailabilityResponse>,
    enabled: params.enabled !== false && params.dealer_ids.length > 0,
  });
}
