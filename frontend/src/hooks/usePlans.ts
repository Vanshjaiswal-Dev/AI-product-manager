import { useQuery } from '@tanstack/react-query';
import { getAllPlans, getPlanById } from '../services/api';

/**
 * Fetch all plans (for History page).
 */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: getAllPlans,
  });
}

/**
 * Fetch a single plan by ID (for Dashboard page).
 * Query is disabled when id is undefined.
 */
export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: () => getPlanById(id!),
    enabled: !!id,
  });
}
