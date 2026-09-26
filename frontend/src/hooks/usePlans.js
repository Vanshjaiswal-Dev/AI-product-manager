import { useQuery } from '@tanstack/react-query';
import { getAllPlans, getPlanById } from '../services/api';

/**
 * Fetch all plans (for History page).
 * Returns { data: { success, count, data: Plan[] }, isLoading, error }
 */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: getAllPlans,
  });
}

/**
 * Fetch a single plan by ID (for Dashboard page).
 * Returns { data: { success, data: Plan }, isLoading, error }
 */
export function usePlan(id) {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: () => getPlanById(id),
    enabled: !!id,
  });
}
