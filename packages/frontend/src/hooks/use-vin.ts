'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { VinDetailResponse } from '@gravity/shared';

export function useVin(vinId: string) {
  return useQuery<VinDetailResponse>({
    queryKey: ['vin', vinId],
    queryFn: () => api.vin(vinId) as Promise<VinDetailResponse>,
    enabled: !!vinId,
  });
}
