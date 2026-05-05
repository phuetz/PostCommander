import { useQuery } from '@tanstack/react-query';
import * as api from '@/services/api';

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: api.getAnalyticsOverview,
  });
}

export function useBestTimes() {
  return useQuery({
    queryKey: ['analytics', 'best-times'],
    queryFn: api.getBestTimes,
  });
}
