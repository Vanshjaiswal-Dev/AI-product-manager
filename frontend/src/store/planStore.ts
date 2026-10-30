import { create } from 'zustand';
import type { PlanState } from '../types';

export const usePlanStore = create<PlanState>((set) => ({
  currentPlanId: null,
  currentIdea: '',

  setCurrentPlan: (id: string, idea: string): void =>
    set({ currentPlanId: id, currentIdea: idea }),

  clearPlan: (): void =>
    set({ currentPlanId: null, currentIdea: '' }),
}));
