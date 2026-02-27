'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { DealerSearchResponse } from '@gravity/shared';

export function useDealers(params: { home_area?: string; vin_id?: string; max?: number }) {
  const queryParams: Record<string, string> = {};
  if (params.home_area) queryParams.home_area = params.home_area;
  if (params.vin_id) queryParams.vin_id = params.vin_id;
  if (params.max) queryParams.max = String(params.max);

  return useQuery<DealerSearchResponse>({
    queryKey: ['dealers', queryParams],
    queryFn: () => api.dealerSearch(queryParams) as Promise<DealerSearchResponse>,
    enabled: !!params.vin_id || !!params.home_area,
  });
}
