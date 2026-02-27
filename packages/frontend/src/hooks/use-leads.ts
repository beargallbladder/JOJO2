'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { LeadsResponse } from '@gravity/shared';

interface UseLeadsOptions {
  subsystem?: string;
  band?: string;
  page?: number;
  limit?: number;
}

export function useLeads(options: UseLeadsOptions = {}) {
  const params: Record<string, string> = {};
  if (options.subsystem) params.subsystem = options.subsystem;
  if (options.band) params.band = options.band;
  if (options.page) params.page = String(options.page);
  if (options.limit) params.limit = String(options.limit);

  return useQuery<LeadsResponse>({
    queryKey: ['leads', params],
    queryFn: () => api.leads(params) as Promise<LeadsResponse>,
  });
}
